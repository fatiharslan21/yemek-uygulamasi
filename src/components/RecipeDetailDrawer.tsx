import { useMemo, useState } from 'react'
import { INGREDIENT_BY_ID, RECIPE_CATALOG } from '../data/recipeCatalog'
import { getCookingGuides, guideIsAvailable } from '../services/cookingGuides'
import type { PlannedMeal, Recipe, UserPlanProfile, WeeklyPlan } from '../types'
import '../recipe-detail.css'
import '../kitchen.css'

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

function outsidePreparationSteps() {
  return [
    'Nearby katmanı bu öğün için çevrendeki uygun restoranları gerçek konum verisiyle eşleştirmeye başlayacak.',
    'İşletme seçildiğinde ileride fiyat, mesafe ve destekleniyorsa menü besin bilgisi bu öğüne geri yazılacak.',
  ]
}

export function RecipeDetailDrawer({ meal, profile, plan, locked, onClose, onSwap, onToggleLock }: RecipeDetailDrawerProps) {
  const recipe = RECIPE_CATALOG.find((item) => item.id === meal.recipeId)
  const whyReasons = buildWhyReasons(meal, recipe, profile, plan)
  const cookingGuides = useMemo(() => getCookingGuides(recipe, meal, profile.people), [recipe, meal, profile.people])
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
          <div><span>⏱️ Süre</span><strong>{meal.source === 'Evde' ? (selectedGuide ? `≈ ${selectedGuide.minutes} dk` : 'Tarife göre') : 'Sipariş'}</strong></div>
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
          ) : <div className="recipe-empty-note">Bu dışarı öğününün gerçek içerik ve porsiyon bilgisi restoran veri katmanı bağlandığında gelecek.</div>}
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
          <section className="recipe-detail-section">
            <div className="recipe-section-title"><span>📍</span><div><h3>İşletme bağlantısı</h3><p>Nearby v0.1 gerçek çevre verisini dashboard'a getiriyor</p></div></div>
            <ol className="recipe-step-list">{outsidePreparationSteps().map((step) => <li key={step}>{step}</li>)}</ol>
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
