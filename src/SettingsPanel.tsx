import React, { useEffect, useState } from 'react'

type Props = {
  cfg: any
  onUpdate: (patch: any) => void
  onReset: () => void
}

export default function SettingsPanel({ cfg, onUpdate, onReset }: Props) {
  const [local, setLocal] = useState<any>({ ...cfg })
  // Sync local when cfg changes outside (e.g., via Chat Settings or reset)
  useEffect(() => {
    setLocal({ ...cfg })
  }, [JSON.stringify(cfg)])

  const update = (patch: any) => {
    setLocal((prev: any) => ({ ...prev, ...patch }))
    onUpdate(patch)
  }

  return (
    <>
      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={!!local.include_in_prompt}
            onChange={(e) => update({ include_in_prompt: (e.target as HTMLInputElement).checked })}
          /> include_in_prompt
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={!!local.include_in_system_message}
            onChange={(e) => update({ include_in_system_message: (e.target as HTMLInputElement).checked })}
          /> include_in_system_message
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={!!local.auto_extract_before_prompt}
            onChange={(e) => update({ auto_extract_before_prompt: (e.target as HTMLInputElement).checked })}
          /> auto_extract_before_prompt
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={!!local.auto_extract_after_response}
            onChange={(e) => update({ auto_extract_after_response: (e.target as HTMLInputElement).checked })}
          /> auto_extract_after_response
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={local.only_show_on_change ?? true}
            onChange={(e) => update({ only_show_on_change: (e.target as HTMLInputElement).checked })}
          /> only_show_on_change
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={!!local.diagnostics}
            onChange={(e) => update({ diagnostics: (e.target as HTMLInputElement).checked })}
          /> diagnostics
        </label>

        <label style={{ display: 'block' }}>
          extraction_strategy
          <select
            value={local.extraction_strategy}
            onChange={(e) => update({ extraction_strategy: (e.target as HTMLSelectElement).value as any })}
            style={{ width: '100%', marginTop: 4 }}
          >
            <option value="heuristic">heuristic</option>
            <option value="llm">llm</option>
          </select>
        </label>

        <label style={{ gridColumn: '1 / span 2' }}>
          extraction_llm_endpoint
          <input
            style={{ width: '100%', marginTop: 4 }}
            value={local.extraction_llm_endpoint}
            onChange={(e) => update({ extraction_llm_endpoint: (e.target as HTMLInputElement).value })}
            placeholder="https://your-endpoint"
          />
        </label>

        <label>
          prompt_block_label
          <input
            style={{ width: '100%', marginTop: 4 }}
            value={local.prompt_block_label}
            onChange={(e) => update({ prompt_block_label: (e.target as HTMLInputElement).value })}
          />
        </label>

        <label>
          max_note_chars
          <input
            type="number"
            style={{ width: '100%', marginTop: 4 }}
            value={local.max_note_chars}
            onChange={(e) => update({ max_note_chars: parseInt((e.target as HTMLInputElement).value || '0', 10) })}
          />
        </label>

        <label>
          time_granularity
          <select
            value={local.time_granularity}
            onChange={(e) => update({ time_granularity: (e.target as HTMLSelectElement).value as any })}
            style={{ width: '100%', marginTop: 4 }}
          >
            <option value="date">date</option>
            <option value="datetime">datetime</option>
          </select>
        </label>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
        Settings here affect only this session. Use Chat Settings to persist defaults.
      </div>

      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={onReset} style={{ padding: '6px 10px' }}>
          Reset to defaults
        </button>
      </div>
    </>
  )
}
