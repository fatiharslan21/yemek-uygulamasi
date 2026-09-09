import { useMemo, useState } from 'react'
import { INGREDIENT_BY_ID, RECIPE_CATALOG } from '../data/recipeCatalog'
import { useNearbyData } from '../context/NearbyDataContext'
import { getCookingGuides, guideIsAvailable } from '../services/cookingGuides'
import { rankRestaurantsForMeal } from '../services/businessMatcher'
import type { NearbyPlace } from '../services/nearbyPlaces'
import type { PlannedMeal, Recipe, UserPlanProfile, WeeklyPlan } from '../types'
import '../recipe-detail.css'
import '../kitchen.css'
import '../business-link.css'

type RecipeDetailDrawerProps = {
  meal: PlannedMeal
  profile: UserPlanProfile
  plan: WeeklyPlan
  locked: boolean
  onClose: () => void
  onSwap: () => void
  onToggleLock: () => void
}

function quantityText(quantity: number, unit: 'g' | 'ml' | 'adet') {
  if (unit === 'g' && quantity >= 1000) return `${(quantity / 1000).toFixed(1).replace('.', ',')} kg`
  if (unit === 'ml' && quantity >= 1000) return `${(quantity / 1000).toFixed(1).replace('.', ',')} L`
  return `${Math.round(quantity)} ${unit}`
}

function distanceText(meters: number) {
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

function externalWebsite(value: string) {
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

function buildWhyReasons(meal: PlannedMeal, recipe: Recipe | undefined, profile: UserPlanProfile, plan: WeeklyPlan) {
  const reasons: Array<{ emoji: string; title: string; detail: string }> = []
  const totalMeals = plan.days.reduce((sum, day) => sum + day.meals.length, 0)
  const averageMealBudget = profile.budget / Math.max(1, totalMeals)
  const proteinShare = Math.round(meal.protein / Math.max(1, plan.nutritionTargets.protein) * 100)

  reasons.push({ emoji: '🥑', title: `${profile.diet} filtrelerinden geçti`, detail: 'Plan motoru önce beslenme tipini ve seçtiğin hassasiyetleri kontrol ediyor.' })

  if (meal.estimatedPrice <= averageMealBudget * 1.15) {
    reasons.push({ emoji: '💸', title: 'Öğün bütçesiyle uyumlu', detail: 'Bu öğünün yaklaşık maliyeti, planındaki öğün başı bütçe bandına yakın veya altında.' })
  } else {
    reasons.push({ emoji: '⚖️', title: 'Daha pahalı ama hafta içinde dengeleniyor', detail: 'Lokma pahalı bir öğünü ancak diğer günlerdeki daha ekonomik seçimlerle toplam bütçeyi dengeleyebiliyorsa tutuyor.' })
  }

  if (proteinShare >= 20) {
    reasons.push({ emoji: '💪', title: `Protein hedefinin yaklaşık %${proteinShare}'ünü karşılıyor`, detail: 'Özellikle kilo verme ve bulk hedeflerinde protein puanı seçim sırasında daha yüksek ağırlık alıyor.' })
  } else {
    reasons.push({ emoji: '🔥', title: 'Günlük enerji dağılımına uyuyor', detail: 'Kalori yükü kahvaltı, öğle, ara öğün ve akşam için belirlenen paylara göre değerlendiriliyor.' })
  }

  const reused = (recipe?.ingredients ?? [])
    .map((ingredient) => plan.shoppingList.find((item) => item.ingredientId === ingredient.ingredientId))
    .filter((item) => item && item.usedInMeals >= 2)

  if (reused.length > 0) {
    reasons.push({ emoji: '♻️', title: `${reused.length} malzemesi başka öğünlerle ortak`, detail: 'Aynı market paketini hafta içinde tekrar kullanmak maliyeti ve elde kalan ürünü azaltmaya yardımcı oluyor.' })
  }

  const sourceRatio = meal.source === 'Evde' ? profile.mealSplit.home : meal.source === 'Sipariş' ? profile.mealSplit.delivery : profile.mealSplit.dineOut
  reasons.push({ emoji: meal.source === 'Evde' ? '🏠' : meal.source === 'Sipariş' ? '🛵' : '🍽️', title: `${meal.source} tercihinle eşleşiyor`, detail: `Planında bu yemek biçimine yaklaşık %${sourceRatio} pay ayırdın.` })

  return reasons.slice(0, 5)
}

function BusinessMetadata({ place }: { place: NearbyPlace }) {
  const hasMetadata = place.openingHours || place.website || place.phone || place.delivery != null || place.takeaway != null
  if (!hasMetadata) return null

  return (
    <div className="business-real-meta">
      {place.openingHours && <span>🕒 {place.openingHours}</span>}
      {place.delivery === true && <span>🛵 Paket servis etiketi var</span>}
      {place.delivery === false && <span>🚫 Paket servis etiketi yok</span>}
      {place.takeaway === true && <span>🥡 Gel-al etiketi var</span>}
      {place.phone && <a href={`tel:${place.phone}`}>☎ {place.phone}</a>}
      {place.website && <a href={externalWebsite(place.website)} target="_blank" rel="noreferrer">🌐 Web sitesi ↗</a>}
    </div>
  )
}

export function RecipeDetailDrawer({ meal, profile, plan, locked, onClose, onSwap, onToggleLock }: RecipeDetailDrawerProps) {
  const { places, restaurantAssignments, assignRestaurant } = useNearbyData()
  const recipe = RECIPE_CATALOG.find((item) => item.id === meal.recipeId)
  const whyReasons = buildWhyReasons(meal, recipe, profile, plan)
  const cookingGuides = useMemo(() => getCookingGuides(recipe, meal, profile.people), [recipe, meal, profile.people])
  const restaurantCandidates = useMemo(() => rankRestaurantsForMeal(places, meal).slice(0, 6), [places, meal])
  const assignedRestaurant = restaurantAssignments[meal.id]
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null)
  const selectedGuide = cookingGuides.find((item) => item.id === selectedGuideId)
    ?? cookingGuides.find((item) => guideIsAvailable(item, profile.cookingEquipment))
    ?? cookingGuides[0]
  const selectedGuideAvailable = selectedGuide ? guideIsAvailable(selectedGuide, profile.cookingEquipment) : false

  return (
    <div className="recipe-detail-overlay" role="presentation" onMouseDown={onClose}>
      <aside className="recipe-detail-drawer" role="dialog" aria-modal="true" aria-label={`${meal.title} detayları`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-handle" />
        <header className="recipe-detail-header">
          <div className="recipe-detail-hero-icon">{meal.emoji}</div>
          <div className="recipe-detail-heading"><span>{meal.slot} • {meal.source}</span><h2>{meal.title}</h2><p>{meal.subtitle}</p></div>
          <button className="recipe-close-button" type="button" onClick={onClose} aria-label="Detayı kapat">×</button>
        </header>

        <div className="recipe-quick-stats">
          <div><span>🔥 Kalori</span><strong>{meal.calories} kcal</strong></div>
          <div><span>💪 Protein</span><strong>{meal.protein} g</strong></div>
          <div><span>💸 Tahmin</span><strong>≈ {Math.round(meal.estimatedPrice).toLocaleString('tr-TR')} ₺</strong></div>
          <div><span>⏱️ / 📏</span><strong>{meal.source === 'Evde' ? (selectedGuide ? `≈ ${selectedGuide.minutes} dk` : 'Tarife göre') : assignedRestaurant ? distanceText(assignedRestaurant.distanceMeters) : 'İşletme seç'}</strong></div>
        </div>

        <section className="recipe-detail-section">
          <div className="recipe-section-title"><span>🛒</span><div><h3>Bu öğünde ne var?</h3><p>{profile.people} kişi için planlanan miktarlar</p></div></div>
          {recipe && recipe.ingredients.length > 0 ? (
            <div className="recipe-ingredient-list">
              {recipe.ingredients.map((ingredient) => {
                const definition = INGREDIENT_BY_ID[ingredient.ingredientId]
                if (!definition) return null
                const shoppingItem = plan.shoppingList.find((item) => item.ingredientId === ingredient.ingredientId)
                return (
                  <div className="recipe-ingredient-row" key={ingredient.ingredientId}>
                    <span className="recipe-ingredient-emoji">{definition.emoji}</span>
                    <div><strong>{definition.name}</strong><small>{shoppingItem && shoppingItem.usedInMeals >= 2 ? `♻️ Haftada ${shoppingItem.usedInMeals} öğünde kullanılıyor` : 'Bu öğün için kullanılıyor'}</small></div>
                    <b>{quantityText(ingredient.quantity * profile.people, definition.unit)}</b>
                  </div>
                )
              })}
            </div>
          ) : <div className="recipe-empty-note">Bu dışarı öğününün gerçek içerik ve porsiyon bilgisi menü veri katmanı bağlandığında gelecek.</div>}
          {recipe?.allergens.length ? <div className="recipe-allergen-note">⚠️ Katalog alerjen etiketi: {recipe.allergens.join(', ')}</div> : null}
        </section>

        <section className="recipe-detail-section why-section">
          <div className="recipe-section-title"><span>🧠</span><div><h3>Lokma bunu neden seçti?</h3><p>Plan motorunun bu öğüne verdiği başlıca artılar</p></div></div>
          <div className="why-reason-list">{whyReasons.map((reason) => <article key={reason.title}><span>{reason.emoji}</span><div><strong>{reason.title}</strong><p>{reason.detail}</p></div></article>)}</div>
        </section>

        {meal.source === 'Evde' ? (
          <section className="recipe-detail-section cooking-method-section">
            <div className="recipe-section-title"><span>👨‍🍳</span><div><h3>Nasıl pişirmek istersin?</h3><p>Aynı öğün için mutfağına uygun farklı hazırlama senaryoları</p></div></div>

            <div className="cooking-equipment-summary">
              {(profile.cookingEquipment.length ? profile.cookingEquipment : ['Ekipman seçilmedi']).map((item) => <span key={item}>✓ {item}</span>)}
            </div>

            <div className="cooking-method-tabs">
              {cookingGuides.map((guide) => {
                const available = guideIsAvailable(guide, profile.cookingEquipment)
                const active = selectedGuide?.id === guide.id
                return <button key={guide.id} type="button" className={`cooking-method-tab ${active ? 'active' : ''} ${available ? '' : 'unavailable'}`} onClick={() => setSelectedGuideId(guide.id)}><span>{guide.emoji}</span>{guide.label}{!available && <em>ekipman eksik</em>}</button>
              })}
            </div>

            {selectedGuide && (
              <div className="cooking-guide-card">
                <div className="cooking-guide-top"><div><strong>{selectedGuide.emoji} {selectedGuide.label}</strong><p>{selectedGuide.summary}</p></div><span>≈ {selectedGuide.minutes} dk</span></div>
                <div className="cooking-guide-requirements">
                  {selectedGuide.equipment.length === 0
                    ? <span>✨ Ek ekipman gerektirmez</span>
                    : selectedGuide.equipment.map((equipment) => <span key={equipment} className={profile.cookingEquipment.includes(equipment) ? '' : 'missing'}>{profile.cookingEquipment.includes(equipment) ? '✓' : '＋'} {equipment}</span>)}
                </div>
                {!selectedGuideAvailable && selectedGuide.equipment.length > 0 && <div className="cooking-method-note">Bu yöntem kullanılabilir bir alternatif ama gerekli ekipmanların tamamı mutfak profilinde seçili değil. Tercihleri düzenleyerek ekleyebilirsin.</div>}
                <ol className="recipe-step-list">{selectedGuide.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                {selectedGuide.note && <div className="cooking-method-note">⚠️ {selectedGuide.note}</div>}
              </div>
            )}
          </section>
        ) : (
          <section className="recipe-detail-section restaurant-match-section">
            <div className="recipe-section-title"><span>📍</span><div><h3>Bu öğünü nereden alalım?</h3><p>Nearby taramasındaki gerçek restoranları öğün türü + mutfak etiketi + mesafeye göre sıralıyoruz</p></div></div>

            {assignedRestaurant && (
              <div className="assigned-restaurant-card assigned-rich">
                <span>✓</span>
                <div><strong>{assignedRestaurant.name}</strong><p>{assignedRestaurant.subtype} • {distanceText(assignedRestaurant.distanceMeters)}{assignedRestaurant.cuisine ? ` • ${assignedRestaurant.cuisine.split(';').join(', ')}` : ''}</p><BusinessMetadata place={assignedRestaurant} /></div>
                <button type="button" onClick={() => assignRestaurant(meal.id, undefined)}>Değiştir</button>
              </div>
            )}

            {restaurantCandidates.length > 0 ? (
              <div className="restaurant-candidate-list">
                {restaurantCandidates.map((place, index) => {
                  const selected = assignedRestaurant?.id === place.id
                  const serviceBits = [place.delivery === true ? '🛵' : '', place.takeaway === true ? '🥡' : '', place.website ? '🌐' : ''].filter(Boolean).join(' ')
                  return (
                    <button key={place.id} type="button" className={`restaurant-candidate ${selected ? 'selected' : ''}`} onClick={() => assignRestaurant(meal.id, selected ? undefined : place)}>
                      <span className="restaurant-rank">{index + 1}</span>
                      <div><strong>{place.name}</strong><p>{place.subtype}{place.cuisine ? ` • ${place.cuisine.split(';').join(', ')}` : ''}{serviceBits ? ` • ${serviceBits}` : ''}</p></div>
                      <b>📏 {distanceText(place.distanceMeters)}</b>
                      <em>{selected ? '✓ Seçildi' : 'Bu öğüne bağla'}</em>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="restaurant-empty-state">
                <span>📡</span><div><strong>Henüz restoran verisi yok.</strong><p>Dashboard’daki “Çevremi tara” butonunu çalıştır; bulunan gerçek restoranlar burada otomatik aday olacak.</p></div>
              </div>
            )}

            <div className="restaurant-data-note">ℹ️ İşletme adı, konum, mesafe ve yukarıda görünüyorsa iletişim/hizmet etiketleri OpenStreetMap kaydından gelir ve eksik veya güncel olmayabilir. Gerçek menü fiyatı bilinmediği için öğünün bütçe tutarı hâlâ Lokma demo tahminidir.</div>
          </section>
        )}

        <footer className="recipe-detail-footer">
          <button type="button" className="drawer-swap-button" disabled={locked} onClick={onSwap}>{locked ? '🔒 Önce kilidi aç' : '↻ Bu öğünü değiştir'}</button>
          <button type="button" className={`drawer-lock-button ${locked ? 'active' : ''}`} onClick={onToggleLock}>{locked ? '🔒 Kilitli — aç' : '🔓 Bu öğünü sabitle'}</button>
        </footer>
      </aside>
    </div>
  )
}
