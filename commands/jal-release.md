---
description: Cut a release with changesets, version bump, changelog generation, and a git tag.
---

Cut a release for the current state of `main` (or the current branch if releasing from elsewhere). Reference skill `jal-release` for the full changesets flow and semver guidance behind this command, do not re-derive it here.

## Steps, in order

1. **Confirm every change has a changeset.** Check for pending changeset files. If a merged change since the last release has no changeset, stop and flag it, do not guess the bump level on its behalf.
2. **Determine the bump.** Per skill `jal-release`, major for breaking changes, minor for backward-compatible features, patch for fixes. Let the changesets already on disk drive this, do not override them silently.
3. **Version.** Run `bun x changeset version`. This bumps package versions and writes the changelog entries.
4. **Review the changelog diff** before committing, confirm it reads clearly, fix wording if a changeset description was terse.
5. **Commit** the version bump and changelog with a conventional commit (`chore: release <version>`).
6. **Tag.** Create an annotated git tag matching the new version (e.g. `v1.2.0`). Never move or force-overwrite an existing tag.
7. **Report** the new version, the changelog summary, and the tag name. Do not push or deploy from this command, that is `/jal-pr` and `/jal-deploy`'s job.

Stay terse throughout.
