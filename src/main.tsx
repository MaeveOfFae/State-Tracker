import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Stage } from './Stage'

type BeforePromptResult = Awaited<ReturnType<Stage['beforePrompt']>>

function Harness() {
  const [tick, setTick] = useState(0)
  const stageRef = useRef<Stage | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Inputs
  const [userText, setUserText] = useState('Hello there!')

  // Outputs
  const [result, setResult] = useState<BeforePromptResult | null>(null)
  const [afterResult, setAfterResult] = useState<any>(null)

  // Create stage once
  if (!stageRef.current) {
    stageRef.current = new Stage({ config: undefined })
    stageRef.current.attach(() => setTick((t) => t + 1))
  }

  // Call load() once
  useEffect(() => {
    ;(async () => {
      await stageRef.current!.load({})
      setLoaded(true)
    })()
  }, [])

  const runBeforePrompt = async () => {
    const r = await stageRef.current!.beforePrompt({ userMessage: { text: userText } })
    setResult(r)
  }

  const runSetState = async () => {
    if (result?.messageState) {
      await stageRef.current!.setState({ messageState: result.messageState })
      setTick((t) => t + 1)
    }
  }

  const [botText, setBotText] = useState('Sure, let’s continue the scene…')

  const runAfterResponse = async () => {
    const r = await stageRef.current!.afterResponse({ botMessage: { text: botText } })
    setAfterResult(r)
  }

  // Live config controls for testing
  const [includeInPrompt, setIncludeInPrompt] = useState(true)
  const [includeInSystem, setIncludeInSystem] = useState(true)
  const [autoBefore, setAutoBefore] = useState(true)
  const [autoAfter, setAutoAfter] = useState(true)
  const [strategy, setStrategy] = useState<'heuristic' | 'llm'>('heuristic')
  const [endpoint, setEndpoint] = useState('')
  const [label, setLabel] = useState('RP_STATE')
  const [maxNotes, setMaxNotes] = useState(280)
  const [granularity, setGranularity] = useState<'date' | 'datetime'>('date')

  useEffect(() => {
    stageRef.current!.updateConfig({
      include_in_prompt: includeInPrompt,
      include_in_system_message: includeInSystem,
      auto_extract_before_prompt: autoBefore,
      auto_extract_after_response: autoAfter,
      extraction_strategy: strategy,
      extraction_llm_endpoint: endpoint,
      prompt_block_label: label,
      max_note_chars: maxNotes,
      time_granularity: granularity,
    })
  }, [includeInPrompt, includeInSystem, autoBefore, autoAfter, strategy, endpoint, label, maxNotes, granularity])

  // Automatically run beforePrompt when userText changes if enabled
  useEffect(() => {
    if (!loaded) return
    if (!autoBefore) return
    ;(async () => {
      const r = await stageRef.current!.beforePrompt({ userMessage: { text: userText, content: userText } })
      setResult(r)
    })()
  }, [userText, autoBefore, loaded])

  // Automatically run afterResponse when botText changes if enabled
  useEffect(() => {
    if (!loaded) return
    if (!autoAfter) return
    ;(async () => {
      const r = await stageRef.current!.afterResponse({ botMessage: { text: botText, content: botText } })
      setAfterResult(r)
    })()
  }, [botText, autoAfter, loaded])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 12, fontFamily: 'sans-serif' }}>
      <div>
        <h2>Harness</h2>
        <fieldset style={{ marginBottom: 8 }}>
          <legend>Config</legend>
          <label style={{ display: 'block' }}>
            <input type="checkbox" checked={includeInPrompt} onChange={(e) => setIncludeInPrompt(e.target.checked)} /> include_in_prompt
          </label>
          <label style={{ display: 'block' }}>
            <input type="checkbox" checked={includeInSystem} onChange={(e) => setIncludeInSystem(e.target.checked)} /> include_in_system_message
          </label>
          <label style={{ display: 'block' }}>
            <input type="checkbox" checked={autoBefore} onChange={(e) => setAutoBefore(e.target.checked)} /> auto_extract_before_prompt
          </label>
          <label style={{ display: 'block' }}>
            <input type="checkbox" checked={autoAfter} onChange={(e) => setAutoAfter(e.target.checked)} /> auto_extract_after_response
          </label>
          <label style={{ display: 'block', marginTop: 6 }}>
            extraction_strategy
            <select value={strategy} onChange={(e) => setStrategy(e.target.value as any)} style={{ marginLeft: 8 }}>
              <option value="heuristic">heuristic</option>
              <option value="llm">llm</option>
            </select>
          </label>
          <label style={{ display: 'block', marginTop: 6 }}>
            extraction_llm_endpoint
            <input style={{ width: '100%', marginTop: 4 }} value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://your-endpoint" />
          </label>
          <label style={{ display: 'block', marginTop: 6 }}>
            prompt_block_label
            <input style={{ width: '100%', marginTop: 4 }} value={label} onChange={(e) => setLabel(e.target.value)} />
          </label>
          <label style={{ display: 'block', marginTop: 6 }}>
            max_note_chars
            <input type="number" style={{ width: '100%', marginTop: 4 }} value={maxNotes} onChange={(e) => setMaxNotes(parseInt(e.target.value || '0', 10))} />
          </label>
          <label style={{ display: 'block', marginTop: 6 }}>
            time_granularity
            <select value={granularity} onChange={(e) => setGranularity(e.target.value as any)} style={{ marginLeft: 8 }}>
              <option value="date">date</option>
              <option value="datetime">datetime</option>
            </select>
          </label>
        </fieldset>
        <div style={{ marginBottom: 8 }}>
          <label>
            User Message
            <textarea
              style={{ width: '100%', minHeight: 80, marginTop: 4 }}
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
            />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={runBeforePrompt}>Run beforePrompt()</button>
          <button onClick={runAfterResponse}>Run afterResponse()</button>
          <button onClick={runSetState} disabled={!result?.messageState}>Apply setState(snapshot)</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <h3>Before Prompt Result</h3>
          <pre style={{ background: '#f6f6f6', padding: 8, borderRadius: 4, overflowX: 'auto' }}>
{JSON.stringify(result, null, 2)}
          </pre>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>
            Bot Message
            <textarea
              style={{ width: '100%', minHeight: 80, marginTop: 4 }}
              value={botText}
              onChange={(e) => setBotText(e.target.value)}
            />
          </label>
          <h3>After Response Result</h3>
          <pre style={{ background: '#f6f6f6', padding: 8, borderRadius: 4, overflowX: 'auto' }}>
{JSON.stringify(afterResult, null, 2)}
          </pre>
        </div>
      </div>

      <div>
        <h2>Stage UI</h2>
        {!loaded ? <div>Loading…</div> : stageRef.current!.render()}
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Harness />)
