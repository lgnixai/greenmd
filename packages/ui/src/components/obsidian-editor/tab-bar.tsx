import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { TabBarProps, TabAction, DragPosition } from '../../types/obsidian-editor';
import { Tab, NewTabButton, TabSkeleton } from './tab';
import { VirtualizedTabBar } from './virtualized-tab-bar';
import { DragDropOverlay } from './drag-drop-overlay';
import { dragDropManager, getTabElementsInContainer } from '../../utils/drag-drop-manager';
import { useObsidianEditorStore } from '../../stores/obsidian-editor-store';
import { useResponsiveDesign, getResponsiveTabWidth, getTouchOptimizedSizes } from '../../hooks/useResponsiveDesign';
import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { Button } from '../button';
import { 
  useKeyboardNavigation,
  useTabAccessibility 
} from '../../hooks/useAccessibility';
import { 
  createAriaProps, 
  generateAriaId, 
  KEYBOARD_KEYS,
  ARIA_ROLES 
} from '../../utils/accessibility-utils';


export const TabBar: React.FC<TabBarProps & {
  onPaneClose?: (paneId: string) => void;
  canClosePane?: boolean;
}> = ({
  tabs,
  activeTab,
  paneId,
  onTabClick,
  onTabClose,
  onTabDrag,
  onNewTab,
  onTabAction,
  onPaneClose,
  canClosePane = true
}) => {
  // Use virtualized tab bar for large number of tabs
  if (tabs.length > 15) {
    return (
      <VirtualizedTabBar
        tabs={tabs}
        activeTab={activeTab}
        paneId={paneId}
        onTabClick={onTabClick}
        onTabClose={onTabClose}
        onTabDrag={onTabDrag}
        onNewTab={onNewTab}
        onTabAction={onTabAction}
        onPaneClose={onPaneClose}
        canClosePane={canClosePane}
        virtualizationThreshold={15}
      />
    );
  }
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  const { reorderTab, settings } = useObsidianEditorStore();
  const responsive = useResponsiveDesign({
    mobile: settings.responsive.mobileBreakpoint,
    tablet: settings.responsive.tabletBreakpoint
  });

  // Accessibility hooks
  const { updateElements } = useKeyboardNavigation(tabBarRef, 'horizontal', true);
  const { announceTabSwitched } = useTabAccessibility();

  // Generate unique IDs for ARIA
  const tabListId = generateAriaId('tablist');
  const tabPanelId = generateAriaId('tabpanel');

  // 检查滚动状态和容器宽度
  const checkScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    setContainerWidth(clientWidth);
  }, []);

  // 计算响应式标签页宽度
  const tabWidthConfig = getResponsiveTabWidth(
    containerWidth,
    tabs.length,
    responsive.isMobile,
    responsive.isTablet
  );

  // 获取触摸优化尺寸
  const touchSizes = getTouchOptimizedSizes(responsive.isTouchDevice, responsive.isMobile);

  useEffect(() => {
    checkScrollState();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollState);
      return () => container.removeEventListener('scroll', checkScrollState);
    }
  }, [checkScrollState, tabs.length]);

  // 滚动到活动标签页
  const scrollToActiveTab = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const activeTabElement = container.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement;
    if (!activeTabElement) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTabElement.getBoundingClientRect();

    if (tabRect.left < containerRect.left) {
      container.scrollLeft -= containerRect.left - tabRect.left + 10;
    } else if (tabRect.right > containerRect.right) {
      container.scrollLeft += tabRect.right - containerRect.right + 10;
    }
  }, [activeTab]);

  useEffect(() => {
    scrollToActiveTab();
  }, [scrollToActiveTab]);

  // 滚动控制
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const container = scrollContainerRef.current;
    if (!container) return;

    // 使用拖拽管理器计算拖拽位置
    const tabElements = getTabElementsInContainer(container);
    const position = dragDropManager.calculateDragPosition(
      e.clientX,
      e.clientY,
      container,
      tabElements
    );

    if (position && position.zone === 'tab') {
      const targetIndex = position.targetIndex || 0;
      setDragOverIndex(Math.floor(targetIndex));
      setDragOverPosition(targetIndex % 1 === 0 ? 'before' : 'after');
      
      // 更新拖拽管理器状态
      dragDropManager.updateDrag(paneId, position);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // 只有当鼠标离开整个标签栏时才清除拖拽状态
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setDragOverIndex(null);
      setDragOverPosition(null);
      
      // 更新拖拽管理器状态
      dragDropManager.updateDrag(null, null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedTabId = e.dataTransfer.getData('text/plain');
    const sourcePaneId = e.dataTransfer.getData('application/source-pane');
    
    if (dragOverIndex !== null && dragOverPosition) {
      const targetIndex = dragOverPosition === 'after' ? dragOverIndex + 1 : dragOverIndex;
      
      const position: DragPosition = {
        x: e.clientX,
        y: e.clientY,
        zone: 'tab',
        targetIndex
      };
      
      // 如果是同一个面板内的重排序
      if (sourcePaneId === paneId) {
        // 使用store的reorderTab方法
        reorderTab(draggedTabId, paneId, targetIndex);
      } else {
        // 跨面板移动
        onTabDrag(draggedTabId, position);
      }
    }

    setDragOverIndex(null);
    setDragOverPosition(null);
    
    // 清除拖拽管理器状态
    dragDropManager.updateDrag(null, null);
  };

  // 标签页操作处理
  const handleTabAction = (tabId: string, action: TabAction) => {
    switch (action) {
      case 'close':
        onTabClose(tabId);
        break;
      case 'closeOthers':
        tabs.forEach(tab => {
          if (tab.id !== tabId && !tab.isLocked) {
            onTabClose(tab.id);
          }
        });
        break;
      case 'closeAll':
        tabs.forEach(tab => {
          if (!tab.isLocked) {
            onTabClose(tab.id);
          }
        });
        break;
      case 'newTab':
        onNewTab();
        break;
      // 高级菜单功能由Tab组件内部处理，这里只需要传递给父组件
      case 'showRelated':
      case 'addToGroup':
      case 'removeFromGroup':
      case 'createGroup':
      case 'linkTabs':
      case 'unlinkTabs':
        onTabAction(tabId, action);
        break;
      default:
        onTabAction(tabId, action);
        break;
    }
  };

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 't':
          e.preventDefault();
          onNewTab();
          break;
        case 'w':
          e.preventDefault();
          if (activeTab) {
            const tab = tabs.find(t => t.id === activeTab);
            if (tab && !tab.isLocked) {
              onTabClose(activeTab);
            }
          }
          break;
        case KEYBOARD_KEYS.TAB:
          e.preventDefault();
          const currentIndex = tabs.findIndex(t => t.id === activeTab);
          if (currentIndex !== -1) {
            const nextIndex = e.shiftKey 
              ? (currentIndex - 1 + tabs.length) % tabs.length
              : (currentIndex + 1) % tabs.length;
            const nextTab = tabs[nextIndex];
            onTabClick(nextTab.id);
            announceTabSwitched(nextTab.title);
          }
          break;
      }
    }

    // 数字键切换标签页
    if (e.ctrlKey || e.metaKey) {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        e.preventDefault();
        const targetTab = tabs[num - 1];
        if (targetTab) {
          onTabClick(targetTab.id);
          announceTabSwitched(targetTab.title);
        }
      }
    }

    // 方向键导航
    switch (e.key) {
      case KEYBOARD_KEYS.ARROW_LEFT:
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const currentIndex = tabs.findIndex(t => t.id === activeTab);
          if (currentIndex > 0) {
            const prevTab = tabs[currentIndex - 1];
            onTabClick(prevTab.id);
            announceTabSwitched(prevTab.title);
          }
        }
        break;
      case KEYBOARD_KEYS.ARROW_RIGHT:
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const currentIndex = tabs.findIndex(t => t.id === activeTab);
          if (currentIndex < tabs.length - 1) {
            const nextTab = tabs[currentIndex + 1];
            onTabClick(nextTab.id);
            announceTabSwitched(nextTab.title);
          }
        }
        break;
      case KEYBOARD_KEYS.HOME:
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const firstTab = tabs[0];
          if (firstTab) {
            onTabClick(firstTab.id);
            announceTabSwitched(firstTab.title);
          }
        }
        break;
      case KEYBOARD_KEYS.END:
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const lastTab = tabs[tabs.length - 1];
          if (lastTab) {
            onTabClick(lastTab.id);
            announceTabSwitched(lastTab.title);
          }
        }
        break;
    }
  };

  // Update keyboard navigation when tabs change
  useEffect(() => {
    updateElements();
  }, [tabs, updateElements]);

  const renderDropIndicator = (index: number, position: 'before' | 'after') => {
    if (dragOverIndex !== index || dragOverPosition !== position) return null;

    return (
      <div 
        className={cn(
          "absolute top-0 bottom-0 w-0.5 bg-primary z-10",
          position === 'before' ? "left-0" : "right-0"
        )}
      />
    );
  };

  return (
    <div 
      ref={tabBarRef}
      className={cn(
        "flex items-center bg-muted/30 border-b border-border tab-bar",
        responsive.isMobile && "px-1",
        responsive.isTablet && "px-2"
      )}
      style={{ height: touchSizes.tabHeight }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      {...createAriaProps({
        role: ARIA_ROLES.TABLIST,
        label: '标签页列表',
        owns: tabListId
      })}
    >
      {/* 左滚动按钮 - 响应式显示 */}
      {(canScrollLeft && (settings.responsive.adaptiveTabWidth ? tabWidthConfig.showScrollButtons : true)) && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "p-0 flex-shrink-0",
            responsive.isMobile ? "h-8 w-8" : "h-8 w-8"
          )}
          style={{ 
            minWidth: touchSizes.minTouchTarget,
            minHeight: touchSizes.minTouchTarget 
          }}
          onClick={scrollLeft}
          title="向左滚动"
          {...createAriaProps({
            label: '向左滚动标签页'
          })}
        >
          <ChevronLeft className={cn(
            responsive.isMobile ? "w-5 h-5" : "w-4 h-4"
          )} />
        </Button>
      )}

      {/* 标签页容器 */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex-1 flex overflow-x-auto scrollbar-none relative",
          "min-w-0", // 防止flex子元素撑开容器
          responsive.isMobile && "gap-1",
          responsive.isTablet && "gap-0.5"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          // 在移动设备上禁用水平滚动的惯性
          WebkitOverflowScrolling: responsive.isMobile ? 'auto' : 'touch'
        }}
        data-pane-id={paneId}
        id={tabListId}
      >
        {/* 拖拽覆盖层 */}
        <DragDropOverlay containerRef={scrollContainerRef} />
        {tabs.length === 0 ? (
          // 空状态 - 响应式文本
          <div className={cn(
            "flex items-center justify-center w-full py-4 text-muted-foreground",
            responsive.isMobile ? "text-xs" : "text-sm"
          )}>
            {responsive.isMobile ? "无标签页" : "没有打开的标签页"}
          </div>
        ) : (
          // 标签页列表
          tabs.map((tab, index) => (
            <div key={tab.id} className="relative flex-shrink-0">
              {renderDropIndicator(index, 'before')}
              <Tab
                tab={tab}
                isActive={tab.id === activeTab}
                onSelect={() => onTabClick(tab.id)}
                onClose={() => onTabClose(tab.id)}
                onMenuAction={(action) => handleTabAction(tab.id, action)}
                onDragStart={() => {
                  // 可以在这里添加拖拽开始的逻辑
                }}
                onDragEnd={() => {
                  setDragOverIndex(null);
                  setDragOverPosition(null);
                }}
                draggable={!responsive.isTouchDevice} // 触摸设备上禁用拖拽
                style={settings.responsive.adaptiveTabWidth ? {
                  width: tabWidthConfig.width,
                  minWidth: tabWidthConfig.width,
                  maxWidth: tabWidthConfig.width
                } : undefined}
                responsive={responsive}
                touchSizes={touchSizes}
              />
              {renderDropIndicator(index, 'after')}
            </div>
          ))
        )}
      </div>

      {/* 右滚动按钮 - 响应式显示 */}
      {(canScrollRight && (settings.responsive.adaptiveTabWidth ? tabWidthConfig.showScrollButtons : true)) && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "p-0 flex-shrink-0",
            responsive.isMobile ? "h-8 w-8" : "h-8 w-8"
          )}
          style={{ 
            minWidth: touchSizes.minTouchTarget,
            minHeight: touchSizes.minTouchTarget 
          }}
          onClick={scrollRight}
          title="向右滚动"
          {...createAriaProps({
            label: '向右滚动标签页'
          })}
        >
          <ChevronRight className={cn(
            responsive.isMobile ? "w-5 h-5" : "w-4 h-4"
          )} />
        </Button>
      )}

      {/* 标签页菜单 - 移动设备上更重要 */}
      {tabs.length > 0 && (responsive.isMobile || tabs.length > 3) && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "p-0 flex-shrink-0",
            responsive.isMobile ? "h-8 w-8" : "h-8 w-8"
          )}
          style={{ 
            minWidth: touchSizes.minTouchTarget,
            minHeight: touchSizes.minTouchTarget 
          }}
          title="标签页菜单"
          {...createAriaProps({
            label: '标签页菜单'
          })}
          onClick={() => {
            // 这里可以实现标签页菜单的显示逻辑
            console.log('Show tab menu');
          }}
        >
          <MoreHorizontal className={cn(
            responsive.isMobile ? "w-5 h-5" : "w-4 h-4"
          )} />
        </Button>
      )}

      {/* 面板关闭按钮 - 桌面设备上显示 */}
      {canClosePane && onPaneClose && !responsive.isMobile && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
          style={{ 
            minWidth: touchSizes.minTouchTarget,
            minHeight: touchSizes.minTouchTarget 
          }}
          title="关闭面板"
          {...createAriaProps({
            label: '关闭当前面板'
          })}
          onClick={(e) => {
            e.stopPropagation();
            onPaneClose(paneId);
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      {/* 新建标签页按钮 */}
      <NewTabButton 
        onClick={onNewTab} 
        className={cn(
          "flex-shrink-0",
          responsive.isMobile ? "mx-0.5" : "mx-1"
        )}
        style={{ 
          minWidth: touchSizes.minTouchTarget,
          minHeight: touchSizes.minTouchTarget 
        }}
        responsive={responsive}
        touchSizes={touchSizes}
      />
    </div>
  );
};

// 标签栏骨架加载组件
export const TabBarSkeleton: React.FC = () => {
  return (
    <div className="flex items-center bg-muted/30 border-b border-border h-10">
      <TabSkeleton />
      <TabSkeleton />
      <TabSkeleton />
      <div className="flex-1" />
      <div className="w-8 h-8 bg-muted rounded animate-pulse mx-1" />
    </div>
  );
};