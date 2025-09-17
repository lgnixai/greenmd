import React, { useCallback, useRef } from 'react';
import { cn } from '../../lib/utils';
import { EditorPaneProps } from '../../types/obsidian-editor';
import { TabBar } from './tab-bar';
import { FileEditor } from './file-editor';
import { QuickActions } from './quick-actions';
import { useObsidianEditorStore } from '../../stores/obsidian-editor-store';

export const EditorPane: React.FC<EditorPaneProps> = ({
  pane,
  tabs,
  isActive,
  onTabSwitch,
  onTabClose,
  onTabMove,
  onSplit,
  onPaneActivate
}) => {
  const paneRef = useRef<HTMLDivElement>(null);
  const {
    createTab,
    updateTab,
    duplicateTab,
    lockTab,
    splitPaneWithTab,
    settings,
    openFile
  } = useObsidianEditorStore();

  // 获取当前活动的标签页
  const activeTab = tabs.find(tab => tab.id === pane.activeTab);

  // 处理新建标签页
  const handleNewTab = useCallback(() => {
    const tabId = createTab({
      title: 'Untitled',
      content: '',
      type: 'file'
    }, pane.id);
    onTabSwitch(tabId);
  }, [createTab, pane.id, onTabSwitch]);

  // 处理标签页操作
  const handleTabAction = useCallback((tabId: string, action: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    switch (action) {
      case 'duplicate':
        const newTabId = duplicateTab(tabId);
        if (newTabId) {
          onTabSwitch(newTabId);
        }
        break;
      
      case 'lock':
        lockTab(tabId, true);
        break;
      
      case 'unlock':
        lockTab(tabId, false);
        break;
      
      case 'splitHorizontal':
        splitPaneWithTab(tabId, 'horizontal');
        break;
      
      case 'splitVertical':
        splitPaneWithTab(tabId, 'vertical');
        break;
      
      case 'rename':
        const newTitle = prompt('请输入新的标签页名称:', tab.title);
        if (newTitle && newTitle.trim()) {
          updateTab(tabId, { title: newTitle.trim() });
        }
        break;
      
      case 'moveToNewWindow':
        // 这里可以实现移动到新窗口的逻辑
        console.log('Move to new window:', tabId);
        break;
      
      default:
        console.warn('Unknown tab action:', action);
    }
  }, [tabs, duplicateTab, lockTab, updateTab, onSplit]);

  // 处理标签页拖拽
  const handleTabDrag = useCallback((tabId: string, position: any) => {
    // 这里可以实现更复杂的拖拽逻辑
    console.log('Tab drag:', tabId, position);
  }, []);

  // 处理内容变化
  const handleContentChange = useCallback((content: string) => {
    if (activeTab) {
      updateTab(activeTab.id, { content });
    }
  }, [activeTab, updateTab]);

  // 处理面板点击（激活面板）
  const handlePaneClick = useCallback(() => {
    if (!isActive) {
      onPaneActivate();
    }
  }, [isActive, onPaneActivate]);

  // 处理拖拽放置
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const draggedTabId = e.dataTransfer.getData('text/plain');
    
    // 如果是从其他面板拖拽过来的标签页
    if (draggedTabId && !tabs.some(tab => tab.id === draggedTabId)) {
      // 这里需要实现跨面板的标签页移动逻辑
      console.log('Drop tab from another pane:', draggedTabId);
    }
  }, [tabs]);

  // 快捷操作处理
  const handleQuickAction = useCallback((action: string, data?: any) => {
    switch (action) {
      case 'newFile':
        handleNewTab();
        break;
      
      case 'openFile':
        // 这里应该打开文件选择对话框
        // 暂时创建一个示例文件
        const tabId = createTab({
          title: 'example.js',
          content: '// 示例 JavaScript 文件\nconsole.log("Hello, World!");',
          type: 'file',
          language: 'javascript',
          filePath: '/example.js'
        }, pane.id);
        onTabSwitch(tabId);
        break;
      
      case 'openRecent':
        if (data && typeof data === 'string') {
          const fileName = data.split('/').pop() || 'Untitled';
          const tabId = openFile(data, '// 从最近文件打开\n');
          onTabSwitch(tabId);
        }
        break;
      
      default:
        console.warn('Unknown quick action:', action);
    }
  }, [createTab, openFile, pane.id, onTabSwitch, handleNewTab]);

  return (
    <div
      ref={paneRef}
      className={cn(
        "flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden transition-all duration-200",
        isActive && "ring-2 ring-primary/50 border-primary/50",
        !isActive && "border-border/50"
      )}
      onClick={handlePaneClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 标签栏 */}
      <TabBar
        tabs={tabs}
        activeTab={pane.activeTab}
        paneId={pane.id}
        onTabClick={onTabSwitch}
        onTabClose={onTabClose}
        onTabDrag={handleTabDrag}
        onNewTab={handleNewTab}
        onTabAction={handleTabAction}
      />

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <FileEditor
            tab={activeTab}
            onContentChange={handleContentChange}
            settings={settings}
            readOnly={activeTab.isLocked}
          />
        ) : (
          <QuickActions
            onNewFile={() => handleQuickAction('newFile')}
            onOpenFile={() => handleQuickAction('openFile')}
            onOpenRecent={(filePath) => handleQuickAction('openRecent', filePath)}
            recentFiles={[
              '/src/components/Button.tsx',
              '/src/utils/helpers.js',
              '/README.md',
              '/package.json',
              '/src/styles/globals.css'
            ]}
          />
        )}
      </div>

      {/* 面板状态指示器 */}
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
      )}
    </div>
  );
};

// 编辑器面板骨架加载组件
export const EditorPaneSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden">
      {/* 标签栏骨架 */}
      <div className="flex items-center bg-muted/30 border-b border-border h-10">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-4 h-4 bg-muted rounded animate-pulse" />
          <div className="w-20 h-4 bg-muted rounded animate-pulse" />
          <div className="w-3 h-3 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex-1" />
        <div className="w-8 h-8 bg-muted rounded animate-pulse mx-1" />
      </div>

      {/* 内容区域骨架 */}
      <div className="flex-1 p-4 space-y-4">
        <div className="flex items-center justify-center h-32 bg-muted/30 rounded-lg">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-muted rounded-full animate-pulse mx-auto" />
            <div className="w-32 h-4 bg-muted rounded animate-pulse mx-auto" />
            <div className="w-24 h-3 bg-muted rounded animate-pulse mx-auto" />
          </div>
        </div>
        
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <div className={cn(
                "h-4 bg-muted rounded animate-pulse",
                Math.random() > 0.7 ? "w-1/4" : Math.random() > 0.4 ? "w-1/2" : "w-3/4"
              )} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};