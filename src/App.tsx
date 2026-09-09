import { useState } from 'react'
import { PlannerCard } from './components/PlannerCard'
import { PlanPreview } from './components/PlanPreview'
import type { PlannerState } from './types'

const initialState: PlannerState = {
  days: 7,
  budget: 2200,
  diet: 'Hepçil',
  goal: 'Kilo ver',
  mode: 'Karışık',
  location: 'Kadıköy, İstanbul',
}

function App() {
  const [planner, setPlanner] = useState(initialState)
  const [generated, setGenerated] = useState(false)

  const generate = () => {
    setGenerated(false)
    window.setTimeout(() => setGenerated(true), 40)
  }

  return (
    <main>
      <nav className="topbar shell">
        <a className="brand" href="#top" aria-label="Lokma ana sayfa"><span className="brand-mark">🍋</span><span>lokma</span></a>
        <div className="nav-links"><a href="#nasil">Nasıl çalışır?</a><a href="#plan">Planım</a><button type="button">Giriş yap</button></div>
      </nav>

      <header className="hero shell" id="top">
        <div className="hero-copy">
          <div className="hero-badge"><span>🌿</span> Bütçene, hedefine ve konumuna göre</div>
          <h1>Bu hafta <span className="highlight">ne yiyeceğim?</span><br />derdini bitirelim.</h1>
          <p>Evde yapacağın yemekleri, dışarıdan söyleyeceklerini ve market alışverişini tek bir haftalık planda birleştir.</p>
          <div className="hero-points"><span>✅ Bütçe kontrollü</span><span>✅ Hedef odaklı</span><span>✅ Konuma göre</span></div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="blob blob-one"></div><div className="blob blob-two"></div>
          <div className="plate"><span className="food f1">🥑</span><span className="food f2">🍳</span><span className="food f3">🍅</span><span className="food f4">🥬</span><span className="food f5">🍚</span></div>
          <div className="floating-chip chip-one">💸 2.200 ₺ / hafta</div><div className="floating-chip chip-two">💪 Protein dengeli</div><div className="floating-chip chip-three">📍 Kadıköy</div>
        </div>
      </header>

      <section className="planner-shell shell" id="plan"><PlannerCard state={planner} onChange={setPlanner} onGenerate={generate} /></section>
      <div className="shell"><PlanPreview state={planner} generated={generated} /></div>

      <section className="how-section shell" id="nasil">
        <div className="section-heading centered"><span className="eyebrow">🧩 Basit, ama akıllı</span><h2>Üç adımda haftalık plan</h2><p>İlk sürümün çekirdeği tam olarak bu akış üzerine kuruluyor.</p></div>
        <div className="steps-grid">
          <article><span>1</span><div className="step-emoji">🧍</div><h3>Seni tanıyalım</h3><p>Gün, bütçe, beslenme tipi ve hedefini seç.</p></article>
          <article><span>2</span><div className="step-emoji">📍</div><h3>Çevreyi tarayalım</h3><p>Market ve restoran seçeneklerini konumuna göre eşleştirelim.</p></article>
          <article><span>3</span><div className="step-emoji">✨</div><h3>Planı optimize edelim</h3><p>Ev yemeği ve siparişi bütçeyi aşmadan haftaya dağıtalım.</p></article>
        </div>
      </section>

      <footer className="footer shell"><div className="brand"><span className="brand-mark">🍋</span><span>lokma</span></div><p>Türkiye’den başlayan akıllı yemek planlama deneyimi.</p><span>Local prototype • v0.1</span></footer>
    </main>
  )
}

export default App
