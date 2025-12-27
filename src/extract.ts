import * as chrono from 'chrono-node'
import { PLACE_NOUNS as placeNouns, AMBIGUOUS_PLACE_NOUNS as ambiguousPlaceNouns } from './places'

export type RPState = {
  inRoleplayDateTime: string
  place: string
  mood: string
  weather: string
  sceneNotes: string
}

type PartialState = Partial<RPState>

const moodWords = [
  'happy','sad','angry','excited','nervous','calm','anxious','tired','relaxed','romantic','scared','fearful','confident','playful','serious','flirty','melancholy','joyful','furious','hopeful',
  'okay','ok','fine','meh','bored','curious','lonely','guilty','ashamed','embarrassed','surprised','shocked','annoyed','frustrated','focused','determined','content','satisfied','worried','terrified','cheerful','miserable'
]

const weatherWords = [
  'sunny','rain','rainy','raining','pouring','storm','stormy','cloudy','overcast','clear','clear skies','snow','snowy','blizzard','hail','fog','foggy','wind','windy','breeze','breezy','thunder','lightning','drizzle','shower','showers','downpour','humid','muggy','hot','cold','warm','chilly','freezing','freezing rain','sleet','hailstorm','heatwave','heat wave','icy'
]

const ambiguousDeterminers = ['the','a','an']
const ambiguousPrepositions = ['in','at','near','outside','inside','by','around','on','under','over','behind','beside']
const ambiguousVerbs = [
  'arrive','arrived','arrives','leave','left','leaves','walk','walked','walks','drive','drove','drives',
  'go','goes','went','head','headed','heads','enter','entered','enters','exit','exited','exits',
]

// placeNouns and ambiguousPlaceNouns are imported from './places'

function firstMatch(text: string, words: string[]): string | undefined {
  const lower = text.toLowerCase()
  for (const w of words) {
    if (lower.includes(w)) return w
  }
  return undefined
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildAlternation(words: string[]): string {
  return [...words].sort((a, b) => b.length - a.length).map(escapeRegex).join('|')
}

const ambiguousNounPattern = buildAlternation(ambiguousPlaceNouns)
const ambiguousDeterminerPattern = ambiguousDeterminers.join('|')
const ambiguousPrepositionPattern = ambiguousPrepositions.join('|')
const ambiguousVerbPattern = ambiguousVerbs.join('|')
const ambiguousDescriptorPattern = '(?:[\\w\'-]+\\s+){0,3}'

const ambiguousDeterminerRegex = new RegExp(
  `\\b((?:${ambiguousDeterminerPattern})\\s+${ambiguousDescriptorPattern}${ambiguousNounPattern})\\b`
)
const ambiguousPrepositionRegex = new RegExp(
  `\\b(?:${ambiguousPrepositionPattern})\\s+((?:(?:${ambiguousDeterminerPattern})\\s+)?${ambiguousDescriptorPattern}${ambiguousNounPattern})\\b`
)
const ambiguousVerbRegex = new RegExp(
  `\\b(?:${ambiguousVerbPattern})\\b(?:\\s+[\\w'-]+){0,3}\\s+(?:to|at|into|toward|towards|from|past)?\\s*((?:(?:${ambiguousDeterminerPattern})\\s+)?${ambiguousDescriptorPattern}${ambiguousNounPattern})\\b`
)

function extractAmbiguousPlace(text: string): string | undefined {
  const lower = text.toLowerCase()
  const detMatch = lower.match(ambiguousDeterminerRegex)
  if (detMatch && detMatch[1]) return detMatch[1]
  const prepMatch = lower.match(ambiguousPrepositionRegex)
  if (prepMatch && prepMatch[1]) return prepMatch[1]
  const verbMatch = lower.match(ambiguousVerbRegex)
  if (verbMatch && verbMatch[1]) return verbMatch[1]
  return undefined
}

function extractPlace(text: string): string | undefined {
  const lower = text.toLowerCase()
  // 1) Look for known place nouns, with optional determiners before
  for (const noun of placeNouns) {
    const idx = lower.indexOf(noun)
    if (idx >= 0) {
      // Expand to include a simple determiner like "the/my/our/his/her/their/a/an"
      const detMatch = lower.slice(Math.max(0, idx - 6), idx).match(/(the|my|our|his|her|their|a|an)\s+$/)
      if (detMatch) {
        return `${detMatch[1]} ${noun}`
      }
      return noun
    }
  }
  // 2) Ambiguous nouns only with nearby context words
  const ambig = extractAmbiguousPlace(text)
  if (ambig) return ambig
  // 3) Generic preposition-based capture (allows lowercase nouns)
  const prep = /\b(?:at|in|on|inside|by|near|around|outside|behind|beside|under|over|between)\s+(?:the\s+|a\s+|an\s+|my\s+|our\s+|his\s+|her\s+|their\s+)?([^\n\.,;:!?]{3,60})/i
  const m = text.match(prep)
  if (m && m[1]) {
    // Trim trailing filler words
    let phrase = m[1].trim()
    phrase = phrase.replace(/\s+(now|today|tonight|this\s+(morning|afternoon|evening|night))$/i, '').trim()
    return phrase
  }
  // 4) Capitalized location-like phrase after "to" or "towards"
  const m2 = text.match(/\b(?:to|towards)\s+([A-Z][A-Za-z'\-]{2,}(?:\s+[A-Z][A-Za-z'\-]{2,}){0,3})/)
  if (m2 && m2[1]) return m2[1].trim()
  return undefined
}

function defaultHourFromText(text: string): number | null {
  const t = text.toLowerCase()
  if (/(morning|sunrise|dawn)\b/.test(t)) return 9
  if (/(noon)\b/.test(t)) return 12
  if (/(afternoon)\b/.test(t)) return 15
  if (/(evening|sunset|dusk)\b/.test(t)) return 19
  if (/(night|tonight|midnight)\b/.test(t)) return /midnight/.test(t) ? 0 : 22
  return null
}

function formatDate(d: Date, granularity: 'date' | 'datetime'): string {
  if (granularity === 'date') {
    return d.toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      weekday: undefined,
    })
  }
  // Round down to the hour for less specificity
  const rd = new Date(d)
  rd.setMinutes(0, 0, 0)
  return rd.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', hour12: true,
  })
}

function extractDateTime(text: string, granularity: 'date' | 'datetime'): string | undefined {
  const now = new Date()
  const results = chrono.parse(text, now, { forwardDate: true })
  if (results && results.length > 0) {
    const r: any = results[0]
    let d = r.date() as Date
    // If time not certain and granularity is datetime, choose a default hour from phrase
    if (granularity === 'datetime' && r.start && typeof r.start.isCertain === 'function' && !r.start.isCertain('hour')) {
      const def = defaultHourFromText(text)
      if (def !== null) {
        d = new Date(d)
        d.setHours(def, 0, 0, 0)
      }
    }
    return formatDate(d, granularity)
  }
  // Fallback: time-only like "7ish" or "around 8"
  const m = text.match(/\b(?:around\s+|about\s+)?(\d{1,2})(?:\s*(?:am|pm))?\s*ish\b/i) || text.match(/\b(?:around\s+|about\s+)?(\d{1,2})\s*(am|pm)\b/i)
  if (m) {
    const hour = parseInt(m[1], 10)
    const isPm = (m[2] || '').toLowerCase() === 'pm'
    const d = new Date(now)
    d.setHours((hour % 12) + (isPm ? 12 : 0), 0, 0, 0)
    return formatDate(d, granularity)
  }
  // Fallback keywords like "tomorrow", "tonight" handled above by chrono; if missed, provide a coarse guess
  if (/\btomorrow\b/i.test(text)) {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    const def = defaultHourFromText(text)
    if (def !== null) d.setHours(def, 0, 0, 0)
    return formatDate(d, granularity)
  }
  if (/\btonight\b/i.test(text)) {
    const d = new Date(now)
    d.setHours(22, 0, 0, 0)
    return formatDate(d, granularity)
  }
  return undefined
}

export function heuristicExtract(text: string, prev: RPState, granularity: 'date' | 'datetime' = 'date'): PartialState {
  const patch: PartialState = {}

  const dt = extractDateTime(text, granularity)
  if (dt) patch.inRoleplayDateTime = dt

  const place = extractPlace(text)
  if (place) patch.place = place

  const mood = firstMatch(text, moodWords)
  if (mood) patch.mood = mood

  const weather = firstMatch(text, weatherWords)
  if (weather) patch.weather = weather

  return patch
}

export async function llmExtract(endpoint: string, text: string, prev: RPState, timeoutMs = 1500): Promise<PartialState | null> {
  if (!endpoint) return null
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, prev }),
      signal: controller.signal,
    })
    if (!res.ok) return null
    const data = await res.json()
    const out: PartialState = {}
    if (typeof data.inRoleplayDateTime === 'string') out.inRoleplayDateTime = data.inRoleplayDateTime
    if (typeof data.place === 'string') out.place = data.place
    if (typeof data.mood === 'string') out.mood = data.mood
    if (typeof data.weather === 'string') out.weather = data.weather
    if (typeof data.sceneNotes === 'string') out.sceneNotes = data.sceneNotes
    return out
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

export function diffState(prev: RPState, next: RPState): Record<string, { from: string; to: string }> {
  const diffs: Record<string, { from: string; to: string }> = {}
  ;(['inRoleplayDateTime','place','mood','weather','sceneNotes'] as const).forEach((k) => {
    if ((prev[k] ?? '') !== (next[k] ?? '')) {
      diffs[k] = { from: prev[k] || '', to: next[k] || '' }
    }
  })
  return diffs
}

export function summarizeDiffs(diffs: Record<string, { from: string; to: string }>): string {
  const entries = Object.entries(diffs)
  if (entries.length === 0) return 'No changes.'
  return entries.map(([k, v]) => `${k}: "${v.from}" → "${v.to}"`).join('\n')
}
