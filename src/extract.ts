import * as chrono from 'chrono-node'
import { PLACE_NOUNS as placeNouns, AMBIGUOUS_PLACE_NOUNS as ambiguousPlaceNouns } from './places'
import * as moods from './moods'

export type RPState = {
  inRoleplayDateTime: string
  place: string
  mood: string
  weather: string
  sceneNotes: string
}

type PartialState = Partial<RPState>

type Candidate<T> = { value: T; score: number }

// canonicalMoods and moodSynonyms moved to ./moods for maintainability

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

function hasNegation(text: string, windowStart: number, windowEnd: number): boolean {
  // Look for simple negations like "not", "no longer", "isn't", "ain't", "without" near the window
  const span = text.slice(Math.max(0, windowStart - 12), Math.min(text.length, windowEnd + 12)).toLowerCase()
  return /(not\s+|no\s+longer\s+|isn['’]?t\s+|ain['’]?t\s+|without\s+)/.test(span)
}

function chooseBest<T>(cands: Candidate<T>[], minScore = 0.6): T | undefined {
  if (!cands.length) return undefined
  const best = cands.reduce((a, b) => (b.score > a.score ? b : a))
  return best.score >= minScore ? best.value : undefined
}

function normMoodKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z]+/g, '')
}

// Build a regex that matches any canonical mood (multi-word supported) with flexible spacing
const canonicalMoodPattern = buildAlternation(moods.canonicalMoods.map(m => m.replace(/\s+/g, ' ')))
const canonicalMoodRegex = new RegExp(`\\b(?:${canonicalMoodPattern.replace(/\s+/g, '\\s+')})\\b`, 'i')

// Blacklist patterns that cause false positives
function isBlacklistedMoodContext(text: string, start: number, end: number, canonical: string): boolean {
  const after = text.slice(end, Math.min(text.length, end + 16)).toLowerCase()
  if (canonical === 'happy' && /\bbirthday\b/.test(after)) return true
  return false
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

function extractAmbiguousPlace(text: string): Candidate<string> | undefined {
  const lower = text.toLowerCase()
  const detMatch = lower.match(ambiguousDeterminerRegex)
  if (detMatch && detMatch[1]) return { value: detMatch[1], score: 0.45 }
  const prepMatch = lower.match(ambiguousPrepositionRegex)
  if (prepMatch && prepMatch[1]) return { value: prepMatch[1], score: 0.5 }
  const verbMatch = lower.match(ambiguousVerbRegex)
  if (verbMatch && verbMatch[1]) return { value: verbMatch[1], score: 0.5 }
  return undefined
}

function extractPlace(text: string): string | undefined {
  const lower = text.toLowerCase()
  const original = text
  const cands: Candidate<string>[] = []
  // Helper to penalize generic phrases
  const isTooGeneric = (phrase: string) => {
    const p = phrase.trim().toLowerCase()
    if (!p) return true
    // If the phrase is just an ambiguous noun (with optional determiner), reject
    const genericRe = new RegExp(`^(?:the |a |an |my |our |his |her |their )?(?:${ambiguousNounPattern})(?:s)?$`)
    if (genericRe.test(p)) return true
    // Common over-generic phrases
    if ([
      'the city','the town','downtown','uptown','outside','inside','the building','the room','the area','the place','a place','somewhere','here','there'
    ].includes(p)) return true
    // Very short single words that are not proper nouns
    if (!/[A-Z]/.test(phrase) && p.split(/\s+/).length === 1 && p.length <= 5) return true
    return false
  }
  const boostIfSpecific = (phrase: string, base: number) => {
    let score = base
    // Boost for capitalized proper nouns
    if (/(?:^|\s)([A-Z][\w'\-]+)/.test(phrase)) score += 0.1
    // Boost for descriptive adjectives
    if (/(grand|central|upper|lower|east|west|north|south|royal|main|city|old|new|public|private)\b/i.test(phrase)) score += 0.05
    // Penalize if too generic
    if (isTooGeneric(phrase)) score -= 0.3
    return Math.max(0, Math.min(1, score))
  }
  // 1) Look for known place nouns, with optional determiners before
  for (const noun of placeNouns) {
    const idx = lower.indexOf(noun)
    if (idx >= 0) {
      // Expand to include a simple determiner like "the/my/our/his/her/their/a/an"
      const detMatch = lower.slice(Math.max(0, idx - 6), idx).match(/(the|my|our|his|her|their|a|an)\s+$/)
      if (detMatch) {
        const phrase = `${detMatch[1]} ${noun}`
        cands.push({ value: phrase, score: boostIfSpecific(phrase, 0.75) })
      } else {
        cands.push({ value: noun, score: boostIfSpecific(noun, 0.7) })
      }
    }
  }
  // 2) Proper-noun phrase after preposition (e.g., at The Grand Library)
  const proper = original.match(/\b(?:at|in|inside|outside|by|near|around|on)\s+((?:The\s+)?[A-Z][\w'\-]+(?:\s+(?:of|the|and|&|at))?\s*(?:[A-Z][\w'\-]+){0,5})/)
  if (proper && proper[1]) {
    const phrase = proper[1].trim()
    cands.push({ value: phrase, score: boostIfSpecific(phrase, 0.9) })
  }
  // 3) Quoted place
  const quoted = original.match(/\b(?:at|in|inside|outside|by|near|around|on)\s+"([^"\n]{3,60})"/i)
  if (quoted && quoted[1]) {
    const phrase = quoted[1].trim()
    cands.push({ value: phrase, score: boostIfSpecific(phrase, 0.85) })
  }
  // 4) Generic preposition-based capture (allows lowercase nouns)
  const prep = /\b(?:at|in|on|inside|by|near|around|outside|behind|beside|under|over|between)\s+(?:the\s+|a\s+|an\s+|my\s+|our\s+|his\s+|her\s+|their\s+)?([^\n\.,;:!?]{3,60})/i
  const m = original.match(prep)
  if (m && m[1]) {
    let phrase = m[1].trim()
    phrase = phrase.replace(/\s+(now|today|tonight|this\s+(morning|afternoon|evening|night))$/i, '').trim()
    cands.push({ value: phrase, score: boostIfSpecific(phrase, 0.6) })
  }
  // 5) Ambiguous nouns only with nearby context words
  const ambig = extractAmbiguousPlace(text)
  if (ambig) cands.push(ambig)

  const best = chooseBest(cands)
  // Reject too generic best results
  if (best && isTooGeneric(best)) return undefined
  return best
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

function extractDateTime(text: string, granularity: 'date' | 'datetime'): Candidate<string> | undefined {
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
    return { value: formatDate(d, granularity), score: 0.9 }
  }
  // Fallback: time-only like "7ish" or "around 8"
  const m = text.match(/\b(?:around\s+|about\s+)?(\d{1,2})(?:\s*(?:am|pm))?\s*ish\b/i) || text.match(/\b(?:around\s+|about\s+)?(\d{1,2})\s*(am|pm)\b/i)
  if (m) {
    const hour = parseInt(m[1], 10)
    const isPm = (m[2] || '').toLowerCase() === 'pm'
    const d = new Date(now)
    d.setHours((hour % 12) + (isPm ? 12 : 0), 0, 0, 0)
    return { value: formatDate(d, granularity), score: 0.75 }
  }
  // Fallback keywords like "tomorrow", "tonight" handled above by chrono; if missed, provide a coarse guess
  if (/\btomorrow\b/i.test(text)) {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    const def = defaultHourFromText(text)
    if (def !== null) d.setHours(def, 0, 0, 0)
    return { value: formatDate(d, granularity), score: 0.7 }
  }
  if (/\btonight\b/i.test(text)) {
    const d = new Date(now)
    d.setHours(22, 0, 0, 0)
    return { value: formatDate(d, granularity), score: 0.7 }
  }
  return undefined
}

export function heuristicExtract(text: string, prev: RPState, granularity: 'date' | 'datetime' = 'date'): PartialState {
  const patch: PartialState = {}

  const dt = extractDateTime(text, granularity)
  if (dt) patch.inRoleplayDateTime = dt.value

  // Place extraction with scoring and negation check
  const placeStr = extractPlace(text)
  if (placeStr) patch.place = placeStr

  // Mood extraction with multi-word support, negation, intensity scoring
  const moodCands: Candidate<string>[] = []
  const lower = text.toLowerCase()

  // Helper to push a mood candidate with intensity-aware score
  const pushMood = (canonical: string, base: number, spanStart: number, spanEnd: number) => {
    if (!moods.canonicalMoods.includes(canonical)) return
    if (hasNegation(lower, spanStart, spanEnd)) return
    if (isBlacklistedMoodContext(lower, spanStart, spanEnd, canonical)) return
    const intensity = (moods as any).moodIntensity?.[normMoodKey(canonical)] ?? 0.5
    const score = Math.max(0, Math.min(1, base + (intensity - 0.5) * 0.3))
    moodCands.push({ value: canonical, score })
  }

  // Pattern: I am/I'm/feel/feeling <phrase> (up to two words)
  const feelRe = /(\bi\s*(?:am|'m|m|feel(?:ing)?)\s+)([a-z][a-z\-']+(?:\s+[a-z][a-z\-']+)*)/i
  const fm = feelRe.exec(text)
  if (fm && fm[2]) {
    const phrase = fm[2].trim().toLowerCase()
    // Normalize phrase: try direct canonical match first
    const candidates = [phrase]
    // Also try normalized key to lookup synonym
    const normKey = normMoodKey(phrase)
    const syn = (moods as any).moodSynonyms?.[phrase] || (moods as any).moodSynonyms?.[normKey]
    if (syn) candidates.unshift(syn)
    for (const c of candidates) {
      // If c is multi-word, check canonical list contains it
      const canonical = moods.canonicalMoods.includes(c) ? c : ((moods as any).moodSynonyms?.[c] || c)
      if (moods.canonicalMoods.includes(canonical)) {
        pushMood(canonical, 0.85, fm.index!, fm.index! + fm[0].length)
        break
      }
    }
  }

  // Fallback: scan for any canonical mood phrase anywhere in text
  for (const m of moods.canonicalMoods) {
    const pattern = new RegExp(`\\b${escapeRegex(m).replace(/\s+/g, '\\s+')}\\b`, 'i')
    const match = pattern.exec(text)
    if (match) {
      pushMood(m, 0.65, match.index, match.index + match[0].length)
    }
  }

  const mood = chooseBest(moodCands)
  if (mood) patch.mood = mood

  // Weather extraction with patterns, negation, and scoring
  const weatherCands: Candidate<string>[] = []
  // Phrases like "it's raining", "the weather is cold"
  const weatherPhrase = lower.match(/\b(?:it\s*(?:is|'s)|the\s+weather\s+is|skies\s+are|it\s+feels)\s+([a-z]+(?:\s+[a-z]+)?)\b/)
  if (weatherPhrase && weatherPhrase[1]) {
    const w = weatherPhrase[1]
    for (const ww of weatherWords) {
      if (w.includes(ww) && !hasNegation(lower, weatherPhrase.index || 0, (weatherPhrase.index || 0) + w.length)) {
        weatherCands.push({ value: ww.includes(' ') ? ww : ww, score: 0.8 })
        break
      }
    }
  }
  // Fallback scanning only if environment anchors nearby
  const envAnchors = ['outside','weather','sky','skies','air','temperature','forecast','storm','rain','snow','wind','sun','heat','cold']
  const hasAnchorAround = (i: number) => {
    const start = Math.max(0, i - 16)
    const end = Math.min(lower.length, i + 16)
    const span = lower.slice(start, end)
    return envAnchors.some(a => span.includes(a))
  }
  for (const ww of weatherWords) {
    const idx = lower.indexOf(ww)
    if (idx >= 0 && !hasNegation(lower, idx, idx + ww.length) && hasAnchorAround(idx)) {
      weatherCands.push({ value: ww, score: 0.6 })
    }
  }
  const weather = chooseBest(weatherCands)
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
