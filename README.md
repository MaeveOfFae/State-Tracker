# RP State Tracker (Chub AI Stage)

A Chub AI Stage that maintains a structured RP state (date/time, place, mood, weather, notes), lets the user edit it in a small UI, and can optionally inject a compact state block into the prompt.

## Files

- public/chub_meta.yaml — Stage metadata and config schema
- src/Stage.tsx — Stage implementation (constructor, load, beforePrompt, afterResponse, setState, render)
- src/main.tsx — Local dev shell (not used by Chub AI runtime)

## Scripts

- npm run dev — Start Vite dev server for local UI preview
- npm run build — Type-check and build the site
- npm run preview — Preview the production build

## Integration Notes

- In Chub AI, stages run in a sandboxed iframe with a stages library that wires up lifecycle methods.
- The UI returned by Stage.render() is mounted by the platform; this repo’s src/main.tsx is only for local preview.
- System messages attached by the stage are visible to the user only and are not sent to the LLM.

## Configuration

See public/chub_meta.yaml. Key options:
- include_in_prompt: Append RP state block to the user prompt
- include_in_system_message: Attach a human-visible snapshot
- prompt_block_label: Label used in the injected block
- max_note_chars: Clamp notes to avoid token bloat

## Development 

Node version
- Requires Node >= 24.2.0 (see .nvmrc). Use nvm:
	- nvm use
	- nvm install if not present

Local dev options
- Harness page (default):
	- npm run dev
	- Opens the local preview that mounts src/main.tsx
- Stages runner page (uses @chub-ai/stages-ts):
	- npm run dev:stages
	- Opens index-stages.html which renders src/App.tsx (TestRunner in dev)

Typical workflow
1. npm install
2. nvm use
3. npm run dev or npm run dev:stages
4. Edit src/Stage.tsx and public/chub_meta.yaml as needed

## Build

- npm run build outputs the production site to dist/
- Multi-page build outputs:
	- dist/index.html (Harness)
	- dist/index-stages.html (Stages runner)

## License

MIT (replace if needed)