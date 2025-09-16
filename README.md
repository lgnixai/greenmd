# Molecule 3.x - Modern Web IDE Framework

[![CI][ci-image]][ci-url] [![NPM version][npm-version]][npm-version-url] [![License][license-image]][license-url]

[ci-image]: https://github.com/DTStack/molecule/actions/workflows/main.yml/badge.svg
[ci-url]: https://github.com/DTStack/molecule/actions/workflows/main.yml
[npm-version]: https://img.shields.io/npm/v/@dtinsight/molecule.svg?style=flat-square
[npm-version-url]: https://www.npmjs.com/package/@dtinsight/molecule
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg
[license-url]: https://github.com/DTStack/molecule/blob/main/LICENSE

<div align="center">

<img src="./website/static/img/logo@3x.png" width="20%" height="20%" alt="molecule-logo" />
<h1>Molecule 3.x</h1>
<h3>A modern Web IDE UI Framework built with React.js and shadcn/ui</h3>

</div>

## 🚀 What's New in 3.x

Molecule 3.x is a complete rewrite of the popular Web IDE framework, featuring:

- **🎨 Modern UI**: Built with [shadcn/ui](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/)
- **⚡ Performance**: Powered by [Vite](https://vitejs.dev/) and modern build tools
- **🔧 TypeScript 5.x**: Full type safety with the latest TypeScript features
- **📦 Monorepo**: Organized as a modern monorepo with Turbo
- **🎯 Simplified API**: Cleaner, more intuitive extension system
- **♿ Accessibility**: Built-in accessibility support with Radix UI
- **🌙 Themes**: Advanced theming system with dark/light mode support

## 📦 Packages

This monorepo contains the following packages:

- **`@dtinsight/molecule-core`** - Core functionality and state management
- **`@dtinsight/molecule-ui`** - UI components based on shadcn/ui
- **`@dtinsight/molecule-editor`** - Monaco Editor integration
- **`@dtinsight/molecule-extensions`** - Extension system
- **`@dtinsight/molecule-themes`** - Theme management

## 🛠️ Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/DTStack/molecule.git
cd molecule

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Basic Usage

```tsx
import React from 'react';
import { MoleculeProvider, Workbench } from '@dtinsight/molecule-ui';
import type { IMoleculeConfig } from '@dtinsight/molecule-core';

const config: IMoleculeConfig = {
  extensions: [],
  defaultLocale: 'en-US',
  defaultColorTheme: 'default-dark',
};

function App() {
  return (
    <MoleculeProvider config={config}>
      <Workbench />
    </MoleculeProvider>
  );
}

export default App;
```

## 🏗️ Architecture

### Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Molecule 3.x Architecture                │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (shadcn/ui + Tailwind CSS)                       │
│  ├── Workbench                                             │
│  ├── Activity Bar                                          │
│  ├── Sidebar                                               │
│  ├── Editor Area                                           │
│  ├── Panel                                                 │
│  └── Status Bar                                            │
├─────────────────────────────────────────────────────────────┤
│  Core Layer (Zustand + TypeScript)                         │
│  ├── State Management                                      │
│  ├── Extension System                                      │
│  ├── Theme Management                                      │
│  └── Service Layer                                         │
├─────────────────────────────────────────────────────────────┤
│  Editor Layer (Monaco Editor)                              │
│  ├── Code Editor                                           │
│  ├── Language Support                                      │
│  └── IntelliSense                                          │
└─────────────────────────────────────────────────────────────┘
```

### State Management

Molecule 3.x uses [Zustand](https://github.com/pmndrs/zustand) for state management:

```tsx
import { useLayoutStore, useEditorStore } from '@dtinsight/molecule-core';

function MyComponent() {
  const { layout, toggleSidebar } = useLayoutStore();
  const { groups, addTab } = useEditorStore();
  
  return (
    <div>
      <button onClick={toggleSidebar}>
        Toggle Sidebar
      </button>
    </div>
  );
}
```

## 🎨 UI Components

### Built with shadcn/ui

All UI components are built on top of [shadcn/ui](https://ui.shadcn.com/) and [Radix UI](https://www.radix-ui.com/):

```tsx
import { Button, Input, Tabs } from '@dtinsight/molecule-ui';

function MyComponent() {
  return (
    <div>
      <Button variant="default">Click me</Button>
      <Input placeholder="Type something..." />
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    </div>
  );
}
```

### Customization

Components can be customized using Tailwind CSS classes:

```tsx
import { Workbench } from '@dtinsight/molecule-ui';

function App() {
  return (
    <Workbench className="bg-gray-100 dark:bg-gray-900">
      {/* Your content */}
    </Workbench>
  );
}
```

## 🔌 Extensions

### Creating Extensions

```tsx
import type { IExtension, IMoleculeContext } from '@dtinsight/molecule-core';

const myExtension: IExtension = {
  id: 'my-extension',
  name: 'My Extension',
  version: '1.0.0',
  activate: (context: IMoleculeContext) => {
    // Extension activation logic
    console.log('My extension activated!');
  },
  contributes: {
    actions: [
      {
        id: 'my-action',
        name: 'My Action',
        title: 'Execute My Action',
        onClick: () => {
          console.log('Action executed!');
        },
      },
    ],
  },
};

export default myExtension;
```

### Extension API

```tsx
// Access Molecule services
const { editor, layout, notification } = context;

// Add new tabs
editor.addTab({
  id: 'my-tab',
  name: 'My Tab',
  data: { content: 'Hello World!' },
});

// Show notifications
notification.show({
  type: 'info',
  message: 'Extension loaded successfully!',
});
```

## 🎨 Theming

### Built-in Themes

- **Default Dark+** - Dark theme inspired by VS Code
- **Default Light+** - Light theme for better readability
- **High Contrast** - High contrast theme for accessibility

### Custom Themes

```tsx
import { useThemeStore } from '@dtinsight/molecule-core';

const customTheme = {
  id: 'my-theme',
  label: 'My Custom Theme',
  uiTheme: 'vs-dark',
  colors: {
    'editor.background': '#1a1a1a',
    'editor.foreground': '#ffffff',
  },
};

// Add theme
useThemeStore.getState().addTheme(customTheme);
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### E2E Testing

```bash
# Run E2E tests with Playwright
pnpm test:e2e
```

## 📚 Documentation

- [Getting Started](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)
- [Extension Guide](./docs/extension-guide.md)
- [Theming Guide](./docs/theming-guide.md)
- [Migration Guide](./docs/migration-guide.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone and install
git clone https://github.com/DTStack/molecule.git
cd molecule
pnpm install

# Start development
pnpm dev

# Build packages
pnpm build

# Run tests
pnpm test
```

## 📄 License

Licensed under the [MIT License](./LICENSE).

## 🙏 Acknowledgments

- [VS Code](https://code.visualstudio.com/) - Inspiration for the UI design
- [shadcn/ui](https://ui.shadcn.com/) - Modern UI components
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Zustand](https://github.com/pmndrs/zustand) - State management

---

<div align="center">
  <p>Built with ❤️ by the DTStack team</p>
  <p>
    <a href="https://github.com/DTStack/molecule">GitHub</a> •
    <a href="https://dtstack.github.io/molecule">Documentation</a> •
    <a href="https://discord.gg/b62gpHwNA7">Discord</a>
  </p>
</div>

