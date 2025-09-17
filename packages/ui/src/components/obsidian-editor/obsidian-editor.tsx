import React, { useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { ObsidianEditorProps } from '../../types/obsidian-editor';
import { PaneContainer } from './pane-container';
import { useObsidianEditorStore } from '../../stores/obsidian-editor-store';
import { matchesShortcut } from '../../utils/obsidian-editor-utils';

export const ObsidianEditor: React.FC<ObsidianEditorProps> = ({
  className,
  initialFiles = [],
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
    saveSession,
    loadSession,
    getActiveTab,
    settings
  } = useObsidianEditorStore();

  // 初始化编辑器
  useEffect(() => {
    // 直接创建默认面板和标签页
    const paneId = createPane();
    
    // 创建一个欢迎标签页
    createTab({
      title: 'Welcome',
      content: '# 欢迎使用 Obsidian 风格编辑器\n\n开始您的编码之旅！',
      type: 'welcome'
    }, paneId);

    // 应用初始设置
    if (initialSettings) {
      updateSettings(initialSettings);
    }
  }, []);

  // 监听文件内容变化
  useEffect(() => {
    const activeTab = getActiveTab();
    if (activeTab && activeTab.filePath && onFileChange) {
      onFileChange(activeTab.filePath, activeTab.content);
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
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 创建新标签页
    if (matchesShortcut(e, 'ctrl+t')) {
      e.preventDefault();
      const activePaneId = Object.keys(panes)[0]; // 简化：使用第一个面板
      if (activePaneId) {
        const tabId = createTab({
          title: 'Untitled',
          content: '',
          type: 'file'
        }, activePaneId);
        switchTab(tabId);
      }
      return;
    }

    // 关闭当前标签页
    if (matchesShortcut(e, 'ctrl+w')) {
      e.preventDefault();
      const activeTab = getActiveTab();
      if (activeTab && !activeTab.isLocked) {
        closeTab(activeTab.id);
      }
      return;
    }

    // 切换标签页
    if (matchesShortcut(e, 'ctrl+tab')) {
      e.preventDefault();
      const tabList = Object.values(tabs);
      const activeTab = getActiveTab();
      if (activeTab && tabList.length > 1) {
        const currentIndex = tabList.findIndex(tab => tab.id === activeTab.id);
        const nextIndex = e.shiftKey 
          ? (currentIndex - 1 + tabList.length) % tabList.length
          : (currentIndex + 1) % tabList.length;
        switchTab(tabList[nextIndex].id);
      }
      return;
    }

    // 数字键切换标签页
    if ((e.ctrlKey || e.metaKey) && /^[1-9]$/.test(e.key)) {
      e.preventDefault();
      const tabList = Object.values(tabs);
      const index = parseInt(e.key) - 1;
      if (tabList[index]) {
        switchTab(tabList[index].id);
      }
      return;
    }

    // 保存当前文件
    if (matchesShortcut(e, 'ctrl+s')) {
      e.preventDefault();
      const activeTab = getActiveTab();
      if (activeTab && activeTab.filePath && onFileChange) {
        onFileChange(activeTab.filePath, activeTab.content);
      }
      return;
    }

    // 新建文件
    if (matchesShortcut(e, 'ctrl+n')) {
      e.preventDefault();
      const activePaneId = Object.keys(panes)[0];
      if (activePaneId) {
        const tabId = createTab({
          title: 'Untitled',
          content: '',
          type: 'file'
        }, activePaneId);
        switchTab(tabId);
      }
      return;
    }
  }, [panes, tabs, createTab, closeTab, switchTab, getActiveTab, onFileChange]);

  // 注册全局键盘事件监听
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 自动保存会话
  useEffect(() => {
    const interval = setInterval(() => {
      saveSession();
    }, 30000); // 每30秒保存一次

    return () => clearInterval(interval);
  }, [saveSession]);

  // 页面卸载时保存会话
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveSession]);

  return (
    <div 
      className={cn(
        "obsidian-editor w-full h-full bg-background text-foreground overflow-hidden",
        className
      )}
      data-theme={settings.theme}
    >
      <PaneContainer />
    </div>
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

// 默认导出
export default ObsidianEditor;