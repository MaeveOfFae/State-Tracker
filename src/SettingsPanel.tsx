import React from 'react'

type Props = {
  cfg: any
  onUpdate: (patch: any) => void
  onReset: () => void
}

export default function SettingsPanel({ cfg, onUpdate, onReset }: Props) {
  return (
    <>
      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={!!cfg.include_in_prompt}
            onChange={(e) => onUpdate({ include_in_prompt: (e.target as HTMLInputElement).checked })}
          /> include_in_prompt
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={!!cfg.include_in_system_message}
            onChange={(e) => onUpdate({ include_in_system_message: (e.target as HTMLInputElement).checked })}
          /> include_in_system_message
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={!!cfg.auto_extract_before_prompt}
            onChange={(e) => onUpdate({ auto_extract_before_prompt: (e.target as HTMLInputElement).checked })}
          /> auto_extract_before_prompt
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={!!cfg.auto_extract_after_response}
            onChange={(e) => onUpdate({ auto_extract_after_response: (e.target as HTMLInputElement).checked })}
          /> auto_extract_after_response
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={cfg.only_show_on_change ?? true}
            onChange={(e) => onUpdate({ only_show_on_change: (e.target as HTMLInputElement).checked })}
          /> only_show_on_change
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={!!cfg.diagnostics}
            onChange={(e) => onUpdate({ diagnostics: (e.target as HTMLInputElement).checked })}
          /> diagnostics
        </label>

        <label style={{ display: 'block' }}>
          extraction_strategy
          <select
            value={cfg.extraction_strategy}
            onChange={(e) => onUpdate({ extraction_strategy: (e.target as HTMLSelectElement).value as any })}
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
            value={cfg.extraction_llm_endpoint}
            onChange={(e) => onUpdate({ extraction_llm_endpoint: (e.target as HTMLInputElement).value })}
            placeholder="https://your-endpoint"
          />
        </label>

        <label>
          prompt_block_label
          <input
            style={{ width: '100%', marginTop: 4 }}
            value={cfg.prompt_block_label}
            onChange={(e) => onUpdate({ prompt_block_label: (e.target as HTMLInputElement).value })}
          />
        </label>

        <label>
          max_note_chars
          <input
            type="number"
            style={{ width: '100%', marginTop: 4 }}
            value={cfg.max_note_chars}
            onChange={(e) => onUpdate({ max_note_chars: parseInt((e.target as HTMLInputElement).value || '0', 10) })}
          />
        </label>

        <label>
          time_granularity
          <select
            value={cfg.time_granularity}
            onChange={(e) => onUpdate({ time_granularity: (e.target as HTMLSelectElement).value as any })}
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
