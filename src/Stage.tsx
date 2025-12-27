// Stage.tsx
// NOTE: This file assumes the stage-template already wires up the StageBase interface.
// We only implement documented lifecycle functions: constructor, load, beforePrompt, afterResponse, setState, render.

import React from "react";
import { heuristicExtract, llmExtract, diffState, summarizeDiffs } from './extract'

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

export class Stage /* extends StageBase<...> */ {
  private chatState: ChatState = { current: { ...DEFAULT_RP_STATE } };
  private _onChange?: () => void;

  private config: {
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
  } = {
    include_in_prompt: true,
    include_in_system_message: true,
    prompt_block_label: "RP_STATE",
    max_note_chars: 280,
    auto_extract_before_prompt: false,
    auto_extract_after_response: true,
    extraction_strategy: 'heuristic',
    extraction_llm_endpoint: '',
    extraction_max_runtime_ms: 1500,
    time_granularity: 'date',
  };

  // ---- Initialization ----
  constructor(init: any) {
    // init/config payload shapes are not specified in docs; treat as optional.
    const cfg = init?.config ?? init?.configuration ?? null;
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
      };
    }
  }

  async load(payload: any) {
    // Restore saved chat state if present
    const savedChatState = payload?.chatState ?? null;
    if (savedChatState?.current) {
      this.chatState.current = {
        ...DEFAULT_RP_STATE,
        ...savedChatState.current,
      };
    }

    // Return nothing else unless you choose to use initState explicitly.
    // Docs: initState is returned at end of load when needed.
    return {
      chatState: this.chatState,
    };
  }

  // Optional: allow host/harness to receive re-render notifications when internal UI updates
  attach(onChange: () => void) {
    this._onChange = onChange;
  }

  updateConfig(patch: Partial<typeof this.config>) {
    this.config = { ...this.config, ...patch }
    this._onChange?.()
  }

  // ---- Before user prompt ----
  async beforePrompt(payload: any) {
    let msgText: string =
      payload?.userMessage?.text ??
      payload?.message?.text ??
      payload?.prompt?.userMessage ??
      "";

    // Optional auto-extraction
    let updatedState = { ...this.chatState.current }
    let extractionSummary: string | null = null
    if (this.config.auto_extract_before_prompt && msgText) {
      const prev = { ...updatedState }
      const patch = await this.extractFromText(msgText, prev)
      updatedState = { ...updatedState, ...patch }
      const diffs = diffState(this.chatState.current, updatedState)
      if (Object.keys(diffs).length > 0) {
        this.chatState.current = updatedState
        extractionSummary = summarizeDiffs(diffs)
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

    // 2) Optionally append to prompt so the LLM sees it (system messages are NOT sent to the LLM).
    const newUserText = this.config.include_in_prompt
      ? `${msgText}\n\n${stateBlock}`
      : msgText;

    // 3) Optionally attach a system message for the human (visible, not sent to LLM).
    let systemMessage = this.config.include_in_system_message
      ? `RP State Snapshot:\n${stateBlock}`
      : null;
    if (extractionSummary && this.config.include_in_system_message) {
      systemMessage = `${systemMessage}\n\nAuto-extracted changes (beforePrompt):\n${extractionSummary}`
    }

    return {
      // Conservative: set text where the template expects it.
      // The exact field names depend on template/library, so keep both common shapes.
      userMessage: payload?.userMessage ? { ...payload.userMessage, text: newUserText } : undefined,
      message: payload?.message ? { ...payload.message, text: newUserText } : undefined,

      messageState,
      chatState: this.chatState,
      systemMessage,
    };
  }

  // ---- After model response ----
  async afterResponse(payload: any) {
    const botText: string = payload?.botMessage?.text ?? payload?.message?.text ?? ''

    let extractionSummary: string | null = null
    if (this.config.auto_extract_after_response && botText) {
      const prev = { ...this.chatState.current }
      const patch = await this.extractFromText(botText, prev)
      const next = { ...prev, ...patch }
      const diffs = diffState(prev, next)
      if (Object.keys(diffs).length > 0) {
        this.chatState.current = next
        extractionSummary = summarizeDiffs(diffs)
      }
    }

    const current: RPState = { ...this.chatState.current };
    const stateBlock = buildStateBlock(this.config.prompt_block_label, current);

    let systemMessage = this.config.include_in_system_message
      ? `RP State Snapshot:\n${stateBlock}`
      : null;
    if (extractionSummary && this.config.include_in_system_message) {
      systemMessage = `${systemMessage}\n\nAuto-extracted changes (afterResponse):\n${extractionSummary}`
    }

    const botMessage = payload?.botMessage ? { ...payload.botMessage } : undefined;
    const message = payload?.message ? { ...payload.message } : undefined;

    return {
      chatState: this.chatState,
      systemMessage,
      botMessage,
      message,
    };
  }

  private async extractFromText(text: string, prev: RPState) {
    if (this.config.extraction_strategy === 'llm' && this.config.extraction_llm_endpoint) {
      const llm = await llmExtract(this.config.extraction_llm_endpoint, text, prev, this.config.extraction_max_runtime_ms)
      if (llm) return llm
    }
    return heuristicExtract(text, prev, this.config.time_granularity)
  }

  // ---- On swipe/jump ----
  async setState(payload: any) {
    // Restore UI to the snapshot for that message node (if present).
    const msgState: MessageState | null = payload?.messageState ?? null;
    if (msgState?.snapshot) {
      this.chatState.current = { ...DEFAULT_RP_STATE, ...msgState.snapshot };
    }
    return {
      chatState: this.chatState,
    };
  }

  // ---- UI ----
  render() {
    const s = this.chatState.current;

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
          If “include_in_prompt” is enabled, this state is appended to your next message.
        </div>
      </div>
    );
  }
}
