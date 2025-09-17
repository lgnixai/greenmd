import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { TabProps, TabAction, Tab as TabType } from '../../types/obsidian-editor';
import { getFileIcon, truncateText } from '../../utils/obsidian-editor-utils';
import { dragDropManager } from '../../utils/drag-drop-manager';
import { RelatedTabsDialog } from './related-tabs-dialog';
import { TabGroupsDialog } from './tab-groups-dialog';
import { X, ChevronDown, Lock, Circle, Plus, Copy, Unlock, SplitSquareHorizontal, SplitSquareVertical, Edit, ExternalLink, Link, Folder } from 'lucide-react';
import { 
  useTabAccessibility, 
  useMenuAccessibility,
  useFocusTrap 
} from '../../hooks/useAccessibility';
import { 
  createAriaProps, 
  generateAriaId, 
  KEYBOARD_KEYS,
  ARIA_ROLES 
} from '../../utils/accessibility-utils';


export const Tab: React.FC<TabProps> = ({
  tab,
  isActive,
  onSelect,
  onClose,
  onMenuAction,
  onDragStart,
  onDragEnd,
  draggable = true,
  style,
  responsive,
  touchSizes
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [showRelatedDialog, setShowRelatedDialog] = useState(false);
  const [showGroupsDialog, setShowGroupsDialog] = useState(false);
  const tabRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Accessibility hooks
  const {
    announceTabSwitched,
    announceTabClosed,
    announceDragStarted,
    announceDragEnded
  } = useTabAccessibility();

  const {
    announceMenuOpened,
    announceMenuClosed,
    handleMenuKeyDown
  } = useMenuAccessibility();

  // Focus trap for dropdown menu
  useFocusTrap(dropdownRef, showDropdown);

  // Generate unique IDs for ARIA
  const tabId = generateAriaId('tab');
  const panelId = generateAriaId('tabpanel');
  const menuId = generateAriaId('menu');

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    if (!isActive) {
      announceTabSwitched(tab.title);
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (tab.isLocked) return;
    announceTabClosed(tab.title);
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
    announceDragStarted(tab.title);
    
    // 使用拖拽管理器处理拖拽开始
    const paneElement = tabRef.current?.closest('[data-pane-id]') as HTMLElement;
    const paneId = paneElement?.getAttribute('data-pane-id') || '';
    
    dragDropManager.startDrag(tab.id, paneId, e.nativeEvent);
    
    onDragStart?.(e);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    announceDragEnded();
    
    // 使用拖拽管理器处理拖拽结束
    dragDropManager.endDrag();
    
    onDragEnd?.(e);
  };

  const handleMenuAction = (action: TabAction) => {
    setShowDropdown(false);
    
    // 处理高级菜单功能
    if (action === 'showRelated') {
      setShowRelatedDialog(true);
      return;
    }
    
    if (action === 'addToGroup' || action === 'removeFromGroup') {
      setShowGroupsDialog(true);
      return;
    }
    
    // 其他操作交给父组件处理
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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case KEYBOARD_KEYS.ENTER:
      case KEYBOARD_KEYS.SPACE:
        e.preventDefault();
        handleClick(e as any);
        break;
      case KEYBOARD_KEYS.DELETE:
      case KEYBOARD_KEYS.BACKSPACE:
        if (!tab.isLocked) {
          e.preventDefault();
          handleCloseClick(e as any);
        }
        break;
      case KEYBOARD_KEYS.ARROW_DOWN:
        e.preventDefault();
        // Open dropdown menu
        if (dropdownButtonRef.current) {
          const rect = dropdownButtonRef.current.getBoundingClientRect();
          setDropdownPosition({
            x: rect.left - 50,
            y: rect.bottom + 4
          });
          setShowDropdown(true);
          announceMenuOpened();
        }
        break;
    }
  };

  return (
    <div
      ref={tabRef}
      className={cn(
        "group relative flex items-center cursor-pointer select-none transition-all duration-200",
        "border-t-2 border-l border-r border-transparent",
        "hover:bg-accent/30 hover:border-t-accent",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        isActive && "bg-background border-t-primary border-l-border border-r-border text-foreground shadow-sm",
        !isActive && "bg-muted/20 text-muted-foreground hover:text-foreground",
        isDragging && "opacity-50 scale-95 z-50",
        tab.isLocked && "bg-accent/10",
        // 响应式间距和文字大小
        responsive?.isMobile ? "gap-1 px-2 py-1 text-xs" : responsive?.isTablet ? "gap-1.5 px-2.5 py-1.5 text-sm" : "gap-2 px-3 py-1.5 text-sm"
      )}
      style={{
        borderTopLeftRadius: '6px',
        borderTopRightRadius: '6px',
        marginRight: '1px',
        minHeight: touchSizes?.minTouchTarget || 32,
        // 确保标签页有最大宽度限制
        maxWidth: responsive?.isMobile ? '160px' : responsive?.isTablet ? '200px' : '250px',
        minWidth: responsive?.isMobile ? '80px' : responsive?.isTablet ? '120px' : '150px',
        ...style
      }}
      onClick={handleClick}
      onMouseDown={handleMiddleClick}
      onKeyDown={handleKeyDown}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-tab-id={tab.id}
      tabIndex={0}
      {...createAriaProps({
        role: ARIA_ROLES.TAB,
        selected: isActive,
        controls: panelId,
        label: `${tab.title}${tab.isDirty ? ' (未保存)' : ''}${tab.isLocked ? ' (已锁定)' : ''}`,
        describedBy: tab.filePath ? `${tabId}-path` : undefined
      })}
    >
      {/* 文件图标 - 响应式显示 */}
      {(!responsive?.isMobile || isActive) && (
        <span className={cn(
          "flex-shrink-0",
          responsive?.isMobile ? "text-xs" : "text-xs"
        )} role="img" aria-label="file icon">
          {getTabIcon()}
        </span>
      )}

      {/* 标题 */}
      <span 
        className={cn(
          "flex-1 min-w-0 truncate",
          isActive && "font-medium"
        )}
        title={tab.title}
      >
        {responsive?.isMobile ? truncateText(tab.title, 12) : displayTitle}
      </span>

      {/* 状态指示器 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* 脏数据指示器 */}
        {tab.isDirty && (
          <Circle 
            className="w-2 h-2 fill-orange-500 text-orange-500" 
          />
        )}

        {/* 锁定指示器 */}
        {tab.isLocked && (
          <Lock 
            className="w-3 h-3 text-muted-foreground" 
          />
        )}

        {/* 下拉菜单 - 响应式显示 */}
        {(!responsive?.isMobile || isActive) && (
          <button
            ref={dropdownButtonRef}
            className={cn(
              "rounded transition-opacity",
              responsive?.isTouchDevice ? "p-1 opacity-100" : "p-0.5 opacity-0 group-hover:opacity-100",
              "hover:bg-accent",
              showDropdown && "opacity-100 bg-accent"
            )}
            style={{
              minWidth: responsive?.isTouchDevice ? touchSizes?.minTouchTarget : undefined,
              minHeight: responsive?.isTouchDevice ? touchSizes?.minTouchTarget : undefined
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!showDropdown && dropdownButtonRef.current) {
                const rect = dropdownButtonRef.current.getBoundingClientRect();
                setDropdownPosition({
                  x: rect.left - 50, // 向左偏移一些，让菜单更好地对齐
                  y: rect.bottom + 4
                });
                announceMenuOpened();
              } else {
                announceMenuClosed();
              }
              setShowDropdown(!showDropdown);
            }}
            onKeyDown={(e) => {
              if (e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) {
                e.preventDefault();
                e.stopPropagation();
                if (!showDropdown && dropdownButtonRef.current) {
                  const rect = dropdownButtonRef.current.getBoundingClientRect();
                  setDropdownPosition({
                    x: rect.left - 50,
                    y: rect.bottom + 4
                  });
                  announceMenuOpened();
                } else {
                  announceMenuClosed();
                }
                setShowDropdown(!showDropdown);
              }
            }}
            title="更多选项 (点击显示菜单)"
            {...createAriaProps({
              label: '标签页选项菜单',
              expanded: showDropdown,
              hasPopup: 'menu',
              controls: showDropdown ? menuId : undefined
            })}
          >
            <ChevronDown className={cn(
              responsive?.isMobile ? "w-4 h-4" : "w-3 h-3"
            )} />
          </button>
        )}

        {/* 上下文菜单 */}
        {showDropdown && (
          <TabDropdownMenu
            ref={dropdownRef}
            id={menuId}
            position={dropdownPosition}
            tab={tab}
            onAction={handleMenuAction}
            onClose={() => {
              setShowDropdown(false);
              announceMenuClosed();
            }}
          />
        )}

        {/* 关闭按钮 - 响应式显示 */}
        {!tab.isLocked && (!responsive?.isMobile || isActive) && (
          <button
            className={cn(
              "rounded hover:bg-destructive hover:text-destructive-foreground transition-all",
              responsive?.isTouchDevice ? "p-1 opacity-100" : "p-0.5 opacity-0 group-hover:opacity-100",
              isActive && !responsive?.isTouchDevice && "opacity-60"
            )}
            style={{
              minWidth: responsive?.isTouchDevice ? touchSizes?.minTouchTarget : undefined,
              minHeight: responsive?.isTouchDevice ? touchSizes?.minTouchTarget : undefined
            }}
            onClick={handleCloseClick}
            title="关闭标签页"
            {...createAriaProps({
              label: `关闭标签页 ${tab.title}`
            })}
          >
            <X className={cn(
              responsive?.isMobile ? "w-4 h-4" : "w-3 h-3"
            )} />
          </button>
        )}
      </div>

      {/* 拖拽指示器 */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/20 border-2 border-primary border-dashed rounded" />
      )}

      {/* 分组颜色指示器 */}
      {tab.color && (
        <div 
          className="absolute left-0 top-0 w-1 h-full rounded-l"
          style={{ backgroundColor: tab.color }}
          aria-hidden="true"
        />
      )}

      {/* 屏幕阅读器描述 */}
      {tab.filePath && (
        <div id={`${tabId}-path`} className="sr-only">
          文件路径: {tab.filePath}
        </div>
      )}

      {/* 关联标签页对话框 */}
      {showRelatedDialog && (
        <RelatedTabsDialog
          tab={tab}
          onClose={() => setShowRelatedDialog(false)}
          position={dropdownPosition}
        />
      )}

      {/* 标签页分组对话框 */}
      {showGroupsDialog && (
        <TabGroupsDialog
          tab={tab}
          onClose={() => setShowGroupsDialog(false)}
          position={dropdownPosition}
        />
      )}
    </div>
  );
};

// 标签页下拉菜单组件
interface TabDropdownMenuProps {
  id?: string;
  position: { x: number; y: number };
  tab: TabType;
  onAction: (action: TabAction) => void;
  onClose: () => void;
}

const TabDropdownMenu = React.forwardRef<HTMLDivElement, TabDropdownMenuProps>(({ 
  id, 
  position, 
  tab, 
  onAction, 
  onClose 
}, ref) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Combine refs
  const combinedRef = (node: HTMLDivElement) => {
    menuRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === KEYBOARD_KEYS.ESCAPE) {
        event.preventDefault();
        onClose();
        return;
      }

      // 键盘导航
      const menuItems = menuRef.current?.querySelectorAll('button');
      if (!menuItems) return;

      switch (event.key) {
        case KEYBOARD_KEYS.ARROW_DOWN:
          event.preventDefault();
          setFocusedIndex(prev => (prev + 1) % menuItems.length);
          break;
        case KEYBOARD_KEYS.ARROW_UP:
          event.preventDefault();
          setFocusedIndex(prev => (prev - 1 + menuItems.length) % menuItems.length);
          break;
        case KEYBOARD_KEYS.HOME:
          event.preventDefault();
          setFocusedIndex(0);
          break;
        case KEYBOARD_KEYS.END:
          event.preventDefault();
          setFocusedIndex(menuItems.length - 1);
          break;
        case KEYBOARD_KEYS.ENTER:
        case KEYBOARD_KEYS.SPACE:
          event.preventDefault();
          const focusedItem = menuItems[focusedIndex] as HTMLButtonElement;
          if (focusedItem) {
            focusedItem.click();
          }
          break;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    // 自动聚焦到第一个菜单项
    setTimeout(() => {
      const firstButton = menuRef.current?.querySelector('button');
      firstButton?.focus();
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // 更新焦点
  useEffect(() => {
    const menuItems = menuRef.current?.querySelectorAll('button');
    if (menuItems && menuItems[focusedIndex]) {
      (menuItems[focusedIndex] as HTMLElement).focus();
    }
  }, [focusedIndex]);

  // 调整菜单位置，确保不超出视窗
  const adjustedPosition = React.useMemo(() => {
    const menuWidth = 200;
    const menuHeight = 300; // 估算高度
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    // 水平位置调整
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }

    // 垂直位置调整
    if (y + menuHeight > viewportHeight) {
      y = position.y - menuHeight - 10;
    }

    return { x: Math.max(10, x), y: Math.max(10, y) };
  }, [position]);

  const menuItems = [
    {
      id: 'newTab',
      label: '新标签',
      icon: <Plus className="w-4 h-4" />,
      shortcut: 'Ctrl+T',
      action: () => onAction('newTab'),
      separator: false
    },
    {
      id: 'close',
      label: '关闭',
      icon: <X className="w-4 h-4" />,
      shortcut: 'Ctrl+W',
      action: () => onAction('close'),
      separator: false
    },
    {
      id: 'closeOthers',
      label: '关闭其他标签页',
      icon: null,
      shortcut: '',
      action: () => onAction('closeOthers'),
      separator: false
    },
    {
      id: 'closeAll',
      label: '全部关闭',
      icon: null,
      shortcut: 'Ctrl+Shift+W',
      action: () => onAction('closeAll'),
      separator: true
    },
    {
      id: 'duplicate',
      label: '复制标签页',
      icon: <Copy className="w-4 h-4" />,
      shortcut: '',
      action: () => onAction('duplicate'),
      separator: false
    },
    {
      id: 'lock',
      label: tab.isLocked ? '解锁' : '锁定',
      icon: tab.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />,
      shortcut: '',
      action: () => onAction(tab.isLocked ? 'unlock' : 'lock'),
      separator: true
    },
    {
      id: 'showRelated',
      label: '关联标签页',
      icon: <Link className="w-4 h-4" />,
      shortcut: '',
      action: () => onAction('showRelated'),
      separator: false
    },
    {
      id: 'addToGroup',
      label: tab.groupId ? '移出分组' : '添加到分组',
      icon: <Folder className="w-4 h-4" />,
      shortcut: '',
      action: () => onAction(tab.groupId ? 'removeFromGroup' : 'addToGroup'),
      separator: true
    },
    {
      id: 'splitHorizontal',
      label: '上下分屏',
      icon: <SplitSquareHorizontal className="w-4 h-4" />,
      shortcut: '',
      action: () => onAction('splitHorizontal'),
      separator: false
    },
    {
      id: 'splitVertical',
      label: '左右分屏',
      icon: <SplitSquareVertical className="w-4 h-4" />,
      shortcut: '',
      action: () => onAction('splitVertical'),
      separator: true
    },
    {
      id: 'rename',
      label: '重命名',
      icon: <Edit className="w-4 h-4" />,
      shortcut: 'F2',
      action: () => onAction('rename'),
      separator: false
    }
  ];

  // 如果有文件路径，添加"移动至新窗口"选项
  if (tab.filePath) {
    menuItems.push({
      id: 'moveToNewWindow',
      label: '移动至新窗口',
      icon: <ExternalLink className="w-4 h-4" />,
      shortcut: '',
      action: () => onAction('moveToNewWindow'),
      separator: false
    });
  }

  const handleItemClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={combinedRef}
      id={id}
      className="fixed z-50 min-w-[200px] rounded-md border bg-popover text-popover-foreground shadow-lg py-1 dropdown-menu"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
      {...createAriaProps({
        role: ARIA_ROLES.MENU,
        label: '标签页操作菜单'
      })}
    >
      {menuItems.map((item, index) => (
        <React.Fragment key={item.id}>
          <button
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors",
              "focus:bg-accent focus:text-accent-foreground focus:outline-none",
              focusedIndex === index && "bg-accent text-accent-foreground"
            )}
            onClick={() => handleItemClick(item.action)}
            onKeyDown={(e) => {
              if (e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) {
                e.preventDefault();
                handleItemClick(item.action);
              }
            }}
            onMouseEnter={() => setFocusedIndex(index)}
            tabIndex={-1}
            {...createAriaProps({
              role: ARIA_ROLES.MENUITEM,
              label: `${item.label}${item.shortcut ? ` (快捷键: ${item.shortcut})` : ''}`
            })}
          >
            <span className="flex items-center justify-center w-4 h-4 flex-shrink-0">
              {item.icon}
            </span>
            <span className="flex-1 min-w-0">
              {item.label}
            </span>
            {item.shortcut && (
              <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
                {item.shortcut}
              </span>
            )}
          </button>
          {item.separator && index < menuItems.length - 1 && (
            <div className="h-px bg-border my-1" role="separator" aria-hidden="true" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
});

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
  style?: React.CSSProperties;
  responsive?: any;
  touchSizes?: any;
}> = ({ onClick, className, style, responsive, touchSizes }) => {
  return (
    <button
      className={cn(
        "flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors",
        responsive?.isMobile ? "w-8 h-8" : "w-8 h-8",
        className
      )}
      style={{
        minWidth: touchSizes?.minTouchTarget || 32,
        minHeight: touchSizes?.minTouchTarget || 32,
        ...style
      }}
      onClick={onClick}
      title="新建标签页 (Ctrl+T)"
      {...createAriaProps({
        label: '新建标签页 (快捷键: Ctrl+T)'
      })}
    >
      <span className={cn(
        "font-light",
        responsive?.isMobile ? "text-lg" : "text-lg"
      )}>+</span>
    </button>
  );
};