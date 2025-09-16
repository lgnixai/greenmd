import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface EditorTab {
  id: string;
  name: string;
  path?: string;
  content: string;
  language: string;
  isDirty: boolean;
  isReadOnly: boolean;
  isActive: boolean;
}

export interface EditorGroup {
  id: string;
  tabs: EditorTab[];
  activeTabId?: string;
}

export interface EditorState {
  groups: EditorGroup[];
  currentGroupId?: string;
  isFullscreen: boolean;
  loading: boolean;
}

interface EditorServiceState extends EditorState {
  // Actions
  createEditor: (name: string, content?: string, language?: string) => string;
  createDiffEditor: (leftFile: string, rightFile: string) => string;
  createCustomEditor: (type: string, data: any) => string;
  openFile: (path: string, content: string, language?: string) => string;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  setTabReadOnly: (tabId: string, readOnly: boolean) => void;
  toggleLoading: () => void;
  updateWelcomePage: () => void;
  toggleDirection: () => void;
  addExecuteAction: (action: any) => void;
  updateExecuteAction: (actionId: string, action: any) => void;
  setActiveGroup: (groupId: string) => void;
  createNewGroup: () => string;
  moveTabToGroup: (tabId: string, targetGroupId: string) => void;
}

const defaultContent = `// Welcome to Molecule 3.x Editor
// This is a modern Web IDE built with React and Monaco Editor

import React from 'react';
import { Editor } from '@monaco-editor/react';

function App() {
  const [code, setCode] = React.useState('// Start coding here...');
  
  return (
    <div className="editor-container">
      <Editor
        height="100%"
        language="typescript"
        value={code}
        onChange={(value) => setCode(value || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on'
        }}
      />
    </div>
  );
}

export default App;`;

const welcomeContent = `# Welcome to Molecule 3.x

## 🚀 Modern Web IDE Framework

Molecule 3.x is a completely rewritten version of the Molecule IDE framework, built with modern technologies:

### ✨ Key Features
- **Modern UI**: Built with shadcn/ui and Tailwind CSS
- **Monaco Editor**: Full-featured code editor
- **TypeScript**: Complete type safety
- **Extensible**: Plugin architecture
- **Responsive**: Works on all screen sizes

### 🛠️ Technology Stack
- React 18
- TypeScript 5.x
- Vite
- Zustand
- Monaco Editor
- Tailwind CSS

### 📚 Getting Started
1. Open a file using the file explorer
2. Start coding with syntax highlighting
3. Use the integrated terminal
4. Install extensions for more features

Happy coding! 🎉`;

export const useEditorService = create<EditorServiceState>()(
  immer((set, get) => ({
    groups: [
      {
        id: 'main-group',
        tabs: [
          {
            id: 'welcome-tab',
            name: 'Welcome',
            content: welcomeContent,
            language: 'markdown',
            isDirty: false,
            isReadOnly: true,
            isActive: true
          }
        ],
        activeTabId: 'welcome-tab'
      }
    ],
    currentGroupId: 'main-group',
    isFullscreen: false,
    loading: false,

    createEditor: (name, content = '', language = 'typescript') => {
      const tabId = `editor-${Date.now()}`;
      const groupId = get().currentGroupId || 'main-group';
      
      set((state) => {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          // 设置当前活动标签为非活动
          group.tabs.forEach(tab => tab.isActive = false);
          
          const newTab: EditorTab = {
            id: tabId,
            name,
            content: content || defaultContent,
            language,
            isDirty: false,
            isReadOnly: false,
            isActive: true
          };
          
          group.tabs.push(newTab);
          group.activeTabId = tabId;
        }
      });
      
      return tabId;
    },

    createDiffEditor: (leftFile, rightFile) => {
      const tabId = `diff-${Date.now()}`;
      const groupId = get().currentGroupId || 'main-group';
      
      set((state) => {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          group.tabs.forEach(tab => tab.isActive = false);
          
          const newTab: EditorTab = {
            id: tabId,
            name: `Diff: ${leftFile} ↔ ${rightFile}`,
            content: `// Diff Editor\n// Left: ${leftFile}\n// Right: ${rightFile}\n\n// Differences will be highlighted here`,
            language: 'typescript',
            isDirty: false,
            isReadOnly: true,
            isActive: true
          };
          
          group.tabs.push(newTab);
          group.activeTabId = tabId;
        }
      });
      
      return tabId;
    },

    createCustomEditor: (type, data) => {
      const tabId = `custom-${Date.now()}`;
      const groupId = get().currentGroupId || 'main-group';
      
      set((state) => {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          group.tabs.forEach(tab => tab.isActive = false);
          
          const newTab: EditorTab = {
            id: tabId,
            name: `Custom: ${type}`,
            content: `// Custom Editor: ${type}\n// Data: ${JSON.stringify(data, null, 2)}`,
            language: 'json',
            isDirty: false,
            isReadOnly: false,
            isActive: true
          };
          
          group.tabs.push(newTab);
          group.activeTabId = tabId;
        }
      });
      
      return tabId;
    },

    openFile: (path, content, language = 'typescript') => {
      const tabId = `file-${Date.now()}`;
      const groupId = get().currentGroupId || 'main-group';
      const fileName = path.split('/').pop() || 'untitled';
      
      set((state) => {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          group.tabs.forEach(tab => tab.isActive = false);
          
          const newTab: EditorTab = {
            id: tabId,
            name: fileName,
            path,
            content,
            language,
            isDirty: false,
            isReadOnly: false,
            isActive: true
          };
          
          group.tabs.push(newTab);
          group.activeTabId = tabId;
        }
      });
      
      return tabId;
    },

    closeTab: (tabId) => {
      set((state) => {
        state.groups.forEach(group => {
          const tabIndex = group.tabs.findIndex(tab => tab.id === tabId);
          if (tabIndex !== -1) {
            const wasActive = group.tabs[tabIndex].isActive;
            group.tabs.splice(tabIndex, 1);
            
            if (wasActive && group.tabs.length > 0) {
              const newActiveTab = group.tabs[group.tabs.length - 1];
              newActiveTab.isActive = true;
              group.activeTabId = newActiveTab.id;
            } else if (group.tabs.length === 0) {
              group.activeTabId = undefined;
            }
          }
        });
      });
    },

    switchTab: (tabId) => {
      set((state) => {
        state.groups.forEach(group => {
          group.tabs.forEach(tab => {
            tab.isActive = tab.id === tabId;
            if (tab.isActive) {
              group.activeTabId = tabId;
            }
          });
        });
      });
    },

    updateTabContent: (tabId, content) => {
      set((state) => {
        state.groups.forEach(group => {
          const tab = group.tabs.find(t => t.id === tabId);
          if (tab) {
            tab.content = content;
            tab.isDirty = true;
          }
        });
      });
    },

    setTabReadOnly: (tabId, readOnly) => {
      set((state) => {
        state.groups.forEach(group => {
          const tab = group.tabs.find(t => t.id === tabId);
          if (tab) {
            tab.isReadOnly = readOnly;
          }
        });
      });
    },

    toggleLoading: () => {
      set((state) => {
        state.loading = !state.loading;
      });
    },

    updateWelcomePage: () => {
      set((state) => {
        const welcomeTab = state.groups
          .flatMap(g => g.tabs)
          .find(tab => tab.id === 'welcome-tab');
        
        if (welcomeTab) {
          welcomeTab.content = `# Welcome to Molecule 3.x - Updated!

## 🎉 Latest Updates
- **Version**: 3.0.0
- **New Features**: 3
- **Bug Fixes**: 12
- **Updated**: ${new Date().toLocaleString()}

## 🚀 What's New
1. **Enhanced Editor**: Better syntax highlighting
2. **Improved Performance**: 3x faster loading
3. **New Extensions**: More plugins available

## 🛠️ Quick Actions
- Press \`Ctrl+N\` to create a new file
- Press \`Ctrl+O\` to open a file
- Press \`Ctrl+S\` to save
- Press \`F11\` for fullscreen

Happy coding! 🎉`;
        }
      });
    },

    toggleDirection: () => {
      set((state) => {
        state.isFullscreen = !state.isFullscreen;
      });
    },

    addExecuteAction: (action) => {
      console.log('Execute action added:', action);
      // 这里可以添加执行动作的逻辑
    },

    updateExecuteAction: (actionId, action) => {
      console.log('Execute action updated:', actionId, action);
      // 这里可以更新执行动作的逻辑
    },

    setActiveGroup: (groupId) => {
      set((state) => {
        state.currentGroupId = groupId;
        state.groups.forEach(group => {
          group.tabs.forEach(tab => {
            tab.isActive = group.id === groupId && tab.id === group.activeTabId;
          });
        });
      });
    },

    createNewGroup: () => {
      const groupId = `group-${Date.now()}`;
      set((state) => {
        state.groups.push({
          id: groupId,
          tabs: [],
          activeTabId: undefined
        });
        state.currentGroupId = groupId;
      });
      return groupId;
    },

    moveTabToGroup: (tabId, targetGroupId) => {
      set((state) => {
        let sourceTab: EditorTab | undefined;
        let sourceGroupId: string | undefined;
        
        // 找到源标签
        for (const group of state.groups) {
          const tab = group.tabs.find(t => t.id === tabId);
          if (tab) {
            sourceTab = tab;
            sourceGroupId = group.id;
            break;
          }
        }
        
        if (sourceTab && sourceGroupId) {
          // 从源组移除
          const sourceGroup = state.groups.find(g => g.id === sourceGroupId);
          if (sourceGroup) {
            sourceGroup.tabs = sourceGroup.tabs.filter(t => t.id !== tabId);
            if (sourceGroup.activeTabId === tabId) {
              sourceGroup.activeTabId = sourceGroup.tabs.length > 0 ? sourceGroup.tabs[0].id : undefined;
            }
          }
          
          // 添加到目标组
          const targetGroup = state.groups.find(g => g.id === targetGroupId);
          if (targetGroup) {
            targetGroup.tabs.push(sourceTab);
            targetGroup.activeTabId = tabId;
          }
        }
      });
    }
  }))
);
