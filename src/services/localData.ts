const LOKMA_PREFIX = 'lokma.'

export function clearAllLokmaLocalData() {
  const keys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index))
    .filter((key): key is string => Boolean(key?.startsWith(LOKMA_PREFIX)))

  keys.forEach((key) => window.localStorage.removeItem(key))
}
