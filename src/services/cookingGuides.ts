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

export function getCookingGuides(recipe: Recipe | undefined, meal: PlannedMeal, people: number): CookingGuide[] {
  if (meal.source !== 'Evde') return []

  const title = meal.title.toLocaleLowerCase('tr-TR')
  const intro = ingredientLead(recipe, people)
  const hasChicken = hasIngredient(recipe, ['chicken'])
  const hasMeat = hasIngredient(recipe, ['mince'])
  const hasFish = hasIngredient(recipe, ['fish'])
  const hasProtein = hasChicken || hasMeat || hasFish || hasIngredient(recipe, ['tofu'])
  const hasGrain = hasIngredient(recipe, ['rice', 'bulgur', 'pasta', 'lentil', 'red_lentil', 'chickpea', 'beans'])

  if (title.includes('yulaf') || title.includes('chia')) {
    return [
      guide(
        'no-cook',
        'Ekipmansız',
        '🥣',
        [],
        5,
        'Karıştır, dinlendir, hazır.',
        [intro, 'Kuru ve sıvı malzemeleri kasede homojen olana kadar karıştır.', 'Meyve ve diğer üst malzemeleri en son ekle; istersen birkaç dakika dinlendirip servis et.'],
      ),
      guide(
        'microwave-oats',
        'Mikrodalga',
        '📡',
        ['Mikrodalga'],
        6,
        'Daha sıcak ve yumuşak kıvam.',
        [intro, 'Yulafı uygun sıvıyla mikrodalgaya dayanıklı geniş bir kapta karıştır.', 'Kısa aralıklarla ısıtıp her arada karıştır; taşmamasını kontrol et.', 'Meyve, yoğurt veya fıstık ezmesini ısıtma bittikten sonra ekle.'],
      ),
      guide(
        'stove-oats',
        'Ocak',
        '🍳',
        ['Ocak'],
        9,
        'Klasik sıcak yulaf yöntemi.',
        [intro, 'Yulaf ve sıvıyı küçük bir tencerede kısık-orta ateşte karıştırarak koyulaştır.', 'Ocaktan alınca 1-2 dakika dinlendir.', 'Meyve ve soğuk malzemeleri servis aşamasında ekle.'],
      ),
    ]
  }

  if (title.includes('tost')) {
    return [
      guide(
        'toast-press',
        'Tost makinesi',
        '🥪',
        ['Tost makinesi'],
        8,
        'En pratik çıtır seçenek.',
        [intro, 'İç malzemeleri ekmeğin arasına dengeli biçimde yerleştir.', 'Tost makinesinde dışı kızarıp içi ısınana kadar kontrollü pişir.', 'Domates ve taze yeşillik gibi sulu malzemeleri istersen sonradan ekle.'],
      ),
      guide(
        'toast-pan',
        'Ocakta tava',
        '🍳',
        ['Ocak'],
        10,
        'Tost makinesi olmadan tava yöntemi.',
        [intro, 'Tostu kapatıp kuru veya çok hafif yağlanmış tavaya al.', 'Orta-kısık ateşte bastırarak iki yüzünü de kontrollü kızart.', 'İç malzeme ısındığında tavadan alıp kısa süre dinlendir.'],
      ),
      guide(
        'toast-airfryer',
        'Airfryer',
        '🌪️',
        ['Airfryer'],
        9,
        'Az uğraşla eşit kızarma.',
        [intro, 'Hazırladığın tostu airfryer sepetine tek kat yerleştir.', 'Kısa aralıklarla kontrol ederek dışı çıtırlaşana kadar pişir.', 'Peyniri veya dolguyu akıtmadan servis tabağına al.'],
      ),
    ]
  }

  if (title.includes('menemen') || title.includes('yumurta') || title.includes('omlet')) {
    const guides = [
      guide(
        'egg-stove',
        'Ocak',
        '🍳',
        ['Ocak'],
        title.includes('menemen') ? 14 : 10,
        'Klasik tava yöntemi.',
        [intro, 'Sebze varsa önce tavada yumuşat; yumurtayı ayrı bir kapta gerekiyorsa çırp.', 'Yumurtayı ekleyip orta-kısık ateşte kontrollü biçimde pişir.', 'Kurumasını beklemeden ocaktan al ve eşlikçileriyle servis et.'],
      ),
    ]
    if (!title.includes('menemen')) {
      guides.push(guide(
        'egg-airfryer',
        'Airfryer',
        '🌪️',
        ['Airfryer'],
        12,
        'Küçük ısıya dayanıklı kapla fırınlanmış yumurta hissi.',
        [intro, 'Yumurta karışımını airfryer uyumlu küçük bir kaba aktar.', 'Kısa aralıklarla kontrol ederek merkez kısmı güvenli biçimde pişene kadar çalıştır.', 'Servisten önce birkaç dakika dinlendir.'],
      ))
    }
    return guides
  }

  if (title.includes('köfte') || (hasMeat && title.includes('patates'))) {
    return [
      guide(
        'meatball-oven',
        'Fırın',
        '🔥',
        ['Fırın'],
        32,
        'Köfte ve sebzeyi aynı tepside hazırlama.',
        [intro, 'Köfteyi şekillendir; patates ve sebzeleri benzer boyutlarda doğra.', 'Malzemeleri tek kat olacak şekilde tepsiye yay ve kontrollü pişir.', 'Köftenin içinin tamamen piştiğinden emin olup sıcak servis et.'],
        'Çiğ et içeren tariflerde yalnızca renk değişimine güvenme; tam pişme ve hijyen kurallarına dikkat et.',
      ),
      guide(
        'meatball-airfryer',
        'Airfryer',
        '🌪️',
        ['Airfryer'],
        24,
        'Daha küçük parti, hızlı kızarma.',
        [intro, 'Köfte ve patatesleri sepeti aşırı doldurmadan yerleştir.', 'Pişirme ortasında sepeti çevir veya malzemeleri karıştır.', 'Köftenin içinin tamamen piştiğini kontrol ederek servis et.'],
      ),
      guide(
        'meatball-stove',
        'Ocak',
        '🍳',
        ['Ocak'],
        26,
        'Tava + kapak yöntemi.',
        [intro, 'Patatesi küçük parçalar halinde tavada kontrollü biçimde ön pişir.', 'Köfteleri ayrı bölümde veya ikinci tavada her yüzü eşit pişecek şekilde çevir.', 'Hepsini kısa süre birlikte ısıtıp servis et.'],
      ),
    ]
  }

  if (hasProtein && hasGrain) {
    const proteinName = hasFish ? 'balığı' : hasMeat ? 'eti' : hasChicken ? 'tavuğu' : 'proteini'
    return [
      guide(
        'protein-stove',
        'Ocak',
        '🍳',
        ['Ocak'],
        28,
        'Tek mutfak ekipmanıyla klasik yöntem.',
        [intro, `Tahıl/bakliyat kısmını uygun tencerede pişir; ${proteinName} ayrı tavada kontrollü biçimde hazırla.`, 'Sebze ve sosları son aşamada ekleyip porsiyonları birleştir.', 'Kalan uygun malzemeyi sonraki Lokma öğünü için soğutup sakla.'],
      ),
      guide(
        'protein-airfryer',
        'Airfryer destekli',
        '🌪️',
        ['Airfryer', 'Ocak'],
        25,
        `${proteinName.charAt(0).toLocaleUpperCase('tr-TR') + proteinName.slice(1)} airfryer'da, yan ürün ocakta.`,
        [intro, `Tahıl/bakliyat kısmını ocakta hazırlarken ${proteinName} airfryer sepetinde tek kat pişir.`, 'Protein parçasını pişirme boyunca bir kez kontrol edip gerekirse çevir.', 'İki bileşeni sebzelerle birleştirip porsiyonla.'],
      ),
      guide(
        'protein-oven',
        'Fırın destekli',
        '🔥',
        ['Fırın', 'Ocak'],
        34,
        `${proteinName.charAt(0).toLocaleUpperCase('tr-TR') + proteinName.slice(1)} fırında, yan ürün ocakta.`,
        [intro, `Tahıl/bakliyatı ocakta hazırlarken ${proteinName} ve uygun sebzeleri fırın tepsisine al.`, 'Protein tamamen pişene kadar kontrollü pişir; aşırı kurutmamaya dikkat et.', 'Pişen parçaları tek tabakta veya meal-prep kaplarında birleştir.'],
      ),
    ]
  }

  if (hasGrain || title.includes('makarna') || title.includes('noodle') || title.includes('çorba') || title.includes('pilav')) {
    return [
      guide(
        'pot-stove',
        'Ocak',
        '🍲',
        ['Ocak'],
        24,
        'Tencere/tava ile en güvenilir yöntem.',
        [intro, 'Ana kuru malzemeyi uygun miktarda sıvıyla kontrollü biçimde pişir.', 'Sebze, baharat ve diğer bileşenleri pişme süresine göre sırayla ekle.', 'Kıvam ve pişme durumunu kontrol edip porsiyonlara ayır.'],
      ),
    ]
  }

  return [
    guide(
      'generic-stove',
      'Ocak',
      '🍳',
      ['Ocak'],
      20,
      'Genel tava/tencere yöntemi.',
      [intro, 'Malzemeleri pişme sürelerine göre sırala ve ana bileşeni kontrollü ateşte hazırla.', 'Sebze ve diğer hassas bileşenleri daha sonra ekle.', 'Porsiyonlayıp servis et; kalan uygun malzemeleri sonraki öğün için sakla.'],
    ),
  ]
}

export function guideIsAvailable(guideItem: CookingGuide, equipment: CookingEquipment[]) {
  return guideItem.equipment.every((item) => equipment.includes(item))
}
