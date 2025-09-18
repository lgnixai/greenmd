### Molecule Obsidian-like Project — Target Architecture

This document proposes a modular, extensible architecture optimized for maintainability and growth. It separates concerns across core domain logic, UI, editor adapters, and extension APIs, and formalizes boundaries and extension points.

## Monorepo Layout

```text
apps/
  web/                     # App shell (routing, theme, composition)

packages/
  core/                    # Headless core (types, services, state, utils)
    src/
      types/               # Domain model (no React)
      services/            # Feature services (Zustand stores + actions)
      stores/              # Shared state slices (if separated from services)
      utils/               # Pure helpers (e.g., panelTree)
      plugin/              # Extension API contracts, registries
      index.ts

  editor/                  # Editor adapters (Monaco, Markdown, Diff)
    src/
      adapters/monaco/     # Monaco wrapper and options
      features/markdown/   # Markdown editor impl
      types/               # Editor-impl types
      index.ts

  ui/                      # UI library (React components, feature views)
    src/
      features/
        workbench/
        explorer/
        search/
        panels/            # Obsidian-like panel UI
        obsidian-editor/   # Composition of Obsidian-like editor views
      components/          # Reusable primitive components
      hooks/               # UI hooks only
      stores/              # UI-only state (view prefs, ephemeral)
      styles/
      providers/
      types/               # UI-specific types (augmentations)
      index.ts

  extensions/              # First-party extensions (examples/tests)
    src/
      hello-world/
      markdown-enhancer/
      index.ts

  themes/                  # Theme packs (JSON/CSS)
    src/
      default-dark/
      default-light/
      high-contrast/

  fs/                      # FileSystem abstraction (optional)
    src/
      adapters/            # localStorage, IndexedDB, Node fs, WebDAV, etc.
      index.ts
```

## Package Boundaries

- core
  - Owns domain types, services, and pure utilities
  - No React components; Zustand is acceptable but React-free
  - Exposes typed service hooks/selectors and extension contracts
  - Example: `panelTree` logic, command service, menu service, extension service, search service, i18n service, theme service

- editor
  - Owns editor implementation details (Monaco, diff, language services)
  - Exposes adapter interfaces for `core` services to call

- ui
  - Owns React components and feature views
  - Depends on `core` for state/services and `editor` for editor components
  - Contains only UI-specific state (e.g., transient view preferences)

- extensions
  - Owns extension modules consuming `core` contracts
  - No direct dependency on `ui` components unless explicitly allowed via view contributions

## Extension Points (Contributes)

- Commands, Menus, Keybindings
- Views (tree/webview/terminal), StatusBar, ActivityBar items
- Themes, Locales, Settings schema
- Editor contributions (language features, decorations)

## State Management

- Use Zustand slices per feature with explicit actions
- Co-locate slice logic in `packages/core/src/services/<feature>/...`
- UI consumes slices via typed hooks exposed by `core`
- Avoid business logic in UI; keep UI declarative

## Panel Tree Ownership

- Source of truth in `core` under `utils/panelTree.ts`
- Services operate on panel tree immutably; UI calls service actions
- UI should avoid duplicating panel traversal/manipulation logic

## Coding Conventions

- Strong types for public APIs; no `any` in exported signatures
- Feature-first directory structure in UI (`features/<feature>`)
- Avoid deep nesting; prefer early returns and small functions
- Keep React components presentational; move side-effects to hooks/services

## Build & Distribution

- Each package builds to ESM+CJS via tsup
- `core` exports only type-safe public surface; internal folders remain private
- `ui` re-exports only stable components and feature entry points

## Testing Strategy

- Unit tests in each package close to source
- Integration tests in `apps/web` composing multiple packages
- Contract tests for extension API stability

