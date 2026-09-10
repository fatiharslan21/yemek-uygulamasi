import fs from 'node:fs'

const coreRecipeFiles = ['src/data/baseRecipeCatalog.ts', 'src/data/extraRecipes.ts']
const expandedRecipeFile = 'src/data/expandedRecipes.ts'
const ingredientFiles = ['src/data/baseRecipeCatalog.ts', 'src/data/extraRecipes.ts']
const allRecipeFiles = [...coreRecipeFiles, expandedRecipeFile]
const sources = allRecipeFiles.map((file) => ({ file, text: fs.readFileSync(file, 'utf8') }))
const failures = []

function unique(values) {
  return new Set(values).size === values.length
}

function duplicates(values) {
  const counts = new Map()
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value)
}

function matches(text, pattern) {
  return [...text.matchAll(pattern)].map((match) => match[1])
}

function recipeIdsFromText(text, includeOutsideHelpers = false) {
  const objectIds = matches(text, /\bid: '([^']+)', title:/g)
  const helperIds = includeOutsideHelpers ? matches(text, /outside\('([^']+)'/g) : []
  return [...objectIds, ...helperIds]
}

const ingredientIds = ingredientFiles.flatMap((file) => matches(fs.readFileSync(file, 'utf8'), /\{ id: '([^']+)', name:/g))
const coreRecipeIds = coreRecipeFiles.flatMap((file) => recipeIdsFromText(fs.readFileSync(file, 'utf8')))
const expandedText = fs.readFileSync(expandedRecipeFile, 'utf8')
const expandedRawIds = recipeIdsFromText(expandedText, true)
const coreIdSet = new Set(coreRecipeIds)
const normalizedExpandedIds = expandedRawIds.map((id) => coreIdSet.has(id) ? `${id}-alt` : id)
const runtimeRecipeIds = [...coreRecipeIds, ...normalizedExpandedIds]
const ingredientUses = sources.flatMap(({ text }) => matches(text, /ingredientId: '([^']+)'/g))
const unknownIngredients = [...new Set(ingredientUses.filter((id) => !ingredientIds.includes(id)))]
const duplicateIngredientIds = duplicates(ingredientIds)
const duplicateCoreRecipeIds = duplicates(coreRecipeIds)
const duplicateExpandedRawIds = duplicates(expandedRawIds)
const duplicateRuntimeRecipeIds = duplicates(runtimeRecipeIds)
const aliasedExpandedCount = expandedRawIds.filter((id) => coreIdSet.has(id)).length

if (!unique(ingredientIds)) failures.push(`Malzeme ID listesinde tekrar var: ${duplicateIngredientIds.join(', ')}`)
if (!unique(coreRecipeIds)) failures.push(`Ana katalog tarif ID tekrarları: ${duplicateCoreRecipeIds.join(', ')}`)
if (!unique(expandedRawIds)) failures.push(`Genişletilmiş katalog kendi içinde tekrar içeriyor: ${duplicateExpandedRawIds.join(', ')}`)
if (!unique(runtimeRecipeIds)) failures.push(`Runtime tarif ID tekrarları: ${duplicateRuntimeRecipeIds.join(', ')}`)
if (unknownIngredients.length) failures.push(`Tanımsız malzeme referansı: ${unknownIngredients.join(', ')}`)
if (runtimeRecipeIds.length < 150) failures.push(`Tarif çeşitliliği beklenen seviyenin altında: ${runtimeRecipeIds.length} < 150`)

const coreText = coreRecipeFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n')
const homeCount = (coreText.match(/source: 'Evde'/g) ?? []).length + (expandedText.match(/home\(\{ id:/g) ?? []).length
const deliveryCount = (coreText.match(/source: 'Sipariş'/g) ?? []).length + (expandedText.match(/outside\('[^']+',\s*'[^']+',\s*'[^']+',\s*'Sipariş'/g) ?? []).length
const dineOutCount = (coreText.match(/source: 'Dışarı'/g) ?? []).length + (expandedText.match(/outside\('[^']+',\s*'[^']+',\s*'[^']+',\s*'Dışarı'/g) ?? []).length

if (homeCount < 100) failures.push(`Ev yemeği çeşitliliği düşük: ${homeCount}`)
if (deliveryCount < 20) failures.push(`Sipariş çeşitliliği düşük: ${deliveryCount}`)
if (dineOutCount < 15) failures.push(`Dışarı yemeği çeşitliliği düşük: ${dineOutCount}`)

for (const { file, text } of sources) {
  const recipeLines = text.split('\n').filter((line) => /\bid: '[^']+', title:/.test(line))
  for (const line of recipeLines) {
    const id = line.match(/\bid: '([^']+)'/)?.[1] ?? 'bilinmeyen'
    if (!line.includes('mealSlots:')) failures.push(`${file}:${id} mealSlots eksik.`)
    if (!line.includes('allowedDiets:')) failures.push(`${file}:${id} allowedDiets eksik.`)
    if (!line.includes('allergens:')) failures.push(`${file}:${id} allergens eksik.`)
    if (!line.includes('calories:') || !line.includes('protein:')) failures.push(`${file}:${id} beslenme özeti eksik.`)
    if (!line.includes('estimatedPrice:')) failures.push(`${file}:${id} fiyat tahmini eksik.`)
    if (!line.includes('ingredients:') || !line.includes('tags:')) failures.push(`${file}:${id} malzeme/tag bilgisi eksik.`)
  }
}

if (failures.length) {
  console.error('\nLokma katalog kontrolü başarısız:')
  failures.forEach((failure) => console.error(`  ✗ ${failure}`))
  process.exit(1)
}

console.log('✓ Lokma yemek kataloğu sağlam')
console.log(`✓ ${runtimeRecipeIds.length} tarif • ${ingredientIds.length} malzeme`)
console.log(`✓ ${homeCount} evde • ${deliveryCount} sipariş • ${dineOutCount} dışarı seçeneği`)
if (aliasedExpandedCount > 0) console.log(`✓ ${aliasedExpandedCount} eski ID çakışması runtime'da -alt ile güvenli ayrıştırılıyor`)
