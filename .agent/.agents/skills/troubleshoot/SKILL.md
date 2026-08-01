---
name: troubleshoot
description: Record resolved technical issues in troubleshoot.md
---

# Purpose

Document resolved technical issues so they can be referenced later.

## Use this skill when

- A bug has been fixed
- An error has been resolved
- A configuration issue has been solved
- A deployment issue has been solved
- An API integration issue has been solved
- A dependency or package conflict has been resolved

## Workflow

1. Open `troubleshoot.md`.
2. Find an existing entry describing the same issue.
3. If found, update the existing entry.
4. Otherwise, append a new entry.
5. Preserve chronological order.

## Entry Format

```md
## Title

### Date

YYYY-MM-DD

### Category

Bug | Configuration | Build | Deployment | API | Database | Dependency | Other

### Summary

Brief description of the issue.

### Symptoms

Observed behavior or error message.

### Root Cause

Why the issue occurred.

### Resolution

Steps taken to resolve the issue.

### Verification

How the fix was confirmed.

### Tags

#nextjs #firebase #typescript
```

## Rules

- Record only resolved issues.
- Keep entries concise and factual.
- Do not duplicate existing entries.
- Do not remove historical records.