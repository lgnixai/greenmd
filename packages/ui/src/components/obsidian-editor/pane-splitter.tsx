import React, { useRef, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { PaneSplitter } from '../../types/obsidian-editor';
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

  const isHorizontal = splitter.direction === 'horizontal';

  // 处理鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startMousePosition = isHorizontal ? e.clientY : e.clientX;
    onDragStart(splitter.id, splitter.position, startMousePosition);

    // 添加全局鼠标事件监听
    const handleMouseMove = (e: MouseEvent) => {
      const mousePosition = isHorizontal ? e.clientY : e.clientX;
      onDrag(mousePosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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
        const newPosition = Math.max(0.1, Math.min(0.9, splitter.position + delta));
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
        "relative flex items-center justify-center bg-border hover:bg-border/80 transition-colors cursor-col-resize select-none group",
        isHorizontal && "cursor-row-resize h-1 w-full",
        !isHorizontal && "cursor-col-resize w-1 h-full",
        isDragging && "bg-primary/50",
        isHovered && "bg-border/60"
      )}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="separator"
      aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
      aria-label={`调整${isHorizontal ? '上下' : '左右'}面板大小`}
      title={`双击重置分割比例，使用方向键微调`}
    >
      {/* 拖拽手柄 */}
      <div
        className={cn(
          "absolute bg-muted-foreground/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",
          isHorizontal && "w-8 h-1",
          !isHorizontal && "w-1 h-8",
          isDragging && "opacity-100 bg-primary/30"
        )}
      >
        {isHorizontal ? (
          <GripHorizontal className="w-4 h-4 text-muted-foreground" />
        ) : (
          <GripVertical className="w-4 h-4 text-muted-foreground" />
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

      {/* 悬停时的扩展区域（增加拖拽目标） */}
      <div
        className={cn(
          "absolute bg-transparent",
          isHorizontal && "w-full h-2 top-1/2 -translate-y-1/2",
          !isHorizontal && "h-full w-2 left-1/2 -translate-x-1/2"
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