export type DietType = 'Hepçil' | 'Vejetaryen' | 'Vegan' | 'Pesketaryen'
export type Goal = 'Kilo ver' | 'Koru' | 'Bulk' | 'Dengeli beslen'
export type MealMode = 'Karışık' | 'Evde yap' | 'Dışarıdan söyle'
export type Sex = 'Erkek' | 'Kadın'
export type ActivityLevel = 'Hareketsiz' | 'Az aktif' | 'Aktif' | 'Çok aktif'
export type MealStylePreset = 'Ekonomik' | 'Dengeli' | 'Rahat'

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

export type MealSplit = {
  home: number
  delivery: number
  dineOut: number
}

export type UserPlanProfile = {
  name: string
  age: number
  sex: Sex
  height: number
  weight: number
  activity: ActivityLevel
  goal: Goal
  diet: DietType
  allergies: string[]
  dislikes: string
  breakfast: boolean
  mealsPerDay: 2 | 3 | 4
  days: number
  budget: number
  people: number
  stylePreset: MealStylePreset
  mealSplit: MealSplit
  city: string
  district: string
  neighborhood: string
}
