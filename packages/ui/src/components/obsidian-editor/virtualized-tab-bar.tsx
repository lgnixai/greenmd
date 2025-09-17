import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { TabBarProps, Tab as TabType } from '../../types/obsidian-editor';
import { Tab, NewTabButton } from './tab';
import { TabVirtualizer } from '../../utils/performance-optimizer';
import { useResponsiveDesign } from '../../hooks/useResponsiveDesign';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../button';

interface VirtualizedTabBarProps extends TabBarProps {
  onPaneClose?: (paneId: string) => void;
  canClosePane?: boolean;
  virtualizationThreshold?: number; // Number of tabs before virtualization kicks in
}

export const VirtualizedTabBar: React.FC<VirtualizedTabBarProps> = ({
  tabs,
  activeTab,
  paneId,
  onTabClick,
  onTabClose,
  onTabDrag,
  onNewTab,
  onTabAction,
  onPaneClose,
  canClosePane = true,
  virtualizationThreshold = 20
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeftState, setCanScrollLeftState] = useState(false);
  const [canScrollRightState, setCanScrollRightState] = useState(false);

  const responsive = useResponsiveDesign({
    mobile: 768,
    tablet: 1024
  });

  // Tab dimensions
  const TAB_WIDTH = responsive.isMobile ? 120 : 160;
  const TAB_HEIGHT = responsive.isMobile ? 36 : 40;

  // Determine if virtualization should be used
  const shouldVirtualize = tabs.length > virtualizationThreshold;

  // Create virtualizer instance
  const virtualizer = useMemo(() => {
    if (!shouldVirtualize) return null;
    
    return new TabVirtualizer({
      itemHeight: TAB_HEIGHT,
      containerHeight: TAB_HEIGHT,
      overscan: 3
    });
  }, [shouldVirtualize, TAB_HEIGHT]);

  // Update container dimensions
  const updateDimensions = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { clientWidth, scrollLeft: currentScrollLeft, scrollWidth } = container;
    setContainerWidth(clientWidth);
    setScrollLeft(currentScrollLeft);
    setCanScrollLeftState(currentScrollLeft > 0);
    setCanScrollRightState(currentScrollLeft < scrollWidth - clientWidth - 1);

    // Update virtualizer scroll position
    if (virtualizer) {
      virtualizer.updateScrollTop(currentScrollLeft);
    }
  }, [virtualizer]);

  useEffect(() => {
    updateDimensions();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateDimensions);
      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(container);
      
      return () => {
        container.removeEventListener('scroll', updateDimensions);
        resizeObserver.disconnect();
      };
    }
  }, [updateDimensions]);

  // Calculate visible tabs for virtualization
  const visibleTabs = useMemo(() => {
    if (!shouldVirtualize || !virtualizer) {
      return tabs.map((tab, index) => ({ tab, index }));
    }

    const visibleRange = virtualizer.getVisibleRange();
    return tabs
      .slice(visibleRange.start, visibleRange.end + 1)
      .map((tab, relativeIndex) => ({
        tab,
        index: visibleRange.start + relativeIndex
      }));
  }, [tabs, shouldVirtualize, virtualizer, scrollLeft]);

  // Scroll to active tab
  const scrollToActiveTab = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !activeTab) return;

    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (activeIndex === -1) return;

    const tabLeft = activeIndex * TAB_WIDTH;
    const tabRight = tabLeft + TAB_WIDTH;
    const containerLeft = container.scrollLeft;
    const containerRight = containerLeft + container.clientWidth;

    if (tabLeft < containerLeft) {
      container.scrollTo({ left: tabLeft - 20, behavior: 'smooth' });
    } else if (tabRight > containerRight) {
      container.scrollTo({ left: tabRight - container.clientWidth + 20, behavior: 'smooth' });
    }
  }, [activeTab, tabs, TAB_WIDTH]);

  useEffect(() => {
    scrollToActiveTab();
  }, [scrollToActiveTab]);

  // Scroll controls
  const scrollLeftHandler = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -TAB_WIDTH * 3, behavior: 'smooth' });
    }
  };

  const scrollRightHandler = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: TAB_WIDTH * 3, behavior: 'smooth' });
    }
  };

  // Render virtualized or normal tabs
  const renderTabs = () => {
    if (!shouldVirtualize) {
      // Normal rendering for small number of tabs
      return tabs.map((tab, index) => (
        <div
          key={tab.id}
          style={{ width: TAB_WIDTH, flexShrink: 0 }}
        >
          <Tab
            tab={tab}
            isActive={tab.id === activeTab}
            onSelect={() => onTabClick(tab.id)}
            onClose={() => onTabClose(tab.id)}
            onMenuAction={(action) => onTabAction(tab.id, action)}
            draggable={!responsive.isTouchDevice}
            responsive={responsive}
            touchSizes={{
              tabHeight: TAB_HEIGHT,
              minTouchTarget: responsive.isMobile ? 44 : 32
            }}
          />
        </div>
      ));
    }

    // Virtualized rendering
    const totalWidth = tabs.length * TAB_WIDTH;
    
    return (
      <div style={{ position: 'relative', width: totalWidth, height: TAB_HEIGHT }}>
        {visibleTabs.map(({ tab, index }) => (
          <div
            key={tab.id}
            style={{
              position: 'absolute',
              left: index * TAB_WIDTH,
              width: TAB_WIDTH,
              height: TAB_HEIGHT
            }}
          >
            <Tab
              tab={tab}
              isActive={tab.id === activeTab}
              onSelect={() => onTabClick(tab.id)}
              onClose={() => onTabClose(tab.id)}
              onMenuAction={(action) => onTabAction(tab.id, action)}
              draggable={!responsive.isTouchDevice}
              responsive={responsive}
              touchSizes={{
                tabHeight: TAB_HEIGHT,
                minTouchTarget: responsive.isMobile ? 44 : 32
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      className={cn(
        "flex items-center bg-muted/30 border-b border-border",
        responsive.isMobile && "px-1",
        responsive.isTablet && "px-2"
      )}
      style={{ height: TAB_HEIGHT }}
    >
      {/* Left scroll button */}
      {canScrollLeftState && (
        <Button
          variant="ghost"
          size="sm"
          className="p-0 flex-shrink-0 h-8 w-8"
          onClick={scrollLeftHandler}
          title="向左滚动"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      {/* Tab container */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex-1 overflow-x-auto scrollbar-none",
          shouldVirtualize ? "relative" : "flex"
        )}
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          height: TAB_HEIGHT
        }}
        data-pane-id={paneId}
      >
        {tabs.length === 0 ? (
          <div className={cn(
            "flex items-center justify-center w-full py-4 text-muted-foreground",
            responsive.isMobile ? "text-xs" : "text-sm"
          )}>
            {responsive.isMobile ? "无标签页" : "没有打开的标签页"}
          </div>
        ) : (
          renderTabs()
        )}
      </div>

      {/* Right scroll button */}
      {canScrollRightState && (
        <Button
          variant="ghost"
          size="sm"
          className="p-0 flex-shrink-0 h-8 w-8"
          onClick={scrollRightHandler}
          title="向右滚动"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}

      {/* New tab button */}
      <NewTabButton 
        onClick={onNewTab} 
        className="flex-shrink-0 mx-1"
        responsive={responsive}
        touchSizes={{
          tabHeight: TAB_HEIGHT,
          minTouchTarget: responsive.isMobile ? 44 : 32
        }}
      />
    </div>
  );
};

// Performance monitoring wrapper
export const PerformantTabBar: React.FC<VirtualizedTabBarProps> = (props) => {
  const startTime = useRef<number>();
  
  useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      if (startTime.current) {
        const renderTime = performance.now() - startTime.current;
        if (renderTime > 16) { // More than one frame
          console.warn(`TabBar render took ${renderTime.toFixed(2)}ms`);
        }
      }
    };
  });

  return <VirtualizedTabBar {...props} />;
};