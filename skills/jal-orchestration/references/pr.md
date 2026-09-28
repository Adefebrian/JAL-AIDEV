# Playbook: Pull request

Internal playbook, run through the `jal-orchestration` engine by a JAL command (see `../SKILL.md` for which command runs it). Run the jal-reviewer gate and /jal-review, then open a conventional-commit PR with a checklist. Never force-merges.

Prepare and open a pull request for the current branch's changes. Reference skill `jal-git-safety`: feature-branch flow, conventional commits, never force-push or force-merge a shared branch.

## Steps, in order

1. **Dispatch agent `jal-reviewer`** against the current diff for correctness, module-boundary compliance (`bun run check:boundaries`), and simplification. Any Critical or Important finding blocks the PR until fixed.
2. **Run the review gate playbook (`review-gate.md`)** for the full consolidated gate (em-dash scan, banned-dependency scan, `bun test`, security hardening checklist). Both this and step 1 must pass before continuing.
3. **If either check fails,** report every finding with file and line, fix what is in scope, re-run both checks. Never open a PR against a failing gate, never skip a check to save time.
4. **Once both pass,** inspect `git log` and `git diff` against the base branch to draft a conventional-commit-style PR title (`feat:`, `fix:`, `chore:`, `refactor:`, etc.) under 70 characters.
5. **Open the PR** with `gh pr create`, body includes a Summary section and a Test plan checklist covering what was verified in steps 1 and 2.
6. **Never force-merge.** If the PR cannot merge cleanly, report the conflict and stop, do not force-push the target branch or bypass required checks to land it.

Report the PR URL and the gate results that cleared it. Stay terse.
