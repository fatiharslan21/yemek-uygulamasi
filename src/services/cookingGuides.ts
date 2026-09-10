import type { CookingEquipment, PlannedMeal, Recipe } from '../types'

export type CookingGuide = {
  id: string
  label: string
  emoji: string
  equipment: CookingEquipment[]
  minutes: number
  summary: string
  steps: string[]
  note?: string
}

function guide(
  id: string,
  label: string,
  emoji: string,
  equipment: CookingEquipment[],
  minutes: number,
  summary: string,
  steps: string[],
  note?: string,
): CookingGuide {
  return { id, label, emoji, equipment, minutes, summary, steps, note }
}

function hasIngredient(recipe: Recipe | undefined, ids: string[]) {
  return Boolean(recipe?.ingredients.some((item) => ids.includes(item.ingredientId)))
}

function ingredientLead(recipe: Recipe | undefined, people: number) {
  const count = recipe?.ingredients.length ?? 0
  return `${people} kişi için ${count || 'gerekli'} malzemeyi ölçüp tezgâha hazırla.`
}

const RAW_PROTEIN_NOTE = 'Çiğ et veya balık içeren tariflerde yalnızca renk değişimine güvenme; tam pişme ve mutfak hijyeni kurallarına dikkat et.'

export function getCookingGuides(recipe: Recipe | undefined, meal: PlannedMeal, people: number): CookingGuide[] {
  if (meal.source !== 'Evde') return []

  const title = meal.title.toLocaleLowerCase('tr-TR')
  const intro = ingredientLead(recipe, people)
  const hasChicken = hasIngredient(recipe, ['chicken'])
  const hasMeat = hasIngredient(recipe, ['mince'])
  const hasFreshFish = hasIngredient(recipe, ['fish'])
  const hasTuna = hasIngredient(recipe, ['tuna'])
  const hasTofu = hasIngredient(recipe, ['tofu'])
  const hasRawAnimalProtein = hasChicken || hasMeat || hasFreshFish
  const hasProtein = hasRawAnimalProtein || hasTuna || hasTofu
  const hasCookedGrain = hasIngredient(recipe, ['rice', 'bulgur', 'pasta', 'lentil', 'red_lentil', 'chickpea', 'beans', 'couscous', 'quinoa'])
  const hasTortilla = hasIngredient(recipe, ['tortilla'])

  if (title.includes('smoothie')) {
    return [guide(
      'smoothie-blender',
      'Blender',
      '🥤',
      ['Blender'],
      4,
      'Malzemeleri ekle, çek ve iç.',
      [intro, 'Sıvıyı blender haznesine önce ekle; ardından meyve ve diğer malzemeleri koy.', 'Kapağı güvenli biçimde kapatıp pürüzsüz kıvama gelene kadar kısa aralıklarla çalıştır.', 'Kıvamı kontrol edip gerekirse az miktarda sıvı ekleyerek servis et.'],
    )]
  }

  if (title.includes('yulaf') || title.includes('chia')) {
    return [
      guide('no-cook-oats', 'Ekipmansız', '🥣', [], 5, 'Karıştır, dinlendir, hazır.', [intro, 'Kuru ve sıvı malzemeleri kasede homojen olana kadar karıştır.', 'Meyve ve diğer üst malzemeleri en son ekle; istersen birkaç dakika dinlendirip servis et.']),
      guide('microwave-oats', 'Mikrodalga', '📡', ['Mikrodalga'], 6, 'Daha sıcak ve yumuşak kıvam.', [intro, 'Yulafı uygun sıvıyla mikrodalgaya dayanıklı geniş bir kapta karıştır.', 'Kısa aralıklarla ısıtıp her arada karıştır; taşmamasını kontrol et.', 'Meyve, yoğurt veya diğer soğuk malzemeleri ısıtma bittikten sonra ekle.']),
      guide('stove-oats', 'Ocak', '🍳', ['Ocak'], 9, 'Klasik sıcak yulaf yöntemi.', [intro, 'Yulaf ve sıvıyı küçük bir tencerede kısık-orta ateşte karıştırarak koyulaştır.', 'Ocaktan alınca kısa süre dinlendir.', 'Meyve ve soğuk malzemeleri servis aşamasında ekle.']),
    ]
  }

  if (title.includes('tost') || title.includes('tortilla') || title.includes('quesadilla')) {
    const options: CookingGuide[] = []
    if (!hasRawAnimalProtein && !hasCookedGrain) {
      options.push(guide('wrap-no-cook', 'Ekipmansız', '🌯', [], 6, 'İçini doldur, sar ve hazır.', [intro, 'Sebze ve soğuk malzemeleri hazırla.', 'Sos veya sürülebilir malzemeyi ince bir kat halinde yay.', 'İç malzemeyi dengeli dağıtıp sıkıca sar ve servis et.']))
    }
    options.push(
      guide('toast-press', 'Tost makinesi', '🥪', ['Tost makinesi'], 9, 'Dışı çıtır, içi sıcak.', [intro, 'İç malzemeleri ekmek veya tortillaya dengeli biçimde yerleştir.', 'Tost makinesinde kontrollü biçimde kızart.', 'Sulu yeşillikleri istersen pişirme sonrası ekle.']),
      guide('toast-pan', 'Ocakta tava', '🍳', ['Ocak'], 11, 'Tavada kontrollü kızartma.', [intro, 'İç malzemeyi yerleştirip ürünü kapat.', 'Orta-kısık ateşte iki tarafını da kontrollü kızart.', 'Çiğ protein varsa içinin tamamen piştiğinden emin ol.'], hasRawAnimalProtein ? RAW_PROTEIN_NOTE : undefined),
      guide('toast-airfryer', 'Airfryer', '🌪️', ['Airfryer'], 11, 'Az uğraşla eşit kızarma.', [intro, 'Hazırladığın ürünü sepete tek kat yerleştir.', 'Kısa aralıklarla kontrol edip gerekirse çevir.', 'İç malzeme güvenli biçimde pişip dışı çıtırlaşınca servis et.'], hasRawAnimalProtein ? RAW_PROTEIN_NOTE : undefined),
    )
    return options
  }

  if (title.includes('menemen') || title.includes('yumurta') || title.includes('omlet')) {
    const guides: CookingGuide[] = [
      guide('egg-stove', 'Ocak', '🍳', ['Ocak'], title.includes('menemen') ? 14 : 11, 'Klasik tava yöntemi.', [intro, 'Sebze varsa önce tavada yumuşat; yumurtayı gerekiyorsa ayrı kapta çırp.', 'Yumurtayı ekleyip orta-kısık ateşte kontrollü biçimde pişir.', 'Kurumasını beklemeden ocaktan al ve eşlikçileriyle servis et.']),
    ]
    if (!title.includes('menemen')) {
      guides.push(
        guide('egg-airfryer', 'Airfryer', '🌪️', ['Airfryer'], 13, 'Küçük ısıya dayanıklı kapla pratik yöntem.', [intro, 'Yumurta karışımını airfryer uyumlu küçük kaba aktar.', 'Kısa aralıklarla kontrol ederek merkez kısmı tamamen pişene kadar çalıştır.', 'Servisten önce kısa süre dinlendir.']),
        guide('egg-oven', 'Fırın', '🔥', ['Fırın'], 18, 'Fırında daha sakin pişirme.', [intro, 'Karışımı hafif yağlanmış fırın kabına aktar.', 'Merkez tamamen pişene kadar kontrollü biçimde fırınla.', 'Biraz dinlendirip porsiyonla.']),
      )
    }
    return guides
  }

  if (title.includes('köfte') || (hasMeat && title.includes('patates'))) {
    return [
      guide('meatball-oven', 'Fırın', '🔥', ['Fırın'], 32, 'Köfte ve sebzeyi aynı tepside hazırla.', [intro, 'Köfteyi şekillendir; sebzeleri benzer boyutlarda doğra.', 'Malzemeleri tek kat olacak şekilde tepsiye yay ve kontrollü pişir.', 'Köftenin içinin tamamen piştiğinden emin olup sıcak servis et.'], RAW_PROTEIN_NOTE),
      guide('meatball-airfryer', 'Airfryer', '🌪️', ['Airfryer'], 24, 'Küçük parti, hızlı kızarma.', [intro, 'Köfte ve eşlikçileri sepeti aşırı doldurmadan yerleştir.', 'Pişirme ortasında sepeti çevir veya malzemeleri karıştır.', 'Köftenin içinin tamamen piştiğini kontrol ederek servis et.'], RAW_PROTEIN_NOTE),
      guide('meatball-stove', 'Ocak', '🍳', ['Ocak'], 26, 'Tava + kapak yöntemi.', [intro, 'Sebze veya patatesi küçük parçalar halinde ön pişir.', 'Köfteleri her yüzü eşit pişecek şekilde çevir.', 'Tam piştiğini kontrol edip birlikte servis et.'], RAW_PROTEIN_NOTE),
    ]
  }

  if (hasRawAnimalProtein && !hasCookedGrain) {
    const proteinName = hasFreshFish ? 'balığı' : hasMeat ? 'eti' : 'tavuğu'
    return [
      guide('protein-simple-stove', 'Ocak', '🍳', ['Ocak'], 24, 'Tava yöntemi.', [intro, `${proteinName} tavada kontrollü biçimde pişir.`, 'Sebzeleri aynı tavada veya ayrı bölümde hazırla.', 'Proteinin tamamen piştiğini kontrol edip servis et.'], RAW_PROTEIN_NOTE),
      guide('protein-simple-airfryer', 'Airfryer', '🌪️', ['Airfryer'], 22, 'Sepette pratik pişirme.', [intro, `${proteinName} ve uygun sebzeleri sepete tek kat yerleştir.`, 'Pişirme sırasında kontrol edip gerekirse çevir.', 'Tam piştiğini kontrol ederek servis et.'], RAW_PROTEIN_NOTE),
      guide('protein-simple-oven', 'Fırın', '🔥', ['Fırın'], 30, 'Tek tepside kolay yöntem.', [intro, `${proteinName} ve sebzeleri tepsiye yay.`, 'Kontrollü biçimde pişir ve gerekirse ortasında çevir.', 'Protein tamamen piştiğinde servis et.'], RAW_PROTEIN_NOTE),
    ]
  }

  if (hasProtein && hasCookedGrain) {
    const proteinName = hasFreshFish || hasTuna ? 'balığı' : hasMeat ? 'eti' : hasChicken ? 'tavuğu' : hasTofu ? 'tofuyu' : 'proteini'
    const note = hasRawAnimalProtein ? RAW_PROTEIN_NOTE : undefined
    return [
      guide('protein-stove', 'Ocak', '🍳', ['Ocak'], 28, 'Klasik tek mutfak akışı.', [intro, `Tahıl/bakliyat kısmını uygun tencerede pişir; ${proteinName} gerekiyorsa ayrı tavada hazırla.`, 'Sebze ve diğer bileşenleri son aşamada ekleyip porsiyonları birleştir.', 'Kalan uygun malzemeyi sonraki öğün için soğutup sakla.'], note),
      guide('protein-airfryer', 'Airfryer + ocak', '🌪️', ['Airfryer', 'Ocak'], 25, 'Protein airfryer’da, yan ürün ocakta.', [intro, `Tahıl/bakliyatı ocakta hazırlarken ${proteinName} airfryer sepetinde hazırla.`, 'Pişirme boyunca kontrol edip gerekirse çevir.', 'İki bileşeni sebzelerle birleştirip porsiyonla.'], note),
      guide('protein-oven', 'Fırın + ocak', '🔥', ['Fırın', 'Ocak'], 34, 'Protein fırında, yan ürün ocakta.', [intro, `Tahıl/bakliyatı ocakta hazırlarken ${proteinName} ve uygun sebzeleri fırın tepsisine al.`, 'Kontrollü biçimde pişir.', 'Pişen parçaları tek tabakta veya meal-prep kaplarında birleştir.'], note),
    ]
  }

  if (hasCookedGrain || title.includes('makarna') || title.includes('noodle') || title.includes('çorba') || title.includes('pilav') || title.includes('kuskus') || title.includes('kinoa')) {
    return [
      guide('pot-stove', 'Ocak', '🍲', ['Ocak'], 24, 'Tencere/tava ile güvenilir yöntem.', [intro, 'Ana kuru malzemeyi uygun miktarda sıvıyla kontrollü biçimde pişir.', 'Sebze, baharat ve diğer bileşenleri pişme süresine göre sırayla ekle.', 'Kıvam ve pişme durumunu kontrol edip porsiyonlara ayır.']),
      ...(title.includes('patates') || title.includes('patlıcan') ? [guide('veg-oven', 'Fırın', '🔥', ['Fırın'], 30, 'Sebzeleri fırında hazırlama seçeneği.', [intro, 'Sebzeleri benzer boyutta doğrayıp tek kat tepsiye yay.', 'Kontrollü biçimde kızarana kadar pişir.', 'Hazır eşlikçilerle birleştirip servis et.'])] : []),
    ]
  }

  if (!hasRawAnimalProtein && !hasCookedGrain && !hasTortilla) {
    return [
      guide('no-cook-bowl', 'Ekipmansız', '🥗', [], 7, 'Doğra, karıştır ve servis et.', [intro, 'Yıkanması gereken taze malzemeleri hazırla.', 'Malzemeleri uygun boyutta doğrayıp kasede birleştir.', 'Sosu veya son dokunuşları servis öncesi ekle.']),
      ...(hasTofu ? [guide('tofu-pan', 'Ocak', '🍳', ['Ocak'], 14, 'Tofuyu sıcak ve kızarmış tercih edenlere.', [intro, 'Tofuyu eşit parçalar halinde kes.', 'Tavada kontrollü biçimde iki yüzünü kızart.', 'Sebzelerle birleştirip servis et.'])] : []),
    ]
  }

  return [
    guide('generic-stove', 'Ocak', '🍳', ['Ocak'], 20, 'Genel tava/tencere yöntemi.', [intro, 'Malzemeleri pişme sürelerine göre sırala ve ana bileşeni kontrollü ateşte hazırla.', 'Sebze ve diğer hassas bileşenleri daha sonra ekle.', 'Porsiyonlayıp servis et; kalan uygun malzemeleri sonraki öğün için sakla.']),
    guide('generic-airfryer', 'Airfryer', '🌪️', ['Airfryer'], 22, 'Uygun malzemeleri sepette pratik hazırla.', [intro, 'Airfryer’a uygun malzemeleri benzer boyutlarda hazırla.', 'Sepeti aşırı doldurmadan kontrollü biçimde pişir.', 'Pişme durumunu kontrol edip servis et.']),
    guide('generic-oven', 'Fırın', '🔥', ['Fırın'], 28, 'Tek tepside alternatif yöntem.', [intro, 'Fırına uygun malzemeleri tepsiye tek kat yerleştir.', 'Kontrollü biçimde pişir ve gerekirse ortasında çevir.', 'Pişme durumunu kontrol edip servis et.']),
  ]
}

export function guideIsAvailable(guideItem: CookingGuide, equipment: CookingEquipment[]) {
  return guideItem.equipment.every((item) => equipment.includes(item))
}
