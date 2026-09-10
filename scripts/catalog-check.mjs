import fs from 'node:fs'

const recipeFiles = ['src/data/baseRecipeCatalog.ts', 'src/data/extraRecipes.ts', 'src/data/expandedRecipes.ts']
const ingredientFiles = ['src/data/baseRecipeCatalog.ts', 'src/data/extraRecipes.ts']
const sources = recipeFiles.map((file) => ({ file, text: fs.readFileSync(file, 'utf8') }))
const failures = []

function unique(values) {
  return new Set(values).size === values.length
}

function matches(text, pattern) {
  return [...text.matchAll(pattern)].map((match) => match[1])
}

const ingredientIds = ingredientFiles.flatMap((file) => matches(fs.readFileSync(file, 'utf8'), /\{ id: '([^']+)', name:/g))
const objectRecipeIds = sources.flatMap(({ text }) => matches(text, /\bid: '([^']+)', title:/g))
const outsideRecipeIds = matches(fs.readFileSync('src/data/expandedRecipes.ts', 'utf8'), /outside\('([^']+)'/g)
const recipeIds = [...objectRecipeIds, ...outsideRecipeIds]
const ingredientUses = sources.flatMap(({ text }) => matches(text, /ingredientId: '([^']+)'/g))
const unknownIngredients = [...new Set(ingredientUses.filter((id) => !ingredientIds.includes(id)))]

if (!unique(ingredientIds)) failures.push('Malzeme ID listesinde tekrar var.')
if (!unique(recipeIds)) failures.push('Tarif ID listesinde tekrar var.')
if (unknownIngredients.length) failures.push(`Tanımsız malzeme referansı: ${unknownIngredients.join(', ')}`)
if (recipeIds.length < 150) failures.push(`Tarif çeşitliliği beklenen seviyenin altında: ${recipeIds.length} < 150`)

const baseAndExtra = sources.filter(({ file }) => file !== 'src/data/expandedRecipes.ts').map(({ text }) => text).join('\n')
const expanded = fs.readFileSync('src/data/expandedRecipes.ts', 'utf8')
const homeCount = (baseAndExtra.match(/source: 'Evde'/g) ?? []).length + (expanded.match(/home\(\{ id:/g) ?? []).length
const deliveryCount = (baseAndExtra.match(/source: 'Sipariş'/g) ?? []).length + (expanded.match(/outside\('[^']+',\s*'[^']+',\s*'[^']+',\s*'Sipariş'/g) ?? []).length
const dineOutCount = (baseAndExtra.match(/source: 'Dışarı'/g) ?? []).length + (expanded.match(/outside\('[^']+',\s*'[^']+',\s*'[^']+',\s*'Dışarı'/g) ?? []).length

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
console.log(`✓ ${recipeIds.length} tarif • ${ingredientIds.length} malzeme`)
console.log(`✓ ${homeCount} evde • ${deliveryCount} sipariş • ${dineOutCount} dışarı seçeneği`)
