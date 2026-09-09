const STORAGE_KEY = 'lokma.weight-history.v1'
const MAX_ENTRIES = 180

export type WeightEntry = {
  id: string
  date: string
  weight: number
}

export function loadWeightHistory(): WeightEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is WeightEntry => item && typeof item.date === 'string' && typeof item.weight === 'number')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-MAX_ENTRIES)
  } catch {
    return []
  }
}

export function saveWeightHistory(entries: WeightEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.sort((a, b) => a.date.localeCompare(b.date)).slice(-MAX_ENTRIES)))
}

export function addWeightEntry(date: string, weight: number) {
  const current = loadWeightHistory().filter((item) => item.date !== date)
  const entry: WeightEntry = { id: `${date}-${Date.now()}`, date, weight }
  saveWeightHistory([...current, entry])
  return loadWeightHistory()
}

export function removeWeightEntry(id: string) {
  const next = loadWeightHistory().filter((item) => item.id !== id)
  saveWeightHistory(next)
  return next
}

export function clearWeightHistory() {
  window.localStorage.removeItem(STORAGE_KEY)
}
