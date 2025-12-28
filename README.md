# RP State Tracker (Chub AI Stage)

A Chub AI Stage that maintains a structured RP state (date/time, place, mood, weather, notes), lets the user edit it in a small UI, and can optionally inject a compact state block into the prompt.

## Files

- public/chub_meta.yaml — Stage metadata, config schema, and state schemas
- src/Stage.tsx — Stage implementation (constructor, load, beforePrompt, afterResponse, setState, render)
- src/SettingsPanel.tsx — Lazy-loaded settings UI
- src/entry-stages.tsx — Entry for stages runner (mounts App)
- src/App.tsx — Chooses ReactRunner (staging) vs TestStageRunner (dev)
- src/main.tsx — Local harness UI (manual testing)
- src/test-harness.tsx — Multi-line extraction test UI
- src/extract.test.ts — Console batch tests for extraction heuristics

## Scripts

- yarn dev — Start Vite dev server (stages runner entry)
- yarn dev:host — Dev server bound to 0.0.0.0 for LAN
- yarn dev:stages — Open index-harness.html (local harness UI)
- yarn dev:stages:host — Harness UI bound to 0.0.0.0
- yarn dev:tests — Open test-harness.html (multi-line extraction UI)
- yarn dev:batch — Open batch-tests.html (console PASS/FAIL)
- yarn build — Type-check and build the site
- yarn preview — Preview the production build
- yarn preview:host — Preview bound to 0.0.0.0 (recommended for staging)

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

Node & package manager
- Requires Node 22 (see .nvmrc). Use nvm:
	- nvm use
	- nvm install if not present
- Uses Yarn classic. If needed, enable via Corepack: corepack enable

Local dev options
- Stages runner page (default, uses @chub-ai/stages-ts):
	- yarn dev
	- Opens root (/) which renders src/App.tsx
- Harness page:
	- yarn dev:stages
	- Opens /index-harness.html which mounts src/main.tsx
- Test pages:
	- yarn dev:tests → /test-harness.html
	- yarn dev:batch → /batch-tests.html (console output)

In-chat staging (recommended)
- Build then serve preview (prevents HMR/iframe handshake issues):
	- yarn build
	- yarn preview:host
	- Set Chat Settings → Staging URL to http://YOUR_LAN_IP:4173/index.html
	- Hard-reload the chat page (Shift+Reload)

Dev server inside iframe
- We set CORS and disabled HMR overlay in vite config to reduce iframe handshake stalls.
- If issues persist, use the preview server flow above.

Typical workflow
1. nvm use
2. yarn install
3. yarn dev (stages) or yarn dev:stages (harness)
4. Edit src/Stage.tsx and public/chub_meta.yaml as needed

## Build

- yarn build outputs the production site to dist/
- Multi-page build outputs:
	- dist/index.html (Stages runner)
	- dist/index-harness.html (Harness)
	- dist/test-harness.html (Extraction test UI)
	- dist/batch-tests.html (Batch tests page)

## CI deployment to Chub

This project can publish the stage to Chub via GitHub Actions on pushes to main. Set a repository secret named CHUB_AUTH_TOKEN containing your stage auth token (get it from the API). In GitHub: Settings → Secrets and Variables → Actions → New repository secret.

## Developing the stage

- Implement logic in src/Stage.tsx.
- When running locally (development mode), src/TestRunner.tsx is used to simulate chat interactions; modify it to cover your scenarios.

## License

MIT (replace if needed)