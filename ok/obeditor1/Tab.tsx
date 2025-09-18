import React, { useState } from 'react';
import { X, ChevronDown, MoreHorizontal, ArrowLeft, ArrowRight, Lock, Plus } from 'lucide-react';
import { cn } from '../../packages/ui/src/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../packages/ui/src/components/ui/dropdown-menu';
import { TEXT } from '@/components/obeditor/constants';

export interface Tab {
  id: string;
  title: string;
  isActive: boolean;
  isDirty?: boolean;
  isLocked?: boolean;
  filePath?: string;
}

interface TabProps {
  tab: Tab;
  onClose: (id: string) => void;
  onActivate: (id: string) => void;
  onCloseOthers: (id: string) => void;
  onCloseAll: () => void;
  onSplitHorizontal: (id: string) => void;
  onSplitVertical: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onCopyPath?: (id: string) => void;
  onRevealInExplorer?: (id: string) => void;
}

const Tab: React.FC<TabProps> = ({ 
  tab, 
  onClose, 
  onActivate, 
  onCloseOthers, 
  onCloseAll, 
  onSplitHorizontal, 
  onSplitVertical,
  onToggleLock,
  onDuplicate,
  onRename,
  onCopyPath,
  onRevealInExplorer
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(tab.title);

  const handleDropdownClick = (action: string) => {
    setIsDropdownOpen(false);
    switch (action) {
      case 'close':
        if (!tab.isLocked) onClose(tab.id);
        break;
      case 'closeOthers':
        onCloseOthers(tab.id);
        break;
      case 'closeAll':
        onCloseAll();
        break;
      case 'splitHorizontal':
        onSplitHorizontal(tab.id);
        break;
      case 'splitVertical':
        onSplitVertical(tab.id);
        break;
      case 'toggleLock':
        onToggleLock(tab.id);
        break;
      case 'duplicate':
        onDuplicate(tab.id);
        break;
      case 'rename':
        setIsRenaming(true);
        setNewTitle(tab.title);
        break;
      case 'copyPath':
        if (onCopyPath) onCopyPath(tab.id);
        break;
      case 'revealInExplorer':
        if (onRevealInExplorer) onRevealInExplorer(tab.id);
        break;
    }
  };

  const handleRenameSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onRename(tab.id, newTitle);
      setIsRenaming(false);
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setNewTitle(tab.title);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-center min-w-0 max-w-[200px] h-8",
        "border-r border-border",
        tab.isActive 
          ? "bg-background" 
          : "bg-muted hover:bg-muted/80"
      )}
    >
      {/* Tab content */}
      <div 
        className="flex-1 flex items-center px-3 cursor-pointer min-w-0"
        onClick={() => onActivate(tab.id)}
      >
        {tab.isLocked && (
          <Lock className="w-3 h-3 mr-1.5 text-muted-foreground" />
        )}
        
        {isRenaming ? (
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleRenameSubmit}
            onBlur={() => setIsRenaming(false)}
            className="flex-1 text-sm bg-transparent border-none outline-none text-foreground"
            autoFocus
          />
        ) : (
          <span className="text-sm text-foreground truncate">
            {tab.title}
          </span>
        )}
        
        {tab.isDirty && (
          <div className="ml-2 w-1.5 h-1.5 bg-primary rounded-full" />
        )}
      </div>

      {/* Tab dropdown */}
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button 
            className={cn(
              "flex items-center justify-center w-5 h-5 mr-1",
              "opacity-0 group-hover:opacity-100 hover:bg-accent rounded",
              "transition-opacity duration-150"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-48 bg-card border border-border shadow-dropdown z-50"
        >
          <DropdownMenuItem 
            className="text-sm hover:bg-secondary cursor-pointer"
            onClick={() => handleDropdownClick('close')}
            disabled={tab.isLocked}
          >
            {TEXT.CLOSE}
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-sm hover:bg-secondary cursor-pointer"
            onClick={() => handleDropdownClick('closeOthers')}
          >
            {TEXT.CLOSE_OTHERS}
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-sm hover:bg-secondary cursor-pointer"
            onClick={() => handleDropdownClick('closeAll')}
          >
            {TEXT.CLOSE_ALL}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-sm hover:bg-secondary cursor-pointer"
            onClick={() => handleDropdownClick('duplicate')}
          >
            复制标签页
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-sm hover:bg-secondary cursor-pointer"
            onClick={() => handleDropdownClick('rename')}
          >
            重命名
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-sm hover:bg-secondary cursor-pointer"
            onClick={() => handleDropdownClick('toggleLock')}
          >
            {tab.isLocked ? '解锁' : '锁定'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-sm hover:bg-secondary cursor-pointer"
            onClick={() => handleDropdownClick('copyPath')}
            disabled={!tab.filePath}
          >
            复制文件路径
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-sm hover:bg-secondary cursor-pointer"
            onClick={() => handleDropdownClick('revealInExplorer')}
          >
            在资源管理器中显示
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-sm hover:bg-secondary cursor-pointer"
            onClick={() => handleDropdownClick('splitHorizontal')}
          >
            左右分屏
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-sm hover:bg-secondary cursor-pointer"
            onClick={() => handleDropdownClick('splitVertical')}
          >
            上下分屏
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Close button */}
      <button
        className={cn(
          "flex items-center justify-center w-5 h-5 mr-1",
          "opacity-0 group-hover:opacity-100 hover:bg-accent rounded",
          "transition-opacity duration-150"
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (!tab.isLocked) {
            onClose(tab.id);
          }
        }}
        disabled={tab.isLocked}
        title={tab.isLocked ? TEXT.TAB_LOCKED_TOOLTIP : TEXT.CLOSE_TAB_TOOLTIP}
      >
        <X className={cn(
          "w-3 h-3 transition-colors",
          tab.isLocked 
            ? "text-muted-foreground/50" 
            : "text-muted-foreground hover:text-foreground"
        )} />
      </button>
    </div>
  );
};

interface TabBarProps {
  tabs: Tab[];
  onCloseTab: (id: string) => void;
  onActivateTab: (id: string) => void;
  onAddTab: () => void;
  onCloseOthers: (id: string) => void;
  onCloseAll: () => void;
  onSplitHorizontal: (id: string) => void;
  onSplitVertical: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onCopyPath?: (id: string) => void;
  onRevealInExplorer?: (id: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ 
  tabs, 
  onCloseTab, 
  onActivateTab, 
  onAddTab, 
  onCloseOthers, 
  onCloseAll, 
  onSplitHorizontal, 
  onSplitVertical,
  onToggleLock,
  onDuplicate,
  onRename,
  onCopyPath,
  onRevealInExplorer
}) => {
  return (
    <div className="flex items-center bg-background border-b border-border">
      {/* Navigation controls */}
      <div className="flex items-center px-2 border-r border-border">
        <button className="p-1 hover:bg-accent rounded" title={TEXT.BACK_TOOLTIP}>
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <button className="p-1 hover:bg-accent rounded" title={TEXT.FORWARD_TOOLTIP}>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-1 overflow-hidden">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            tab={tab}
            onClose={onCloseTab}
            onActivate={onActivateTab}
            onCloseOthers={onCloseOthers}
            onCloseAll={onCloseAll}
            onSplitHorizontal={onSplitHorizontal}
            onSplitVertical={onSplitVertical}
            onToggleLock={onToggleLock}
            onDuplicate={onDuplicate}
            onRename={onRename}
            onCopyPath={onCopyPath}
            onRevealInExplorer={onRevealInExplorer}
          />
        ))}
      </div>

      {/* Add tab button */}
      <div className="flex items-center px-2 border-l border-border">
        <button 
          onClick={onAddTab}
          className="p-1 hover:bg-accent rounded"
          title={TEXT.ADD_TAB_TOOLTIP}
        >
          <Plus className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 hover:bg-accent rounded ml-1" title={TEXT.MORE_OPTIONS_TOOLTIP}>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border border-border shadow-dropdown">
            <DropdownMenuItem 
              className="text-sm hover:bg-secondary cursor-pointer"
              onClick={onAddTab}
            >
              新标签页
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button className="p-1 hover:bg-accent rounded ml-1" title={TEXT.MORE_ACTIONS_TOOLTIP}>
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export { Tab, TabBar };
export type { Tab as TabType };