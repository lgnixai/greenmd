import React, { useEffect, useCallback, useState } from 'react';
import { cn } from '../../lib/utils';
import { ObsidianEditorProps } from '../../types/obsidian-editor';
import { PaneContainer } from './pane-container';
import { useObsidianEditorStore } from '../../stores/obsidian-editor-store';
import { matchesShortcut } from '../../utils/obsidian-editor-utils';
import { SessionRecoveryDialog } from '../session-recovery-dialog';
import { PersistenceStatus } from '../persistence-status';
import { usePersistence } from '../../hooks/usePersistence';
import { ErrorBoundary, useErrorHandler } from '../error-boundary';
import { performanceMonitor, memoryManager } from '../../utils/performance-optimizer';
import { 
  useAccessibility,
  useGlobalKeyboardShortcuts,
  useHighContrastTheme,
  useTabAccessibility,
  useFileAccessibility
} from '../../hooks/useAccessibility';
import { 
  createAriaProps, 
  createSkipLink,
  generateAriaId, 
  KEYBOARD_SHORTCUTS,
  ARIA_ROLES 
} from '../../utils/accessibility-utils';
import '../../styles/high-contrast.css';

export const ObsidianEditor: React.FC<ObsidianEditorProps> = ({
  className,
  onFileChange,
  onTabClose,
  settings: initialSettings
}) => {
  const {
    panes,
    tabs,
    createTab,
    createPane,
    closeTab,
    switchTab,
    updateSettings,
    getActiveTab,
    settings
  } = useObsidianEditorStore();

  const { recoverSession } = usePersistence();
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const { reportError } = useErrorHandler();
  const [isInitialized, setIsInitialized] = useState(false);

  // Accessibility hooks
  const { announce, state: accessibilityState } = useAccessibility({
    enableScreenReader: true,
    enableKeyboardNavigation: true,
    enableHighContrast: true,
    announceChanges: true
  });

  const isHighContrast = useHighContrastTheme();
  const { announceTabSwitched, announceTabOpened, announceTabClosed } = useTabAccessibility();
  const { announceFileSaved } = useFileAccessibility();

  // Generate unique IDs for ARIA
  const editorId = generateAriaId('obsidian-editor');
  const mainContentId = generateAriaId('main-content');
  const skipLinkId = generateAriaId('skip-link');

  // 初始化编辑器和会话恢复
  useEffect(() => {
    const initializeEditor = async () => {
      try {
        performanceMonitor.startMeasure('editor-initialization');
        
        // 启动性能监控
        performanceMonitor.observeLongTasks();
        performanceMonitor.observeLayoutShifts();
        
        // 尝试恢复会话
        const result = await recoverSession();
        
        if (result.recovered) {
          console.log('Session recovered successfully');
          if (result.warnings.length > 0) {
            setShowRecoveryDialog(true);
          }
        } else {
          // 如果恢复失败或没有会话，创建默认状态
          if (Object.keys(panes).length === 0) {
            const paneId = createPane();
            createTab({
              title: 'Welcome',
              content: '# 欢迎使用 Obsidian 风格编辑器\n\n开始您的编码之旅！',
              type: 'welcome'
            }, paneId);
          }
          
          if (result.errors.length > 0) {
            setShowRecoveryDialog(true);
          }
        }
        
        // 应用初始设置
        if (initialSettings) {
          updateSettings(initialSettings);
        }
        
        performanceMonitor.endMeasure('editor-initialization');
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize editor:', error);
        reportError(error as Error, 'editor-initialization');
        
        // 创建默认状态作为后备
        const paneId = createPane();
        createTab({
          title: 'Welcome',
          content: '# 欢迎使用 Obsidian 风格编辑器\n\n开始您的编码之旅！',
          type: 'welcome'
        }, paneId);
        
        if (initialSettings) {
          updateSettings(initialSettings);
        }
        
        performanceMonitor.endMeasure('editor-initialization');
        
        setIsInitialized(true);
        setShowRecoveryDialog(true);
      }
    };

    initializeEditor();
    
    // Cleanup function
    return () => {
      performanceMonitor.disconnect();
      memoryManager.clearCache();
    };
  }, []);

  // 监听文件内容变化
  useEffect(() => {
    const activeTab = getActiveTab();
    if (activeTab && activeTab.filePath && onFileChange) {
      onFileChange(activeTab.filePath, activeTab.content);
    }
    
    // Monitor memory usage
    const cacheStats = memoryManager.getCacheStats();
    if (cacheStats.utilization > 80) {
      console.warn('Memory cache utilization high:', cacheStats);
      // Force garbage collection if available
      memoryManager.forceGarbageCollection();
    }
  }, [tabs, getActiveTab, onFileChange]);

  // 监听标签页关闭
  useEffect(() => {
    // 这里可以添加标签页关闭的监听逻辑
    if (onTabClose) {
      // 实现标签页关闭回调
    }
  }, [onTabClose]);

  // 全局点击处理（关闭所有下拉菜单）
  useEffect(() => {
    const handleGlobalClick = () => {
      // 触发全局事件来关闭所有下拉菜单
      window.dispatchEvent(new CustomEvent('closeAllDropdowns'));
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  // 全局键盘快捷键处理
  const keyboardShortcuts = useCallback(() => ({
    'ctrl+t': () => {
      const activePaneId = Object.keys(panes)[0];
      if (activePaneId) {
        const tabId = createTab({
          title: 'Untitled',
          content: '',
          type: 'file'
        }, activePaneId);
        switchTab(tabId);
        announceTabOpened('Untitled');
      }
    },
    'ctrl+w': () => {
      const activeTab = getActiveTab();
      if (activeTab && !activeTab.isLocked) {
        announceTabClosed(activeTab.title);
        closeTab(activeTab.id);
      }
    },
    'ctrl+tab': () => {
      const tabList = Object.values(tabs);
      const activeTab = getActiveTab();
      if (activeTab && tabList.length > 1) {
        const currentIndex = tabList.findIndex(tab => tab.id === activeTab.id);
        const nextIndex = (currentIndex + 1) % tabList.length;
        const nextTab = tabList[nextIndex];
        switchTab(nextTab.id);
        announceTabSwitched(nextTab.title);
      }
    },
    'ctrl+shift+tab': () => {
      const tabList = Object.values(tabs);
      const activeTab = getActiveTab();
      if (activeTab && tabList.length > 1) {
        const currentIndex = tabList.findIndex(tab => tab.id === activeTab.id);
        const prevIndex = (currentIndex - 1 + tabList.length) % tabList.length;
        const prevTab = tabList[prevIndex];
        switchTab(prevTab.id);
        announceTabSwitched(prevTab.title);
      }
    },
    'ctrl+s': () => {
      const activeTab = getActiveTab();
      if (activeTab && activeTab.filePath && onFileChange) {
        onFileChange(activeTab.filePath, activeTab.content);
        announceFileSaved(activeTab.title);
      }
    },
    'ctrl+n': () => {
      const activePaneId = Object.keys(panes)[0];
      if (activePaneId) {
        const tabId = createTab({
          title: 'Untitled',
          content: '',
          type: 'file'
        }, activePaneId);
        switchTab(tabId);
        announceTabOpened('Untitled');
      }
    },
    // 数字键快捷键
    'ctrl+1': () => switchToTabByIndex(0),
    'ctrl+2': () => switchToTabByIndex(1),
    'ctrl+3': () => switchToTabByIndex(2),
    'ctrl+4': () => switchToTabByIndex(3),
    'ctrl+5': () => switchToTabByIndex(4),
    'ctrl+6': () => switchToTabByIndex(5),
    'ctrl+7': () => switchToTabByIndex(6),
    'ctrl+8': () => switchToTabByIndex(7),
    'ctrl+9': () => switchToTabByIndex(8)
  }), [panes, tabs, createTab, closeTab, switchTab, getActiveTab, onFileChange, announceTabOpened, announceTabClosed, announceTabSwitched, announceFileSaved]);

  const switchToTabByIndex = useCallback((index: number) => {
    const tabList = Object.values(tabs);
    if (tabList[index]) {
      switchTab(tabList[index].id);
      announceTabSwitched(tabList[index].title);
    }
  }, [tabs, switchTab, announceTabSwitched]);

  // 使用全局键盘快捷键 Hook
  useGlobalKeyboardShortcuts(keyboardShortcuts(), true);

  // 添加跳过链接到页面顶部
  useEffect(() => {
    const skipLink = createSkipLink(mainContentId, '跳转到主要内容');
    skipLink.id = skipLinkId;
    document.body.insertBefore(skipLink, document.body.firstChild);

    return () => {
      const existingSkipLink = document.getElementById(skipLinkId);
      if (existingSkipLink) {
        document.body.removeChild(existingSkipLink);
      }
    };
  }, [mainContentId, skipLinkId]);



  const handleRecoveryComplete = (recovered: boolean) => {
    setShowRecoveryDialog(false);
    console.log(`Session recovery completed: ${recovered ? 'success' : 'failed'}`);
  };

  // 显示加载状态直到初始化完成
  if (!isInitialized) {
    return (
      <div 
        className={cn(
          "obsidian-editor w-full h-full bg-background text-foreground flex items-center justify-center",
          className
        )}
        {...createAriaProps({
          role: ARIA_ROLES.APPLICATION,
          label: 'Obsidian 风格编辑器',
          live: 'polite'
        })}
      >
        <div className="flex items-center space-x-2">
          <div 
            className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin loading-spinner" 
            aria-hidden="true"
          />
          <span className="text-sm text-gray-600">正在初始化编辑器...</span>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        reportError(error, 'obsidian-editor');
        console.error('ObsidianEditor Error:', error, errorInfo);
      }}
      resetKeys={[Object.keys(panes).length, Object.keys(tabs).length]}
      resetOnPropsChange={true}
    >
      <div 
        id={editorId}
        className={cn(
          "obsidian-editor w-full h-full bg-background text-foreground overflow-hidden relative",
          className,
          isHighContrast && "high-contrast"
        )}
        data-theme={settings.theme}
        {...createAriaProps({
          role: ARIA_ROLES.APPLICATION,
          label: 'Obsidian 风格编辑器'
        })}
      >
        {/* 主要内容区域 */}
        <main 
          id={mainContentId}
          className="w-full h-full"
          {...createAriaProps({
            role: ARIA_ROLES.MAIN,
            label: '编辑器主要内容'
          })}
        >
          <PaneContainer />
        </main>
        
        {/* 持久化状态指示器 */}
        <div 
          className="absolute bottom-2 right-2 z-10"
          {...createAriaProps({
            role: ARIA_ROLES.REGION,
            label: '状态信息'
          })}
        >
          <PersistenceStatus className="bg-white/90 backdrop-blur-sm rounded px-2 py-1 shadow-sm border" />
        </div>

        {/* 会话恢复对话框 */}
        <SessionRecoveryDialog
          isOpen={showRecoveryDialog}
          onClose={() => setShowRecoveryDialog(false)}
          onRecoveryComplete={handleRecoveryComplete}
        />

        {/* 屏幕阅读器实时区域 */}
        <div 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
          id={`${editorId}-announcements`}
        />

        {/* 键盘快捷键帮助（隐藏，仅供屏幕阅读器） */}
        <div className="sr-only">
          <h2>键盘快捷键</h2>
          <ul>
            <li>{KEYBOARD_SHORTCUTS.NEW_TAB.keys}: {KEYBOARD_SHORTCUTS.NEW_TAB.description}</li>
            <li>{KEYBOARD_SHORTCUTS.CLOSE_TAB.keys}: {KEYBOARD_SHORTCUTS.CLOSE_TAB.description}</li>
            <li>{KEYBOARD_SHORTCUTS.NEXT_TAB.keys}: {KEYBOARD_SHORTCUTS.NEXT_TAB.description}</li>
            <li>{KEYBOARD_SHORTCUTS.PREV_TAB.keys}: {KEYBOARD_SHORTCUTS.PREV_TAB.description}</li>
            <li>{KEYBOARD_SHORTCUTS.SAVE_FILE.keys}: {KEYBOARD_SHORTCUTS.SAVE_FILE.description}</li>
            <li>方向键: 在标签页之间导航</li>
            <li>Enter/Space: 激活选中的标签页</li>
            <li>Delete/Backspace: 关闭当前标签页</li>
          </ul>
        </div>
      </div>
    </ErrorBoundary>
  );
};

// 导出所有相关组件
export * from './tab';
export * from './tab-bar';
export * from './file-editor';
export * from './editor-pane';
export * from './quick-actions';
export * from './pane-container';
export * from './pane-splitter';

// 导出持久化相关组件
export { PersistenceStatus, SimplePersistenceStatus, DetailedPersistenceStatus, PersistenceControlPanel } from '../persistence-status';
export { SessionRecoveryDialog, AutoSaveRecoveryPrompt } from '../session-recovery-dialog';

// 默认导出
export default ObsidianEditor;