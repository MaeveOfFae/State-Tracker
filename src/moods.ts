// Canonical moods and synonym mapping used by the heuristic extractor.

export const canonicalMoods: string[] = [
  'happy','sad','angry','excited','nervous','calm','anxious','tired','relaxed','romantic','scared','fearful','confident','playful','serious','flirty','melancholy','joyful','furious','hopeful',
  'okay','ok','fine','meh','bored','curious','lonely','guilty','ashamed','embarrassed','surprised','shocked','annoyed','frustrated','focused','determined','content','satisfied','worried','terrified','cheerful','miserable'
]

export const moodSynonyms: Record<string, string> = {
  thrilled: 'excited', ecstatic: 'excited', pumped: 'excited', stoked: 'excited',
  delighted: 'happy', glad: 'happy', cheerful: 'cheerful', joyful: 'joyful', elated: 'happy',
  depressed: 'sad', down: 'sad', blue: 'sad', heartbroken: 'sad',
  pissed: 'angry', mad: 'angry', irate: 'angry', livid: 'angry',
  anxious: 'anxious', worried: 'worried', tense: 'nervous', jittery: 'nervous',
  relaxed: 'relaxed', chill: 'relaxed', calm: 'calm',
  tired: 'tired', exhausted: 'tired', sleepy: 'tired',
  romantic: 'romantic', flirty: 'flirty', affectionate: 'romantic',
  confident: 'confident', focused: 'focused', determined: 'determined',
  embarrassed: 'embarrassed', ashamed: 'ashamed', guilty: 'guilty',
  okay: 'okay', ok: 'ok', fine: 'fine', meh: 'meh',
  terrified: 'terrified', scared: 'scared', afraid: 'scared', fearful: 'fearful',
  bored: 'bored', curious: 'curious', lonely: 'lonely', frustrated: 'frustrated', annoyed: 'annoyed',
  content: 'content', satisfied: 'satisfied', melancholy: 'melancholy', furious: 'furious', hopeful: 'hopeful', serious: 'serious', playful: 'playful'
}
