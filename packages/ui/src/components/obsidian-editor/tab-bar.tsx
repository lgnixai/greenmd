import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { TabBarProps, Tab as TabType, TabAction, DragPosition } from '../../types/obsidian-editor';
import { Tab, NewTabButton, TabSkeleton } from './tab';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '../button';
import { ContextMenu, ContextMenuItem } from '../context-menu';

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  paneId,
  onTabClick,
  onTabClose,
  onTabDrag,
  onNewTab,
  onTabAction
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);

  // 检查滚动状态
  const checkScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

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

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // 找到最接近的标签页
    const tabElements = Array.from(container.querySelectorAll('[data-tab-id]')) as HTMLElement[];
    let closestIndex = 0;
    let closestDistance = Infinity;
    let position: 'before' | 'after' = 'before';

    tabElements.forEach((element, index) => {
      const elementRect = element.getBoundingClientRect();
      const elementX = elementRect.left - rect.left;
      const elementCenter = elementX + elementRect.width / 2;
      
      const distance = Math.abs(x - elementCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
        position = x < elementCenter ? 'before' : 'after';
      }
    });

    setDragOverIndex(closestIndex);
    setDragOverPosition(position);
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
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedTabId = e.dataTransfer.getData('text/plain');
    
    if (dragOverIndex !== null && dragOverPosition) {
      const targetIndex = dragOverPosition === 'after' ? dragOverIndex + 1 : dragOverIndex;
      
      const position: DragPosition = {
        x: e.clientX,
        y: e.clientY,
        zone: 'tab',
        targetIndex
      };
      
      onTabDrag(draggedTabId, position);
    }

    setDragOverIndex(null);
    setDragOverPosition(null);
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
        case 'Tab':
          e.preventDefault();
          const currentIndex = tabs.findIndex(t => t.id === activeTab);
          if (currentIndex !== -1) {
            const nextIndex = e.shiftKey 
              ? (currentIndex - 1 + tabs.length) % tabs.length
              : (currentIndex + 1) % tabs.length;
            onTabClick(tabs[nextIndex].id);
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
        }
      }
    }
  };

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
      className="flex items-center bg-muted/30 border-b border-border"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* 左滚动按钮 */}
      {canScrollLeft && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 flex-shrink-0"
          onClick={scrollLeft}
          title="向左滚动"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      {/* 标签页容器 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex overflow-x-auto scrollbar-none relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.length === 0 ? (
          // 空状态
          <div className="flex items-center justify-center w-full py-4 text-muted-foreground text-sm">
            没有打开的标签页
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
                onDragStart={(e) => {
                  // 可以在这里添加拖拽开始的逻辑
                }}
                onDragEnd={(e) => {
                  setDragOverIndex(null);
                  setDragOverPosition(null);
                }}
                draggable={true}
              />
              {renderDropIndicator(index, 'after')}
            </div>
          ))
        )}
      </div>

      {/* 右滚动按钮 */}
      {canScrollRight && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 flex-shrink-0"
          onClick={scrollRight}
          title="向右滚动"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}

      {/* 标签页菜单 */}
      {tabs.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 flex-shrink-0"
          title="标签页菜单"
          onClick={() => {
            // 这里可以实现标签页菜单的显示逻辑
            console.log('Show tab menu');
          }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      )}

      {/* 新建标签页按钮 */}
      <NewTabButton onClick={onNewTab} className="flex-shrink-0 mx-1" />
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