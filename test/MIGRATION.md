# Migration Guide: Molecule 2.x to 3.x

This guide will help you migrate your Molecule 2.x applications to the new Molecule 3.x framework.

## 🚨 Breaking Changes

### 1. Package Structure

**Before (2.x):**
```bash
npm install @dtinsight/molecule
```

**After (3.x):**
```bash
npm install @dtinsight/molecule-core @dtinsight/molecule-ui
```

### 2. Import Changes

**Before (2.x):**
```tsx
import { create, Workbench } from '@dtinsight/molecule';
import '@dtinsight/molecule/esm/style/mo.css';
```

**After (3.x):**
```tsx
import { MoleculeProvider, Workbench } from '@dtinsight/molecule-ui';
import { useLayoutStore, useEditorStore } from '@dtinsight/molecule-core';
import '@dtinsight/molecule-ui/dist/styles.css';
```

### 3. Initialization

**Before (2.x):**
```tsx
const moInstance = create({
  extensions: [],
});

const App = () => moInstance.render(<Workbench />);
```

**After (3.x):**
```tsx
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
```

## 🔄 Component Migration

### 1. State Management

**Before (2.x):**
```tsx
import { useConnector } from '@dtinsight/molecule';

function MyComponent() {
  const layout = useConnector('layout');
  const editor = useConnector('editor');
  
  return (
    <div>
      <button onClick={() => layout.toggleSidebar()}>
        Toggle Sidebar
      </button>
    </div>
  );
}
```

**After (3.x):**
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

### 2. UI Components

**Before (2.x):**
```tsx
import { Button, Input } from '@dtinsight/molecule';

function MyComponent() {
  return (
    <div>
      <Button type="primary">Click me</Button>
      <Input placeholder="Type something..." />
    </div>
  );
}
```

**After (3.x):**
```tsx
import { Button, Input } from '@dtinsight/molecule-ui';

function MyComponent() {
  return (
    <div>
      <Button variant="default">Click me</Button>
      <Input placeholder="Type something..." />
    </div>
  );
}
```

### 3. Styling

**Before (2.x):**
```scss
// Using SCSS with BEM naming
.mo-button {
  background-color: var(--button-background);
  
  &--primary {
    background-color: var(--button-primary-background);
  }
}
```

**After (3.x):**
```tsx
// Using Tailwind CSS classes
<Button className="bg-primary hover:bg-primary/90">
  Click me
</Button>

// Or custom CSS with CSS variables
<Button className="custom-button">
  Click me
</Button>
```

```css
.custom-button {
  background-color: hsl(var(--primary));
}

.custom-button:hover {
  background-color: hsl(var(--primary) / 0.9);
}
```

## 🔌 Extension Migration

### 1. Extension Structure

**Before (2.x):**
```tsx
import { IExtension } from '@dtinsight/molecule';

const myExtension: IExtension = {
  id: 'my-extension',
  name: 'My Extension',
  activate: (context) => {
    // Extension logic
  },
};
```

**After (3.x):**
```tsx
import type { IExtension, IMoleculeContext } from '@dtinsight/molecule-core';

const myExtension: IExtension = {
  id: 'my-extension',
  name: 'My Extension',
  version: '1.0.0', // Now required
  activate: (context: IMoleculeContext) => {
    // Extension logic
  },
};
```

### 2. Service Access

**Before (2.x):**
```tsx
activate: (context) => {
  const { editor, layout } = context;
  editor.addTab({ id: '1', name: 'New Tab' });
}
```

**After (3.x):**
```tsx
activate: (context: IMoleculeContext) => {
  const { editor, layout } = context;
  editor.addTab({ 
    id: '1', 
    name: 'New Tab',
    data: {} // data is now required
  });
}
```

## 🎨 Theme Migration

### 1. Theme Definition

**Before (2.x):**
```tsx
const theme = {
  id: 'my-theme',
  label: 'My Theme',
  uiTheme: 'vs-dark',
  path: '/path/to/theme.json',
};
```

**After (3.x):**
```tsx
const theme = {
  id: 'my-theme',
  label: 'My Theme',
  uiTheme: 'vs-dark',
  path: '/path/to/theme.json',
  colors: {
    'editor.background': '#1a1a1a',
    'editor.foreground': '#ffffff',
  },
  tokenColors: [
    // Token color definitions
  ],
};
```

### 2. Theme Application

**Before (2.x):**
```tsx
import { useConnector } from '@dtinsight/molecule';

function MyComponent() {
  const colorTheme = useConnector('colorTheme');
  colorTheme.setCurrent('my-theme');
}
```

**After (3.x):**
```tsx
import { useThemeStore } from '@dtinsight/molecule-core';

function MyComponent() {
  const { setCurrentTheme } = useThemeStore();
  setCurrentTheme('my-theme');
}
```

## 🛠️ Build Configuration

### 1. Vite Configuration

**Before (2.x):**
```js
// webpack.config.js or similar
module.exports = {
  // webpack configuration
};
```

**After (3.x):**
```js
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@dtinsight/molecule-core': path.resolve(__dirname, 'node_modules/@dtinsight/molecule-core'),
      '@dtinsight/molecule-ui': path.resolve(__dirname, 'node_modules/@dtinsight/molecule-ui'),
    },
  },
})
```

### 2. TypeScript Configuration

**Before (2.x):**
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["ES5", "ES6", "ES7", "es2017", "dom", "ESNext"],
    "jsx": "react-jsx"
  }
}
```

**After (3.x):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

## 📋 Migration Checklist

- [ ] Update package dependencies
- [ ] Update import statements
- [ ] Migrate state management from connectors to stores
- [ ] Update UI components to use new API
- [ ] Migrate SCSS styles to Tailwind CSS
- [ ] Update extension definitions
- [ ] Update theme definitions
- [ ] Update build configuration
- [ ] Test all functionality
- [ ] Update documentation

## 🆘 Getting Help

If you encounter issues during migration:

1. Check the [API Reference](./docs/api-reference.md)
2. Look at the [Examples](./examples/) directory
3. Join our [Discord community](https://discord.gg/b62gpHwNA7)
4. Open an issue on [GitHub](https://github.com/DTStack/molecule/issues)

## 🎯 Migration Tools

We provide migration tools to help automate the process:

```bash
# Install migration tool
npm install -g @dtinsight/molecule-migrate

# Run migration
molecule-migrate --from=2.x --to=3.x ./src
```

This tool will automatically:
- Update import statements
- Convert SCSS to Tailwind CSS
- Update component props
- Migrate state management code

---

**Note**: This migration guide covers the most common scenarios. For specific use cases, please refer to the detailed documentation or contact our support team.

