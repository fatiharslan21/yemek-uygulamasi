import { INGREDIENT_BY_ID, RECIPE_CATALOG } from '../data/recipeCatalog'
import type { PlannedMeal, Recipe, UserPlanProfile, WeeklyPlan } from '../types'
import '../recipe-detail.css'

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

function prepMinutes(recipe: Recipe | undefined, meal: PlannedMeal) {
  if (meal.source !== 'Evde') return null
  if (meal.slot === 'Ara öğün' || meal.slot === 'Gece öğünü') return 5
  if (recipe?.tags.some((tag) => ['hızlı', 'pratik'].includes(tag))) return 10
  if (recipe?.tags.includes('meal prep')) return 25
  return Math.min(40, 15 + ((recipe?.ingredients.length ?? 2) * 4))
}

function buildWhyReasons(meal: PlannedMeal, recipe: Recipe | undefined, profile: UserPlanProfile, plan: WeeklyPlan) {
  const reasons: Array<{ emoji: string; title: string; detail: string }> = []
  const totalMeals = plan.days.reduce((sum, day) => sum + day.meals.length, 0)
  const averageMealBudget = profile.budget / Math.max(1, totalMeals)
  const proteinShare = Math.round(meal.protein / Math.max(1, plan.nutritionTargets.protein) * 100)

  reasons.push({
    emoji: '🥑',
    title: `${profile.diet} filtrelerinden geçti`,
    detail: 'Plan motoru önce beslenme tipini ve seçtiğin hassasiyetleri kontrol ediyor.',
  })

  if (meal.estimatedPrice <= averageMealBudget * 1.15) {
    reasons.push({
      emoji: '💸',
      title: 'Öğün bütçesiyle uyumlu',
      detail: `Bu öğünün yaklaşık maliyeti, planındaki öğün başı bütçe bandına yakın veya altında.`,
    })
  } else {
    reasons.push({
      emoji: '⚖️',
      title: 'Daha pahalı ama hafta içinde dengeleniyor',
      detail: 'Lokma pahalı bir öğünü ancak diğer günlerdeki daha ekonomik seçimlerle toplam bütçeyi dengeleyebiliyorsa tutuyor.',
    })
  }

  if (proteinShare >= 20) {
    reasons.push({
      emoji: '💪',
      title: `Protein hedefinin yaklaşık %${proteinShare}'ünü karşılıyor`,
      detail: 'Özellikle kilo verme ve bulk hedeflerinde protein puanı seçim sırasında daha yüksek ağırlık alıyor.',
    })
  } else {
    reasons.push({
      emoji: '🔥',
      title: 'Günlük enerji dağılımına uyuyor',
      detail: 'Kalori yükü kahvaltı, öğle, ara öğün ve akşam için belirlenen paylara göre değerlendiriliyor.',
    })
  }

  const reused = (recipe?.ingredients ?? [])
    .map((ingredient) => plan.shoppingList.find((item) => item.ingredientId === ingredient.ingredientId))
    .filter((item) => item && item.usedInMeals >= 2)

  if (reused.length > 0) {
    reasons.push({
      emoji: '♻️',
      title: `${reused.length} malzemesi başka öğünlerle ortak`,
      detail: 'Aynı market paketini hafta içinde tekrar kullanmak maliyeti ve elde kalan ürünü azaltmaya yardımcı oluyor.',
    })
  }

  const sourceRatio = meal.source === 'Evde'
    ? profile.mealSplit.home
    : meal.source === 'Sipariş'
      ? profile.mealSplit.delivery
      : profile.mealSplit.dineOut

  reasons.push({
    emoji: meal.source === 'Evde' ? '🏠' : meal.source === 'Sipariş' ? '🛵' : '🍽️',
    title: `${meal.source} tercihinle eşleşiyor`,
    detail: `Planında bu yemek biçimine yaklaşık %${sourceRatio} pay ayırdın.`,
  })

  return reasons.slice(0, 5)
}

function preparationSteps(recipe: Recipe | undefined, meal: PlannedMeal, people: number) {
  if (meal.source !== 'Evde') {
    return [
      'Konum ve gerçek işletme katmanı bağlandığında Lokma bu öğün için çevrendeki uygun restoranları burada listeleyecek.',
      'Restoran seçildiğinde fiyat, mesafe ve mümkünse menü besin bilgisi bu öğün kartına geri yazılacak.',
    ]
  }

  const ingredientNames = (recipe?.ingredients ?? [])
    .map((item) => INGREDIENT_BY_ID[item.ingredientId]?.name)
    .filter(Boolean)

  return [
    `${people} kişi için gerekli malzemeleri ölç ve hazırla${ingredientNames.length ? `: ${ingredientNames.slice(0, 4).join(', ')}${ingredientNames.length > 4 ? '…' : ''}` : '.'}`,
    'Ana bileşenleri uygun pişirme yöntemiyle hazırla; sebze ve yan bileşenleri son aşamada birleştir.',
    'Porsiyonlara ayır, kalan uygun malzemeleri haftadaki diğer Lokma tarifleri için sakla.',
  ]
}

export function RecipeDetailDrawer({ meal, profile, plan, locked, onClose, onSwap, onToggleLock }: RecipeDetailDrawerProps) {
  const recipe = RECIPE_CATALOG.find((item) => item.id === meal.recipeId)
  const whyReasons = buildWhyReasons(meal, recipe, profile, plan)
  const minutes = prepMinutes(recipe, meal)
  const steps = preparationSteps(recipe, meal, profile.people)

  return (
    <div className="recipe-detail-overlay" role="presentation" onMouseDown={onClose}>
      <aside className="recipe-detail-drawer" role="dialog" aria-modal="true" aria-label={`${meal.title} detayları`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-handle" />
        <header className="recipe-detail-header">
          <div className="recipe-detail-hero-icon">{meal.emoji}</div>
          <div className="recipe-detail-heading">
            <span>{meal.slot} • {meal.source}</span>
            <h2>{meal.title}</h2>
            <p>{meal.subtitle}</p>
          </div>
          <button className="recipe-close-button" type="button" onClick={onClose} aria-label="Detayı kapat">×</button>
        </header>

        <div className="recipe-quick-stats">
          <div><span>🔥 Kalori</span><strong>{meal.calories} kcal</strong></div>
          <div><span>💪 Protein</span><strong>{meal.protein} g</strong></div>
          <div><span>💸 Tahmin</span><strong>≈ {Math.round(meal.estimatedPrice).toLocaleString('tr-TR')} ₺</strong></div>
          <div><span>⏱️ Süre</span><strong>{minutes ? `≈ ${minutes} dk` : 'Sipariş'}</strong></div>
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
          ) : (
            <div className="recipe-empty-note">Bu dışarı öğününün gerçek içerik ve porsiyon bilgisi restoran veri katmanı bağlandığında gelecek.</div>
          )}
          {recipe?.allergens.length ? <div className="recipe-allergen-note">⚠️ Katalog alerjen etiketi: {recipe.allergens.join(', ')}</div> : null}
        </section>

        <section className="recipe-detail-section why-section">
          <div className="recipe-section-title"><span>🧠</span><div><h3>Lokma bunu neden seçti?</h3><p>Plan motorunun bu öğüne verdiği başlıca artılar</p></div></div>
          <div className="why-reason-list">
            {whyReasons.map((reason) => (
              <article key={reason.title}><span>{reason.emoji}</span><div><strong>{reason.title}</strong><p>{reason.detail}</p></div></article>
            ))}
          </div>
        </section>

        <section className="recipe-detail-section">
          <div className="recipe-section-title"><span>{meal.source === 'Evde' ? '👨‍🍳' : '📍'}</span><div><h3>{meal.source === 'Evde' ? 'Hazırlama akışı' : 'İşletme bağlantısı'}</h3><p>{meal.source === 'Evde' ? 'Şimdilik prototip seviyesinde kısa hazırlama özeti' : 'Bir sonraki konum fazında canlı veriyle dolacak'}</p></div></div>
          <ol className="recipe-step-list">
            {steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          {meal.source === 'Evde' && <p className="recipe-prototype-note">Not: Bu bölüm şu an tarif kataloğundaki bileşenlerden üretilen prototip hazırlama akışıdır; final sürümde tarif bazlı doğrulanmış adımlar tutulacak.</p>}
        </section>

        <footer className="recipe-detail-footer">
          <button type="button" className="drawer-swap-button" disabled={locked} onClick={onSwap}>{locked ? '🔒 Önce kilidi aç' : '↻ Bu öğünü değiştir'}</button>
          <button type="button" className={`drawer-lock-button ${locked ? 'active' : ''}`} onClick={onToggleLock}>{locked ? '🔒 Kilitli — aç' : '🔓 Bu öğünü sabitle'}</button>
        </footer>
      </aside>
    </div>
  )
}
