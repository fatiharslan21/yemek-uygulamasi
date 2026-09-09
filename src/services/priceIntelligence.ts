import type { ShoppingListItem } from '../types'
import type { NearbyPlace } from './nearbyPlaces'

export type PriceDataKind = 'simulated' | 'live'

export type BasketItemQuote = {
  ingredientId: string
  name: string
  emoji: string
  packages: number
  packageLabel: string
  baseCatalogPackagePrice: number
  quotedPackagePrice: number
  totalPrice: number
  marketId: string
  marketName: string
  dataKind: PriceDataKind
}

export type MarketBasketQuote = {
  market: NearbyPlace
  items: BasketItemQuote[]
  total: number
  dataKind: PriceDataKind
  sourceLabel: string
}

export type SplitMarketGroup = {
  market: NearbyPlace
  items: BasketItemQuote[]
  subtotal: number
}

export type SplitBasketPlan = {
  groups: SplitMarketGroup[]
  total: number
  marketCount: number
  savingsVsBestSingle: number
  dataKind: PriceDataKind
}

export type PriceIntelligenceResult = {
  quotes: MarketBasketQuote[]
  bestSingle?: MarketBasketQuote
  splitPlan?: SplitBasketPlan
}

function hashText(text: string) {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function simulatedFactor(market: NearbyPlace, item: ShoppingListItem) {
  // This intentionally does NOT encode real-world chain pricing assumptions.
  // It only creates a stable local scenario until a live price provider is connected.
  const hash = hashText(`${market.id}|${market.name}|${item.ingredientId}`)
  const itemVariation = ((hash % 1701) - 850) / 10000 // -8.5% .. +8.5%
  const basketSignature = ((hashText(market.id) % 401) - 200) / 10000 // -2% .. +2%
  return Math.max(0.86, Math.min(1.14, 1 + itemVariation + basketSignature))
}

function roundPrice(value: number) {
  if (value < 100) return Math.max(1, Math.round(value))
  return Math.max(1, Math.round(value / 5) * 5)
}

export function simulateMarketBasket(market: NearbyPlace, shoppingList: ShoppingListItem[]): MarketBasketQuote {
  const items = shoppingList.map((item): BasketItemQuote => {
    const factor = simulatedFactor(market, item)
    const quotedPackagePrice = roundPrice(item.estimatedCost / Math.max(1, item.packages) * factor)
    return {
      ingredientId: item.ingredientId,
      name: item.name,
      emoji: item.emoji,
      packages: item.packages,
      packageLabel: item.packageLabel,
      baseCatalogPackagePrice: Math.round(item.estimatedCost / Math.max(1, item.packages)),
      quotedPackagePrice,
      totalPrice: quotedPackagePrice * item.packages,
      marketId: market.id,
      marketName: market.name,
      dataKind: 'simulated',
    }
  })

  return {
    market,
    items,
    total: items.reduce((sum, item) => sum + item.totalPrice, 0),
    dataKind: 'simulated',
    sourceLabel: 'Lokma fiyat senaryosu',
  }
}

function combinations<T>(items: T[], maxSize: number) {
  const output: T[][] = []
  const walk = (start: number, current: T[]) => {
    if (current.length > 0) output.push([...current])
    if (current.length === maxSize) return
    for (let index = start; index < items.length; index += 1) {
      current.push(items[index])
      walk(index + 1, current)
      current.pop()
    }
  }
  walk(0, [])
  return output
}

function buildSplitPlan(quotes: MarketBasketQuote[], bestSingle: MarketBasketQuote, maxMarkets = 2): SplitBasketPlan | undefined {
  if (quotes.length === 0 || bestSingle.items.length === 0) return undefined

  let bestGroups: SplitMarketGroup[] | undefined
  let bestTotal = Number.POSITIVE_INFINITY

  const quoteSets = combinations(quotes, Math.min(maxMarkets, quotes.length))
  quoteSets.forEach((quoteSet) => {
    const assignments = new Map<string, SplitMarketGroup>()
    let total = 0

    bestSingle.items.forEach((baseItem) => {
      const candidates = quoteSet
        .map((quote) => ({ quote, item: quote.items.find((entry) => entry.ingredientId === baseItem.ingredientId) }))
        .filter((entry): entry is { quote: MarketBasketQuote; item: BasketItemQuote } => Boolean(entry.item))
        .sort((left, right) => left.item.totalPrice - right.item.totalPrice)

      const selected = candidates[0]
      if (!selected) return
      total += selected.item.totalPrice
      const current = assignments.get(selected.quote.market.id) ?? {
        market: selected.quote.market,
        items: [],
        subtotal: 0,
      }
      current.items.push(selected.item)
      current.subtotal += selected.item.totalPrice
      assignments.set(selected.quote.market.id, current)
    })

    const groups = [...assignments.values()].sort((left, right) => right.subtotal - left.subtotal)
    if (groups.length > maxMarkets) return
    if (total < bestTotal) {
      bestTotal = total
      bestGroups = groups
    }
  })

  if (!bestGroups) return undefined

  return {
    groups: bestGroups,
    total: bestTotal,
    marketCount: bestGroups.length,
    savingsVsBestSingle: Math.max(0, bestSingle.total - bestTotal),
    dataKind: 'simulated',
  }
}

export function buildPriceIntelligence(
  markets: NearbyPlace[],
  shoppingList: ShoppingListItem[],
  maxComparedMarkets = 5,
): PriceIntelligenceResult {
  const comparableMarkets = markets
    .filter((place) => place.category === 'Market')
    .sort((left, right) => left.distanceMeters - right.distanceMeters)
    .slice(0, maxComparedMarkets)

  const quotes = comparableMarkets
    .map((market) => simulateMarketBasket(market, shoppingList))
    .sort((left, right) => left.total - right.total)

  const bestSingle = quotes[0]
  const splitPlan = bestSingle ? buildSplitPlan(quotes, bestSingle, 2) : undefined

  return { quotes, bestSingle, splitPlan }
}
