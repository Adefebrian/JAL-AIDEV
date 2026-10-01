# `@remotion/codemods`: edit Remotion source in memory

Written against `remotion` 4.0.532 (docs read 2026-10-01). Draft API: Remotion reserves the right to change it at any time.

From:
- https://www.remotion.dev/docs/codemods/
- https://www.remotion.dev/docs/codemods/add-canvas-capture-composition
- https://www.remotion.dev/docs/codemods/add-composition
- https://www.remotion.dev/docs/codemods/add-effect
- https://www.remotion.dev/docs/codemods/add-element
- https://www.remotion.dev/docs/codemods/add-folder
- https://www.remotion.dev/docs/codemods/apply-codemod-changes
- https://www.remotion.dev/docs/codemods/create-element
- https://www.remotion.dev/docs/codemods/delete-composition
- https://www.remotion.dev/docs/codemods/delete-effects
- https://www.remotion.dev/docs/codemods/delete-nodes
- https://www.remotion.dev/docs/codemods/detach-audio
- https://www.remotion.dev/docs/codemods/duplicate-composition
- https://www.remotion.dev/docs/codemods/duplicate-effects
- https://www.remotion.dev/docs/codemods/duplicate-nodes
- https://www.remotion.dev/docs/codemods/get-node-props
- https://www.remotion.dev/docs/codemods/get-nodes
- https://www.remotion.dev/docs/codemods/move-composition
- https://www.remotion.dev/docs/codemods/move-folder
- https://www.remotion.dev/docs/codemods/rename-composition
- https://www.remotion.dev/docs/codemods/rename-folder
- https://www.remotion.dev/docs/codemods/reorder-effect
- https://www.remotion.dev/docs/codemods/reorder-node
- https://www.remotion.dev/docs/codemods/resolve-composition-component
- https://www.remotion.dev/docs/codemods/set-composition-default-props
- https://www.remotion.dev/docs/codemods/split-sequences
- https://www.remotion.dev/docs/codemods/static-file-value
- https://www.remotion.dev/docs/codemods/unwrap-folder
- https://www.remotion.dev/docs/codemods/update-composition-metadata
- https://www.remotion.dev/docs/codemods/update-effect-keyframes
- https://www.remotion.dev/docs/codemods/update-effect-props
- https://www.remotion.dev/docs/codemods/update-multiple-node-props
- https://www.remotion.dev/docs/codemods/update-node-keyframes
- https://www.remotion.dev/docs/codemods/update-node-props
- https://www.remotion.dev/docs/codemods/update-visual-controls
- https://www.remotion.dev/docs/codemods/wrap-node

## What it is

A package (since 4.0.527) that takes source files as strings and returns the changed files. It does not read or write the disk, run the project, download media or install packages. You decide how to preview, save and compile. The Studio's interactivity uses the same idea. Install: `bun add --exact @remotion/codemods@<version>`, with the same version as the other Remotion packages (check with `bunx remotionb versions`).

## When a JAL agent uses it

When a tool or agent has to edit a Remotion project programmatically and safely: add a composition, change default props, rename or move compositions and folders, add an element, edit a prop or keyframe, split a sequence. Prefer it over regex or blind text edits because it understands imports, node paths and registrations. Not needed for normal hand-written compositions.

## Model

- `CodemodProject`: `{rootDir, files: Record<path, source>}`. Include the files needed for the edit (a prop edit needs its target file; resolving an imported composition component needs the files along the import path). Mutations never change the input project.
- `NodeReference`: `{filePath, nodePath}`. `nodePath` is opaque and identifies an element in the current source snapshot. Get it from `getNodes()`, an insertion result, or a mounted layer. A reference points at source, not a rendered instance: editing a shared component changes every composition that uses it, and editing a node inside a loop changes every iteration.
- `EffectReference`: a node reference plus `effectIndex`, the zero-based position in its inline `effects` array. Adding, deleting, duplicating or reordering effects shifts indices and node-path remapping does not fix that; inspect effects again.
- `CodemodResult`: `changes` (array of `{filePath, previousContents | null, nextContents | null}`; `previousContents` null means created, `nextContents` null means deleted) and, for node, effect, keyframe and registration mutations, `nodePathRemappings` (`{filePath, oldNodePath, newNodePath}`; null old means insertion, null new means removal; apply once to references from the input project). Prefer returned `insertedNode`, `insertedNodes`, `updatedNode`, `insertedEffect`, `insertedEffects`, `updatedEffect`. After manual edits, call `getNodes()` again. Editors that keep mounted sequences attached to source nodes (`<Canvas>`) take remappings through `queueSequenceNodePathRemappings()`.
- Apply a result to an in-memory project with `applyCodemodChanges({project, changes})`.

## API reference

### Create and place elements (4.0.530)

| API | Purpose | Key arguments |
| --- | --- | --- |
| `createElement({component, importPath?, importName?, props?, children?})` | Immutable description of an element; chain `withProp(name, value)`, `withProps(props)`, `withChild(...)`; imports and local names resolve at insertion | |
| `addElement({project, element, target})` | Insert into a composition component or next to a node and add the import | `target`: `{type:'composition', compositionFile, compositionId}`, `{type:'component', filePath, exportName}`, `{type:'inside'\|'before'\|'after', node}` |
| `wrapNode({project, node, wrapper})` | Wrap a node in an element made with `createElement()`; the node becomes the only child | |
| `staticFileValue(path)` | A `CodemodValue` written as a `staticFile()` call (import added) | `path` |

### Inspect

| API | Purpose | Key arguments |
| --- | --- | --- |
| `getNodes({project, filePath})` | List nodes in source order with `nodePath`, `tagName`, `componentIdentity`, `location`, `parentNodePath` | |
| `getNodeProps({project, node, keys, effectKeys?, assetKeys?, componentIdentity?, videoConfig?})` | Read props and inline effects without executing the project; reports whether each can be updated (`canUpdate`) | |
| `resolveCompositionComponent({project, compositionFile, compositionId})` | Find the component a composition uses through project imports and re-exports | returns `filePath`, `exportName`, `location`, `canAddContent` |

### Edit nodes

| API | Purpose |
| --- | --- |
| `updateNodeProps({project, node, props?, updates?, ...})` | Change props, nested object properties, supported text children; supports `defaultValue`, Google font values |
| `updateMultipleNodeProps({project, changes})` | Many nodes across files in one operation, against the input project's references |
| `updateNodeKeyframes({project, node, updates, operation, schema?, videoConfig?})` | Add, remove, move or configure keyframes on a node prop |
| `deleteNodes({project, nodes})` | Delete nodes (any element, including sequences) |
| `duplicateNodes({project, nodes})` | Duplicate beside the originals |
| `reorderNode({project, node, target, position})` | Move before or after a sibling |
| `splitSequences({project, splits: [{node, frame}]})` | Split supported timing elements into two adjacent nodes |
| `detachAudio({project, node})` | Mute a video element and insert a matching audio element beside it |

### Effects

| API | Purpose |
| --- | --- |
| `addEffect({project, node, importName, importPath, props?})` | Append an effect to the inline `effects` array and add its import |
| `updateEffectProps({project, effect, props?, updates?})` | Update explicit properties of an inline effect |
| `updateEffectKeyframes({project, effect, updates, operation, schema?, videoConfig?})` | Keyframe an effect property |
| `deleteEffects`, `duplicateEffects`, `reorderEffect({project, effect, toIndex})` | Remove, copy right after the original, move within the array |

### Compositions and folders (registration file edits)

| API | Purpose |
| --- | --- |
| `addComposition({project, compositionFile, compositionId, component, importName, importPath, metadata})` | Add a registration referencing an existing named component export; metadata: `width`, `height`, `fps`, `durationInFrames` |
| `addCanvasCaptureComposition(...)` | Create an interactive Canvas Capture component and register it; both files returned |
| `deleteComposition`, `duplicateComposition({newId, metadata?, tag?})`, `renameComposition({newId})`, `moveComposition({destination})` | Manage registrations (compositions and stills) |
| `updateCompositionMetadata({metadata})` | Change width, height, fps, durationInFrames on a registration |
| `setCompositionDefaultProps({defaultProps, enumPaths?})` | Replace statically readable default props or add them |
| `addFolder`, `renameFolder`, `moveFolder`, `unwrapFolder` | Folder registrations: add empty, rename keeping contents, move with contents, remove wrapper keeping contents |
| `updateVisualControls({project, filePath, changes})` | Update default values of `visualControl()` calls while keeping surrounding source |

### Utility

| API | Purpose |
| --- | --- |
| `applyCodemodChanges({project, changes})` | Apply returned changes to an in-memory project |

## Usage notes for JAL

- Always keep a copy of the input files and show the resulting `changes` as a diff before writing to disk.
- Keep source in the shape the Studio can edit (studio.md#write-code-the-studio-can-edit-best-practices); codemods can only edit statically readable values.
- Because the API is a draft, pin the exact Remotion version and re-run the tests of any tool that uses it after an upgrade.
