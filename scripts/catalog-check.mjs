import fs from 'node:fs'

const files = ['src/data/baseRecipeCatalog.ts', 'src/data/extraRecipes.ts']
const sources = files.map((file) => ({ file, text: fs.readFileSync(file, 'utf8') }))
const failures = []

function unique(values) {
  return new Set(values).size === values.length
}

function matches(text, pattern) {
  return [...text.matchAll(pattern)].map((match) => match[1])
}

const ingredientIds = sources.flatMap(({ text }) => matches(text, /\{ id: '([^']+)', name:/g))
const recipeIds = sources.flatMap(({ text }) => matches(text, /\{ id: '([^']+)', title:/g))
const ingredientUses = sources.flatMap(({ text }) => matches(text, /ingredientId: '([^']+)'/g))
const unknownIngredients = [...new Set(ingredientUses.filter((id) => !ingredientIds.includes(id)))]

if (!unique(ingredientIds)) failures.push('Malzeme ID listesinde tekrar var.')
if (!unique(recipeIds)) failures.push('Tarif ID listesinde tekrar var.')
if (unknownIngredients.length) failures.push(`Tanımsız malzeme referansı: ${unknownIngredients.join(', ')}`)
if (recipeIds.length < 80) failures.push(`Tarif çeşitliliği beklenen seviyenin altında: ${recipeIds.length} < 80`)

const allText = sources.map(({ text }) => text).join('\n')
const homeCount = (allText.match(/source: 'Evde'/g) ?? []).length
const deliveryCount = (allText.match(/source: 'Sipariş'/g) ?? []).length
const dineOutCount = (allText.match(/source: 'Dışarı'/g) ?? []).length

if (homeCount < 50) failures.push(`Ev yemeği çeşitliliği düşük: ${homeCount}`)
if (deliveryCount < 10) failures.push(`Sipariş çeşitliliği düşük: ${deliveryCount}`)
if (dineOutCount < 8) failures.push(`Dışarı yemeği çeşitliliği düşük: ${dineOutCount}`)

for (const { file, text } of sources) {
  const recipeLines = text.split('\n').filter((line) => line.includes("{ id: '") && line.includes("title: '") && line.includes('source:'))
  for (const line of recipeLines) {
    const id = line.match(/\{ id: '([^']+)'/)?.[1] ?? 'bilinmeyen'
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
