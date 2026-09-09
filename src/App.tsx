import { useState } from 'react'
import { OnboardingFlow } from './components/OnboardingFlow'
import { PlanLocationGate } from './components/PlanLocationGate'
import { StarterPlanDashboard } from './components/StarterPlanDashboard'
import { clearAppState, loadSavedAppState, saveAppState } from './services/appStorage'
import { clearPlanSession } from './services/planSessionStorage'
import type { UserPlanProfile } from './types'
import './onboarding.css'
import './location-ui.css'
import './location-flow-fix.css'
import './mobile-app.css'

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
  cookingEquipment: ['Ocak', 'Fırın'],
  city: '',
  district: '',
  neighborhood: '',
  locationSource: 'manual',
}

type Screen = 'about' | 'location' | 'onboarding' | 'dashboard'

function App() {
  const savedState = loadSavedAppState()
  const [profile, setProfile] = useState<UserPlanProfile>(() => savedState?.profile ?? initialProfile)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => Boolean(savedState?.onboardingCompleted))
  const [screen, setScreen] = useState<Screen>(() => savedState?.onboardingCompleted ? 'dashboard' : 'location')

  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const startPlan = () => {
    setScreen('location')
    goTop()
  }

  const continueFromLocation = (nextProfile: UserPlanProfile) => {
    setProfile(nextProfile)
    setScreen('onboarding')
    goTop()
  }

  const completeOnboarding = (nextProfile: UserPlanProfile) => {
    setProfile(nextProfile)
    setHasCompletedOnboarding(true)
    saveAppState(nextProfile)
    setScreen('dashboard')
    goTop()
  }

  const editProfile = () => {
    setScreen('onboarding')
    goTop()
  }

  const returnFromFlow = () => {
    setScreen(hasCompletedOnboarding ? 'dashboard' : 'about')
    goTop()
  }

  const resetLocalApp = () => {
    clearAppState()
    clearPlanSession()
    setProfile(initialProfile)
    setHasCompletedOnboarding(false)
    setScreen('location')
    goTop()
  }

  if (screen === 'location') {
    return <PlanLocationGate profile={profile} onContinue={continueFromLocation} onBack={returnFromFlow} />
  }

  if (screen === 'onboarding') {
    return <OnboardingFlow initialProfile={profile} onComplete={completeOnboarding} onExit={returnFromFlow} />
  }

  if (screen === 'dashboard') {
    return <StarterPlanDashboard profile={profile} onEdit={editProfile} onHome={() => setScreen('about')} />
  }

  return (
    <main className="about-page">
      <nav className="topbar shell about-topbar">
        <button className="brand brand-button" type="button" onClick={() => hasCompletedOnboarding ? setScreen('dashboard') : startPlan()}><span className="brand-mark">🍋</span><span>lokma</span></button>
        <div className="nav-links">
          <a href="#nasil">Nasıl çalışır?</a>
          <a href="#neden">Neden Lokma?</a>
          <button type="button" onClick={() => hasCompletedOnboarding ? setScreen('dashboard') : startPlan()}>{hasCompletedOnboarding ? 'Planıma dön' : 'Planını oluştur'}</button>
        </div>
      </nav>

      <header className="hero shell about-hero" id="top">
        <div className="hero-copy">
          <div className="hero-badge"><span>🌿</span> Mobil-first yemek planlama deneyimi</div>
          <h1>Bu hafta <span className="highlight">ne yiyeceğim?</span><br />derdini bitirelim.</h1>
          <p>Evde yapacağın yemekleri, dışarıdan söyleyeceklerini, çevrendeki gerçek işletmeleri ve market alışverişini tek bir akıllı haftalık planda birleştir.</p>
          <div className="hero-actions">
            <button className="hero-primary" type="button" onClick={() => hasCompletedOnboarding ? setScreen('dashboard') : startPlan()}>{hasCompletedOnboarding ? 'Planıma dön' : 'Planımı oluşturmaya başla'} <span>→</span></button>
            <small>{hasCompletedOnboarding ? '💚 Profilin bu cihazda kayıtlı' : '⏱️ İlk kurulum yaklaşık 2 dakika'}</small>
          </div>
          <div className="hero-points"><span>✅ Bütçe kontrollü</span><span>✅ Hedef odaklı</span><span>✅ Konuma göre</span></div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="blob blob-one"></div><div className="blob blob-two"></div>
          <div className="plate"><span className="food f1">🥑</span><span className="food f2">🍳</span><span className="food f3">🍅</span><span className="food f4">🥬</span><span className="food f5">🍚</span></div>
          <div className="floating-chip chip-one">💸 Bütçeyi koru</div><div className="floating-chip chip-two">💪 Hedefe uygun</div><div className="floating-chip chip-three">📍 Mahallene göre</div>
        </div>
      </header>

      <section className="home-demo-strip"><div className="shell demo-strip-inner"><div><span>Lokma şunu birleştiriyor</span><strong>🥗 Beslenme hedefi</strong></div><b>+</b><div><span>Haftalık sınırın</span><strong>💸 Yemek bütçesi</strong></div><b>+</b><div><span>Gerçek hayatın</span><strong>🏠 Ev + 🛵 Sipariş</strong></div><b>+</b><div><span>Çevrendeki seçenekler</span><strong>📍 Konum</strong></div></div></section>

      <section className="how-section shell" id="nasil">
        <div className="section-heading centered"><span className="eyebrow">📱 Uygulama gibi başlar</span><h2>İlk girişte doğrudan planını kurarsın.</h2><p>Uzun tanıtım sayfaları arasında dolaşmadan Lokma seni önce konum ve tercih akışına götürür. Sonraki gelişinde doğrudan planın açılır.</p></div>
        <div className="steps-grid">
          <article><span>1</span><div className="step-emoji">📍</div><h3>Çevreni seç</h3><p>Canlı konum veya il / ilçe / mahalle bilgisiyle planın nerede kullanılacağını söyle.</p></article>
          <article><span>2</span><div className="step-emoji">🧍</div><h3>Tercihlerini ver</h3><p>Hedef, beslenme biçimi, bütçe, mutfak ekipmanı ve öğün düzenini seç.</p></article>
          <article><span>3</span><div className="step-emoji">✨</div><h3>Planın hazır</h3><p>Ev yemeği, gerçek çevre işletmeleri ve alışveriş sepeti tek deneyimde birleşsin.</p></article>
        </div>
      </section>

      <section className="why-lokma shell" id="neden">
        <div className="why-card"><div className="why-copy"><span className="eyebrow">♻️ Sadece tarif uygulaması değil</span><h2>Asıl mesele, aldığını gerçekten kullanmak.</h2><p>Lokma tek tek güzel tarif göstermek yerine aynı malzemeyi hafta boyunca mantıklı biçimde yeniden kullanmayı, sepeti ve dışarıda yemeyi birlikte optimize etmeyi hedefliyor.</p><button type="button" onClick={() => hasCompletedOnboarding ? setScreen('dashboard') : startPlan()}>{hasCompletedOnboarding ? 'Planıma dön →' : 'Planımı kurmaya başla →'}</button></div><div className="ingredient-chain" aria-hidden="true"><div className="ingredient-main">🍗<small>1 paket</small></div><span>→</span><div>🥙<small>Pzt</small></div><span>→</span><div>🌯<small>Çar</small></div><span>→</span><div>🍝<small>Cum</small></div></div></div>
      </section>

      {hasCompletedOnboarding && (
        <section className="shell local-profile-card">
          <div><span>💾</span><div><strong>Bu cihazdaki Lokma profilini sıfırla</strong><p>İlk kullanım deneyimini baştan test etmek istersen kayıtlı profil ve son plan oturumu birlikte silinir.</p></div></div>
          <button type="button" onClick={resetLocalApp}>Profili sıfırla</button>
        </section>
      )}

      <footer className="footer shell"><div className="brand"><span className="brand-mark">🍋</span><span>lokma</span></div><p>Türkiye’den başlayan akıllı yemek planlama deneyimi.</p><span>Local prototype • mobile-first</span></footer>
    </main>
  )
}

export default App
