import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

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
  panelTree: any; // PanelNode from ObsidianLayout
  tabGroups: Record<string, TabGroup>;
  tabStacks: Record<string, TabStack>;
  createdAt: number;
  isDefault?: boolean;
}

interface NavigationHistory {
  panelId: string;
  history: string[]; // tab IDs
  currentIndex: number;
  maxSize: number;
}

interface TabManagerState {
  tabGroups: Record<string, TabGroup>;
  tabStacks: Record<string, TabStack>;
  workspaceLayouts: Record<string, WorkspaceLayout>;
  navigationHistories: Record<string, NavigationHistory>;
  shortcuts: Record<string, string>;
  settings: {
    maxVisibleTabs: number;
    enableAutoStacking: boolean;
    stackingStrategy: 'overflow' | 'group' | 'manual';
    enableTabGroups: boolean;
    showTabPreview: boolean;
  };
}

interface TabManagerStore extends TabManagerState {
  // Tab Group Management
  createTabGroup: (name: string, color: string, tabIds: string[]) => string;
  updateTabGroup: (groupId: string, updates: Partial<TabGroup>) => void;
  deleteTabGroup: (groupId: string) => void;
  addTabToGroup: (tabId: string, groupId: string) => void;
  removeTabFromGroup: (tabId: string) => void;
  moveTabBetweenGroups: (tabId: string, fromGroupId: string, toGroupId: string) => void;
  
  // Tab Stack Management
  createTabStack: (panelId: string, tabIds: string[]) => string;
  addTabToStack: (tabId: string, stackId: string) => void;
  removeTabFromStack: (tabId: string, stackId: string) => void;
  setStackActiveTab: (stackId: string, tabIndex: number) => void;
  toggleStackMode: (stackId: string) => void;
  
  // Workspace Layout Management
  saveWorkspaceLayout: (name: string, panelTree: any, description?: string) => string;
  loadWorkspaceLayout: (layoutId: string) => WorkspaceLayout | null;
  deleteWorkspaceLayout: (layoutId: string) => void;
  setDefaultLayout: (layoutId: string) => void;
  
  // Navigation Management
  addToHistory: (panelId: string, tabId: string) => void;
  navigateBack: (panelId: string) => string | null;
  navigateForward: (panelId: string) => string | null;
  getRecentTabs: (panelId: string, limit?: number) => string[];
  
  // Settings Management
  updateSettings: (settings: Partial<TabManagerState['settings']>) => void;
  
  // Utility Functions
  getTabsByGroup: (groupId: string) => Tab[];
  getTabsByStack: (stackId: string) => Tab[];
  shouldStackTabs: (panelId: string, tabCount: number) => boolean;
  getGroupColors: () => string[];
}

 

const DEFAULT_SETTINGS: TabManagerState['settings'] = {
  maxVisibleTabs: 8,
  enableAutoStacking: true,
  stackingStrategy: 'overflow',
  enableTabGroups: true,
  showTabPreview: true,
};

const DEFAULT_GROUP_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
];

export const useTabManager = create<TabManagerStore>()(
  persist(
    immer((set, get) => ({
      tabGroups: {},
      tabStacks: {},
      workspaceLayouts: {},
      navigationHistories: {},
      shortcuts: {},
      settings: DEFAULT_SETTINGS,

      // Tab Group Management
      createTabGroup: (name, color, tabIds = []) => {
        const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const newGroup: TabGroup = {
          id: groupId,
          name,
          color,
          tabs: tabIds,
          isCollapsed: false,
          isLocked: false,
          position: Object.keys(get().tabGroups).length,
        };
        set((state) => {
          state.tabGroups[groupId] = newGroup;
        });
        return groupId;
      },

      updateTabGroup: (groupId, updates) => {
        set((state) => {
          const group = state.tabGroups[groupId];
          if (!group) return;
          Object.assign(group, updates);
        });
      },

      deleteTabGroup: (groupId) => {
        set((state) => {
          delete state.tabGroups[groupId];
        });
      },

      addTabToGroup: (tabId, groupId) => {
        set((state) => {
          const group = state.tabGroups[groupId];
          if (!group) return;
          if (!group.tabs.includes(tabId)) group.tabs.push(tabId);
        });
      },

      removeTabFromGroup: (tabId) => {
        set((state) => {
          Object.values(state.tabGroups).forEach((group) => {
            group.tabs = group.tabs.filter((id) => id !== tabId);
          });
        });
      },

      moveTabBetweenGroups: (tabId, fromGroupId, toGroupId) => {
        set((state) => {
          const fromGroup = state.tabGroups[fromGroupId];
          const toGroup = state.tabGroups[toGroupId];
          if (!fromGroup || !toGroup) return;
          fromGroup.tabs = fromGroup.tabs.filter((id) => id !== tabId);
          if (!toGroup.tabs.includes(tabId)) toGroup.tabs.push(tabId);
        });
      },

      // Tab Stack Management
      createTabStack: (panelId, tabIds = []) => {
        const stackId = `stack_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const newStack: TabStack = {
          id: stackId,
          tabs: tabIds,
          activeTabIndex: 0,
          isStacked: true,
          panelId,
        };
        set((state) => {
          state.tabStacks[stackId] = newStack;
        });
        return stackId;
      },

      addTabToStack: (tabId, stackId) => {
        set((state) => {
          const stack = state.tabStacks[stackId];
          if (!stack) return;
          if (!stack.tabs.includes(tabId)) stack.tabs.push(tabId);
        });
      },

      removeTabFromStack: (tabId, stackId) => {
        set((state) => {
          const stack = state.tabStacks[stackId];
          if (!stack) return;
          const newTabs = stack.tabs.filter((id) => id !== tabId);
          stack.tabs = newTabs;
          stack.activeTabIndex = Math.min(stack.activeTabIndex, Math.max(0, newTabs.length - 1));
        });
      },

      setStackActiveTab: (stackId, tabIndex) => {
        set((state) => {
          const stack = state.tabStacks[stackId];
          if (!stack) return;
          if (tabIndex < 0 || tabIndex >= stack.tabs.length) return;
          stack.activeTabIndex = tabIndex;
        });
      },

      toggleStackMode: (stackId) => {
        set((state) => {
          const stack = state.tabStacks[stackId];
          if (!stack) return;
          stack.isStacked = !stack.isStacked;
        });
      },

      // Workspace Layout Management
      saveWorkspaceLayout: (name, panelTree, description) => {
        const layoutId = `layout_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        set((state) => {
          state.workspaceLayouts[layoutId] = {
            id: layoutId,
            name,
            description,
            panelTree,
            tabGroups: { ...state.tabGroups },
            tabStacks: { ...state.tabStacks },
            createdAt: Date.now(),
          };
        });
        return layoutId;
      },

      loadWorkspaceLayout: (layoutId) => {
        const layout = get().workspaceLayouts[layoutId];
        if (!layout) return null;
        set((state) => {
          state.tabGroups = { ...layout.tabGroups };
          state.tabStacks = { ...layout.tabStacks };
        });
        return layout;
      },

      deleteWorkspaceLayout: (layoutId) => {
        set((state) => {
          delete state.workspaceLayouts[layoutId];
        });
      },

      setDefaultLayout: (layoutId) => {
        set((state) => {
          Object.values(state.workspaceLayouts).forEach((layout) => {
            layout.isDefault = layout.id === layoutId;
          });
        });
      },

      // Navigation Management
      addToHistory: (panelId, tabId) => {
        set((state) => {
          const existing = state.navigationHistories[panelId] || {
            panelId,
            history: [],
            currentIndex: -1,
            maxSize: 50,
          };
          const newHistory = [...existing.history];
          const existingIndex = newHistory.indexOf(tabId);
          if (existingIndex > -1) newHistory.splice(existingIndex, 1);
          newHistory.push(tabId);
          if (newHistory.length > existing.maxSize) newHistory.shift();
          state.navigationHistories[panelId] = {
            ...existing,
            history: newHistory,
            currentIndex: newHistory.length - 1,
          };
        });
      },

      navigateBack: (panelId) => {
        const history = get().navigationHistories[panelId];
        if (!history || history.currentIndex <= 0) return null;
        const newIndex = history.currentIndex - 1;
        const tabId = history.history[newIndex];
        set((state) => {
          const h = state.navigationHistories[panelId];
          if (!h) return;
          h.currentIndex = newIndex;
        });
        return tabId;
      },

      navigateForward: (panelId) => {
        const history = get().navigationHistories[panelId];
        if (!history || history.currentIndex >= history.history.length - 1) return null;
        const newIndex = history.currentIndex + 1;
        const tabId = history.history[newIndex];
        set((state) => {
          const h = state.navigationHistories[panelId];
          if (!h) return;
          h.currentIndex = newIndex;
        });
        return tabId;
      },

      getRecentTabs: (panelId, limit = 10) => {
        const history = get().navigationHistories[panelId];
        if (!history) return [];
        return history.history.slice(-limit).reverse();
      },

      // Settings Management
      updateSettings: (settings) => {
        set((state) => {
          state.settings = { ...state.settings, ...settings };
        });
      },

      // Utility Functions
      getTabsByGroup: (groupId) => {
        const group = get().tabGroups[groupId];
        return group ? group.tabs.map((id) => ({ id } as Tab)) : [];
      },

      getTabsByStack: (stackId) => {
        const stack = get().tabStacks[stackId];
        return stack ? stack.tabs.map((id) => ({ id } as Tab)) : [];
      },

      shouldStackTabs: (panelId, tabCount) => {
        const { settings } = get();
        return settings.enableAutoStacking && settings.stackingStrategy === 'overflow' && tabCount > settings.maxVisibleTabs;
      },

      getGroupColors: () => DEFAULT_GROUP_COLORS,
    })),
    {
      name: 'obsidian.clone.tabManager',
      partialize: (state) => ({
        tabGroups: state.tabGroups,
        tabStacks: state.tabStacks,
        workspaceLayouts: state.workspaceLayouts,
        navigationHistories: state.navigationHistories,
        settings: state.settings,
      }),
    }
  )
);