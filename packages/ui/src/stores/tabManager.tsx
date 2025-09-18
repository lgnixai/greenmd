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

interface TabManagerActions {
  // Tab Group Management
  createTabGroup: (name: string, color: string, tabIds?: string[]) => string;
  updateTabGroup: (groupId: string, updates: Partial<TabGroup>) => void;
  deleteTabGroup: (groupId: string) => void;
  addTabToGroup: (tabId: string, groupId: string) => void;
  removeTabFromGroup: (tabId: string) => void;
  moveTabBetweenGroups: (tabId: string, fromGroupId: string, toGroupId: string) => void;
  
  // Tab Stack Management
  createTabStack: (panelId: string, tabIds?: string[]) => string;
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

export type TabManagerStore = TabManagerState & TabManagerActions;

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
      createTabGroup: (name: string, color: string, tabIds: string[] = []) => {
        const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        
        set((state) => {
          const newGroup: TabGroup = {
            id: groupId,
            name,
            color,
            tabs: tabIds,
            isCollapsed: false,
            isLocked: false,
            position: Object.keys(state.tabGroups).length,
          };
          state.tabGroups[groupId] = newGroup;
        });

        return groupId;
      },

      updateTabGroup: (groupId: string, updates: Partial<TabGroup>) => {
        set((state) => {
          if (state.tabGroups[groupId]) {
            Object.assign(state.tabGroups[groupId], updates);
          }
        });
      },

      deleteTabGroup: (groupId: string) => {
        set((state) => {
          delete state.tabGroups[groupId];
        });
      },

      addTabToGroup: (tabId: string, groupId: string) => {
        set((state) => {
          const group = state.tabGroups[groupId];
          if (group && !group.tabs.includes(tabId)) {
            group.tabs.push(tabId);
          }
        });
      },

      removeTabFromGroup: (tabId: string) => {
        set((state) => {
          Object.values(state.tabGroups).forEach(group => {
            const index = group.tabs.indexOf(tabId);
            if (index > -1) {
              group.tabs.splice(index, 1);
            }
          });
        });
      },

      moveTabBetweenGroups: (tabId: string, fromGroupId: string, toGroupId: string) => {
        set((state) => {
          const fromGroup = state.tabGroups[fromGroupId];
          const toGroup = state.tabGroups[toGroupId];

          if (fromGroup && toGroup) {
            // Remove from source group
            const index = fromGroup.tabs.indexOf(tabId);
            if (index > -1) {
              fromGroup.tabs.splice(index, 1);
            }
            
            // Add to target group if not already present
            if (!toGroup.tabs.includes(tabId)) {
              toGroup.tabs.push(tabId);
            }
          }
        });
      },

      // Tab Stack Management
      createTabStack: (panelId: string, tabIds: string[] = []) => {
        const stackId = `stack_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        
        set((state) => {
          const newStack: TabStack = {
            id: stackId,
            tabs: tabIds,
            activeTabIndex: 0,
            isStacked: true,
            panelId,
          };
          state.tabStacks[stackId] = newStack;
        });

        return stackId;
      },

      addTabToStack: (tabId: string, stackId: string) => {
        set((state) => {
          const stack = state.tabStacks[stackId];
          if (stack && !stack.tabs.includes(tabId)) {
            stack.tabs.push(tabId);
          }
        });
      },

      removeTabFromStack: (tabId: string, stackId: string) => {
        set((state) => {
          const stack = state.tabStacks[stackId];
          if (stack) {
            const index = stack.tabs.indexOf(tabId);
            if (index > -1) {
              stack.tabs.splice(index, 1);
              stack.activeTabIndex = Math.min(stack.activeTabIndex, Math.max(0, stack.tabs.length - 1));
            }
          }
        });
      },

      setStackActiveTab: (stackId: string, tabIndex: number) => {
        set((state) => {
          const stack = state.tabStacks[stackId];
          if (stack && tabIndex >= 0 && tabIndex < stack.tabs.length) {
            stack.activeTabIndex = tabIndex;
          }
        });
      },

      toggleStackMode: (stackId: string) => {
        set((state) => {
          const stack = state.tabStacks[stackId];
          if (stack) {
            stack.isStacked = !stack.isStacked;
          }
        });
      },

      // Workspace Layout Management
      saveWorkspaceLayout: (name: string, panelTree: any, description?: string) => {
        const layoutId = `layout_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        
        set((state) => {
          const newLayout: WorkspaceLayout = {
            id: layoutId,
            name,
            description,
            panelTree,
            tabGroups: { ...state.tabGroups },
            tabStacks: { ...state.tabStacks },
            createdAt: Date.now(),
          };
          state.workspaceLayouts[layoutId] = newLayout;
        });

        return layoutId;
      },

      loadWorkspaceLayout: (layoutId: string) => {
        const state = get();
        const layout = state.workspaceLayouts[layoutId];
        if (!layout) return null;

        set((state) => {
          state.tabGroups = { ...layout.tabGroups };
          state.tabStacks = { ...layout.tabStacks };
        });

        return layout;
      },

      deleteWorkspaceLayout: (layoutId: string) => {
        set((state) => {
          delete state.workspaceLayouts[layoutId];
        });
      },

      setDefaultLayout: (layoutId: string) => {
        set((state) => {
          Object.values(state.workspaceLayouts).forEach(layout => {
            layout.isDefault = layout.id === layoutId;
          });
        });
      },

      // Navigation Management
      addToHistory: (panelId: string, tabId: string) => {
        set((state) => {
          let history = state.navigationHistories[panelId];
          if (!history) {
            history = {
              panelId,
              history: [],
              currentIndex: -1,
              maxSize: 50,
            };
            state.navigationHistories[panelId] = history;
          }

          const existingIndex = history.history.indexOf(tabId);
          if (existingIndex > -1) {
            history.history.splice(existingIndex, 1);
          }
          
          history.history.push(tabId);
          
          if (history.history.length > history.maxSize) {
            history.history.shift();
          }

          history.currentIndex = history.history.length - 1;
        });
      },

      navigateBack: (panelId: string) => {
        const state = get();
        const history = state.navigationHistories[panelId];
        if (!history || history.currentIndex <= 0) return null;

        const newIndex = history.currentIndex - 1;
        const tabId = history.history[newIndex];

        set((state) => {
          if (state.navigationHistories[panelId]) {
            state.navigationHistories[panelId].currentIndex = newIndex;
          }
        });

        return tabId;
      },

      navigateForward: (panelId: string) => {
        const state = get();
        const history = state.navigationHistories[panelId];
        if (!history || history.currentIndex >= history.history.length - 1) return null;

        const newIndex = history.currentIndex + 1;
        const tabId = history.history[newIndex];

        set((state) => {
          if (state.navigationHistories[panelId]) {
            state.navigationHistories[panelId].currentIndex = newIndex;
          }
        });

        return tabId;
      },

      getRecentTabs: (panelId: string, limit: number = 10) => {
        const state = get();
        const history = state.navigationHistories[panelId];
        if (!history) return [];
        return history.history.slice(-limit).reverse();
      },

      // Settings Management
      updateSettings: (settings: Partial<TabManagerState['settings']>) => {
        set((state) => {
          Object.assign(state.settings, settings);
        });
      },

      // Utility Functions
      getTabsByGroup: (groupId: string) => {
        const state = get();
        const group = state.tabGroups[groupId];
        return group ? group.tabs.map(id => ({ id } as Tab)) : [];
      },

      getTabsByStack: (stackId: string) => {
        const state = get();
        const stack = state.tabStacks[stackId];
        return stack ? stack.tabs.map(id => ({ id } as Tab)) : [];
      },

      shouldStackTabs: (panelId: string, tabCount: number) => {
        const state = get();
        return state.settings.enableAutoStacking && 
               state.settings.stackingStrategy === 'overflow' && 
               tabCount > state.settings.maxVisibleTabs;
      },

      getGroupColors: () => {
        return DEFAULT_GROUP_COLORS;
      },
    })),
    {
      name: 'greenmd-tab-manager',
      version: 1,
    }
  )
);