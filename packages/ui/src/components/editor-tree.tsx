import React from 'react';
import { cn } from "@/lib/utils";
import { useEditorService } from '@dtinsight/molecule-core';

export interface EditorTreeProps {
  className?: string;
}

export const EditorTree: React.FC<EditorTreeProps> = ({ className }) => {
  const { groups, currentGroupId, switchTab, closeTab } = useEditorService();
  const current = groups.find(g => g.id === currentGroupId);

  if (!current || current.tabs.length === 0) {
    return <div className={cn('p-2 text-xs text-muted-foreground', className)}>没有打开的编辑器</div>;
  }

  return (
    <div className={cn('p-2 space-y-1', className)}>
      {current.tabs.map(tab => (
        <div key={tab.id} className={cn('flex items-center justify-between px-2 py-1 rounded text-sm cursor-pointer hover:bg-accent', tab.isActive && 'bg-accent')}>
          <div onClick={() => switchTab(tab.id)} className="truncate pr-2">{tab.name}</div>
          <button className="text-xs opacity-70 hover:opacity-100" onClick={() => closeTab(tab.id)}>×</button>
        </div>
      ))}
    </div>
  );
};


