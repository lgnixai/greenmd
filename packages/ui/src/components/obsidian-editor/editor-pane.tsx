import React, { useCallback, useRef, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { EditorPaneProps, DragPosition } from '../../types/obsidian-editor';
import { TabBar } from './tab-bar';
import { FileEditor } from './file-editor';
import { QuickActions } from './quick-actions';
import { DropZoneHighlight } from './drag-drop-overlay';
import { dragDropManager, DragDropState } from '../../utils/drag-drop-manager';
import { useObsidianEditorStore } from '../../stores/obsidian-editor-store';

export const EditorPane: React.FC<EditorPaneProps & {
  onPaneClose?: (paneId: string) => void;
  canClose?: boolean;
}> = ({
  pane,
  tabs,
  isActive,
  onTabSwitch,
  onTabClose,
  onTabMove,
  onSplit,
  onPaneActivate,
  onPaneClose,
  canClose = true
}) => {
  const paneRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragDropState>(dragDropManager.getState());
  const [dropZoneType, setDropZoneType] = useState<'merge' | 'split-left' | 'split-right' | 'split-top' | 'split-bottom' | null>(null);
  
  const {
    createTab,
    updateTab,
    duplicateTab,
    lockTab,
    splitPaneWithTab,
    moveTab,
    settings,
    openFile
  } = useObsidianEditorStore();

  // 监听拖拽状态变化
  useEffect(() => {
    const handleStateChange = (state: DragDropState) => {
      setDragState(state);
    };

    dragDropManager.addListener(handleStateChange);
    return () => dragDropManager.removeListener(handleStateChange);
  }, []);

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
      case 'newTab':
        handleNewTab();
        break;
      
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
        // 使用store的moveTabToNewWindow方法
        const { moveTabToNewWindow } = useObsidianEditorStore.getState();
        moveTabToNewWindow(tabId);
        break;
      
      // 高级菜单功能 - 这些由Tab组件内部的对话框处理，这里不需要额外逻辑
      case 'showRelated':
      case 'addToGroup':
      case 'removeFromGroup':
      case 'createGroup':
      case 'linkTabs':
      case 'unlinkTabs':
        // 这些操作由Tab组件的对话框处理，不需要在这里实现
        break;
      
      default:
        console.warn('Unknown tab action:', action);
    }
  }, [tabs, duplicateTab, lockTab, updateTab, onSplit, handleNewTab]);

  // 处理标签页拖拽
  const handleTabDrag = useCallback((tabId: string, position: DragPosition) => {
    if (position.zone === 'tab' && position.targetIndex !== undefined) {
      // 在同一面板内重新排序
      const currentIndex = tabs.findIndex(tab => tab.id === tabId);
      if (currentIndex !== -1 && currentIndex !== position.targetIndex) {
        // 这里需要实现标签页重排序逻辑
        console.log('Reorder tab:', tabId, 'from', currentIndex, 'to', position.targetIndex);
        // 可以通过store的moveTab方法实现
        // moveTab(tabId, pane.id, pane.id, position.targetIndex);
      }
    }
  }, [tabs, pane.id]);

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

  // 处理面板关闭
  const handlePaneClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPaneClose && canClose) {
      onPaneClose(pane.id);
    }
  }, [onPaneClose, canClose, pane.id]);

  // 处理拖拽放置
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // 只处理来自其他面板的拖拽
    if (!dragState.isDragging || dragState.draggedFromPane === pane.id) {
      return;
    }
    
    const rect = paneRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const threshold = 50;
    
    // 确定拖拽区域类型
    let newDropZoneType: typeof dropZoneType = null;
    
    if (x < threshold) {
      newDropZoneType = 'split-left';
    } else if (x > rect.width - threshold) {
      newDropZoneType = 'split-right';
    } else if (y < threshold) {
      newDropZoneType = 'split-top';
    } else if (y > rect.height - threshold) {
      newDropZoneType = 'split-bottom';
    } else {
      newDropZoneType = 'merge';
    }
    
    setDropZoneType(newDropZoneType);
    
    // 更新拖拽管理器状态
    const position: DragPosition = {
      x: e.clientX,
      y: e.clientY,
      zone: newDropZoneType === 'merge' ? 'pane' : 
            (newDropZoneType?.includes('left') || newDropZoneType?.includes('right')) ? 'split-vertical' : 'split-horizontal',
      targetIndex: newDropZoneType?.includes('left') || newDropZoneType?.includes('top') ? 0 : -1
    };
    
    dragDropManager.updateDrag(pane.id, position);
  }, [dragState, pane.id, dropZoneType]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    // 检查是否真的离开了面板
    const rect = paneRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setDropZoneType(null);
      dragDropManager.updateDrag(null, null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    const draggedTabId = e.dataTransfer.getData('text/plain');
    const sourcePane = e.dataTransfer.getData('application/source-pane');
    
    // 清除拖拽状态
    setDropZoneType(null);
    dragDropManager.updateDrag(null, null);
    
    // 如果是从其他面板拖拽过来的标签页
    if (draggedTabId && sourcePane && sourcePane !== pane.id) {
      switch (dropZoneType) {
        case 'split-left':
        case 'split-right':
          splitPaneWithTab(draggedTabId, 'vertical');
          break;
        case 'split-top':
        case 'split-bottom':
          splitPaneWithTab(draggedTabId, 'horizontal');
          break;
        case 'merge':
        default:
          // 移动到当前面板
          if (onTabMove) {
            onTabMove(draggedTabId, pane.id);
          } else {
            // 直接使用store方法
            moveTab(draggedTabId, sourcePane, pane.id);
          }
          break;
      }
    }
  }, [pane.id, dropZoneType, splitPaneWithTab, onTabMove, moveTab]);

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
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-pane-id={pane.id}
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
        onPaneClose={onPaneClose}
        canClosePane={canClose}
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
      
      {/* 拖拽区域高亮 */}
      {dragState.isDragging && dragState.draggedFromPane !== pane.id && dropZoneType && (
        <DropZoneHighlight
          isActive={true}
          type={dropZoneType === 'merge' ? 'pane' : 'split'}
          className={cn(
            dropZoneType === 'split-left' && "right-1/2",
            dropZoneType === 'split-right' && "left-1/2",
            dropZoneType === 'split-top' && "bottom-1/2",
            dropZoneType === 'split-bottom' && "top-1/2"
          )}
        />
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