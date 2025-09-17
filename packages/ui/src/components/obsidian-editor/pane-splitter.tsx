import React, { useRef, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { PaneSplitter } from '../../types/obsidian-editor';
import { useResponsiveDesign, getTouchOptimizedSizes } from '../../hooks/useResponsiveDesign';
import { useObsidianEditorStore } from '../../stores/obsidian-editor-store';
import { GripVertical, GripHorizontal } from 'lucide-react';

interface PaneSplitterComponentProps {
  splitter: PaneSplitter;
  onDragStart: (splitterId: string, startPosition: number, startMousePosition: number) => void;
  onDrag: (mousePosition: number) => void;
  onDragEnd: () => void;
  onDoubleClick?: () => void;
}

export const PaneSplitterComponent: React.FC<PaneSplitterComponentProps> = ({
  splitter,
  onDragStart,
  onDrag,
  onDragEnd,
  onDoubleClick
}) => {
  const splitterRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { settings } = useObsidianEditorStore();
  const responsive = useResponsiveDesign({
    mobile: settings.responsive.mobileBreakpoint,
    tablet: settings.responsive.tabletBreakpoint
  });
  const touchSizes = getTouchOptimizedSizes(responsive.isTouchDevice, responsive.isMobile);

  const isHorizontal = splitter.direction === 'horizontal';

  // 处理鼠标按下和触摸开始
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startPosition = isHorizontal ? e.clientY : e.clientX;
    onDragStart(splitter.id, splitter.position, startPosition);

    // 添加全局指针事件监听（支持鼠标和触摸）
    const handlePointerMove = (e: PointerEvent) => {
      const position = isHorizontal ? e.clientY : e.clientX;
      onDrag(position);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      onDragEnd();
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }, [splitter.id, splitter.position, isHorizontal, onDragStart, onDrag, onDragEnd]);

  // 处理双击
  const handleDoubleClick = useCallback(() => {
    onDoubleClick?.();
  }, [onDoubleClick]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDoubleClick();
    }

    // 方向键调整分割器位置
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      
      let delta = 0;
      const step = 0.05; // 5% 步长

      if (isHorizontal) {
        if (e.key === 'ArrowUp') delta = -step;
        if (e.key === 'ArrowDown') delta = step;
      } else {
        if (e.key === 'ArrowLeft') delta = -step;
        if (e.key === 'ArrowRight') delta = step;
      }

      if (delta !== 0) {
        // 这里需要调用 resize 方法，但我们没有直接的回调
        // 可以通过触发一个模拟的拖拽事件来实现
        onDragStart(splitter.id, splitter.position, 0);
        onDrag(delta * 1000); // 模拟鼠标移动
        onDragEnd();
      }
    }
  }, [splitter.id, splitter.position, isHorizontal, onDragStart, onDrag, onDragEnd, handleDoubleClick]);

  return (
    <div
      ref={splitterRef}
      className={cn(
        "relative flex items-center justify-center bg-border hover:bg-border/80 transition-colors select-none group",
        isHorizontal && "cursor-row-resize w-full",
        !isHorizontal && "cursor-col-resize h-full",
        isDragging && "bg-primary/50",
        isHovered && "bg-border/60",
        // 响应式尺寸
        responsive.isTouchDevice && isHorizontal && `h-[${touchSizes.splitterSize}px]`,
        responsive.isTouchDevice && !isHorizontal && `w-[${touchSizes.splitterSize}px]`,
        !responsive.isTouchDevice && isHorizontal && "h-1",
        !responsive.isTouchDevice && !isHorizontal && "w-1"
      )}
      style={{
        // 确保触摸设备上有足够的触摸目标
        minHeight: isHorizontal ? touchSizes.splitterSize : undefined,
        minWidth: !isHorizontal ? touchSizes.splitterSize : undefined,
        touchAction: 'none' // 防止触摸滚动干扰拖拽
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="separator"
      aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
      aria-label={`调整${isHorizontal ? '上下' : '左右'}面板大小`}
      title={responsive.isTouchDevice ? `拖拽调整面板大小` : `双击重置分割比例，使用方向键微调`}
    >
      {/* 拖拽手柄 - 响应式显示 */}
      <div
        className={cn(
          "absolute bg-muted-foreground/20 rounded-full transition-opacity flex items-center justify-center",
          responsive.isTouchDevice ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          isHorizontal && (responsive.isTouchDevice ? "w-12 h-1" : "w-8 h-1"),
          !isHorizontal && (responsive.isTouchDevice ? "w-1 h-12" : "w-1 h-8"),
          isDragging && "opacity-100 bg-primary/30"
        )}
      >
        {isHorizontal ? (
          <GripHorizontal className={cn(
            "text-muted-foreground",
            responsive.isTouchDevice ? "w-5 h-5" : "w-4 h-4"
          )} />
        ) : (
          <GripVertical className={cn(
            "text-muted-foreground",
            responsive.isTouchDevice ? "w-5 h-5" : "w-4 h-4"
          )} />
        )}
      </div>

      {/* 拖拽时的视觉反馈 */}
      {isDragging && (
        <div
          className={cn(
            "absolute bg-primary/20 pointer-events-none",
            isHorizontal && "w-full h-0.5 top-1/2 -translate-y-1/2",
            !isHorizontal && "h-full w-0.5 left-1/2 -translate-x-1/2"
          )}
        />
      )}

      {/* 扩展触摸区域（增加拖拽目标） */}
      <div
        className={cn(
          "absolute bg-transparent",
          isHorizontal && `w-full top-1/2 -translate-y-1/2`,
          !isHorizontal && `h-full left-1/2 -translate-x-1/2`,
          // 触摸设备上提供更大的触摸区域
          responsive.isTouchDevice && isHorizontal && "h-6",
          responsive.isTouchDevice && !isHorizontal && "w-6",
          !responsive.isTouchDevice && isHorizontal && "h-2",
          !responsive.isTouchDevice && !isHorizontal && "w-2"
        )}
      />
    </div>
  );
};

// 分割器预览组件（用于拖拽时显示预览）
export const SplitterPreview: React.FC<{
  direction: 'horizontal' | 'vertical';
  position: number;
  containerRect: DOMRect;
}> = ({ direction, position, containerRect }) => {
  const isHorizontal = direction === 'horizontal';
  
  const style = isHorizontal
    ? {
        top: `${position * containerRect.height}px`,
        left: 0,
        right: 0,
        height: '2px'
      }
    : {
        left: `${position * containerRect.width}px`,
        top: 0,
        bottom: 0,
        width: '2px'
      };

  return (
    <div
      className="absolute bg-primary/50 pointer-events-none z-50"
      style={style}
    />
  );
};