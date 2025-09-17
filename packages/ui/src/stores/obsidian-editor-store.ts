import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  EditorState, 
  Tab, 
  EditorPane, 
  TabAction, 
  DragState,
  EditorSettings,
  EditorLayout,
  PaneSplitter
} from '../types/obsidian-editor';
import { generateId, createDefaultTab, createDefaultPane, createDefaultSettings } from '../utils/obsidian-editor-utils';

interface EditorActions {
  // Tab 操作
  createTab: (options?: Partial<Tab>, paneId?: string) => string;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string, paneId?: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  moveTab: (tabId: string, fromPane: string, toPane: string, index?: number) => void;
  duplicateTab: (tabId: string) => string;
  lockTab: (tabId: string, locked: boolean) => void;
  
  // Pane 操作
  createPane: (options?: Partial<EditorPane>) => string;
  closePane: (paneId: string) => void;
  activatePane: (paneId: string) => void;
  splitPane: (paneId: string, direction: 'horizontal' | 'vertical') => string;
  splitPaneWithTab: (tabId: string, direction: 'horizontal' | 'vertical') => string;
  resizePane: (paneId: string, width: number, height: number) => void;
  
  // 布局操作
  createSplit: (paneAId: string, paneBId: string, direction: 'horizontal' | 'vertical') => string;
  removeSplit: (splitterId: string) => void;
  resizeSplit: (splitterId: string, position: number) => void;
  
  // 拖拽操作
  startDrag: (tabId: string, fromPane: string) => void;
  updateDrag: (dragOverPane?: string, position?: any) => void;
  endDrag: () => void;
  
  // 文件操作
  openFile: (filePath: string, content?: string) => string;
  saveFile: (tabId: string) => Promise<void>;
  saveAllFiles: () => Promise<void>;
  
  // 设置操作
  updateSettings: (settings: Partial<EditorSettings>) => void;
  
  // 会话操作
  saveSession: () => void;
  loadSession: () => void;
  clearSession: () => void;
  
  // 工具方法
  getActiveTab: () => Tab | undefined;
  getActivePane: () => EditorPane | undefined;
  getTabsByPane: (paneId: string) => Tab[];
  getPaneById: (paneId: string) => EditorPane | undefined;
  getTabById: (tabId: string) => Tab | undefined;
}

type EditorStore = EditorState & EditorActions;

const initialState: EditorState = {
  panes: {},
  tabs: {},
  layout: {
    type: 'single',
    panes: [],
    splitters: [],
    activePane: ''
  },
  recentFiles: [],
  settings: createDefaultSettings(),
  activePane: '',
  dragState: undefined
};

export const useObsidianEditorStore = create<EditorStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // Tab 操作
      createTab: (options = {}, paneId) => {
        const tabId = generateId();
        const tab = createDefaultTab({ id: tabId, ...options });
        
        set((state) => {
          state.tabs[tabId] = tab;
          
          // 确定要添加到哪个面板
          let targetPaneId = paneId || state.activePane;
          
          // 如果没有面板，创建一个默认面板
          if (!targetPaneId || !state.panes[targetPaneId]) {
            const newPaneId = generateId();
            const newPane = createDefaultPane({ id: newPaneId });
            state.panes[newPaneId] = newPane;
            state.layout.panes.push(newPane);
            state.activePane = newPaneId;
            targetPaneId = newPaneId;
          }
          
          // 添加标签页到面板
          state.panes[targetPaneId].tabs.push(tabId);
          state.panes[targetPaneId].activeTab = tabId;
        });
        
        return tabId;
      },

      closeTab: (tabId) => {
        set((state) => {
          const tab = state.tabs[tabId];
          if (!tab) return;
          
          // 找到包含此标签页的面板
          const paneId = Object.keys(state.panes).find(id => 
            state.panes[id].tabs.includes(tabId)
          );
          
          if (paneId) {
            const pane = state.panes[paneId];
            const tabIndex = pane.tabs.indexOf(tabId);
            
            // 从面板中移除标签页
            pane.tabs.splice(tabIndex, 1);
            
            // 如果关闭的是活动标签页，切换到其他标签页
            if (pane.activeTab === tabId) {
              if (pane.tabs.length > 0) {
                // 优先选择右边的标签页，如果没有则选择左边的
                const newActiveIndex = Math.min(tabIndex, pane.tabs.length - 1);
                pane.activeTab = pane.tabs[newActiveIndex];
              } else {
                pane.activeTab = '';
              }
            }
            
            // 如果面板没有标签页了，考虑关闭面板
            if (pane.tabs.length === 0 && Object.keys(state.panes).length > 1) {
              delete state.panes[paneId];
              state.layout.panes = state.layout.panes.filter(p => p.id !== paneId);
              
              // 如果关闭的是活动面板，切换到其他面板
              if (state.activePane === paneId) {
                const remainingPanes = Object.keys(state.panes);
                state.activePane = remainingPanes[0] || '';
              }
            }
          }
          
          // 删除标签页
          delete state.tabs[tabId];
          
          // 更新最近文件列表
          if (tab.filePath) {
            const recentIndex = state.recentFiles.indexOf(tab.filePath);
            if (recentIndex > -1) {
              state.recentFiles.splice(recentIndex, 1);
            }
            state.recentFiles.unshift(tab.filePath);
            state.recentFiles = state.recentFiles.slice(0, 10); // 保留最近10个文件
          }
        });
      },

      switchTab: (tabId, paneId) => {
        set((state) => {
          const targetPaneId = paneId || state.activePane;
          const pane = state.panes[targetPaneId];
          
          if (pane && pane.tabs.includes(tabId)) {
            pane.activeTab = tabId;
            state.activePane = targetPaneId;
          }
        });
      },

      updateTab: (tabId, updates) => {
        set((state) => {
          const tab = state.tabs[tabId];
          if (tab) {
            Object.assign(tab, updates);
            tab.modifiedAt = new Date();
            
            // 如果内容发生变化，标记为脏数据
            if ('content' in updates) {
              tab.isDirty = true;
            }
          }
        });
      },

      moveTab: (tabId, fromPane, toPane, index) => {
        set((state) => {
          const fromPaneObj = state.panes[fromPane];
          const toPaneObj = state.panes[toPane];
          
          if (!fromPaneObj || !toPaneObj) return;
          
          // 从源面板移除
          const tabIndex = fromPaneObj.tabs.indexOf(tabId);
          if (tabIndex > -1) {
            fromPaneObj.tabs.splice(tabIndex, 1);
            
            // 如果移除的是活动标签页，更新活动标签页
            if (fromPaneObj.activeTab === tabId) {
              fromPaneObj.activeTab = fromPaneObj.tabs[0] || '';
            }
          }
          
          // 添加到目标面板
          const insertIndex = index !== undefined ? index : toPaneObj.tabs.length;
          toPaneObj.tabs.splice(insertIndex, 0, tabId);
          toPaneObj.activeTab = tabId;
          
          // 激活目标面板
          state.activePane = toPane;
        });
      },

      duplicateTab: (tabId) => {
        const tab = get().tabs[tabId];
        if (!tab) return '';
        
        const newTabId = get().createTab({
          title: `${tab.title} (副本)`,
          content: tab.content,
          type: tab.type,
          language: tab.language
        });
        
        return newTabId;
      },

      lockTab: (tabId, locked) => {
        set((state) => {
          const tab = state.tabs[tabId];
          if (tab) {
            tab.isLocked = locked;
          }
        });
      },

      // Pane 操作
      createPane: (options = {}) => {
        const paneId = generateId();
        const pane = createDefaultPane({ id: paneId, ...options });
        
        set((state) => {
          state.panes[paneId] = pane;
          state.layout.panes.push(pane);
          
          if (!state.activePane) {
            state.activePane = paneId;
          }
        });
        
        return paneId;
      },

      closePane: (paneId) => {
        set((state) => {
          const pane = state.panes[paneId];
          if (!pane) return;
          
          // 关闭面板中的所有标签页
          pane.tabs.forEach(tabId => {
            delete state.tabs[tabId];
          });
          
          // 删除面板
          delete state.panes[paneId];
          state.layout.panes = state.layout.panes.filter(p => p.id !== paneId);
          
          // 如果关闭的是活动面板，切换到其他面板
          if (state.activePane === paneId) {
            const remainingPanes = Object.keys(state.panes);
            state.activePane = remainingPanes[0] || '';
          }
          
          // 清理相关的分割器
          state.layout.splitters = state.layout.splitters.filter(
            s => s.paneA !== paneId && s.paneB !== paneId
          );
        });
      },

      activatePane: (paneId) => {
        set((state) => {
          if (state.panes[paneId]) {
            state.activePane = paneId;
          }
        });
      },

      splitPane: (paneId, direction) => {
        const newPaneId = generateId();
        const newPane = createDefaultPane({ id: newPaneId });
        
        set((state) => {
          state.panes[newPaneId] = newPane;
          state.layout.panes.push(newPane);
          
          // 创建分割器
          const splitterId = generateId();
          const splitter: PaneSplitter = {
            id: splitterId,
            direction,
            position: 0.5,
            paneA: paneId,
            paneB: newPaneId
          };
          
          state.layout.splitters.push(splitter);
          state.layout.type = 'split';
          state.activePane = newPaneId;
        });
        
        return newPaneId;
      },

      // 分屏并移动标签页
      splitPaneWithTab: (tabId, direction) => {
        const state = get();
        const tab = state.tabs[tabId];
        if (!tab) return '';

        // 找到包含此标签页的面板
        const currentPaneId = Object.keys(state.panes).find(id => 
          state.panes[id].tabs.includes(tabId)
        );
        
        if (!currentPaneId) return '';

        // 创建新面板
        const newPaneId = get().splitPane(currentPaneId, direction);
        
        // 移动标签页到新面板
        get().moveTab(tabId, currentPaneId, newPaneId);
        
        return newPaneId;
      },

      resizePane: (paneId, width, height) => {
        set((state) => {
          const pane = state.panes[paneId];
          if (pane) {
            pane.position.width = width;
            pane.position.height = height;
          }
        });
      },

      // 布局操作
      createSplit: (paneAId, paneBId, direction) => {
        const splitterId = generateId();
        
        set((state) => {
          const splitter: PaneSplitter = {
            id: splitterId,
            direction,
            position: 0.5,
            paneA: paneAId,
            paneB: paneBId
          };
          
          state.layout.splitters.push(splitter);
          state.layout.type = 'split';
        });
        
        return splitterId;
      },

      removeSplit: (splitterId) => {
        set((state) => {
          state.layout.splitters = state.layout.splitters.filter(s => s.id !== splitterId);
          
          if (state.layout.splitters.length === 0) {
            state.layout.type = 'single';
          }
        });
      },

      resizeSplit: (splitterId, position) => {
        set((state) => {
          const splitter = state.layout.splitters.find(s => s.id === splitterId);
          if (splitter) {
            splitter.position = Math.max(0.1, Math.min(0.9, position));
          }
        });
      },

      // 拖拽操作
      startDrag: (tabId, fromPane) => {
        set((state) => {
          state.dragState = {
            draggedTab: tabId,
            draggedFrom: fromPane
          };
        });
      },

      updateDrag: (dragOverPane, position) => {
        set((state) => {
          if (state.dragState) {
            state.dragState.dragOverPane = dragOverPane;
            state.dragState.dragPosition = position;
          }
        });
      },

      endDrag: () => {
        set((state) => {
          state.dragState = undefined;
        });
      },

      // 文件操作
      openFile: (filePath, content = '') => {
        // 检查文件是否已经打开
        const existingTab = Object.values(get().tabs).find(tab => tab.filePath === filePath);
        if (existingTab) {
          get().switchTab(existingTab.id);
          return existingTab.id;
        }
        
        // 创建新标签页
        const fileName = filePath.split('/').pop() || 'Untitled';
        const tabId = get().createTab({
          title: fileName,
          filePath,
          content,
          type: 'file'
        });
        
        return tabId;
      },

      saveFile: async (tabId) => {
        const tab = get().tabs[tabId];
        if (!tab || !tab.filePath) return;
        
        try {
          // 这里应该调用实际的文件保存 API
          // await fileSystem.writeFile(tab.filePath, tab.content);
          
          set((state) => {
            const currentTab = state.tabs[tabId];
            if (currentTab) {
              currentTab.isDirty = false;
              currentTab.modifiedAt = new Date();
            }
          });
        } catch (error) {
          console.error('Failed to save file:', error);
          throw error;
        }
      },

      saveAllFiles: async () => {
        const dirtyTabs = Object.values(get().tabs).filter(tab => tab.isDirty);
        
        for (const tab of dirtyTabs) {
          try {
            await get().saveFile(tab.id);
          } catch (error) {
            console.error(`Failed to save file ${tab.filePath}:`, error);
          }
        }
      },

      // 设置操作
      updateSettings: (settings) => {
        set((state) => {
          Object.assign(state.settings, settings);
        });
      },

      // 会话操作
      saveSession: () => {
        const state = get();
        const sessionData = {
          tabs: state.tabs,
          panes: state.panes,
          layout: state.layout,
          activePane: state.activePane,
          recentFiles: state.recentFiles,
          settings: state.settings,
          timestamp: Date.now(),
          version: '1.0.0'
        };
        
        try {
          localStorage.setItem('obsidian-editor-session', JSON.stringify(sessionData));
        } catch (error) {
          console.error('Failed to save session:', error);
        }
      },

      loadSession: () => {
        try {
          const sessionData = localStorage.getItem('obsidian-editor-session');
          if (sessionData) {
            const parsed = JSON.parse(sessionData);
            
            set((state) => {
              state.tabs = parsed.tabs || {};
              state.panes = parsed.panes || {};
              state.layout = parsed.layout || state.layout;
              state.activePane = parsed.activePane || '';
              state.recentFiles = parsed.recentFiles || [];
              state.settings = { ...state.settings, ...parsed.settings };
            });
          }
        } catch (error) {
          console.error('Failed to load session:', error);
        }
      },

      clearSession: () => {
        try {
          localStorage.removeItem('obsidian-editor-session');
        } catch (error) {
          console.error('Failed to clear session:', error);
        }
      },

      // 工具方法
      getActiveTab: () => {
        const state = get();
        const activePane = state.panes[state.activePane];
        if (activePane && activePane.activeTab) {
          return state.tabs[activePane.activeTab];
        }
        return undefined;
      },

      getActivePane: () => {
        const state = get();
        return state.panes[state.activePane];
      },

      getTabsByPane: (paneId) => {
        const state = get();
        const pane = state.panes[paneId];
        if (!pane) return [];
        
        return pane.tabs.map(tabId => state.tabs[tabId]).filter(Boolean);
      },

      getPaneById: (paneId) => {
        return get().panes[paneId];
      },

      getTabById: (tabId) => {
        return get().tabs[tabId];
      }
    }))
  )
);

// 自动保存会话
if (typeof window !== 'undefined') {
  let saveTimeout: NodeJS.Timeout;
  
  useObsidianEditorStore.subscribe(
    (state) => ({ tabs: state.tabs, panes: state.panes, layout: state.layout }),
    (state) => {
      // 清除之前的定时器
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      
      // 延迟保存，避免频繁写入
      saveTimeout = setTimeout(() => {
        const saveSession = useObsidianEditorStore.getState().saveSession;
        saveSession();
      }, 2000);
    }
  );
}