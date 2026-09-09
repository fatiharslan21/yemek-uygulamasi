export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function dateFromLocalKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, Math.max(0, month - 1), day)
}

export function addDaysToKey(value: string, days: number) {
  const date = dateFromLocalKey(value)
  date.setDate(date.getDate() + days)
  return localDateKey(date)
}

export function planDayIndex(startDateKey: string, now = new Date()) {
  const start = dateFromLocalKey(startDateKey)
  const today = dateFromLocalKey(localDateKey(now))
  const diff = today.getTime() - start.getTime()
  return Math.floor(diff / 86_400_000)
}

export function formatPlanDate(startDateKey: string, dayIndex: number, compact = false) {
  const date = dateFromLocalKey(addDaysToKey(startDateKey, dayIndex))
  return new Intl.DateTimeFormat('tr-TR', compact
    ? { weekday: 'short', day: 'numeric', month: 'short' }
    : { weekday: 'long', day: 'numeric', month: 'long' }
  ).format(date)
}

export function greetingForNow(now = new Date()) {
  const hour = now.getHours()
  if (hour < 6) return 'İyi geceler'
  if (hour < 11) return 'Günaydın'
  if (hour < 17) return 'İyi günler'
  if (hour < 22) return 'İyi akşamlar'
  return 'İyi geceler'
}
