import { useMemo, useState } from 'react'
import type {
  ActivityLevel,
  CookingEquipment,
  DietType,
  Goal,
  MealStylePreset,
  Sex,
  UserPlanProfile,
} from '../types'
import '../kitchen.css'

type OnboardingFlowProps = {
  initialProfile: UserPlanProfile
  onComplete: (profile: UserPlanProfile) => void
  onExit: () => void
}

type ChoiceCardProps<T extends string> = {
  value: T
  current: T
  emoji: string
  title: string
  description?: string
  onSelect: (value: T) => void
}

const activityDescriptions: Record<ActivityLevel, string> = {
  Hareketsiz: 'Masa başı, düzenli egzersiz yok',
  'Az aktif': 'Haftada 1–3 gün hafif hareket',
  Aktif: 'Haftada 3–5 gün egzersiz',
  'Çok aktif': 'Neredeyse her gün yoğun hareket',
}

const goalDescriptions: Record<Goal, string> = {
  'Kilo ver': 'Kalori açığı + yüksek protein dengesi',
  Koru: 'Mevcut kilonu korumaya odaklan',
  Bulk: 'Kas kazanımını destekleyen enerji fazlası',
  'Dengeli beslen': 'Katı hedef olmadan dengeli seçimler',
}

const splitByPreset: Record<MealStylePreset, UserPlanProfile['mealSplit']> = {
  Ekonomik: { home: 80, delivery: 15, dineOut: 5 },
  Dengeli: { home: 60, delivery: 30, dineOut: 10 },
  Rahat: { home: 40, delivery: 40, dineOut: 20 },
}

const allergyOptions = ['Gluten', 'Laktoz', 'Yumurta', 'Kuruyemiş', 'Deniz ürünü', 'Soya']
const kitchenEquipmentOptions: Array<{ value: CookingEquipment; emoji: string; detail: string }> = [
  { value: 'Ocak', emoji: '🍳', detail: 'Tencere ve tava tarifleri' },
  { value: 'Fırın', emoji: '🔥', detail: 'Tepsi ve fırın yemekleri' },
  { value: 'Airfryer', emoji: '🌪️', detail: 'Hızlı, küçük parti pişirme' },
  { value: 'Mikrodalga', emoji: '📡', detail: 'Isıtma ve hızlı tarifler' },
  { value: 'Tost makinesi', emoji: '🥪', detail: 'Tost ve pratik sıcak öğün' },
  { value: 'Blender', emoji: '🥤', detail: 'Smoothie ve soslar' },
]

function ChoiceCard<T extends string>({ value, current, emoji, title, description, onSelect }: ChoiceCardProps<T>) {
  const active = value === current
  return (
    <button type="button" className={`choice-card ${active ? 'is-active' : ''}`} onClick={() => onSelect(value)} aria-pressed={active}>
      <span className="choice-emoji">{emoji}</span>
      <span className="choice-copy"><strong>{title}</strong>{description && <small>{description}</small>}</span>
      <span className="choice-check">{active ? '✓' : ''}</span>
    </button>
  )
}

function estimateTargets(profile: UserPlanProfile) {
  const sexOffset = profile.sex === 'Erkek' ? 5 : -161
  const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + sexOffset
  const activityFactor: Record<ActivityLevel, number> = {
    Hareketsiz: 1.2,
    'Az aktif': 1.375,
    Aktif: 1.55,
    'Çok aktif': 1.725,
  }
  const maintenance = bmr * activityFactor[profile.activity]
  const goalAdjustment: Record<Goal, number> = {
    'Kilo ver': -400,
    Koru: 0,
    Bulk: 300,
    'Dengeli beslen': 0,
  }
  const calories = Math.max(1200, Math.round((maintenance + goalAdjustment[profile.goal]) / 50) * 50)
  const proteinMultiplier = profile.goal === 'Bulk' || profile.goal === 'Kilo ver' ? 1.8 : 1.5
  return { calories, protein: Math.round(profile.weight * proteinMultiplier) }
}

export function OnboardingFlow({ initialProfile, onComplete, onExit }: OnboardingFlowProps) {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<UserPlanProfile>(initialProfile)
  const totalSteps = 6
  const targets = useMemo(() => estimateTargets(profile), [profile])

  const patch = <K extends keyof UserPlanProfile,>(key: K, value: UserPlanProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }))
  }

  const toggleAllergy = (allergy: string) => {
    patch('allergies', profile.allergies.includes(allergy)
      ? profile.allergies.filter((item) => item !== allergy)
      : [...profile.allergies, allergy])
  }

  const toggleEquipment = (equipment: CookingEquipment) => {
    patch('cookingEquipment', profile.cookingEquipment.includes(equipment)
      ? profile.cookingEquipment.filter((item) => item !== equipment)
      : [...profile.cookingEquipment, equipment])
  }

  const selectPreset = (preset: MealStylePreset) => {
    setProfile((current) => ({ ...current, stylePreset: preset, mealSplit: splitByPreset[preset] }))
  }

  const goNext = () => setStep((current) => Math.min(current + 1, totalSteps - 1))
  const goBack = () => setStep((current) => Math.max(current - 1, 0))
  const progress = ((step + 1) / totalSteps) * 100
  const budgetPerDay = Math.round(profile.budget / Math.max(1, profile.days))
  const budgetPerPersonDay = Math.round(budgetPerDay / Math.max(1, profile.people))
  const locationText = [profile.neighborhood, profile.district, profile.city].filter(Boolean).join(', ')

  return (
    <main className="onboarding-page">
      <div className="onboarding-orb orb-a" />
      <div className="onboarding-orb orb-b" />

      <header className="onboarding-header shell">
        <button className="brand brand-button" type="button" onClick={onExit}><span className="brand-mark">🍋</span><span>lokma</span></button>
        <div className="step-status"><span>Adım {step + 1}/{totalSteps}</span><div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div></div>
        <button className="ghost-action" type="button" onClick={onExit}>Çıkış</button>
      </header>

      <section className="onboarding-shell shell">
        <div className="onboarding-card">
          {step === 0 && (
            <div className="step-panel welcome-step">
              <div className="welcome-art" aria-hidden="true"><span className="welcome-plate">🥗</span><span className="float-food food-a">🍋</span><span className="float-food food-b">🍅</span><span className="float-food food-c">🥑</span><span className="float-food food-d">🥖</span></div>
              <span className="step-kicker">✓ Konum tamam • şimdi seni tanıyalım</span>
              <h1>Sana gerçekten uyan bir <em>yemek haftası</em> kuralım.</h1>
              <p>Yaklaşık 2 dakika sürecek. Bütçeni, hedefini ve nasıl yemek istediğini anlayıp önce menünü göstereceğiz; sen onaylamadan plan başlamayacak.</p>
              <div className="welcome-benefits"><span>💸 Bütçene göre</span><span>🎯 Hedefine göre</span><span>📍 {locationText || 'Seçtiğin çevreye göre'}</span></div>
              <button className="primary-onboarding" type="button" onClick={goNext}>Başlayalım <span>→</span></button>
            </div>
          )}

          {step === 1 && (
            <div className="step-panel">
              <span className="step-kicker">🧍 Önce seni tanıyalım</span>
              <h2>Vücudun ve günlük tempon nasıl?</h2>
              <p className="step-description">Bunları yalnızca yaklaşık enerji ve protein hedefi oluşturmak için kullanıyoruz.</p>
              <div className="form-grid two-col">
                <label className="input-field full-width"><span>Sana nasıl hitap edelim?</span><input value={profile.name} onChange={(e) => patch('name', e.target.value)} placeholder="Örn. Fatih" /></label>
                <label className="input-field"><span>Yaş</span><div className="input-with-unit"><input type="number" min="16" max="100" value={profile.age} onChange={(e) => patch('age', Number(e.target.value))} /><small>yaş</small></div></label>
                <label className="input-field"><span>Cinsiyet</span><select value={profile.sex} onChange={(e) => patch('sex', e.target.value as Sex)}><option>Erkek</option><option>Kadın</option></select></label>
                <label className="input-field"><span>Boy</span><div className="input-with-unit"><input type="number" min="130" max="230" value={profile.height} onChange={(e) => patch('height', Number(e.target.value))} /><small>cm</small></div></label>
                <label className="input-field"><span>Kilo</span><div className="input-with-unit"><input type="number" min="35" max="250" step="0.1" value={profile.weight} onChange={(e) => patch('weight', Number(e.target.value))} /><small>kg</small></div></label>
              </div>
              <div className="subsection"><span className="field-heading">Günlük hareketin</span><div className="choice-grid compact">
                {(Object.keys(activityDescriptions) as ActivityLevel[]).map((activity) => <ChoiceCard key={activity} value={activity} current={profile.activity} emoji={activity === 'Hareketsiz' ? '🪑' : activity === 'Az aktif' ? '🚶' : activity === 'Aktif' ? '🏃' : '⚡'} title={activity} description={activityDescriptions[activity]} onSelect={(value) => patch('activity', value)} />)}
              </div></div>
              <div className="subsection"><span className="field-heading">Hedefin</span><div className="choice-grid compact">
                {(['Kilo ver', 'Koru', 'Bulk', 'Dengeli beslen'] as Goal[]).map((goal) => <ChoiceCard key={goal} value={goal} current={profile.goal} emoji={goal === 'Kilo ver' ? '📉' : goal === 'Koru' ? '⚖️' : goal === 'Bulk' ? '💪' : '🌿'} title={goal} description={goalDescriptions[goal]} onSelect={(value) => patch('goal', value)} />)}
              </div></div>
              <div className="target-preview"><span>Lokma'nın ilk tahmini</span><strong>≈ {targets.calories.toLocaleString('tr-TR')} kcal</strong><i>•</i><strong>≈ {targets.protein} g protein</strong><small>Günlük yaklaşık hedef; tıbbi öneri değildir.</small></div>
            </div>
          )}

          {step === 2 && (
            <div className="step-panel">
              <span className="step-kicker">🥑 Damak zevkin + mutfağın</span>
              <h2>Neleri yiyelim, evde nelerle pişirelim?</h2>
              <p className="step-description">Önerileri hem beslenme tercihine hem de evde gerçekten kullanabildiğin ekipmanlara göre düzenliyoruz.</p>
              <span className="field-heading">Beslenme tipi</span>
              <div className="choice-grid compact diet-grid">
                {(['Hepçil', 'Vejetaryen', 'Vegan', 'Pesketaryen'] as DietType[]).map((diet) => <ChoiceCard key={diet} value={diet} current={profile.diet} emoji={diet === 'Hepçil' ? '🍗' : diet === 'Vejetaryen' ? '🥦' : diet === 'Vegan' ? '🌱' : '🐟'} title={diet} onSelect={(value) => patch('diet', value)} />)}
              </div>
              <div className="subsection"><span className="field-heading">Alerji / hassasiyet <small>Birden fazla seçebilirsin</small></span><div className="tag-selector">
                {allergyOptions.map((allergy) => <button key={allergy} type="button" className={profile.allergies.includes(allergy) ? 'selected' : ''} onClick={() => toggleAllergy(allergy)}>{profile.allergies.includes(allergy) ? '✓ ' : '+ '}{allergy}</button>)}
              </div></div>
              <label className="input-field subsection"><span>Özellikle sevmediğin şeyler</span><textarea value={profile.dislikes} onChange={(e) => patch('dislikes', e.target.value)} placeholder="Örn. mantar, kereviz, çok acı yemekler..." /></label>
              <div className="form-grid two-col subsection">
                <div className="binary-card"><div><strong>🌞 Kahvaltı yapıyor musun?</strong><small>Planın sabah öğünleri buna göre ayarlanır.</small></div><div className="segmented"><button type="button" className={profile.breakfast ? 'active' : ''} onClick={() => patch('breakfast', true)}>Evet</button><button type="button" className={!profile.breakfast ? 'active' : ''} onClick={() => patch('breakfast', false)}>Hayır</button></div></div>
                <div className="binary-card"><div><strong>🍽️ Günde kaç ana öğün?</strong><small>Plan yoğunluğu buna göre ayarlanır.</small></div><div className="segmented three"><button type="button" className={profile.mealsPerDay === 2 ? 'active' : ''} onClick={() => patch('mealsPerDay', 2)}>2</button><button type="button" className={profile.mealsPerDay === 3 ? 'active' : ''} onClick={() => patch('mealsPerDay', 3)}>3</button><button type="button" className={profile.mealsPerDay === 4 ? 'active' : ''} onClick={() => patch('mealsPerDay', 4)}>4</button></div></div>
              </div>
              <div className="subsection">
                <span className="field-heading">Evde hangi ekipmanlar var? <small>Birden fazla seçebilirsin</small></span>
                <div className="kitchen-equipment-grid">
                  {kitchenEquipmentOptions.map((item) => {
                    const selected = profile.cookingEquipment.includes(item.value)
                    return <button key={item.value} type="button" className={`kitchen-equipment-option ${selected ? 'selected' : ''}`} onClick={() => toggleEquipment(item.value)}><span>{item.emoji}</span><div><strong>{item.value}</strong><small>{item.detail}</small></div><b>{selected ? '✓' : '+'}</b></button>
                  })}
                </div>
                <div className="kitchen-hint">👨‍🍳 <span>Aynı yemek farklı yöntemlerle yapılabiliyorsa tarif detayında ocak, fırın, airfryer veya diğer uygun seçenekleri ayrı ayrı görebilirsin.</span></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-panel budget-step">
              <span className="step-kicker">💸 Bütçe zamanı</span><h2>Bu plan için ne kadar ayırıyoruz?</h2><p className="step-description">Lokma öğünleri, alışverişi ve dışarıdan yemeyi bu sınırın içinde dengelemeye çalışır.</p>
              <div className="budget-hero-input"><span>Haftalık yemek bütçesi</span><div><input type="number" min="250" step="100" value={profile.budget} onChange={(e) => patch('budget', Number(e.target.value))} /><strong>₺</strong></div><input className="budget-range" type="range" min="500" max="10000" step="100" value={Math.min(10000, Math.max(500, profile.budget))} onChange={(e) => patch('budget', Number(e.target.value))} /><div className="range-labels"><span>500 ₺</span><span>10.000 ₺+</span></div></div>
              <div className="form-grid two-col subsection"><label className="input-field"><span>Kaç günlük plan?</span><select value={profile.days} onChange={(e) => patch('days', Number(e.target.value))}>{[3,4,5,6,7].map((day) => <option key={day} value={day}>{day} gün</option>)}</select></label><label className="input-field"><span>Kaç kişi?</span><select value={profile.people} onChange={(e) => patch('people', Number(e.target.value))}>{[1,2,3,4,5,6].map((people) => <option key={people} value={people}>{people} kişi</option>)}</select></label></div>
              <div className="budget-breakdown"><div><span>📆 Günlük toplam</span><strong>{budgetPerDay.toLocaleString('tr-TR')} ₺</strong></div><div><span>👤 Kişi başı / gün</span><strong>{budgetPerPersonDay.toLocaleString('tr-TR')} ₺</strong></div><div><span>🍽️ Tahmini ana öğün</span><strong>{profile.days * profile.mealsPerDay * profile.people} adet</strong></div></div>
            </div>
          )}

          {step === 4 && (
            <div className="step-panel">
              <span className="step-kicker">🍳 Ev mi, sipariş mi?</span><h2>Haftanın yemek karakterini seç.</h2><p className="step-description">Bunu daha sonra gün bazında değiştirebilirsin. Şimdilik Lokma'ya genel yönü veriyorsun.</p>
              <div className="style-presets">
                <button type="button" className={profile.stylePreset === 'Ekonomik' ? 'selected' : ''} onClick={() => selectPreset('Ekonomik')}><span className="preset-emoji">🏠</span><strong>Ekonomik</strong><small>Evde pişirme ağırlıklı</small><div className="mini-split"><i style={{ width: '80%' }} /><i style={{ width: '15%' }} /><i style={{ width: '5%' }} /></div><b>%80 ev • %15 sipariş • %5 dışarı</b></button>
                <button type="button" className={profile.stylePreset === 'Dengeli' ? 'selected' : ''} onClick={() => selectPreset('Dengeli')}><span className="preset-emoji">⚖️</span><strong>Dengeli</strong><small>Konfor ve bütçe ortası</small><div className="mini-split"><i style={{ width: '60%' }} /><i style={{ width: '30%' }} /><i style={{ width: '10%' }} /></div><b>%60 ev • %30 sipariş • %10 dışarı</b></button>
                <button type="button" className={profile.stylePreset === 'Rahat' ? 'selected' : ''} onClick={() => selectPreset('Rahat')}><span className="preset-emoji">🛵</span><strong>Rahat</strong><small>Daha az mutfak mesaisi</small><div className="mini-split"><i style={{ width: '40%' }} /><i style={{ width: '40%' }} /><i style={{ width: '20%' }} /></div><b>%40 ev • %40 sipariş • %20 dışarı</b></button>
              </div>
              <div className="split-visual subsection"><div className="split-title"><strong>Seçilen dağılım</strong><span>{profile.stylePreset} mod</span></div><div className="split-bar"><span className="home" style={{ width: `${profile.mealSplit.home}%` }} /><span className="delivery" style={{ width: `${profile.mealSplit.delivery}%` }} /><span className="outside" style={{ width: `${profile.mealSplit.dineOut}%` }} /></div><div className="split-legend"><span><i className="home-dot" />🏠 Evde %{profile.mealSplit.home}</span><span><i className="delivery-dot" />🛵 Sipariş %{profile.mealSplit.delivery}</span><span><i className="outside-dot" />🍽️ Dışarı %{profile.mealSplit.dineOut}</span></div></div>
              <div className="smart-note"><span>✨</span><div><strong>Bu dağılım esnek.</strong><p>Bütçe sıkışırsa ev yemeği ağırlığı artabilir; beğenmediğin tek bir öğünü menü onayında değiştirebilirsin.</p></div></div>
            </div>
          )}

          {step === 5 && (
            <div className="step-panel summary-step">
              <span className="step-kicker">✨ Hazırsın</span><h2>{profile.name ? `${profile.name}, ` : ''}menünü hazırlamaya hazırız.</h2><p className="step-description">Bir sonraki ekranda haftalık menünün tamamını göreceksin. Beğenmediğin öğünleri değiştirebilir, menüyü onayladıktan sonra plana başlayabilirsin.</p>
              <div className="summary-hero"><div><span>Günlük hedef</span><strong>{targets.calories.toLocaleString('tr-TR')} <small>kcal</small></strong><p>≈ {targets.protein} g protein</p></div><div><span>Plan bütçesi</span><strong>{profile.budget.toLocaleString('tr-TR')} <small>₺</small></strong><p>{profile.days} gün • {profile.people} kişi</p></div><div><span>Konum</span><strong className="location-summary">{profile.neighborhood || profile.district || profile.city || 'Belirtilmedi'}</strong><p>{[profile.district, profile.city].filter(Boolean).join(', ')}</p></div></div>
              <div className="summary-grid">
                <article><span>🎯 Hedef</span><strong>{profile.goal}</strong><small>{profile.activity}</small></article>
                <article><span>🥑 Beslenme</span><strong>{profile.diet}</strong><small>{profile.allergies.length ? `${profile.allergies.length} hassasiyet seçildi` : 'Alerjen seçilmedi'}</small></article>
                <article><span>🍽️ Öğün düzeni</span><strong>Günde {profile.mealsPerDay} öğün</strong><small>{profile.breakfast ? 'Kahvaltı dahil' : 'Kahvaltısız plan'}</small></article>
                <article><span>🏠 Yemek stili</span><strong>{profile.stylePreset}</strong><small>%{profile.mealSplit.home} ev • %{profile.mealSplit.delivery} sipariş</small></article>
                <article><span>👨‍🍳 Mutfak</span><strong>{profile.cookingEquipment.length ? `${profile.cookingEquipment.length} ekipman` : 'Ekipman seçilmedi'}</strong><small>{profile.cookingEquipment.slice(0, 4).join(' • ') || 'Tarif yöntemleri serbest'}</small></article>
              </div>
              <div className="what-next"><span>🍽️</span><div><strong>Sırada menü onayı var.</strong><p>Önce tüm yemek seçeneklerini göreceksin. Plan, sen “Bu menüyü onayla” demeden başlamayacak.</p></div></div>
              <button className="primary-onboarding finish-button" type="button" onClick={() => onComplete(profile)}>Menümü göster <span>→</span></button>
            </div>
          )}

          {step > 0 && step < 5 && <div className="step-navigation"><button type="button" className="back-button" onClick={goBack}>← Geri</button><button type="button" className="next-button" onClick={goNext}>Devam et <span>→</span></button></div>}
          {step === 5 && <button type="button" className="summary-back" onClick={goBack}>← Bir şeyi değiştirmek istiyorum</button>}
        </div>
      </section>
    </main>
  )
}
