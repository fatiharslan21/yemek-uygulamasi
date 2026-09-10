import { useMemo, useState } from 'react'
import { RECIPE_CATALOG } from '../data/recipeCatalog'
import { CloudAccountPanel } from './CloudAccountPanel'
import { LocalBackupPanel } from './LocalBackupPanel'
import { LegalCenter } from './LegalCenter'
import { PlanHistoryPanel } from './PlanHistoryPanel'
import { WeightTracker } from './WeightTracker'
import { loadAppPreferences, saveAppPreferences, type AppPreferences } from '../services/appPreferences'
import { cloudConfigured } from '../services/cloudClient'
import { loadFavoriteRecipeIds, saveFavoriteRecipeIds } from '../services/favoritesStorage'
import type { UserPlanProfile } from '../types'
import '../profile-hub.css'

type ProfileHubProps = {
  profile: UserPlanProfile
  onBack: () => void
  onEditPreferences: () => void
  onAbout: () => void
  onResetAll: () => void
}

function money(value: number) {
  return Math.round(value).toLocaleString('tr-TR')
}

export function ProfileHub({ profile, onBack, onEditPreferences, onAbout, onResetAll }: ProfileHubProps) {
  const [preferences, setPreferences] = useState<AppPreferences>(() => loadAppPreferences())
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => loadFavoriteRecipeIds())
  const favorites = useMemo(() => RECIPE_CATALOG.filter((recipe) => favoriteIds.has(recipe.id)), [favoriteIds])

  const patchPreference = <K extends keyof AppPreferences,>(key: K, value: AppPreferences[K]) => {
    const next = { ...preferences, [key]: value }
    setPreferences(next)
    saveAppPreferences(next)
  }

  const removeFavorite = (recipeId: string) => {
    setFavoriteIds((current) => {
      const next = new Set(current)
      next.delete(recipeId)
      saveFavoriteRecipeIds(next)
      return next
    })
  }

  const location = [profile.neighborhood, profile.district, profile.city].filter(Boolean).join(', ')

  return (
    <main className="profile-hub-page">
      <header className="profile-hub-top shell">
        <button type="button" className="profile-back" onClick={onBack} aria-label="Plana geri dön">←</button>
        <button type="button" className="brand brand-button" onClick={onBack}><span className="brand-mark">🍋</span><span>lokma</span></button>
        <button type="button" className="profile-about" onClick={onAbout}>Hakkında</button>
      </header>

      <section className="profile-hero shell">
        <div className="profile-avatar" aria-hidden="true">{profile.name ? profile.name.slice(0, 1).toLocaleUpperCase('tr-TR') : '👤'}</div>
        <div><span>Lokma profilin</span><h1>{profile.name || 'Senin planın'}</h1><p>{location || 'Konum belirtilmedi'} • {profile.diet} • {profile.goal}</p></div>
        <button type="button" onClick={onEditPreferences}>⚙️ Tercihleri düzenle</button>
      </section>

      <section className="profile-summary shell" aria-label="Plan özeti">
        <article><span>💸 Haftalık bütçe</span><strong>{money(profile.budget)} ₺</strong><small>{profile.people} kişi</small></article>
        <article><span>📅 Plan süresi</span><strong>{profile.days} gün</strong><small>günde {profile.mealsPerDay} öğün</small></article>
        <article><span>🏠 Ev ağırlığı</span><strong>%{profile.mealSplit.home}</strong><small>sipariş %{profile.mealSplit.delivery}</small></article>
        <article><span>⚖️ Plan kilosu</span><strong>{profile.weight} kg</strong><small>hedef hesabında kullanılıyor</small></article>
      </section>

      {cloudConfigured ? <CloudAccountPanel /> : <LocalBackupPanel />}
      <WeightTracker startingWeight={profile.weight} />

      <section className="profile-section shell">
        <div className="profile-section-head"><div><span>♥</span><div><small>Kişiselleştirme</small><h2>Favori yemeklerin</h2><p>Favoriler yeni planlarda kontrollü biçimde daha yüksek şans alır; aynı yemeği sürekli tekrarlatmayız.</p></div></div><b>{favorites.length}</b></div>
        {favorites.length ? (
          <div className="favorite-profile-grid">
            {favorites.map((recipe) => <article key={recipe.id}><span>{recipe.emoji}</span><div><strong>{recipe.title}</strong><small>{recipe.source} • {recipe.calories} kcal • {recipe.protein} g protein</small></div><button type="button" onClick={() => removeFavorite(recipe.id)} aria-label={`${recipe.title} favoriden çıkar`}>×</button></article>)}
          </div>
        ) : <div className="profile-empty">♡ Bugün ekranında sevdiğin öğünlere kalp bıraktığında burada birikir.</div>}
      </section>

      <section className="profile-section shell app-settings-card">
        <div className="profile-section-head"><div><span>🎛️</span><div><small>Uygulama ayarları</small><h2>Lokma nasıl davransın?</h2><p>Bu ayarlar yalnızca bu cihazdaki deneyimini değiştirir.</p></div></div></div>
        <label className="settings-switch-row"><div><strong>Favorileri yeni plana kat</strong><small>Sevdiğin tariflere ölçülü seçim bonusu verir.</small></div><input type="checkbox" checked={preferences.favoriteBiasEnabled} onChange={(event) => patchPreference('favoriteBiasEnabled', event.target.checked)} /><span /></label>
        <label className="settings-switch-row"><div><strong>Yeni haftada son tartımı kullan</strong><small>Mevcut hafta değişmez; plan dönemi bittiğinde yeni menü önizlemesi son kayıtlı kilonla hesaplanır.</small></div><input type="checkbox" checked={preferences.useLatestWeightForRenewal} onChange={(event) => patchPreference('useLatestWeightForRenewal', event.target.checked)} /><span /></label>
        <label className="settings-switch-row"><div><strong>Hareketleri azalt</strong><small>Animasyon ve geçişleri minimuma indirir.</small></div><input type="checkbox" checked={preferences.reducedMotion} onChange={(event) => patchPreference('reducedMotion', event.target.checked)} /><span /></label>
        <label className="settings-switch-row"><div><strong>Daha büyük yazılar</strong><small>Kart ve açıklama metinlerini yaklaşık %10 büyütür.</small></div><input type="checkbox" checked={preferences.largerText} onChange={(event) => patchPreference('largerText', event.target.checked)} /><span /></label>
        <label className="settings-switch-row"><div><strong>Yüksek kontrast</strong><small>Metin, çerçeve ve odak işaretlerini daha belirgin yapar.</small></div><input type="checkbox" checked={preferences.highContrast} onChange={(event) => patchPreference('highContrast', event.target.checked)} /><span /></label>
      </section>

      <PlanHistoryPanel />
      <LegalCenter />

      <section className="profile-section shell profile-data-card">
        <div><span>🔐</span><div><strong>Planın uygulamayı kapatsan da bu cihazda açık kalır</strong><p>Profil, aktif plan, günlük işaretler, favoriler, kilo kayıtları ve geçmiş planlar cihazda saklanır. Uygulamayı silmek veya uygulama verilerini temizlemek bu kayıtları silebilir. {cloudConfigured ? 'İstersen hesabınla ayrıca buluta yedekleyebilirsin.' : 'Profil bölümünden tek dosyalık yedek indirip daha sonra geri yükleyebilirsin.'}</p></div></div>
        <button type="button" onClick={onResetAll}>Tüm yerel veriyi sıfırla</button>
      </section>
    </main>
  )
}
