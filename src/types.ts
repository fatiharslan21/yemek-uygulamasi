export type DietType = 'Hepçil' | 'Vejetaryen' | 'Vegan' | 'Pesketaryen'
export type Goal = 'Kilo ver' | 'Koru' | 'Bulk' | 'Dengeli beslen'
export type MealMode = 'Karışık' | 'Evde yap' | 'Dışarıdan söyle'

export type PlannerState = {
  days: number
  budget: number
  diet: DietType
  goal: Goal
  mode: MealMode
  location: string
}

export type MealSuggestion = {
  id: number
  title: string
  subtitle: string
  emoji: string
  price: number
  calories: number
  protein: number
  source: 'Ev' | 'Restoran'
  tag: string
}
