import { useState } from 'react'
import { OnboardingFlow } from './components/OnboardingFlow'
import { PlanLocationGate } from './components/PlanLocationGate'
import { StarterPlanDashboard } from './components/StarterPlanDashboard'
import type { UserPlanProfile } from './types'
import './onboarding.css'
import './location-ui.css'

const initialProfile: UserPlanProfile = {
  name: '',
  age: 30,
  sex: 'Erkek',
  height: 175,
  weight: 80,
  activity: 'Az aktif',
  goal: 'Kilo ver',
  diet: 'Hepçil',
  allergies: [],
  dislikes: '',
  breakfast: true,
  mealsPerDay: 3,
  days: 7,
  budget: 2500,
  people: 1,
  stylePreset: 'Dengeli',
  mealSplit: { home: 60, delivery: 30, dineOut: 10 },
  city: 'İstanbul',
  district: 'Kadıköy',
  neighborhood: 'Caddebostan',
  locationSource: 'manual',
}

type Screen = 'home' | 'location' | 'onboarding' | 'dashboard'

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [profile, setProfile] = useState<UserPlanProfile>(initialProfile)

  const startPlan = () => {
    setScreen('location')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const continueFromLocation = (nextProfile: UserPlanProfile) => {
    setProfile(nextProfile)
    setScreen('onboarding')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const completeOnboarding = (nextProfile: UserPlanProfile) => {
    setProfile(nextProfile)
    setScreen('dashboard')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (screen === 'location') {
    return <PlanLocationGate profile={profile} onContinue={continueFromLocation} onBack={() => setScreen('home')} />
  }

  if (screen === 'onboarding') {
    return <OnboardingFlow initialProfile={profile} onComplete={completeOnboarding} onExit={() => setScreen('home')} />
  }

  if (screen === 'dashboard') {
    return <StarterPlanDashboard profile={profile} onEdit={() => setScreen('onboarding')} onHome={() => setScreen('home')} />
  }

  return (
    <main>
      <nav className="topbar shell">
        <button className="brand brand-button" type="button"><span className="brand-mark">🍋</span><span>lokma</span></button>
        <div className="nav-links"><a href="#nasil">Nasıl çalışır?</a><a href="#neden">Neden Lokma?</a><button type="button" onClick={startPlan}>Planını oluştur</button></div>
      </nav>

      <header className="hero shell" id="top">
        <div className="hero-copy">
          <div className="hero-badge"><span>🌿</span> Bütçene, hedefine ve konumuna göre</div>
          <h1>Bu hafta <span className="highlight">ne yiyeceğim?</span><br />derdini bitirelim.</h1>
          <p>Evde yapacağın yemekleri, dışarıdan söyleyeceklerini ve market alışverişini tek bir akıllı haftalık planda birleştir.</p>
          <div className="hero-actions"><button className="hero-primary" type="button" onClick={startPlan}>Ücretsiz planımı oluştur <span>→</span></button><small>⏱️ Yaklaşık 2 dakika</small></div>
          <div className="hero-points"><span>✅ Bütçe kontrollü</span><span>✅ Hedef odaklı</span><span>✅ Konuma göre</span></div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="blob blob-one"></div><div className="blob blob-two"></div>
          <div className="plate"><span className="food f1">🥑</span><span className="food f2">🍳</span><span className="food f3">🍅</span><span className="food f4">🥬</span><span className="food f5">🍚</span></div>
          <div className="floating-chip chip-one">💸 2.500 ₺ / hafta</div><div className="floating-chip chip-two">💪 Hedefe uygun</div><div className="floating-chip chip-three">📍 Mahallene göre</div>
        </div>
      </header>

      <section className="home-demo-strip"><div className="shell demo-strip-inner"><div><span>Bugün Lokma şunu birleştiriyor</span><strong>🥗 Beslenme hedefi</strong></div><b>+</b><div><span>Haftalık sınırın</span><strong>💸 Yemek bütçesi</strong></div><b>+</b><div><span>Gerçek hayatın</span><strong>🏠 Ev + 🛵 Sipariş</strong></div><b>+</b><div><span>Çevrendeki seçenekler</span><strong>📍 Konum</strong></div></div></section>

      <section className="how-section shell" id="nasil">
        <div className="section-heading centered"><span className="eyebrow">🧩 Basit, ama akıllı</span><h2>Sen birkaç şeyi söyle, gerisini Lokma düşünsün.</h2><p>İlk kullanım akışını gerçek ürün mantığına dönüştürdük.</p></div>
        <div className="steps-grid">
          <article><span>1</span><div className="step-emoji">📍</div><h3>Önce çevreni seç</h3><p>Canlı konum veya il / ilçe / mahalle bilgisiyle planın nerede kullanılacağını söyle.</p></article>
          <article><span>2</span><div className="step-emoji">🧍</div><h3>Seni tanıyalım</h3><p>Hedef, hareket, beslenme biçimi, bütçe ve öğün düzenini seç.</p></article>
          <article><span>3</span><div className="step-emoji">✨</div><h3>Haftayı oluşturalım</h3><p>Ev, sipariş ve dışarıda yemeyi tek planda dengeleyelim.</p></article>
        </div>
      </section>

      <section className="why-lokma shell" id="neden">
        <div className="why-card"><div className="why-copy"><span className="eyebrow">♻️ Sadece tarif uygulaması değil</span><h2>Asıl mesele, aldığını gerçekten kullanmak.</h2><p>Lokma'nın hedefi tek tek güzel tarifler göstermek değil. Aynı malzemeyi hafta boyunca mantıklı biçimde yeniden kullanıp market sepetini, öğün planını ve bütçeyi birlikte optimize etmek.</p><button type="button" onClick={startPlan}>Planımı kurmaya başla →</button></div><div className="ingredient-chain" aria-hidden="true"><div className="ingredient-main">🍗<small>1 paket</small></div><span>→</span><div>🥙<small>Pzt</small></div><span>→</span><div>🌯<small>Çar</small></div><span>→</span><div>🍝<small>Cum</small></div></div></div>
      </section>

      <footer className="footer shell"><div className="brand"><span className="brand-mark">🍋</span><span>lokma</span></div><p>Türkiye’den başlayan akıllı yemek planlama deneyimi.</p><span>Local prototype • v0.3</span></footer>
    </main>
  )
}

export default App
