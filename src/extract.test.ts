// Batch test harness for extraction heuristics
import { heuristicExtract } from './extract'
import { getMoodFeatures } from './moods'

const TESTS = [
  {
    input: "Let's meet tomorrow evening at the cafe.",
    expect: { inRoleplayDateTime: true, place: true }
  },
  {
    input: "I'm feeling a bit anxious about the storm rolling in tonight.",
    expect: { mood: 'anxious', weather: 'storm', inRoleplayDateTime: true }
  },
  {
    input: "We wandered through the Grand Library, tired but hopeful.",
    expect: { place: 'Grand Library', mood: 'tired' }
  },
  {
    input: "The air is chilly and the sky is overcast.",
    expect: { weather: 'chilly' }
  },
  {
    input: "He was happy. Happy birthday!", // Should not match 'happy' due to birthday
    expect: { mood: null }
  },
  {
    input: "She felt homesick and lonely in the big city.",
    expect: { mood: 'homesick', place: 'city' }
  },
  {
    input: "It's pouring rain and I'm exhausted.",
    expect: { weather: 'rain', mood: 'exhausted' }
  },
  {
    input: "We'll see each other in an hour at the station.",
    expect: { inRoleplayDateTime: true, place: 'station' }
  },
  {
    input: "Let's meet from 7 to 9pm at the cafe.",
    expect: { inRoleplayDateTime: true, place: 'cafe' }
  },
  {
    input: "I'll ping you in a few minutes.",
    expect: { inRoleplayDateTime: true }
  },
  {
    input: "The mood was tense, but the room was warm.",
    expect: { mood: 'tense', weather: 'warm', place: null }
  },
  {
    input: "I feel blissful and safe here.",
    expect: { mood: 'blissful' }
  }
]

function runTests() {
  let pass = 0, fail = 0
  for (const { input, expect } of TESTS) {
    const result = heuristicExtract(input, {
      inRoleplayDateTime: '', place: '', mood: '', weather: '', sceneNotes: ''
    }, 'datetime') as Record<string, any>
    const exp = expect as Record<string, any>
    const moodFeatures = result.mood ? getMoodFeatures(result.mood) : null
    let ok = true
    for (const k of Object.keys(exp)) {
      if (exp[k] === true && !result[k]) ok = false
      else if (exp[k] === null && result[k]) ok = false
      else if (typeof exp[k] === 'string' && result[k] !== exp[k]) ok = false
    }
    if (ok) {
      pass++
      console.log(`PASS: "${input}" →`, result, moodFeatures)
    } else {
      fail++
      console.error(`FAIL: "${input}" →`, result, moodFeatures, 'expected:', expect)
    }
  }
  console.log(`\n${pass} passed, ${fail} failed.`)
}

runTests()
