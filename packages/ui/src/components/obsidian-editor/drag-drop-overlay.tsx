import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { DragPosition } from '../../types/obsidian-editor';
import { dragDropManager, DragDropState } from '../../utils/drag-drop-manager';

interface DragDropOverlayProps {
  containerRef: React.RefObject<HTMLElement>;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ containerRef }) => {
  const [dragState, setDragState] = useState<DragDropState>(dragDropManager.getState());

  useEffect(() => {
    const handleStateChange = (state: DragDropState) => {
      setDragState(state);
    };

    dragDropManager.addListener(handleStateChange);
    return () => dragDropManager.removeListener(handleStateChange);
  }, []);

  if (!dragState.isDragging || !dragState.dragOverPosition || !containerRef.current) {
    return null;
  }

  return (
    <DragIndicators
      position={dragState.dragOverPosition}
      containerElement={containerRef.current}
    />
  );
};

interface DragIndicatorsProps {
  position: DragPosition;
  containerElement: HTMLElement;
}

const DragIndicators: React.FC<DragIndicatorsProps> = ({ position, containerElement }) => {
  const containerRect = containerElement.getBoundingClientRect();

  switch (position.zone) {
    case 'tab':
      return <TabInsertIndicator position={position} containerRect={containerRect} />;
    
    case 'split-horizontal':
      return <SplitIndicator direction="horizontal" position={position} containerRect={containerRect} />;
    
    case 'split-vertical':
      return <SplitIndicator direction="vertical" position={position} containerRect={containerRect} />;
    
    case 'pane':
      return <PaneMergeIndicator position={position} containerRect={containerRect} />;
    
    default:
      return null;
  }
};

interface TabInsertIndicatorProps {
  position: DragPosition;
  containerRect: DOMRect;
}

const TabInsertIndicator: React.FC<TabInsertIndicatorProps> = ({ position, containerRect }) => {
  const [insertPosition, setInsertPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // 计算插入位置
    const tabElements = Array.from(
      document.querySelectorAll('[data-tab-id]')
    ) as HTMLElement[];

    if (tabElements.length === 0) {
      setInsertPosition(null);
      return;
    }

    const targetIndex = position.targetIndex || 0;
    let x = 0;

    if (targetIndex === 0) {
      // 插入到第一个位置
      const firstTab = tabElements[0];
      if (firstTab) {
        const rect = firstTab.getBoundingClientRect();
        x = rect.left - containerRect.left;
      }
    } else if (targetIndex >= tabElements.length) {
      // 插入到最后一个位置
      const lastTab = tabElements[tabElements.length - 1];
      if (lastTab) {
        const rect = lastTab.getBoundingClientRect();
        x = rect.right - containerRect.left;
      }
    } else {
      // 插入到中间位置
      const targetTab = tabElements[targetIndex];
      if (targetTab) {
        const rect = targetTab.getBoundingClientRect();
        x = rect.left - containerRect.left;
      }
    }

    setInsertPosition({ x, y: 0 });
  }, [position.targetIndex, containerRect]);

  if (!insertPosition) return null;

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-primary z-50 animate-pulse"
      style={{
        left: `${insertPosition.x}px`,
        transform: 'translateX(-50%)'
      }}
    />
  );
};

interface SplitIndicatorProps {
  direction: 'horizontal' | 'vertical';
  position: DragPosition;
  containerRect: DOMRect;
}

const SplitIndicator: React.FC<SplitIndicatorProps> = ({ direction, position, containerRect }) => {
  const isHorizontal = direction === 'horizontal';
  const isStart = (position.targetIndex || 0) === 0;

  const style = isHorizontal
    ? {
        left: 0,
        right: 0,
        height: '2px',
        [isStart ? 'top' : 'bottom']: 0
      }
    : {
        top: 0,
        bottom: 0,
        width: '2px',
        [isStart ? 'left' : 'right']: 0
      };

  return (
    <>
      {/* 分割线指示器 */}
      <div
        className="absolute bg-primary z-50 animate-pulse"
        style={style}
      />
      
      {/* 分割区域预览 */}
      <div
        className={cn(
          "absolute bg-primary/10 border-2 border-primary border-dashed z-40",
          isHorizontal && "left-0 right-0",
          !isHorizontal && "top-0 bottom-0"
        )}
        style={
          isHorizontal
            ? {
                [isStart ? 'top' : 'bottom']: 0,
                height: '50%'
              }
            : {
                [isStart ? 'left' : 'right']: 0,
                width: '50%'
              }
        }
      >
        <div className="flex items-center justify-center h-full text-primary font-medium">
          {isHorizontal ? '水平分割' : '垂直分割'}
        </div>
      </div>
    </>
  );
};

interface PaneMergeIndicatorProps {
  position: DragPosition;
  containerRect: DOMRect;
}

const PaneMergeIndicator: React.FC<PaneMergeIndicatorProps> = ({ position, containerRect }) => {
  return (
    <div className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed z-40">
      <div className="flex items-center justify-center h-full text-primary font-medium">
        合并到此面板
      </div>
    </div>
  );
};

// 拖拽预览组件
interface DragPreviewProps {
  tabTitle: string;
  isDragging: boolean;
}

export const DragPreview: React.FC<DragPreviewProps> = ({ tabTitle, isDragging }) => {
  if (!isDragging) return null;

  return (
    <div className="fixed pointer-events-none z-50 opacity-80 transform rotate-3 scale-95">
      <div className="bg-background border border-primary rounded-t-md px-3 py-1.5 shadow-lg">
        <span className="text-sm font-medium">{tabTitle}</span>
      </div>
    </div>
  );
};

// 拖拽区域高亮组件
interface DropZoneHighlightProps {
  isActive: boolean;
  type: 'tab' | 'pane' | 'split';
  className?: string;
}

export const DropZoneHighlight: React.FC<DropZoneHighlightProps> = ({ 
  isActive, 
  type, 
  className 
}) => {
  if (!isActive) return null;

  const highlightClass = {
    tab: 'bg-primary/20 border-primary',
    pane: 'bg-accent/30 border-accent',
    split: 'bg-destructive/20 border-destructive'
  }[type];

  return (
    <div 
      className={cn(
        "absolute inset-0 border-2 border-dashed rounded transition-all duration-200 pointer-events-none z-30",
        highlightClass,
        className
      )}
    />
  );
};