import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { heuristicExtract, RPState } from './extract'

const DEFAULT_PREV: RPState = {
  inRoleplayDateTime: '',
  place: '',
  mood: '',
  weather: '',
  sceneNotes: '',
}

const DEFAULT_SAMPLES = [
  "Let's meet tomorrow evening at The Grand Library.",
  "I'm kinda on edge today; the weather is gloomy and windy.",
  "Headed to the cafe near the station in an hour.",
  "Feeling exhausted but hopeful.",
  "It's raining outside, streets are slick.",
  "We'll be at \"Midnight Diner\" around 8pm.",
  "Not at the building anymore, moved to the courtyard.",
  "Happy birthday! (should not map to happy)",
]

function Row({ text, result }: { text: string; result: Partial<RPState> }) {
  return (
    <tr>
      <td style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>{text}</td>
      <td style={{ verticalAlign: 'top' }}>
        <div><strong>Date/Time:</strong> {result.inRoleplayDateTime ?? ''}</div>
        <div><strong>Place:</strong> {result.place ?? ''}</div>
        <div><strong>Mood:</strong> {result.mood ?? ''}</div>
        <div><strong>Weather:</strong> {result.weather ?? ''}</div>
      </td>
    </tr>
  )
}

function App() {
  const [granularity, setGranularity] = useState<'date' | 'datetime'>('date')
  const [text, setText] = useState(DEFAULT_SAMPLES.join('\n'))

  const lines = useMemo(() => text.split('\n').map(s => s.trim()).filter(Boolean), [text])
  const results = useMemo(() => lines.map(l => heuristicExtract(l, DEFAULT_PREV, granularity)), [lines, granularity])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, padding: 16 }}>
      <div>
        <h2>Extraction Tests</h2>
        <div style={{ marginBottom: 8 }}>
          <label>
            time_granularity
            <select value={granularity} onChange={e => setGranularity(e.target.value as any)} style={{ marginLeft: 8 }}>
              <option value="date">date</option>
              <option value="datetime">datetime</option>
            </select>
          </label>
        </div>
        <textarea style={{ width: '100%', minHeight: 320 }} value={text} onChange={e => setText(e.target.value)} />
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>One test per line. Edit freely.</div>
      </div>
      <div>
        <h2>Results</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingRight: 8 }}>Input</th>
              <th style={{ textAlign: 'left' }}>Extraction</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <Row key={i} text={l} result={results[i]} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
