import type { DietType, Goal, MealMode, PlannerState } from '../types'
import { OptionPills } from './OptionPills'

const diets: DietType[] = ['Hepçil', 'Vejetaryen', 'Vegan', 'Pesketaryen']
const goals: Goal[] = ['Kilo ver', 'Koru', 'Bulk', 'Dengeli beslen']
const modes: MealMode[] = ['Karışık', 'Evde yap', 'Dışarıdan söyle']

type PlannerCardProps = {
  state: PlannerState
  onChange: (next: PlannerState) => void
  onGenerate: () => void
}

export function PlannerCard({ state, onChange, onGenerate }: PlannerCardProps) {
  const patch = <K extends keyof PlannerState>(key: K, value: PlannerState[K]) => {
    onChange({ ...state, [key]: value })
  }

  return (
    <section className="planner-card glass-panel">
      <div className="planner-title-row">
        <div>
          <span className="eyebrow">✨ Planını 1 dakikada oluştur</span>
          <h2>Bu hafta nasıl yiyelim?</h2>
        </div>
        <div className="floating-emoji" aria-hidden="true">🍜</div>
      </div>

      <div className="planner-grid">
        <label className="field-card">
          <span>📅 Kaç gün?</span>
          <div className="range-row">
            <input type="range" min="1" max="7" value={state.days} onChange={(e) => patch('days', Number(e.target.value))} />
            <strong>{state.days} gün</strong>
          </div>
        </label>

        <label className="field-card">
          <span>💸 Haftalık bütçe</span>
          <div className="budget-input-wrap">
            <input className="budget-input" type="number" min="250" step="50" value={state.budget} onChange={(e) => patch('budget', Number(e.target.value))} />
            <span>₺</span>
          </div>
        </label>
      </div>

      <div className="field-block"><span className="field-label">🥑 Beslenme tipi</span><OptionPills options={diets} value={state.diet} onChange={(v) => patch('diet', v)} /></div>
      <div className="field-block"><span className="field-label">🎯 Hedef</span><OptionPills options={goals} value={state.goal} onChange={(v) => patch('goal', v)} /></div>
      <div className="field-block"><span className="field-label">🍳 Nasıl yemek istiyorsun?</span><OptionPills options={modes} value={state.mode} onChange={(v) => patch('mode', v)} /></div>

      <label className="location-field">
        <span className="location-icon">📍</span>
        <div>
          <small>Konum</small>
          <input value={state.location} onChange={(e) => patch('location', e.target.value)} placeholder="İlçe veya mahalle yaz" />
        </div>
        <button type="button" title="Konum izni sonraki aşamada bağlanacak">⌖</button>
      </label>

      <button className="generate-button" type="button" onClick={onGenerate}><span>Planımı hazırla</span><span className="button-arrow">→</span></button>
      <p className="microcopy">Fiyatlar ve çevredeki işletmeler şimdilik demo veridir. Gerçek veri entegrasyonu sonraki aşamada yapılacak.</p>
    </section>
  )
}
