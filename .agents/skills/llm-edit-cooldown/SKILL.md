---
name: llm-edit-cooldown
description: Guidance and pattern for managing LLM pipeline re-triggers during user entry updates, enforcing client-side cooldown rate limiting, and bypassing input selection for senior direct-edit UX.
---

# LLM Edit Cooldown & Senior Direct-Edit UX Pattern

## Overview
When updating existing entries in an LLM-powered application, avoid unthrottled API re-triggers and simplify the UI for senior users.

## Guidelines
1. **Direct Edit Pre-fill**: When editing existing records, skip input method selection (voice/text/OCR) and immediately pre-fill text area.
2. **Cooldown Throttle**: Use `localStorage` to enforce a 3-minute cooldown between edits per entry ID to prevent LLM quota depletion.
3. **Safe Re-indexing**: Pass `isEdit: true` to backend and agent pipelines (`SafetyGuardAgent`, `NarrativeBuilderAgent`) to safely update records without duplicating nodes.
