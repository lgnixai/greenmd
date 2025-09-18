### Migration Guide — Toward Modular Architecture

This guide lists practical steps to migrate the current codebase to the proposed structure with minimal breakage.

## 1) Unify Types and Utilities

- Move panel tree helpers into `packages/core/src/utils/panelTree.ts` (done)
- Export helpers from `@dtinsight/molecule-core` root (done)
- Replace UI-local `PanelNode` with `core` `PanelNode` type (in-progress; start with ObsidianLayout)

Checklist:
- [x] Core exports `panelTree` helpers
- [ ] All UI components import `PanelNode` from core types
- [ ] Remove duplicated UI `PanelNode` definitions

## 2) Services vs UI Boundaries

- Keep feature services and slices in `core/src/services`
- UI invokes services via hooks from `@dtinsight/molecule-core`
- Move any non-visual logic from UI components into service actions

Checklist:
- [ ] Audit UI components for business logic; move to services
- [ ] Add missing services (e.g., workspace layouts, session recovery) in core

## 3) Editor Adapters Package

- Create `packages/editor` to encapsulate Monaco and other editor types
- Expose `EditorView` and adapter interfaces so UI composes editor without coupling to Monaco details

Checklist:
- [ ] Extract `MonacoEditor` usage behind adapter in `packages/editor`
- [ ] Replace direct `@monaco-editor/react` imports in UI

## 4) Feature-First UI Structure

- Move `components/obeditor` into `features/obsidian-editor`
- Group related UI, hooks, and lightweight UI state under feature folder

Checklist:
- [ ] Create `packages/ui/src/features/obsidian-editor/*`
- [ ] Update exports and imports

## 5) Extension Contracts and Registries

- Define extension contribution interfaces in `core/src/plugin`
- Provide registries and lifecycle hooks (activate/deactivate)
- Add example extensions in `packages/extensions`

Checklist:
- [ ] `core/plugin` contracts and basic registry
- [ ] Example view/command/theme contributions

## 6) Theming and I18n

- Keep theme metadata and i18n catalogs in core types
- UI reads current theme/locale from services; themes live in `packages/themes`

Checklist:
- [ ] Standardize theme type in core
- [ ] Ensure `ui` uses theme service only

## 7) Testing and CI

- Add unit tests for `panelTree` helpers
- Add integration tests for Obsidian-like panel operations via services

Checklist:
- [ ] panelTree unit tests
- [ ] end-to-end panel interactions in `apps/web`

## 8) Release Strategy

- Version packages independently with changesets or keep turbo+pnpm workspace ranges
- Stabilize core API first; mark UI APIs experimental until solidified

