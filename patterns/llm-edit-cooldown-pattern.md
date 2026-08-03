# LLM Edit Cooldown & Direct-Edit UX Pattern

**Extracted:** 2026-08-02  
**Context:** Senior-targeted journaling/memory apps triggering multi-agent LLM pipelines on edit.

## Problem
1. When users edit existing entries (journals/diaries), re-triggering heavy LLM background pipelines (Safety Guard, Narrative Builder, Question Generator) without restriction risks API quota exhaustion, excessive costs, and duplicate graph node creation.
2. In senior-targeted interfaces, forcing users through initial input selection steps (Voice/Text/OCR selection tiles) when editing existing text introduces unnecessary cognitive friction.

## Solution
1. **Direct-Edit Mode Bypass**:
   - Check if an `editId` or `existingEntry` is present on page/modal entry.
   - Automatically bypass selection steps, defaulting to `answerType = "text"`, and pre-fill the text area with existing content.
2. **Client-side Cooldown Rate-Limiting**:
   - Store completion timestamps in `localStorage` keyed by record ID (e.g., `last_edit_${id}`).
   - Require a minimum cooldown period (e.g., 3 minutes / 180,000ms) before allowing resubmission. Display a friendly popup warning with remaining cooldown seconds if triggered early.
3. **Non-Destructive Pipeline Re-triggering**:
   - Pass an update flag (`isEdit: true`) to backend API routes and LLM agents (`SafetyGuardAgent`, `NarrativeBuilderAgent`).
   - Update existing records in Supabase/Firestore and refresh narrative chapter cards without creating duplicate narrative nodes or violating non-pharmacological safety rules.

## Example Code

```typescript
// Client-side rate-limiting check before edit submission
const COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes

export function checkEditCooldown(entryId: string): { allowed: boolean; remainingSec: number } {
  const lastEditTime = localStorage.getItem(`last_edit_time_${entryId}`);
  if (!lastEditTime) return { allowed: true, remainingSec: 0 };

  const elapsed = Date.now() - parseInt(lastEditTime, 10);
  if (elapsed < COOLDOWN_MS) {
    const remainingSec = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
    return { allowed: false, remainingSec };
  }
  return { allowed: true, remainingSec: 0 };
}

// Updating timestamp on successful submit
export function recordEditTimestamp(entryId: string): void {
  localStorage.setItem(`last_edit_time_${entryId}`, Date.now().toString());
}
```

## When to Use
- When editing user-generated content that triggers downstream LLM processing or multi-agent pipelines.
- When designing editing workflows for senior users requiring low cognitive friction and fast 2-step completion.
