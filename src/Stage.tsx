// Stage.tsx
// NOTE: This file assumes the stage-template already wires up the StageBase interface.
// We only implement documented lifecycle functions: constructor, load, beforePrompt, afterResponse, setState, render.

import React from "react";
import { StageBase } from "@chub-ai/stages-ts";
import { heuristicExtract, heuristicExtractWithMeta, llmExtract, diffState, summarizeDiffs } from './extract'

type RPState = {
  inRoleplayDateTime: string; // free-form
  place: string;
  mood: string;
  weather: string;
  sceneNotes: string;
};

// What we store per-message so swipe/jump restores historical context
type MessageState = {
  snapshot: RPState;
};

// What we store across the chat graph (current working values)
type ChatState = {
  current: RPState;
};

const DEFAULT_RP_STATE: RPState = {
  inRoleplayDateTime: "",
  place: "",
  mood: "",
  weather: "",
  sceneNotes: "",
};

function clamp(s: string, max: number) {
  if (!s) return "";
  return s.length <= max ? s : s.slice(0, max);
}

function buildStateBlock(label: string, s: RPState) {
  // Keep it compact, stable, and parse-friendly.
  return (
    `[${label}]\n` +
    `DateTime: ${s.inRoleplayDateTime || "(unset)"}\n` +
    `Place: ${s.place || "(unset)"}\n` +
    `Mood: ${s.mood || "(unset)"}\n` +
    `Weather: ${s.weather || "(unset)"}\n` +
    `Notes: ${s.sceneNotes || "(unset)"}\n` +
    `[/${label}]`
  );
}

function buildSystemBox(label: string, s: RPState, diffs?: Record<string, { from: string; to: string }>) {
  const lines: string[] = []
  lines.push(`[${label}]`)
  lines.push(`DateTime: ${s.inRoleplayDateTime || "(unset)"}`)
  lines.push(`Place: ${s.place || "(unset)"}`)
  lines.push(`Mood: ${s.mood || "(unset)"}`)
  lines.push(`Weather: ${s.weather || "(unset)"}`)
  lines.push(`Notes: ${s.sceneNotes || "(unset)"}`)
  if (diffs && Object.keys(diffs).length > 0) {
    lines.push("")
    lines.push("Changes:")
    for (const [k, v] of Object.entries(diffs)) {
      lines.push(`- ${k}: "${v.from}" → "${v.to}"`)
    }
  }
  lines.push(`[/${label}]`)
  return lines.join('\n')
}

type Config = {
  include_in_prompt: boolean;
  include_in_system_message: boolean;
  prompt_block_label: string;
  max_note_chars: number;
  auto_extract_before_prompt: boolean;
  auto_extract_after_response: boolean;
  extraction_strategy: 'heuristic' | 'llm';
  extraction_llm_endpoint: string;
  extraction_max_runtime_ms: number;
  time_granularity: 'date' | 'datetime';
  only_show_on_change?: boolean;
  diagnostics?: boolean;
}

export class Stage extends StageBase<any, ChatState, MessageState, Config> {
  private chatState: ChatState = { current: { ...DEFAULT_RP_STATE } };
  private _onChange?: () => void;
  private _env: string | undefined;
  private _lastMeta?: { confidences: { inRoleplayDateTime?: number; place?: number; mood?: number; weather?: number } }

  private config: Config = {
    include_in_prompt: false,
    include_in_system_message: false,
    prompt_block_label: "RP_STATE",
    max_note_chars: 280,
    auto_extract_before_prompt: false,
    auto_extract_after_response: true,
    extraction_strategy: 'heuristic',
    extraction_llm_endpoint: '',
    extraction_max_runtime_ms: 1500,
    time_granularity: 'date',
    diagnostics: false,
  };

  // ---- Initialization ----
  constructor(init: any) {
    super(init);
    // init/config payload shapes are not specified in docs; treat as optional.
    const cfg = init?.config ?? init?.configuration ?? null;
    this._env = init?.environment || undefined
    if (cfg && typeof cfg === "object") {
      this.config = {
        include_in_prompt: cfg.include_in_prompt ?? this.config.include_in_prompt,
        include_in_system_message:
          cfg.include_in_system_message ?? this.config.include_in_system_message,
        prompt_block_label: cfg.prompt_block_label ?? this.config.prompt_block_label,
        max_note_chars: cfg.max_note_chars ?? this.config.max_note_chars,
        auto_extract_before_prompt: cfg.auto_extract_before_prompt ?? this.config.auto_extract_before_prompt,
        auto_extract_after_response: cfg.auto_extract_after_response ?? this.config.auto_extract_after_response,
        extraction_strategy: cfg.extraction_strategy ?? this.config.extraction_strategy,
        extraction_llm_endpoint: cfg.extraction_llm_endpoint ?? this.config.extraction_llm_endpoint,
        extraction_max_runtime_ms: cfg.extraction_max_runtime_ms ?? this.config.extraction_max_runtime_ms,
        time_granularity: cfg.time_granularity ?? this.config.time_granularity,
        only_show_on_change: cfg.only_show_on_change ?? this.config.only_show_on_change ?? true,
        diagnostics: cfg.diagnostics ?? this.config.diagnostics ?? false,
      };
    }
  }

  async load() {
    // Try to hydrate stored per-chat config
    try {
      const stored = await this.storage.query({ keys: ['rp_state_config'], character_ids: null, user_ids: null, persona_ids: null, chat_local: true })
      const v = stored?.data?.find(d => d.key === 'rp_state_config')?.value as Partial<Config> | undefined
      if (v && typeof v === 'object') {
        this.config = { ...this.config, ...v }
      }
    } catch {
      // ignore storage failures
    }
    // Log readiness for staging troubleshooting
    try { console.info(`Stage ready (${this._env ?? 'unknown env'})`) } catch {}
    // Return initial state; StageBase will persist state as needed.
    return {
      initState: null,
      chatState: this.chatState,
      messageState: null,
      error: null,
      success: true,
    };
  }

  // Optional: allow host/harness to receive re-render notifications when internal UI updates
  attach(onChange: () => void) {
    this._onChange = onChange;
  }

  updateConfig(patch: Partial<typeof this.config>) {
    this.config = { ...this.config, ...patch }
    this._onChange?.()
    // Fire-and-forget persist to chat-local storage
    try {
      this.storage.set('rp_state_config', this.config).forChat()
    } catch {}
  }

  // ---- Before user prompt ----
  async beforePrompt(payload: any) {
    const coalesce = (...vals: Array<unknown>): string => {
      for (const v of vals) {
        if (typeof v === 'string' && v.trim().length > 0) return v
      }
      return ''
    }

    // Accept multiple payload shapes from different runners
    let msgText: string = coalesce(
      payload?.userMessage?.text,
      payload?.userMessage?.content,
      payload?.message?.text,
      payload?.message?.content,
      payload?.prompt?.userMessage,
      payload?.text,
      payload?.content,
    )

    // Optional auto-extraction (fail-safe)
    let updatedState = { ...this.chatState.current }
    let extractionSummary: string | null = null
    if (this.config.auto_extract_before_prompt && msgText) {
      try {
        const prev = { ...updatedState }
        const patch = await this.extractFromText(msgText, prev)
        updatedState = { ...updatedState, ...patch }
        const diffs = diffState(this.chatState.current, updatedState)
        if (Object.keys(diffs).length > 0) {
          this.chatState.current = updatedState
          extractionSummary = summarizeDiffs(diffs)
        }
      } catch {
        // Fail gracefully: no-op
      }
    }

    // Clamp notes to avoid runaway tokens
    const current: RPState = {
      ...this.chatState.current,
      sceneNotes: clamp(this.chatState.current.sceneNotes, this.config.max_note_chars),
    };

    const stateBlock = buildStateBlock(this.config.prompt_block_label, current);

    // 1) Message state snapshot (for swipe/jump) — message state belongs to the node.
    const messageState: MessageState = { snapshot: current };

    // 2) Never modify visible message to avoid interrupting RP. Use stageDirections for LLM-only context.
    const stageDirections = this.config.include_in_prompt ? `\n\n${stateBlock}` : null

    // 3) Optionally attach a system message for the human (visible, not sent to LLM).
    let systemMessage: string | null = null
    if (this.config.include_in_system_message) {
      const onlyOnChange = this.config.only_show_on_change ?? true
      // Only show when there are changes, to avoid interrupting RP.
      if (!onlyOnChange || extractionSummary) {
        const diffs = diffState(this.chatState.current, current) // current reflects clamped notes only
        systemMessage = buildSystemBox(this.config.prompt_block_label, current, diffs)
      }
    }

    const userMessage = payload?.userMessage
      ? { ...payload.userMessage, text: msgText, content: msgText }
      : undefined
    const message = payload?.message
      ? { ...payload.message, text: msgText, content: msgText }
      : undefined

    return {
      // StageBase-compatible fields (do not change visible content)
      modifiedMessage: null,
      stageDirections,
      systemMessage,
      error: null,
      chatState: this.chatState,
      messageState,

      // Compatibility fields for local harness
      userMessage,
      message,
    } as any;
  }

  // ---- After model response ----
  async afterResponse(payload: any) {
    const coalesce = (...vals: Array<unknown>): string => {
      for (const v of vals) {
        if (typeof v === 'string' && v.trim().length > 0) return v
      }
      return ''
    }
    const botText: string = coalesce(
      payload?.botMessage?.text,
      payload?.botMessage?.content,
      payload?.message?.text,
      payload?.message?.content,
      payload?.text,
      payload?.content,
    )

    let extractionSummary: string | null = null
    if (this.config.auto_extract_after_response && botText) {
      try {
        const prev = { ...this.chatState.current }
        const patch = await this.extractFromText(botText, prev)
        const next = { ...prev, ...patch }
        const diffs = diffState(prev, next)
        if (Object.keys(diffs).length > 0) {
          this.chatState.current = next
          extractionSummary = summarizeDiffs(diffs)
        }
      } catch {
        // Fail gracefully
      }
    }

    const current: RPState = { ...this.chatState.current };
    const stateBlock = buildStateBlock(this.config.prompt_block_label, current);

    let systemMessage: string | null = null
    if (this.config.include_in_system_message) {
      const onlyOnChange = this.config.only_show_on_change ?? true
      if (!onlyOnChange || extractionSummary) {
        const diffs = diffState(this.chatState.current, current)
        systemMessage = buildSystemBox(this.config.prompt_block_label, current, diffs)
        if (this.config.diagnostics && this._lastMeta) {
          const c = this._lastMeta.confidences
          const parts = [
            c.inRoleplayDateTime != null ? `dt=${c.inRoleplayDateTime.toFixed(2)}` : null,
            c.place != null ? `place=${c.place.toFixed(2)}` : null,
            c.mood != null ? `mood=${c.mood.toFixed(2)}` : null,
            c.weather != null ? `weather=${c.weather.toFixed(2)}` : null,
          ].filter(Boolean)
          if (parts.length) systemMessage += `\nConfidences: ${parts.join(', ')}`
        }
      }
    }

    const botMessage = payload?.botMessage ? { ...payload.botMessage, text: payload?.botMessage?.text ?? botText, content: payload?.botMessage?.content ?? botText } : undefined;
    const message = payload?.message ? { ...payload.message, text: payload?.message?.text ?? botText, content: payload?.message?.content ?? botText } : undefined;

    return {
      modifiedMessage: null,
      stageDirections: null,
      systemMessage,
      error: null,
      chatState: this.chatState,
      messageState: null,

      // Compatibility for local harness display
      botMessage,
      message,
    } as any;
  }

  private async extractFromText(text: string, prev: RPState) {
    if (this.config.extraction_strategy === 'llm' && this.config.extraction_llm_endpoint) {
      const llm = await llmExtract(this.config.extraction_llm_endpoint, text, prev, this.config.extraction_max_runtime_ms)
      if (llm) return llm
    }
    const { patch, meta } = heuristicExtractWithMeta(text, prev, this.config.time_granularity)
    this._lastMeta = meta
    return patch
  }

  // ---- On swipe/jump ----
  async setState(payload: any) {
    // Accept either direct MessageState or wrapper { messageState }
    const msgState: MessageState | null = (payload && payload.snapshot)
      ? payload as MessageState
      : (payload?.messageState ?? null);
    if (msgState?.snapshot) {
      this.chatState.current = { ...DEFAULT_RP_STATE, ...msgState.snapshot };
    }
  }

  // ---- UI ----
  render() {
    const s = this.chatState.current;
    const cfg = this.config;

    const set = (patch: Partial<RPState>) => {
      this.chatState.current = { ...this.chatState.current, ...patch };
      // Notify host/harness to re-render if attached
      this._onChange?.();
      // Rendering is allowed any time; heavy work is discouraged. Keep this lightweight.
    };

    return (
      <div style={{ padding: 12, fontFamily: "sans-serif" }}>
        <h3 style={{ margin: "0 0 8px 0" }}>RP State</h3>

        <label>
          In-RP Date/Time
          <input
            style={{ width: "100%", marginTop: 4, marginBottom: 8 }}
            value={s.inRoleplayDateTime}
            onChange={(e) => set({ inRoleplayDateTime: (e.target as HTMLInputElement).value })}
          />
        </label>

        <label>
          Place
          <input
            style={{ width: "100%", marginTop: 4, marginBottom: 8 }}
            value={s.place}
            onChange={(e) => set({ place: (e.target as HTMLInputElement).value })}
          />
        </label>

        <label>
          Mood
          <input
            style={{ width: "100%", marginTop: 4, marginBottom: 8 }}
            value={s.mood}
            onChange={(e) => set({ mood: (e.target as HTMLInputElement).value })}
          />
        </label>

        <label>
          Weather
          <input
            style={{ width: "100%", marginTop: 4, marginBottom: 8 }}
            value={s.weather}
            onChange={(e) => set({ weather: (e.target as HTMLInputElement).value })}
          />
        </label>

        <label>
          Scene Notes (clamped)
          <textarea
            style={{ width: "100%", marginTop: 4, minHeight: 80 }}
            value={s.sceneNotes}
            onChange={(e) => set({ sceneNotes: (e.target as HTMLTextAreaElement).value })}
          />
        </label>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
          These fields are tracked and may be used to guide the model if enabled.
        </div>

        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Settings</summary>
          <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={!!cfg.include_in_prompt}
                onChange={(e) => this.updateConfig({ include_in_prompt: (e.target as HTMLInputElement).checked })}
              /> include_in_prompt
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={!!cfg.include_in_system_message}
                onChange={(e) => this.updateConfig({ include_in_system_message: (e.target as HTMLInputElement).checked })}
              /> include_in_system_message
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={!!cfg.auto_extract_before_prompt}
                onChange={(e) => this.updateConfig({ auto_extract_before_prompt: (e.target as HTMLInputElement).checked })}
              /> auto_extract_before_prompt
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={!!cfg.auto_extract_after_response}
                onChange={(e) => this.updateConfig({ auto_extract_after_response: (e.target as HTMLInputElement).checked })}
              /> auto_extract_after_response
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={cfg.only_show_on_change ?? true}
                onChange={(e) => this.updateConfig({ only_show_on_change: (e.target as HTMLInputElement).checked })}
              /> only_show_on_change
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={!!cfg.diagnostics}
                onChange={(e) => this.updateConfig({ diagnostics: (e.target as HTMLInputElement).checked })}
              /> diagnostics
            </label>

            <label style={{ display: 'block' }}>
              extraction_strategy
              <select
                value={cfg.extraction_strategy}
                onChange={(e) => this.updateConfig({ extraction_strategy: (e.target as HTMLSelectElement).value as any })}
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
                onChange={(e) => this.updateConfig({ extraction_llm_endpoint: (e.target as HTMLInputElement).value })}
                placeholder="https://your-endpoint"
              />
            </label>

            <label>
              prompt_block_label
              <input
                style={{ width: '100%', marginTop: 4 }}
                value={cfg.prompt_block_label}
                onChange={(e) => this.updateConfig({ prompt_block_label: (e.target as HTMLInputElement).value })}
              />
            </label>

            <label>
              max_note_chars
              <input
                type="number"
                style={{ width: '100%', marginTop: 4 }}
                value={cfg.max_note_chars}
                onChange={(e) => this.updateConfig({ max_note_chars: parseInt((e.target as HTMLInputElement).value || '0', 10) })}
              />
            </label>

            <label>
              time_granularity
              <select
                value={cfg.time_granularity}
                onChange={(e) => this.updateConfig({ time_granularity: (e.target as HTMLSelectElement).value as any })}
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
        </details>
      </div>
    );
  }
}
