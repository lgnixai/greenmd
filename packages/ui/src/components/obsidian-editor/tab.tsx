import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { TabProps, TabAction } from '../../types/obsidian-editor';
import { getFileIcon, truncateText } from '../../utils/obsidian-editor-utils';
import { X, ChevronDown, Lock, Circle } from 'lucide-react';
import { ContextMenu, ContextMenuItem } from '../context-menu';
import { useDropdownManager } from './dropdown-manager';

export const Tab: React.FC<TabProps> = ({
  tab,
  isActive,
  onSelect,
  onClose,
  onMenuAction,
  onDragStart,
  onDragEnd,
  draggable = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const tabRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (tab.isLocked) return;
    onClose();
  };

  const handleMiddleClick = (e: React.MouseEvent) => {
    if (e.button === 1) { // 中键点击
      e.preventDefault();
      e.stopPropagation();
      if (!tab.isLocked) {
        onClose();
      }
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) {
      e.preventDefault();
      return;
    }

    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tab.id);
    
    // 创建拖拽预览
    const dragImage = tabRef.current?.cloneNode(true) as HTMLElement;
    if (dragImage) {
      dragImage.style.opacity = '0.8';
      dragImage.style.transform = 'rotate(5deg)';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }

    onDragStart?.(e);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd?.(e);
  };

  const handleMenuAction = (action: TabAction) => {
    setShowDropdown(false);
    onMenuAction(action);
  };

  // 监听全局关闭下拉菜单事件
  useEffect(() => {
    const handleCloseAllDropdowns = () => {
      setShowDropdown(false);
    };

    window.addEventListener('closeAllDropdowns', handleCloseAllDropdowns);
    return () => {
      window.removeEventListener('closeAllDropdowns', handleCloseAllDropdowns);
    };
  }, []);

  const getTabIcon = () => {
    if (tab.filePath) {
      return getFileIcon(tab.filePath);
    }
    
    switch (tab.type) {
      case 'welcome':
        return '🏠';
      case 'settings':
        return '⚙️';
      default:
        return '📄';
    }
  };

  const displayTitle = truncateText(tab.title, 20);

  return (
    <div
      ref={tabRef}
      className={cn(
        "group relative flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer select-none transition-all duration-200",
        "border-t-2 border-l border-r border-transparent",
        "hover:bg-accent/30 hover:border-t-accent",
        isActive && "bg-background border-t-primary border-l-border border-r-border text-foreground shadow-sm",
        !isActive && "bg-muted/20 text-muted-foreground hover:text-foreground",
        isDragging && "opacity-50 scale-95 z-50",
        tab.isLocked && "bg-accent/10"
      )}
      style={{
        borderTopLeftRadius: '6px',
        borderTopRightRadius: '6px',
        marginRight: '1px'
      }}
      onClick={handleClick}
      onMouseDown={handleMiddleClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-tab-id={tab.id}
    >
      {/* 文件图标 */}
      <span className="text-xs flex-shrink-0" role="img" aria-label="file icon">
        {getTabIcon()}
      </span>

      {/* 标题 */}
      <span 
        className={cn(
          "flex-1 min-w-0 truncate",
          isActive && "font-medium"
        )}
        title={tab.title}
      >
        {displayTitle}
      </span>

      {/* 状态指示器 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* 脏数据指示器 */}
        {tab.isDirty && (
          <Circle 
            className="w-2 h-2 fill-orange-500 text-orange-500" 
            title="未保存的更改"
          />
        )}

        {/* 锁定指示器 */}
        {tab.isLocked && (
          <Lock 
            className="w-3 h-3 text-muted-foreground" 
            title="已锁定"
          />
        )}

        {/* 下拉菜单 */}
        <button
          ref={dropdownButtonRef}
          className={cn(
            "p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity",
            showDropdown && "opacity-100"
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (!showDropdown && dropdownButtonRef.current) {
              const rect = dropdownButtonRef.current.getBoundingClientRect();
              setDropdownPosition({
                x: rect.left,
                y: rect.bottom + 4
              });
            }
            setShowDropdown(!showDropdown);
          }}
          title="更多选项"
        >
          <ChevronDown className="w-3 h-3" />
        </button>

        {/* 上下文菜单 */}
        {showDropdown && (
          <div
            className="fixed z-50 min-w-[140px] max-w-[180px] rounded border bg-popover text-popover-foreground shadow-md py-1"
            style={{ left: dropdownPosition.x, top: dropdownPosition.y }}
          >
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleMenuAction('close')}
            >
              关闭
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleMenuAction('closeOthers')}
            >
              关闭其他
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleMenuAction('closeAll')}
            >
              关闭所有
            </button>
            <div className="h-px bg-border my-1" />
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleMenuAction('duplicate')}
            >
              复制
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleMenuAction(tab.isLocked ? 'unlock' : 'lock')}
            >
              {tab.isLocked ? '解锁' : '锁定'}
            </button>
            <div className="h-px bg-border my-1" />
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleMenuAction('splitHorizontal')}
            >
              上下分屏
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleMenuAction('splitVertical')}
            >
              左右分屏
            </button>
            <div className="h-px bg-border my-1" />
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleMenuAction('rename')}
            >
              重命名
            </button>
            {tab.filePath && (
              <button
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleMenuAction('moveToNewWindow')}
              >
                新窗口
              </button>
            )}
          </div>
        )}

        {/* 关闭按钮 */}
        {!tab.isLocked && (
          <button
            className={cn(
              "p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all",
              isActive && "opacity-60"
            )}
            onClick={handleCloseClick}
            title="关闭标签页"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 拖拽指示器 */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/20 border-2 border-primary border-dashed rounded" />
      )}

      {/* 移除底部指示器，因为我们现在使用顶部边框 */}
    </div>
  );
};

// 标签页骨架加载组件
export const TabSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-r border-border/50">
      <div className="w-4 h-4 bg-muted rounded animate-pulse" />
      <div className="w-20 h-4 bg-muted rounded animate-pulse" />
      <div className="w-3 h-3 bg-muted rounded animate-pulse" />
    </div>
  );
};

// 新建标签页按钮
export const NewTabButton: React.FC<{
  onClick: () => void;
  className?: string;
}> = ({ onClick, className }) => {
  return (
    <button
      className={cn(
        "flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors",
        className
      )}
      onClick={onClick}
      title="新建标签页 (Ctrl+T)"
    >
      <span className="text-lg font-light">+</span>
    </button>
  );
};