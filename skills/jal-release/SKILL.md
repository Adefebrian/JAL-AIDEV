---
user-invocable: false
name: jal-release
description: Changesets release flow for the JAL monorepo, add a changeset per change, bun x changeset version, changelog generation, git tagging, and semver bump guidance for major, minor, and patch. Use when finishing a feature branch, cutting a release, or deciding whether a change is a major, minor, or patch bump.
---

# JAL Release: Changesets

Release discipline for the Turborepo monorepo mandated by `jal-standards`. Every user-visible or contract-visible change carries its own changeset; releases are generated from those, never hand-typed after the fact.

## Add a changeset per change

- Every PR that changes behavior, fixes a bug, or touches a published package's public surface adds a changeset in the same PR: `bun x changeset`.
- The CLI prompts for affected packages and bump type; write the summary as the changelog entry itself, one or two sentences, user-facing language, not "fix bug" or "update code."
- A PR with no user-visible effect (an internal refactor with no behavior change, a test-only change, docs) does not need a changeset. When unsure, add one, an empty release note is cheaper than a missing one.
- Changesets live as small markdown files under `.changeset/` until consumed by a version bump. Do not hand-edit or delete one after merge, let the release step consume it.

## bun x changeset version

- At release time, run `bun x changeset version`. This consumes every pending changeset, bumps each affected package's version per the highest bump type it collected, and writes or updates that package's `CHANGELOG.md`.
- Commit the result as its own commit (`chore: version packages`). Do not hand-edit the generated version numbers or changelog entries afterward, if something is wrong, fix the source changeset and re-run.
- Run `bun install` after versioning to refresh the lockfile with the new internal package versions before committing.

## Changelog

- `CHANGELOG.md` per package is generated, not hand-maintained. Do not add entries directly to it, add a changeset instead so the entry survives the next `version` run with correct attribution and grouping.
- Keep changeset summaries changelog-quality from the start (what changed, for whom), since that text becomes the changelog verbatim.

## Tag

- After versioning and merging, tag the release commit per the `jal-git-safety` convention: `git tag -a v<version> -m "..."`, push the tag, and tag the corresponding Docker image with the same version string.
- One tag per release, matching the version `changeset version` produced. Never tag a commit that has not gone through the versioning step.

## Semver guidance: major/minor/patch

- **Patch**: a bug fix, an internal refactor with no API change, a dependency bump with no behavior change visible to a consumer of the package.
- **Minor**: a new backward-compatible capability, a new route, a new optional field, a new exported function. Existing callers keep working unchanged.
- **Major**: any breaking change, a removed or renamed field, route, or export, a changed default that alters existing behavior, a required new input. Breaking the `AppType` contract from `jal-rpc` in a way that fails existing frontend call sites is always major.
- Default to the smallest honest bump. Marking something major "to be safe" trains consumers to ignore version numbers. Marking something minor when it breaks a caller is worse. Get the classification right rather than defensive in either direction.
