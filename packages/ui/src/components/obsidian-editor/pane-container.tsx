import React, { useCallback, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { EditorPane as EditorPaneType, PaneSplitter } from '../../types/obsidian-editor';
import { EditorPane } from './editor-pane';
import { PaneSplitterComponent } from './pane-splitter';
import { useObsidianEditorStore } from '../../stores/obsidian-editor-store';
import { useResponsiveDesign, shouldAutoMergePanes, getOptimalPaneLayout } from '../../hooks/useResponsiveDesign';

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
    layout,
    activePane,
    settings,
    getTabsByPane,
    activatePane,
    switchTab,
    closeTab,
    moveTab,
    splitPane,
    resizeSplit,
    closePane,
    mergePanes,
    canMergePanes,
    getPaneMinSize,
    validatePaneSize,
    autoMergePanes
  } = useObsidianEditorStore();

  // 响应式设计
  const responsive = useResponsiveDesign({
    mobile: settings.responsive.mobileBreakpoint,
    tablet: settings.responsive.tabletBreakpoint
  });

  // 响应式自动合并面板
  React.useEffect(() => {
    if (!settings.responsive.autoMergePanes) return;

    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    const paneCount = Object.keys(panes).length;

    if (shouldAutoMergePanes(width, height, paneCount, responsive.isMobile, responsive.isTablet)) {
      // 自动合并面板
      autoMergePanes();
    }
  }, [responsive.isMobile, responsive.isTablet, panes, settings.responsive.autoMergePanes, autoMergePanes]);

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

  // 处理标签页移动 - 适配接口签名
  const handleTabMoveForPane = useCallback((paneId: string) => (tabId: string, targetPane: string) => {
    moveTab(tabId, paneId, targetPane);
  }, [moveTab]);

  // 处理面板分割 - 适配接口签名
  const handlePaneSplitForPane = useCallback((paneId: string) => (direction: 'horizontal' | 'vertical') => {
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
    // 检查是否需要自动合并面板
    autoMergePanes();
  }, [autoMergePanes]);

  // 处理面板关闭
  const handlePaneClose = useCallback((paneId: string) => {
    closePane(paneId);
  }, [closePane]);

  // 处理面板合并
  const handlePaneMerge = useCallback((paneAId: string, paneBId: string) => {
    if (canMergePanes(paneAId, paneBId)) {
      mergePanes(paneAId, paneBId);
    }
  }, [mergePanes, canMergePanes]);

  // 处理分割器双击（重置分割比例）
  const handleSplitterDoubleClick = useCallback((splitterId: string) => {
    resizeSplit(splitterId, 0.5);
  }, [resizeSplit]);

  // 渲染单个面板
  const renderPane = useCallback((pane: EditorPaneType) => {
    const paneTabs = getTabsByPane(pane.id);
    const isActive = activePane === pane.id;
    const canClose = Object.keys(panes).length > 1; // 只有多个面板时才能关闭

    return (
      <EditorPane
        key={pane.id}
        pane={pane}
        tabs={paneTabs}
        isActive={isActive}
        onTabSwitch={handleTabSwitch}
        onTabClose={handleTabClose}
        onTabMove={handleTabMoveForPane(pane.id)}
        onSplit={handlePaneSplitForPane(pane.id)}
        onPaneActivate={() => handlePaneActivate(pane.id)}
        onPaneClose={handlePaneClose}
        canClose={canClose}
      />
    );
  }, [
    getTabsByPane,
    activePane,
    panes,
    handleTabSwitch,
    handleTabClose,
    handleTabMoveForPane,
    handlePaneSplitForPane,
    handlePaneActivate,
    handlePaneClose
  ]);

  // 递归渲染分割布局节点
  const renderSplitNode = useCallback((paneId: string, availableSplitters: PaneSplitter[]): React.ReactNode => {
    // 查找以此面板为 paneA 的分割器
    const splitter = availableSplitters.find(s => s.paneA === paneId);
    
    if (!splitter) {
      // 没有分割器，直接渲染面板
      const pane = panes[paneId];
      return pane ? renderPane(pane) : null;
    }

    // 有分割器，递归渲染分割布局
    const paneB = panes[splitter.paneB];
    if (!paneB) return null;

    const isHorizontal = splitter.direction === 'horizontal';
    const position = splitter.position * 100;
    
    // 移除当前分割器，避免无限递归
    const remainingSplitters = availableSplitters.filter(s => s.id !== splitter.id);

    return (
      <div className={cn(
        "w-full h-full flex",
        isHorizontal ? "flex-col" : "flex-row"
      )}>
        {/* 第一个面板或子分割 */}
        <div
          className="overflow-hidden"
          style={{
            [isHorizontal ? 'height' : 'width']: `${position}%`
          }}
        >
          {renderSplitNode(splitter.paneA, remainingSplitters)}
        </div>

        {/* 分割器 */}
        <PaneSplitterComponent
          splitter={splitter}
          onDragStart={handleSplitterDragStart}
          onDrag={handleSplitterDrag}
          onDragEnd={handleSplitterDragEnd}
          onDoubleClick={() => handleSplitterDoubleClick(splitter.id)}
        />

        {/* 第二个面板或子分割 */}
        <div
          className="overflow-hidden"
          style={{
            [isHorizontal ? 'height' : 'width']: `${100 - position}%`
          }}
        >
          {renderSplitNode(splitter.paneB, remainingSplitters)}
        </div>
      </div>
    );
  }, [panes, renderPane, handleSplitterDragStart, handleSplitterDrag, handleSplitterDragEnd]);

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

    // 复杂分割布局 - 支持多层嵌套
    // 找到根面板（不作为任何分割器的 paneB 的面板）
    const allPaneBIds = new Set(layout.splitters.map(s => s.paneB));
    const rootPanes = Object.keys(panes).filter(paneId => !allPaneBIds.has(paneId));
    
    if (rootPanes.length === 0) {
      // 如果没有根面板，使用第一个面板作为根
      const firstPane = Object.keys(panes)[0];
      return firstPane ? renderSplitNode(firstPane, layout.splitters) : null;
    }

    // 渲染第一个根面板的分割树
    return (
      <div className="w-full h-full">
        {renderSplitNode(rootPanes[0], layout.splitters)}
      </div>
    );
  }, [layout, panes, renderPane, renderSplitNode]);

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

  // 响应式处理 - 监听容器大小变化
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      const minSize = getPaneMinSize();

      // 如果容器太小，自动合并面板
      if (width < minSize.width * 2 || height < minSize.height * 2) {
        if (layout.type === 'split' && Object.keys(panes).length > 1) {
          autoMergePanes();
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [layout.type, panes, getPaneMinSize, autoMergePanes]);

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