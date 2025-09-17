import React, { useCallback, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { EditorPane as EditorPaneType, PaneSplitter } from '../../types/obsidian-editor';
import { EditorPane } from './editor-pane';
import { PaneSplitterComponent } from './pane-splitter';
import { useObsidianEditorStore } from '../../stores/obsidian-editor-store';

interface PaneContainerProps {
  className?: string;
}

export const PaneContainer: React.FC<PaneContainerProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    splitterId: string;
    startPosition: number;
    startMousePosition: number;
  } | null>(null);

  const {
    panes,
    tabs,
    layout,
    activePane,
    getTabsByPane,
    activatePane,
    switchTab,
    closeTab,
    moveTab,
    splitPane,
    resizeSplit
  } = useObsidianEditorStore();

  // 处理面板激活
  const handlePaneActivate = useCallback((paneId: string) => {
    activatePane(paneId);
  }, [activatePane]);

  // 处理标签页切换
  const handleTabSwitch = useCallback((tabId: string) => {
    switchTab(tabId);
  }, [switchTab]);

  // 处理标签页关闭
  const handleTabClose = useCallback((tabId: string) => {
    closeTab(tabId);
  }, [closeTab]);

  // 处理标签页移动
  const handleTabMove = useCallback((tabId: string, fromPane: string, toPane: string) => {
    moveTab(tabId, fromPane, toPane);
  }, [moveTab]);

  // 处理面板分割
  const handlePaneSplit = useCallback((paneId: string, direction: 'horizontal' | 'vertical') => {
    splitPane(paneId, direction);
  }, [splitPane]);

  // 处理分割器拖拽开始
  const handleSplitterDragStart = useCallback((
    splitterId: string,
    startPosition: number,
    startMousePosition: number
  ) => {
    setDragState({
      splitterId,
      startPosition,
      startMousePosition
    });
  }, []);

  // 处理分割器拖拽
  const handleSplitterDrag = useCallback((mousePosition: number) => {
    if (!dragState) return;

    const delta = mousePosition - dragState.startMousePosition;
    const container = containerRef.current;
    if (!container) return;

    const splitter = layout.splitters.find(s => s.id === dragState.splitterId);
    if (!splitter) return;

    const containerSize = splitter.direction === 'horizontal' 
      ? container.clientHeight 
      : container.clientWidth;

    const deltaRatio = delta / containerSize;
    const newPosition = Math.max(0.1, Math.min(0.9, dragState.startPosition + deltaRatio));

    resizeSplit(dragState.splitterId, newPosition);
  }, [dragState, layout.splitters, resizeSplit]);

  // 处理分割器拖拽结束
  const handleSplitterDragEnd = useCallback(() => {
    setDragState(null);
  }, []);

  // 渲染单个面板
  const renderPane = useCallback((pane: EditorPaneType) => {
    const paneTabs = getTabsByPane(pane.id);
    const isActive = activePane === pane.id;

    return (
      <EditorPane
        key={pane.id}
        pane={pane}
        tabs={paneTabs}
        isActive={isActive}
        onTabSwitch={handleTabSwitch}
        onTabClose={handleTabClose}
        onTabMove={handleTabMove}
        onSplit={handlePaneSplit}
        onPaneActivate={() => handlePaneActivate(pane.id)}
      />
    );
  }, [
    getTabsByPane,
    activePane,
    handleTabSwitch,
    handleTabClose,
    handleTabMove,
    handlePaneSplit,
    handlePaneActivate
  ]);

  // 渲染分割布局
  const renderSplitLayout = useCallback(() => {
    if (layout.type === 'single' || layout.splitters.length === 0) {
      // 单面板布局
      const paneList = Object.values(panes);
      if (paneList.length === 0) return null;
      
      return (
        <div className="w-full h-full">
          {renderPane(paneList[0])}
        </div>
      );
    }

    // 分割布局 - 这里实现一个简单的两面板分割
    // 在实际应用中，可能需要更复杂的递归布局算法
    const splitter = layout.splitters[0]; // 简化：只处理第一个分割器
    const paneA = panes[splitter.paneA];
    const paneB = panes[splitter.paneB];

    if (!paneA || !paneB) return null;

    const isHorizontal = splitter.direction === 'horizontal';
    const position = splitter.position * 100;

    return (
      <div className={cn(
        "w-full h-full flex",
        isHorizontal ? "flex-col" : "flex-row"
      )}>
        {/* 第一个面板 */}
        <div
          className="overflow-hidden"
          style={{
            [isHorizontal ? 'height' : 'width']: `${position}%`
          }}
        >
          {renderPane(paneA)}
        </div>

        {/* 分割器 */}
        <PaneSplitterComponent
          splitter={splitter}
          onDragStart={handleSplitterDragStart}
          onDrag={handleSplitterDrag}
          onDragEnd={handleSplitterDragEnd}
        />

        {/* 第二个面板 */}
        <div
          className="overflow-hidden"
          style={{
            [isHorizontal ? 'height' : 'width']: `${100 - position}%`
          }}
        >
          {renderPane(paneB)}
        </div>
      </div>
    );
  }, [
    layout,
    panes,
    renderPane,
    handleSplitterDragStart,
    handleSplitterDrag,
    handleSplitterDragEnd
  ]);

  // 处理全局鼠标事件（用于分割器拖拽）
  React.useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const splitter = layout.splitters.find(s => s.id === dragState.splitterId);
      if (!splitter) return;

      const mousePosition = splitter.direction === 'horizontal' ? e.clientY : e.clientX;
      handleSplitterDrag(mousePosition);
    };

    const handleMouseUp = () => {
      handleSplitterDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, layout.splitters, handleSplitterDrag, handleSplitterDragEnd]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full h-full bg-background", className)}
    >
      {renderSplitLayout()}
    </div>
  );
};

// 面板容器骨架加载组件
export const PaneContainerSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full bg-background p-4">
      <div className="w-full h-full border border-border rounded-lg overflow-hidden">
        {/* 标签栏骨架 */}
        <div className="flex items-center bg-muted/30 border-b border-border h-10 px-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted rounded animate-pulse" />
            <div className="w-20 h-4 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex-1" />
          <div className="w-8 h-8 bg-muted rounded animate-pulse" />
        </div>

        {/* 内容区域骨架 */}
        <div className="flex-1 p-4 space-y-4">
          <div className="flex items-center justify-center h-32 bg-muted/30 rounded-lg">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-muted rounded-full animate-pulse mx-auto" />
              <div className="w-32 h-4 bg-muted rounded animate-pulse mx-auto" />
            </div>
          </div>
          
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-2">
                <div className={cn(
                  "h-4 bg-muted rounded animate-pulse",
                  Math.random() > 0.5 ? "w-1/3" : "w-2/3"
                )} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};