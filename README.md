- In-chat live coding
	- yarn dev:chat:host
	- In Chub Chat Settings → Staging URL, paste http://localhost:5173 and refresh.
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

Node & package manager
- Requires Node 21.7.1 (see .nvmrc). Use nvm:
	- nvm use
	- nvm install if not present
- Uses Yarn classic. If needed, enable via Corepack: corepack enable

Local dev options
- Stages runner page (default, uses @chub-ai/stages-ts):
	- yarn dev
	- Opens root (/) which renders src/App.tsx (TestRunner in dev)
- Harness page:
	- yarn dev:stages
	- Opens /index-harness.html which mounts src/main.tsx
In-chat staging (recommended)
 - Build then serve preview (avoids HMR-in-iframe quirks):
	 - yarn build
	 - yarn preview:host
	 - Set Chat Settings → Staging URL to http://localhost:4173
	 - Hard-reload the chat page

Typical workflow
1. nvm use
2. yarn install
3. yarn dev (stages) or yarn dev:stages (harness)
4. Edit src/Stage.tsx and public/chub_meta.yaml as needed

## Build

- yarn build outputs the production site to dist/
- Multi-page build outputs:
	- dist/index.html (Harness)
	- dist/index-stages.html (Stages runner)

## CI deployment to Chub

This project can publish the stage to Chub via GitHub Actions on pushes to main. Set a repository secret named CHUB_AUTH_TOKEN containing your stage auth token (get it from the API). In GitHub: Settings → Secrets and Variables → Actions → New repository secret.

## Developing the stage

- Implement logic in src/Stage.tsx.
- When running locally (development mode), src/TestRunner.tsx is used to simulate chat interactions; modify it to cover your scenarios.

## License

MIT (replace if needed)