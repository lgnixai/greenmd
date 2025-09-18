import React, { useCallback, useEffect, useMemo } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TabBar } from '../../packages/ui/src/components/obeditor/Tab';
import type { Tab as TabType } from '../../packages/ui/src/components/obeditor/Tab';
import Editor from '../../packages/ui/src/components/obeditor/Editor';
import { useEditorService } from '@dtinsight/molecule-core';
import { Button } from '../../packages/ui/src/components/ui/button';
import { AlertCircle } from 'lucide-react';
import ErrorBoundary from '@/components/obeditor/ErrorBoundary';
import { 
  PanelNode, 
  isPanelNode, 
  findPanelById,
  generateTabId
} from '@/components/obeditor/utils/panelUtils';
import { TEXT } from '@/components/obeditor/constants';

// 错误显示组件
const ErrorDisplay: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
    <AlertCircle className="w-8 h-8 text-destructive mb-2" />
    <div className="text-destructive text-lg font-semibold mb-2">
      {TEXT.PANEL_CONFIG_ERROR}
    </div>
    <div className="text-muted-foreground text-sm mb-4">
      {error}
    </div>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        {TEXT.REINITIALIZE}
      </Button>
    )}
  </div>
);

export const   ObsidianEditor: React.FC = () => {
  const { updateTabContent } = useEditorService();
  const {
    panelTree,
    initializePanelTree,
    splitPanel,
    addTabToPanel,
    closeTabInPanel,
    activateTabInPanel,
  } = useEditorService();

  useEffect(() => {
    if (!panelTree) {
      initializePanelTree();
    }
  }, [panelTree, initializePanelTree]);

  // 使用工具函数替代本地实现

  const updatePanelTabs = useCallback((panelId: string, newTabs: TabType[]) => {
    if (!panelTree || !isPanelNode(panelTree)) return;
    
    try {
      const panel = findPanelById(panelTree, panelId);
      if (panel && panel.type === 'leaf') {
        // 直接更新面板的标签，避免重复添加
        panel.tabs = newTabs.map(tab => ({ ...tab }));
        
        // 确保只有一个标签是激活的
        const activeTab = newTabs.find(t => t.isActive);
        if (activeTab) {
          panel.tabs.forEach(t => t.isActive = t.id === activeTab.id);
        } else if (panel.tabs.length > 0) {
          panel.tabs[0].isActive = true;
        }
      }
    } catch (error) {
      console.error('Error updating panel tabs:', error);
    }
  }, [panelTree, findPanelById]);

  const handleToggleLock = useCallback((panelId: string) => (id: string) => {
    if (!panelTree || !isPanelNode(panelTree)) return;
    
    const panel = findPanelById(panelTree, panelId);
    if (!panel?.tabs) return;

    const newTabs = panel.tabs.map(tab => 
      tab.id === id ? { ...tab, isLocked: !tab.isLocked } : tab
    );
    updatePanelTabs(panelId, newTabs);
  }, [panelTree, findPanelById, updatePanelTabs]);

  const handleDuplicate = useCallback((panelId: string) => (id: string) => {
    if (!panelTree || !isPanelNode(panelTree)) return;
    
    const panel = findPanelById(panelTree, panelId);
    if (!panel?.tabs) return;

    const targetTab = panel.tabs.find(tab => tab.id === id);
    if (targetTab) {
      const newTab = {
        ...targetTab,
        id: `${id}-copy-${Date.now()}`,
        title: `${targetTab.title} - 副本`,
        isActive: false
      };
      const newTabs = [...panel.tabs, newTab];
      updatePanelTabs(panelId, newTabs);
    }
  }, [panelTree, findPanelById, updatePanelTabs]);

  const handleRename = useCallback((panelId: string) => (id: string, newTitle: string) => {
    if (!panelTree || !isPanelNode(panelTree) || !newTitle.trim()) return;
    
    const panel = findPanelById(panelTree, panelId);
    if (!panel?.tabs) return;

    const newTabs = panel.tabs.map(tab => 
      tab.id === id ? { ...tab, title: newTitle.trim() } : tab
    );
    updatePanelTabs(panelId, newTabs);
  }, [panelTree, findPanelById, updatePanelTabs]);

  const handleCopyPath = useCallback((panelId: string) => (id: string) => {
    if (!panelTree || !isPanelNode(panelTree)) return;
    
    const panel = findPanelById(panelTree, panelId);
    if (!panel?.tabs) return;

    const targetTab = panel.tabs.find(tab => tab.id === id);
    if (targetTab?.filePath) {
      navigator.clipboard.writeText(targetTab.filePath).catch(err => {
        console.error('Failed to copy path to clipboard:', err);
      });
    }
  }, [panelTree, findPanelById]);

  const handleRevealInExplorer = useCallback((panelId: string) => (id: string) => {
    if (!panelTree || !isPanelNode(panelTree)) return;
    
    const panel = findPanelById(panelTree, panelId);
    if (!panel?.tabs) return;

    const targetTab = panel.tabs.find(tab => tab.id === id);
    if (targetTab) {
      // TODO: 在实际应用中应该集成文件管理器
      const message = `文件位置: ${targetTab.filePath || '新文件'}`;
      // 使用更友好的通知方式而不是 alert
      console.info(message);
      // 这里可以集成通知系统
    }
  }, [panelTree, findPanelById]);

  const splitPanelLocal = useCallback((panelId: string, direction: 'horizontal' | 'vertical') => {
    splitPanel(panelId, direction);
  }, [splitPanel]);

  // panel removal handled in core if needed

  const handleCloseTab = useCallback((panelId: string) => (id: string) => {
    closeTabInPanel(panelId, id);
  }, [closeTabInPanel]);

  const handleActivateTab = useCallback((panelId: string) => (id: string) => {
    activateTabInPanel(panelId, id);
  }, [activateTabInPanel]);

  const handleAddTab = useCallback((panelId: string) => () => {
    const newTabId = generateTabId();
    addTabToPanel(panelId, { id: newTabId, title: TEXT.NEW_TAB, isActive: true });
  }, [addTabToPanel]);

  const handleCloseOthers = useCallback((panelId: string) => (id: string) => {
    if (!panelTree || !isPanelNode(panelTree)) return;
    
    const panel = findPanelById(panelTree, panelId);
    if (!panel?.tabs) return;

    const targetTab = panel.tabs.find(tab => tab.id === id);
    if (targetTab) {
      updatePanelTabs(panelId, [{ ...targetTab, isActive: true }]);
    }
  }, [panelTree, findPanelById, updatePanelTabs]);

  const handleCloseAll = useCallback((panelId: string) => () => {
    const newTabId = generateTabId();
    const newTab = { id: newTabId, title: TEXT.NEW_TAB, isActive: true };
    updatePanelTabs(panelId, [newTab]);
  }, [updatePanelTabs]);

  const handleSplitHorizontal = useCallback((panelId: string) => (_id: string) => {
    splitPanelLocal(panelId, 'horizontal');
  }, [splitPanelLocal]);

  const handleSplitVertical = useCallback((panelId: string) => (_id: string) => {
    splitPanelLocal(panelId, 'vertical');
  }, [splitPanelLocal]);

  // 优化性能：将处理函数分组以减少依赖
  const tabHandlers = useMemo(() => ({
    onCloseTab: handleCloseTab,
    onActivateTab: handleActivateTab,
    onAddTab: handleAddTab,
    onCloseOthers: handleCloseOthers,
    onCloseAll: handleCloseAll,
    onSplitHorizontal: handleSplitHorizontal,
    onSplitVertical: handleSplitVertical,
    onToggleLock: handleToggleLock,
    onDuplicate: handleDuplicate,
    onRename: handleRename,
    onCopyPath: handleCopyPath,
    onRevealInExplorer: handleRevealInExplorer
  }), [
    handleCloseTab,
    handleActivateTab,
    handleAddTab,
    handleCloseOthers,
    handleCloseAll,
    handleSplitHorizontal,
    handleSplitVertical,
    handleToggleLock,
    handleDuplicate,
    handleRename,
    handleCopyPath,
    handleRevealInExplorer
  ]);

  const renderPanelNode = useCallback((node: PanelNode): React.ReactElement => {
    if (!isPanelNode(node)) {
      return (
        <ErrorDisplay 
          error="无效的面板节点配置" 
          onRetry={() => initializePanelTree()}
        />
      );
    }

    if (node.type === 'leaf' && node.tabs) {
      return (
        <div className="h-full flex flex-col">
          <ErrorBoundary
            onError={(error, errorInfo) => {
              console.error('TabBar error:', error, errorInfo);
            }}
          >
            <TabBar
              tabs={node.tabs}
              onCloseTab={tabHandlers.onCloseTab(node.id)}
              onActivateTab={tabHandlers.onActivateTab(node.id)}
              onAddTab={tabHandlers.onAddTab(node.id)}
              onCloseOthers={tabHandlers.onCloseOthers(node.id)}
              onCloseAll={tabHandlers.onCloseAll(node.id)}
              onSplitHorizontal={tabHandlers.onSplitHorizontal(node.id)}
              onSplitVertical={tabHandlers.onSplitVertical(node.id)}
              onToggleLock={tabHandlers.onToggleLock(node.id)}
              onDuplicate={tabHandlers.onDuplicate(node.id)}
              onRename={tabHandlers.onRename(node.id)}
              onCopyPath={tabHandlers.onCopyPath(node.id)}
              onRevealInExplorer={tabHandlers.onRevealInExplorer(node.id)}
            />
          </ErrorBoundary>
          <ErrorBoundary
            onError={(error, errorInfo) => {
              console.error('Editor error:', error, errorInfo);
            }}
          >
            <Editor
              onChange={({ text }) => {
                try {
                  const active = node.tabs?.find(t => t.isActive);
                  if (active) {
                    updateTabContent(active.id, text);
                  }
                } catch (error) {
                  console.error('Error updating tab content:', error);
                }
              }}
            />
          </ErrorBoundary>
        </div>
      );
    }

    if (node.type === 'split' && node.children && node.children.length > 0) {
      return (
        <PanelGroup direction={node.direction || 'horizontal'} className="min-w-0">
          {node.children.map((child, index) => {
            if (!isPanelNode(child)) {
              return (
                <Panel key={`error-${index}`} defaultSize={50} minSize={20}>
                  <ErrorDisplay error={`子面板 ${index} 配置错误`} />
                </Panel>
              );
            }
            
            return (
              <React.Fragment key={child.id}>
                <Panel 
                  defaultSize={child.size || 50} 
                  minSize={child.minSize || 20}
                  className={`min-w-0 ${
                    node.direction === 'horizontal' && index === 0 
                      ? 'border-r border-border' 
                      : ''
                  }`}
                >
                  {renderPanelNode(child)}
                </Panel>
                {index < (node.children?.length || 0) - 1 && (
                  <PanelResizeHandle 
                    className={node.direction === 'horizontal' 
                      ? "w-1 bg-border hover:bg-accent transition-colors duration-200" 
                      : "h-1 bg-border hover:bg-accent transition-colors duration-200"
                    } 
                  />
                )}
              </React.Fragment>
            );
          })}
        </PanelGroup>
      );
    }

    return (
      <ErrorDisplay 
        error={`不支持的面板类型: ${node.type}`} 
        onRetry={() => initializePanelTree()}
      />
    );
  }, [tabHandlers, updateTabContent, initializePanelTree]);

  return (
    <div className="h-full w-full min-w-0 flex flex-col bg-background">
      {panelTree && isPanelNode(panelTree) ? (
        renderPanelNode(panelTree)
      ) : (
        <ErrorDisplay 
          error="面板树未初始化或配置错误" 
          onRetry={() => initializePanelTree()}
        />
      )}
    </div>
  );
};

