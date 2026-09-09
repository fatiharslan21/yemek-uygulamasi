import type { MealSuggestion } from '../types'

export const suggestions: MealSuggestion[] = [
  { id: 1, title: 'Tavuklu Akdeniz Bowl', subtitle: 'Bulgur, yoğurt, tavuk, roka ve domates', emoji: '🥗', price: 118, calories: 620, protein: 46, source: 'Ev', tag: 'Bütçe dostu' },
  { id: 2, title: 'Izgara Tavuk Menü', subtitle: 'Yakındaki örnek restoran • 12 dk', emoji: '🍗', price: 235, calories: 710, protein: 51, source: 'Restoran', tag: 'Yüksek protein' },
  { id: 3, title: 'Mercimek & Tahin Tabağı', subtitle: 'Mercimek, tahin, salata ve tam tahıllı ekmek', emoji: '🫘', price: 92, calories: 540, protein: 26, source: 'Ev', tag: 'Lifli' },
]

export const markets = [
  { name: 'Migros', distance: '650 m', emoji: '🛒', estimate: '≈ 710 ₺' },
  { name: 'CarrefourSA', distance: '1,1 km', emoji: '🥕', estimate: '≈ 735 ₺' },
  { name: 'Yerel Market', distance: '400 m', emoji: '🥬', estimate: '≈ 680 ₺' },
]
