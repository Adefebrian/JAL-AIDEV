---
description: Create the next-numbered Architecture Decision Record in docs/adr/ from the standard template.
argument-hint: <title>
---

Create a new ADR titled `$ARGUMENTS`. Reference skill `jal-adr` for the Context/Decision/Consequences/Status template and numbering convention behind this command, do not re-derive it here.

## Steps, in order

1. **Find the next number.** List `docs/adr/NNNN-*.md`, take the highest existing `NNNN`, increment by one, zero-pad to four digits. If `docs/adr/` does not exist, create it and start at `0001`.
2. **Slugify the title.** Lowercase `$ARGUMENTS`, replace spaces and non-alphanumeric characters with hyphens, trim trailing hyphens.
3. **Load the template.** Use `${CLAUDE_PLUGIN_ROOT}/templates/adr/ADR-template.md` if it exists, otherwise use the Context/Decision/Consequences/Status structure from skill `jal-adr` directly.
4. **Write `docs/adr/NNNN-<slug>.md`** with the title filled in, `Status: Proposed`, and the Context/Decision/Consequences sections left as prompts for the author to fill in, never invent a decision on the author's behalf.
5. **Report the file path** and remind the caller that any change introducing tech outside the approved stack (per skill `jal-standards`) needs this ADR merged before it ships.

Stay terse, no narration beyond the file path and next step.
