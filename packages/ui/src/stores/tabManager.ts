import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Tab {
  id: string;
  title: string;
  isActive: boolean;
  isDirty?: boolean;
  isLocked?: boolean;
  filePath?: string;
  documentId?: string;
  groupId?: string;
  color?: string;
  stackId?: string;
  lastActivated?: number;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  tabs: string[]; // tab IDs
  isCollapsed: boolean;
  isLocked: boolean;
  position: number;
}

export interface TabStack {
  id: string;
  tabs: string[]; // tab IDs
  activeTabIndex: number;
  isStacked: boolean;
  stackTitle?: string;
  panelId: string;
}

export interface WorkspaceLayout {
  id: string;
  name: string;
  description?: string;
  panelTree: any;
  tabGroups: Record<string, TabGroup>;
  tabStacks: Record<string, TabStack>;
  isDefault: boolean;
  createdAt: number;
}

interface TabManagerSettings {
  maxVisibleTabs: number;
  autoStackThreshold: number;
  enableTabGroups: boolean;
  enableTabStacking: boolean;
}

interface TabManagerState {
  // Settings
  settings: TabManagerSettings;
  
  // Tab Groups
  tabGroups: Record<string, TabGroup>;
  
  // Tab Stacks
  tabStacks: Record<string, TabStack>;
  
  // Navigation History
  navigationHistory: Record<string, { stack: string[]; index: number }>;
  
  // Workspace Layouts
  workspaceLayouts: Record<string, WorkspaceLayout>;
  
  // Actions
  createTabGroup: (name: string, color: string, tabs: string[]) => string;
  updateTabGroup: (id: string, updates: Partial<TabGroup>) => void;
  deleteTabGroup: (id: string) => void;
  addTabToGroup: (tabId: string, groupId: string) => void;
  removeTabFromGroup: (tabId: string) => void;
  getGroupColors: () => string[];
  
  // Tab Stacking
  createTabStack: (panelId: string, tabIds: string[]) => string;
  addToTabStack: (tabId: string, stackId: string) => void;
  removeTabFromStack: (tabId: string, stackId: string) => void;
  setStackActiveTab: (stackId: string, index: number) => void;
  toggleStackMode: (stackId: string) => void;
  shouldStackTabs: (panelId: string, tabCount: number) => boolean;
  
  // Navigation History
  addToHistory: (panelId: string, tabId: string) => void;
  navigateBack: (panelId: string) => string | null;
  navigateForward: (panelId: string) => string | null;
  getRecentTabs: (panelId: string, limit?: number) => string[];
  
  // Workspace Management
  saveWorkspaceLayout: (name: string, panelTree: any, description?: string) => string;
  loadWorkspaceLayout: (id: string) => WorkspaceLayout | null;
  deleteWorkspaceLayout: (id: string) => void;
  setDefaultLayout: (id: string) => void;
}

const defaultSettings: TabManagerSettings = {
  maxVisibleTabs: 8,
  autoStackThreshold: 12,
  enableTabGroups: true,
  enableTabStacking: true,
};

const defaultColors = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export const useTabManager = create<TabManagerState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      tabGroups: {},
      tabStacks: {},
      navigationHistory: {},
      workspaceLayouts: {},

      // Tab Groups
      createTabGroup: (name: string, color: string, tabs: string[]) => {
        const id = Date.now().toString();
        const group: TabGroup = {
          id,
          name,
          color,
          tabs,
          isCollapsed: false,
          isLocked: false,
          position: Object.keys(get().tabGroups).length,
        };

        set((state) => ({
          tabGroups: {
            ...state.tabGroups,
            [id]: group,
          },
        }));

        return id;
      },

      updateTabGroup: (id: string, updates: Partial<TabGroup>) => {
        set((state) => ({
          tabGroups: {
            ...state.tabGroups,
            [id]: {
              ...state.tabGroups[id],
              ...updates,
            },
          },
        }));
      },

      deleteTabGroup: (id: string) => {
        set((state) => {
          const { [id]: _, ...rest } = state.tabGroups;
          return { tabGroups: rest };
        });
      },

      addTabToGroup: (tabId: string, groupId: string) => {
        set((state) => {
          const group = state.tabGroups[groupId];
          if (!group) return state;

          return {
            tabGroups: {
              ...state.tabGroups,
              [groupId]: {
                ...group,
                tabs: [...group.tabs, tabId],
              },
            },
          };
        });
      },

      removeTabFromGroup: (tabId: string) => {
        set((state) => {
          const updatedGroups = { ...state.tabGroups };
          Object.keys(updatedGroups).forEach((groupId) => {
            updatedGroups[groupId] = {
              ...updatedGroups[groupId],
              tabs: updatedGroups[groupId].tabs.filter((id) => id !== tabId),
            };
          });
          return { tabGroups: updatedGroups };
        });
      },

      getGroupColors: () => defaultColors,

      // Tab Stacking
      createTabStack: (panelId: string, tabIds: string[]) => {
        const id = Date.now().toString();
        const stack: TabStack = {
          id,
          tabs: tabIds,
          activeTabIndex: 0,
          isStacked: true,
          panelId,
        };

        set((state) => ({
          tabStacks: {
            ...state.tabStacks,
            [id]: stack,
          },
        }));

        return id;
      },

      addToTabStack: (tabId: string, stackId: string) => {
        set((state) => {
          const stack = state.tabStacks[stackId];
          if (!stack) return state;

          return {
            tabStacks: {
              ...state.tabStacks,
              [stackId]: {
                ...stack,
                tabs: [...stack.tabs, tabId],
              },
            },
          };
        });
      },

      removeTabFromStack: (tabId: string, stackId: string) => {
        set((state) => {
          const stack = state.tabStacks[stackId];
          if (!stack) return state;

          const newTabs = stack.tabs.filter((id) => id !== tabId);
          const newActiveIndex = Math.min(stack.activeTabIndex, newTabs.length - 1);

          return {
            tabStacks: {
              ...state.tabStacks,
              [stackId]: {
                ...stack,
                tabs: newTabs,
                activeTabIndex: Math.max(0, newActiveIndex),
              },
            },
          };
        });
      },

      setStackActiveTab: (stackId: string, index: number) => {
        set((state) => {
          const stack = state.tabStacks[stackId];
          if (!stack) return state;

          return {
            tabStacks: {
              ...state.tabStacks,
              [stackId]: {
                ...stack,
                activeTabIndex: Math.max(0, Math.min(index, stack.tabs.length - 1)),
              },
            },
          };
        });
      },

      toggleStackMode: (stackId: string) => {
        set((state) => {
          const stack = state.tabStacks[stackId];
          if (!stack) return state;

          return {
            tabStacks: {
              ...state.tabStacks,
              [stackId]: {
                ...stack,
                isStacked: !stack.isStacked,
              },
            },
          };
        });
      },

      shouldStackTabs: (panelId: string, tabCount: number) => {
        const { settings } = get();
        return settings.enableTabStacking && tabCount > settings.autoStackThreshold;
      },

      // Navigation History
      addToHistory: (panelId: string, tabId: string) => {
        set((state) => {
          const history = state.navigationHistory[panelId] || { stack: [], index: -1 };
          const newStack = history.stack.slice(0, history.index + 1);
          
          if (newStack[newStack.length - 1] !== tabId) {
            newStack.push(tabId);
          }

          return {
            navigationHistory: {
              ...state.navigationHistory,
              [panelId]: {
                stack: newStack,
                index: newStack.length - 1,
              },
            },
          };
        });
      },

      navigateBack: (panelId: string) => {
        const { navigationHistory } = get();
        const history = navigationHistory[panelId];
        
        if (!history || history.index <= 0) return null;
        
        const newIndex = history.index - 1;
        const tabId = history.stack[newIndex];
        
        set((state) => ({
          navigationHistory: {
            ...state.navigationHistory,
            [panelId]: {
              ...history,
              index: newIndex,
            },
          },
        }));
        
        return tabId;
      },

      navigateForward: (panelId: string) => {
        const { navigationHistory } = get();
        const history = navigationHistory[panelId];
        
        if (!history || history.index >= history.stack.length - 1) return null;
        
        const newIndex = history.index + 1;
        const tabId = history.stack[newIndex];
        
        set((state) => ({
          navigationHistory: {
            ...state.navigationHistory,
            [panelId]: {
              ...history,
              index: newIndex,
            },
          },
        }));
        
        return tabId;
      },

      getRecentTabs: (panelId: string, limit = 10) => {
        const { navigationHistory } = get();
        const history = navigationHistory[panelId];
        
        if (!history) return [];
        
        return history.stack.slice(-limit).reverse();
      },

      // Workspace Management
      saveWorkspaceLayout: (name: string, panelTree: any, description = '') => {
        const id = Date.now().toString();
        const layout: WorkspaceLayout = {
          id,
          name,
          description,
          panelTree,
          tabGroups: get().tabGroups,
          tabStacks: get().tabStacks,
          isDefault: false,
          createdAt: Date.now(),
        };

        set((state) => ({
          workspaceLayouts: {
            ...state.workspaceLayouts,
            [id]: layout,
          },
        }));

        return id;
      },

      loadWorkspaceLayout: (id: string) => {
        return get().workspaceLayouts[id] || null;
      },

      deleteWorkspaceLayout: (id: string) => {
        set((state) => {
          const { [id]: _, ...rest } = state.workspaceLayouts;
          return { workspaceLayouts: rest };
        });
      },

      setDefaultLayout: (id: string) => {
        set((state) => {
          const updatedLayouts = { ...state.workspaceLayouts };
          Object.keys(updatedLayouts).forEach((layoutId) => {
            updatedLayouts[layoutId] = {
              ...updatedLayouts[layoutId],
              isDefault: layoutId === id,
            };
          });
          return { workspaceLayouts: updatedLayouts };
        });
      },
    }),
    {
      name: 'tab-manager-storage',
    }
  )
);
