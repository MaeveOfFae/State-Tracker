# Chub.ai Stage Documentation

---

## 1. What Is a Stage

### Links

[Devloping a Stage](https://docs.chub.ai/docs/stages/developing-a-stage)
[Quickstart/Setup](https://docs.chub.ai/docs/stages/developing-a-stage/quickstart-setup)
[Concepts](https://docs.chub.ai/docs/stages/developing-a-stage/concepts)
[Config/Metadata](https://docs.chub.ai/docs/stages/developing-a-stage/config-metadata)
[State](https://docs.chub.ai/docs/stages/developing-a-stage/state)
[Examples/Resources](https://docs.chub.ai/docs/stages/developing-a-stage/examples-resources)

### Definition

A **Stage** is a third-party software component used within a chat. It is implemented as a standalone web application and integrated into Chub.ai.

### Purpose

The documentation explicitly defines the following uses:

* Expression packs (visual emotional indicators)
* Mini-game user interfaces
* Specialized prompt handling
* Interaction with third-party APIs

No other purposes are defined.

### Relationship to Characters, Chats, and Messages

* A stage may be attached to:

  * A character
  * A chat
* A stage may:

  * Modify a user message before it is sent to the LLM
  * Modify a model response after it is received
  * Attach **system messages** to user or bot messages

System messages produced by stages:

* Appear at the end of the message they are attached to
* Are visible only to the human user
* Are not sent to the LLM
* Are stored separately from user messages and LLM responses

---

## 2. When a Stage Executes

### Invocation Points

The documentation defines four top-down invocation points:

1. Initialization
2. Before a prompt
3. After a response
4. On a swipe or jump

Rendering is separate and may occur independently.

### Timing and Behavior

#### Initialization

* Corresponds to `constructor` and `load`
* Called when a chat is started
* The stage receives information about the chat and its participants
* Initialization state may be returned at the end of `load`

#### Before a Prompt

* Corresponds to `beforePrompt`
* Called when a user initiates an LLM request
* The stage may:

  * Modify the user message
  * Append content to the prompt
  * Save updated state
  * Attach a system message to the user message

#### After a Response

* Corresponds to `afterResponse`
* Called after the full LLM response is received
* The stage may:

  * Modify the response message
  * Save updated state
  * Attach a system message to the bot message

#### Swipe or Jump

* Corresponds to `setState`
* Called when navigating to a previously seen message
* The stage receives message-level state for that message

#### Rendering

* Corresponds to `render`
* May be called at any time
* Returns a React element
* Should not perform significant work

### Execution Order

* No execution ordering between multiple stages is specified
* No conflict resolution rules are defined

---

## 3. Stage Scope

### Scope Types

A stage may be attached to:

* A character
* A chat

No other scope types are defined.

### Scope Effects

* Chat-level settings override character-level settings
* Overrides apply to:

  * Configuration values
  * Enabled/disabled state

### UI Visibility

* `position: 'NONE'` → no UI; stage runs in background
* Otherwise:

  * Wide screens: stage renders to the right of chat
  * Narrow/mobile screens: stage renders between header and messages
* Multiple visible stages:

  * Wide screens: vertical space divided evenly
  * Narrow screens: horizontal space divided evenly

---

## 4. Stage Components

### 4.1 Hosting and Isolation

* Each stage runs in a sandboxed iframe on a separate domain
* A stage:

  * Cannot access Chub.ai cookies or local storage
  * Cannot access other stages’ storage
  * Is restricted from certain hostile browser actions
* **Verified** stages have been reviewed by site developers
* Sandboxing does not prevent social engineering

---

### 4.2 Project Structure

* A stage is implemented as a small React website
* Documented components include:

  * `public/chub_meta.yaml`
  * `src/Stage.tsx`
  * Test utilities
* Communication is handled by the stages library
* Developers implement the `StageBase` interface

---

### 4.3 Metadata (`chub_meta.yaml`)

* Required for every stage
* Contains metadata such as:

  * Name
  * Description
  * Tags
* `position` controls UI rendering vs background execution
* The full metadata schema is defined only in the annotated template referenced by the docs

---

### 4.4 User Configuration (`config_schema`)

* Optional
* Defined in `chub_meta.yaml` or referenced from a JSON file
* UI is generated automatically
* Based on JSON Schema (2020) with limitations:

  * Advanced constructs (e.g., `anyOf`, external refs) generally unsupported
* Supports non-standard `character_map` type:

  * Enables per-character configuration
  * Uses boolean `required`
* Configuration must be treated as optional and nullable

---

### 4.5 Lifecycle Interface

Defined interface points:

* `constructor`
* `load`
* `beforePrompt`
* `afterResponse`
* `setState`
* `render`

No others are specified.

---

### 4.6 Generator Functions (Experimental)

Available via `this.generator`:

* `makeImage`
* `imageToImage`
* `removeBackground`
* `inpaintImage`

Constraints:

* All are unstable
* Awaiting them inside lifecycle hooks is discouraged
* Best results documented for 1:1 aspect ratio

---

## 5. Variables and Data Access

### Read Access

Stages receive:

* Chat and participant information during initialization
* Prompt data during `beforePrompt`
* Response data during `afterResponse`
* Message-level state during `setState`

Payload structures are not specified.

### Write Access

Stages may:

* Modify user messages
* Modify model responses
* Attach system messages
* Return updated state

### Persistence

Three persisted state types:

* Initialization state
* Message state
* Chat state

Schemas are optional.

### State Lifetime

* Initialization state: created once per chat; reused on reload
* Message state: tied to a specific message node
* Chat state: shared across all branches; rarely needed

---

## 6. Control Flow

* No conditional language is defined
* No early-exit or cancellation behavior is specified
* Only UI space-sharing behavior between stages is defined

---

## 7. Errors and Failure Modes

The documentation does not define:

* Exception handling
* Error visibility
* Retry behavior
* Failure isolation

All error semantics are undefined.

---

## 8. Practical Examples

### System Messages (Maze)

* Stages may attach computed information as system messages
* Messages are stored separately from LLM output
* Purpose is to prevent LLM hallucination of structured data

### State Usage

* Documented examples demonstrate use of:

  * Initialization state for one-time setup
  * Message state for per-node data
  * Chat state for cross-branch data

---

## 9. Limitations and Undefined Behavior

### Explicit Limitations

* Sandboxing does not prevent social engineering
* Generator functions are unstable
* JSON Schema support is limited
* System messages are never sent to the LLM

### Undefined

The documentation does not specify:

* Execution order between stages
* Prompt/response payload schemas
* Error handling behavior
* Conditional control flow
* Additional scope types
