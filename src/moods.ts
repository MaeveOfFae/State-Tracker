// Canonical moods and synonym mapping used by the heuristic extractor.
// Expanded for higher recall across RP, narration, and casual dialogue.

export const canonicalMoods: string[] = [
  // Core valence
  'happy','sad','angry','excited','nervous','calm','anxious','tired','relaxed','romantic','scared','fearful','confident','playful','serious','flirty','melancholy','joyful','furious','hopeful',

  // Neutral / low-signal
  'okay','ok','fine','meh','neutral','blank','detached','numb','indifferent','unbothered',

  // Cognitive / focus states
  'focused','distracted','confused','curious','thoughtful','pensive','overwhelmed','determined','decisive','hesitant','uncertain','resolved',

  // Social / relational
  'lonely','connected','affectionate','intimate','jealous','possessive','protective','vulnerable','guarded','open','distant','attached',

  // Stress & intensity
  'stressed','tense','on edge','panicked','terrified','uneasy','restless','pressured','burned out','exhausted',

  // Positive nuanced
  'content','satisfied','fulfilled','grateful','proud','relieved','comforted','safe','secure','optimistic','inspired',

  // Negative nuanced
  'miserable','hopeless','resentful','bitter','ashamed','guilty','embarrassed','regretful','hurt','heartbroken','disappointed','discouraged','disgusted',

  // High-energy / chaotic
  'amped','wired','hyper','reckless','impulsive','euphoric','manic','unstable',

  // Low-energy / subdued
  'lethargic','drained','weary','listless','sleepy','heavy','foggy'
]

export const moodSynonyms: Record<string, string> = {
  // Excited / high energy
  thrilled: 'excited', ecstatic: 'excited', pumped: 'excited', stoked: 'excited', hyped: 'excited', amped: 'excited',

  // Happy / positive
  delighted: 'happy', glad: 'happy', cheerful: 'happy', joyful: 'joyful', elated: 'happy', pleased: 'happy', contented: 'content',
  blissful: 'happy', overjoyed: 'joyful', radiant: 'happy', beaming: 'happy',

  // Sad / low
  depressed: 'sad', down: 'sad', blue: 'sad', heartbroken: 'heartbroken', miserable: 'miserable', devastated: 'sad',
  crushed: 'sad', sorrowful: 'sad', woeful: 'sad',

  // Anger
  pissed: 'angry', mad: 'angry', irate: 'angry', livid: 'furious', raging: 'furious', salty: 'angry', bitter: 'bitter', cranky: 'annoyed', grumpy: 'annoyed', irritable: 'annoyed', irritated: 'annoyed', hangry: 'angry',

  // Anxiety / fear
  anxious: 'anxious', worried: 'worried', tense: 'nervous', jittery: 'nervous', uneasy: 'uneasy', panicky: 'panicked',
  scared: 'scared', afraid: 'scared', fearful: 'fearful', terrified: 'terrified', freaked: 'scared',
  onedge: 'on edge', edgy: 'on edge',

  // Calm / relaxed
  relaxed: 'relaxed', chill: 'relaxed', calm: 'calm', serene: 'calm', peaceful: 'calm', grounded: 'calm',

  // Tired
  tired: 'tired', exhausted: 'exhausted', sleepy: 'sleepy', drained: 'drained', wiped: 'tired', burnedout: 'burned out', knackered: 'exhausted', shattered: 'exhausted', pooped: 'tired',

  // Romantic / flirty
  romantic: 'romantic', flirty: 'flirty', affectionate: 'affectionate', loving: 'romantic', tender: 'romantic',
  smitten: 'romantic', enamored: 'romantic', infatuated: 'romantic',

  // Confidence / focus
  confident: 'confident', secure: 'secure', focused: 'focused', lockedin: 'focused', determined: 'determined', resolved: 'resolved', decisive: 'decisive',

  // Neutral fillers
  okay: 'okay', ok: 'ok', fine: 'fine', meh: 'meh', whatever: 'meh', neutral: 'neutral', apathetic: 'indifferent', indifferent: 'indifferent', unbothered: 'unbothered',

  // Social / relational
  lonely: 'lonely', isolated: 'lonely', homesick: 'lonely', jealous: 'jealous', possessive: 'possessive', clingy: 'attached', distant: 'distant', guarded: 'guarded', open: 'open',

  // Cognitive states
  confused: 'confused', lost: 'confused', curious: 'curious', intrigued: 'curious', thoughtful: 'thoughtful', pensive: 'pensive',

  // Shame / guilt
  embarrassed: 'embarrassed', ashamed: 'ashamed', guilty: 'guilty', regretful: 'regretful', mortified: 'embarrassed', humiliated: 'embarrassed',

  // Misc
  bored: 'bored', annoyed: 'annoyed', frustrated: 'frustrated', stressed: 'stressed', overwhelmed: 'overwhelmed', nostalgic: 'melancholy', thankful: 'grateful', appreciative: 'grateful', scornful: 'bitter', spiteful: 'resentful', vengeful: 'angry', disgusted: 'disgusted'
}

// Optional: intensity hints for fuzzy mood words.
// Use this AFTER synonym normalization (i.e., map -> canonical first, then apply intensity).
// Scale: 0 (very low) ... 1 (very high)
export const moodIntensity: Record<string, number> = {
  // Happy spectrum
  pleased: 0.45, content: 0.35, satisfied: 0.4, happy: 0.6, joyful: 0.75, delighted: 0.8, ecstatic: 1.0, euphoric: 0.95,

  // Sad spectrum
  meh: 0.2, down: 0.4, sad: 0.55, miserable: 0.8, heartbroken: 0.9, devastated: 1.0,

  // Anger spectrum
  annoyed: 0.35, irritated: 0.4, frustrated: 0.55, angry: 0.7, furious: 0.9, livid: 1.0, raging: 1.0,

  // Anxiety / fear spectrum
  uneasy: 0.35, nervous: 0.5, anxious: 0.6, worried: 0.55, onedge: 0.65, panicked: 0.9, terrified: 1.0,

  // Calm / relaxed spectrum
  calm: 0.55, relaxed: 0.65, serene: 0.8, peaceful: 0.75, safe: 0.7, secure: 0.7,

  // Energy / fatigue spectrum
  tired: 0.55, sleepy: 0.6, weary: 0.65, exhausted: 0.85, burnedout: 0.95,
  amped: 0.8, wired: 0.85, hyper: 0.9,

  // Social / relational intensity
  lonely: 0.65, isolated: 0.75, connected: 0.55, intimate: 0.7, homesick: 0.6,
  jealous: 0.7, possessive: 0.85, vulnerable: 0.7, guarded: 0.6,

  // Other
  bored: 0.35, curious: 0.45, focused: 0.55, overwhelmed: 0.75, disgusted: 0.65
}

// Optional: factor moods into axes for state tracking.
// This lets you store both the surface mood AND a stable numeric state.
export type MoodAxes = {
  valence: number;     // -1 (negative) .. +1 (positive)
  arousal: number;     // 0 (low energy) .. 1 (high energy)
  dominance: number;   // -1 (submissive/helpless) .. +1 (in-control/assertive)
  attachment: number;  // -1 (avoidant/distant) .. +1 (clingy/connected)
}

// Best-effort axis defaults for canonical moods.
// Keep this small and opinionated; you can override per-project as you learn.
export const canonicalMoodAxes: Record<string, MoodAxes> = {
  // Positive
  happy:        { valence:  0.7, arousal: 0.55, dominance:  0.2, attachment:  0.2 },
  joyful:       { valence:  0.85, arousal: 0.7, dominance:  0.25, attachment:  0.25 },
  excited:      { valence:  0.6, arousal: 0.9, dominance:  0.3, attachment:  0.1 },
  hopeful:      { valence:  0.55, arousal: 0.5, dominance:  0.1, attachment:  0.15 },
  content:      { valence:  0.5, arousal: 0.25, dominance:  0.15, attachment:  0.15 },
  satisfied:    { valence:  0.55, arousal: 0.3, dominance:  0.2, attachment:  0.1 },
  relaxed:      { valence:  0.45, arousal: 0.2, dominance:  0.1, attachment:  0.15 },
  calm:         { valence:  0.35, arousal: 0.15, dominance:  0.15, attachment:  0.1 },
  confident:    { valence:  0.6, arousal: 0.55, dominance:  0.8, attachment:  0.0 },
  focused:      { valence:  0.2, arousal: 0.5, dominance:  0.5, attachment: -0.1 },
  determined:   { valence:  0.25, arousal: 0.65, dominance:  0.6, attachment: -0.05 },

  // Negative
  sad:          { valence: -0.7, arousal: 0.25, dominance: -0.4, attachment:  0.15 },
  melancholy:   { valence: -0.45, arousal: 0.2, dominance: -0.2, attachment:  0.1 },
  miserable:    { valence: -0.9, arousal: 0.35, dominance: -0.6, attachment:  0.1 },
  lonely:       { valence: -0.75, arousal: 0.35, dominance: -0.35, attachment:  0.6 },
  guilty:       { valence: -0.6, arousal: 0.45, dominance: -0.4, attachment:  0.1 },
  ashamed:      { valence: -0.75, arousal: 0.4, dominance: -0.55, attachment:  0.0 },
  embarrassed:  { valence: -0.55, arousal: 0.55, dominance: -0.35, attachment:  0.05 },
  anxious:      { valence: -0.65, arousal: 0.7, dominance: -0.35, attachment:  0.15 },
  nervous:      { valence: -0.4, arousal: 0.65, dominance: -0.2, attachment:  0.1 },
  worried:      { valence: -0.55, arousal: 0.55, dominance: -0.25, attachment:  0.15 },
  scared:       { valence: -0.75, arousal: 0.8, dominance: -0.7, attachment:  0.15 },
  fearful:      { valence: -0.7, arousal: 0.75, dominance: -0.65, attachment:  0.15 },
  terrified:    { valence: -0.95, arousal: 1.0, dominance: -0.9, attachment:  0.2 },
  angry:        { valence: -0.7, arousal: 0.75, dominance:  0.6, attachment: -0.2 },
  furious:      { valence: -0.85, arousal: 0.95, dominance:  0.75, attachment: -0.25 },
  annoyed:      { valence: -0.35, arousal: 0.4, dominance:  0.25, attachment: -0.1 },
  frustrated:   { valence: -0.55, arousal: 0.65, dominance:  0.35, attachment: -0.15 },

  // Neutral-ish / low-signal
  okay:         { valence:  0.05, arousal: 0.25, dominance:  0.05, attachment:  0.0 },
  ok:           { valence:  0.05, arousal: 0.25, dominance:  0.05, attachment:  0.0 },
  fine:         { valence:  0.05, arousal: 0.2, dominance:  0.1, attachment: -0.05 },
  meh:          { valence: -0.1, arousal: 0.15, dominance: -0.05, attachment: -0.1 },
  neutral:      { valence:  0.0, arousal: 0.2, dominance:  0.0, attachment:  0.0 },
  numb:         { valence: -0.2, arousal: 0.05, dominance: -0.1, attachment: -0.1 },
  detached:     { valence: -0.1, arousal: 0.1, dominance:  0.0, attachment: -0.6 },
  indifferent:  { valence: -0.05, arousal: 0.15, dominance:  0.0, attachment: -0.15 },
  unbothered:   { valence:  0.05, arousal: 0.15, dominance:  0.05, attachment: -0.15 },

  // Relational
  romantic:     { valence:  0.7, arousal: 0.55, dominance:  0.05, attachment:  0.7 },
  flirty:       { valence:  0.65, arousal: 0.7, dominance:  0.15, attachment:  0.5 },
  affectionate: { valence:  0.75, arousal: 0.45, dominance:  0.0, attachment:  0.8 },
  jealous:      { valence: -0.55, arousal: 0.7, dominance:  0.2, attachment:  0.75 },
  possessive:   { valence: -0.45, arousal: 0.75, dominance:  0.35, attachment:  0.9 },
  homesick:     { valence: -0.45, arousal: 0.35, dominance: -0.2, attachment:  0.7 }
}

// Internal: normalize a string to a key usable for lookups
function normKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z]+/g, '')
}

// Fallback axes if no known mapping exists
export const NEUTRAL_AXES: MoodAxes = { valence: 0, arousal: 0.5, dominance: 0, attachment: 0 }

// Try to map an arbitrary token/phrase to a canonical mood string.
// - Accepts multi-word phrases (e.g., "on edge", "burned out").
// - Checks direct canonical list, then synonym table (both raw and normalized).
export function normalizeMoodToken(input: string): string | null {
  if (!input) return null
  const raw = input.trim().toLowerCase()
  if (!raw) return null

  // Exact canonical match
  if (canonicalMoods.includes(raw)) return raw

  // Synonym direct
  if (raw in moodSynonyms) return moodSynonyms[raw]

  // Normalized-key lookups (strip spaces/punct)
  const nk = normKey(raw)
  if (!nk) return null
  // match canonical via normalized comparison
  for (const c of canonicalMoods) {
    if (normKey(c) === nk) return c
  }
  // synonym via normalized key
  if (nk in moodSynonyms) return moodSynonyms[nk]

  return null
}

// Get mood features (canonical label, intensity, and axes) with safe fallbacks.
// - If canonical cannot be determined, returns { canonical: null, intensity: 0.5, axes: NEUTRAL_AXES }
export function getMoodFeatures(input: string): { canonical: string | null; intensity: number; axes: MoodAxes } {
  const canonical = normalizeMoodToken(input)
  if (!canonical) return { canonical: null, intensity: 0.5, axes: NEUTRAL_AXES }

  const key = normKey(canonical)
  const intensity = (moodIntensity as any)?.[key] ?? 0.5
  const axes = canonicalMoodAxes[canonical] ?? NEUTRAL_AXES
  return { canonical, intensity, axes }
}
