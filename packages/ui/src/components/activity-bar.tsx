import React from 'react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { FileText } from 'lucide-react';
import { useLayoutStore } from '@dtinsight/molecule-core';

export interface ActivityBarProps {
  className?: string;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({ className }) => {
  const { layout, setSidebarCurrent } = useLayoutStore();
  const activities = layout.activityItems || [
    { id: 'explorer', label: '资源管理器' },
    { id: 'search', label: '搜索' },
    { id: 'git', label: '源代码管理' },
    { id: 'debug', label: '运行和调试' },
    { id: 'extensions', label: '扩展' },
    { id: 'user', label: '用户' },
    { id: 'settings', label: '设置' },
    { id: 'test', label: '测试' },
  ];

  const handleActivityClick = (activityId: string) => {
    console.log(`活动栏点击: ${activityId}`);
    setSidebarCurrent(activityId as any);
  };

  return (
    <div data-testid="activity-bar" className={cn("w-12 bg-sidebar border-r flex flex-col items-center py-2", className)}>
      {activities.map((activity) => {
        const isActive = layout.sidebar.current === activity.id;
        
        return (
          <Button
            key={activity.id}
            variant="ghost"
            size="icon"
            className={cn(
              "w-10 h-10 mb-1",
              isActive && "bg-accent text-accent-foreground"
            )}
            title={activity.label}
            onClick={() => handleActivityClick(activity.id)}
          >
            <FileText className="h-5 w-5" />
          </Button>
        );
      })}
    </div>
  );
};
