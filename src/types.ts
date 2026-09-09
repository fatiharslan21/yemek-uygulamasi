export type DietType = 'Hepçil' | 'Vejetaryen' | 'Vegan' | 'Pesketaryen'
export type Goal = 'Kilo ver' | 'Koru' | 'Bulk' | 'Dengeli beslen'
export type MealMode = 'Karışık' | 'Evde yap' | 'Dışarıdan söyle'
export type Sex = 'Erkek' | 'Kadın'
export type ActivityLevel = 'Hareketsiz' | 'Az aktif' | 'Aktif' | 'Çok aktif'
export type MealStylePreset = 'Ekonomik' | 'Dengeli' | 'Rahat'
export type MealSource = 'Evde' | 'Sipariş' | 'Dışarı'
export type MealSlot = 'Kahvaltı' | 'Öğle' | 'Ara öğün' | 'Akşam' | 'Gece öğünü'
export type IngredientUnit = 'g' | 'ml' | 'adet'
export type LocationSource = 'manual' | 'device'
export type CookingEquipment = 'Ocak' | 'Fırın' | 'Airfryer' | 'Mikrodalga' | 'Tost makinesi' | 'Blender'

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
  cookingEquipment: CookingEquipment[]
  city: string
  district: string
  neighborhood: string
  latitude?: number
  longitude?: number
  locationAccuracy?: number
  locationSource?: LocationSource
}

export type IngredientUse = {
  ingredientId: string
  quantity: number
}

export type IngredientDefinition = {
  id: string
  name: string
  emoji: string
  unit: IngredientUnit
  packageSize: number
  packageLabel: string
  packagePrice: number
  category: 'Protein' | 'Sebze & meyve' | 'Kuru gıda' | 'Kahvaltılık' | 'Diğer'
}

export type Recipe = {
  id: string
  title: string
  subtitle: string
  emoji: string
  mealSlots: MealSlot[]
  source: MealSource
  allowedDiets: DietType[]
  allergens: string[]
  calories: number
  protein: number
  estimatedPrice: number
  ingredients: IngredientUse[]
  tags: string[]
}

export type PlannedMeal = {
  id: string
  recipeId: string
  slot: MealSlot
  title: string
  subtitle: string
  emoji: string
  source: MealSource
  calories: number
  protein: number
  estimatedPrice: number
  tags: string[]
}

export type PlannedDay = {
  index: number
  name: string
  meals: PlannedMeal[]
  totalCalories: number
  totalProtein: number
  totalEstimatedPrice: number
}

export type ShoppingListItem = {
  ingredientId: string
  name: string
  emoji: string
  category: IngredientDefinition['category']
  requiredQuantity: number
  unit: IngredientUnit
  packageSize: number
  packageLabel: string
  packages: number
  estimatedCost: number
  usedInMeals: number
}

export type NutritionTargets = {
  calories: number
  protein: number
}

export type WeeklyPlan = {
  days: PlannedDay[]
  shoppingList: ShoppingListItem[]
  nutritionTargets: NutritionTargets
  averageCalories: number
  averageProtein: number
  marketCost: number
  outsideCost: number
  totalCost: number
  remainingBudget: number
  budgetUsagePct: number
  reuseScore: number
  reusedIngredientCount: number
  estimatedWasteSaving: number
  adjustedForBudget: boolean
  convertedOutsideMeals: number
}
