import React, { useState, useRef, useCallback } from 'react';
import { cn } from '../lib/utils';
import { ChevronUp } from 'lucide-react';

export interface ResizableBottomPanelProps {
  children: React.ReactNode;
  className?: string;
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  onResize?: (height: number) => void;
  onToggle?: (isVisible: boolean) => void;
  isVisible?: boolean;
}

export const ResizableBottomPanel: React.FC<ResizableBottomPanelProps> = ({
  children,
  className,
  defaultHeight = 200,
  minHeight = 100,
  maxHeight = 600,
  onResize,
  onToggle,
  isVisible = true
}) => {
  const [height, setHeight] = useState(defaultHeight);
  const [isResizing, setIsResizing] = useState(false);
  // const [isMaximized, setIsMaximized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startYRef.current = e.clientY;
    startHeightRef.current = height;
  }, [height]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !panelRef.current) return;

    const deltaY = startYRef.current - e.clientY; // 向上拖拽增加高度
    const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeightRef.current + deltaY));
    
    setHeight(newHeight);
    onResize?.(newHeight);
  }, [isResizing, minHeight, maxHeight, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleToggle = useCallback(() => {
    onToggle?.(!isVisible);
  }, [isVisible, onToggle]);

  // const handleMaximize = useCallback(() => {
  //   if (isMaximized) {
  //     setHeight(defaultHeight);
  //     setIsMaximized(false);
  //   } else {
  //     setHeight(maxHeight);
  //     setIsMaximized(true);
  //   }
  // }, [isMaximized, defaultHeight, maxHeight]);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (!isVisible) {
    return (
      <div className="h-6 bg-statusBar-background border-t flex items-center justify-center">
        <button
          onClick={handleToggle}
          className="p-1 hover:bg-accent rounded"
          title="显示面板"
        >
          <ChevronUp className="w-4 h-4 rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* 拖拽手柄 */}
      <div
        className={cn(
          "h-1 cursor-row-resize transition-colors flex items-center justify-center",
          isResizing ? "bg-blue-500" : "bg-transparent hover:bg-blue-400"
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="w-8 h-0.5 bg-border rounded" />
      </div>

      {/* 面板内容 */}
      <div
        ref={panelRef}
        className={cn("bg-background border-t", className)}
        style={{ height: `${height}px`, minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
      >
        {children}
      </div>
    </div>
  );
};
