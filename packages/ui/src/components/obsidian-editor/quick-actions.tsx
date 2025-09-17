import React from 'react';
import { cn } from '../../lib/utils';
import { QuickActionsProps } from '../../types/obsidian-editor';
import { FileText, FolderOpen, Clock, Keyboard, Zap } from 'lucide-react';
import { Button } from '../button';
import { formatTime } from '../../utils/obsidian-editor-utils';

export const QuickActions: React.FC<QuickActionsProps> = ({
  onNewFile,
  onOpenFile,
  onOpenRecent,
  recentFiles
}) => {
  const shortcuts = [
    { key: 'Ctrl+N', action: '创建新文件', handler: onNewFile },
    { key: 'Ctrl+O', action: '打开文件', handler: onOpenFile },
    { key: 'Ctrl+T', action: '新建标签页', handler: onNewFile },
    { key: 'Ctrl+W', action: '关闭标签页', handler: () => {} },
    { key: 'Ctrl+S', action: '保存文件', handler: () => {} },
    { key: 'Ctrl+Shift+P', action: '命令面板', handler: () => {} }
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-background">
      <div className="max-w-2xl w-full space-y-8">
        {/* 欢迎标题 */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            欢迎使用 Obsidian 风格编辑器
          </h1>
          <p className="text-muted-foreground">
            开始您的编码之旅，创建新文件或打开现有项目
          </p>
        </div>

        {/* 主要操作按钮 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={onNewFile}
            className="h-16 flex items-center justify-start gap-4 p-6 text-left"
            variant="outline"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium">创建新文件</div>
              <div className="text-sm text-muted-foreground">开始编写新的代码文件</div>
            </div>
            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Ctrl+N
            </div>
          </Button>

          <Button
            onClick={onOpenFile}
            className="h-16 flex items-center justify-start gap-4 p-6 text-left"
            variant="outline"
          >
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="font-medium">打开文件</div>
              <div className="text-sm text-muted-foreground">浏览并打开现有文件</div>
            </div>
            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Ctrl+O
            </div>
          </Button>
        </div>

        {/* 最近文件 */}
        {recentFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="w-4 h-4" />
              最近打开的文件
            </div>
            <div className="space-y-2">
              {recentFiles.slice(0, 5).map((filePath, index) => {
                const fileName = filePath.split('/').pop() || filePath;
                const fileDir = filePath.substring(0, filePath.lastIndexOf('/')) || '/';
                
                return (
                  <Button
                    key={filePath}
                    onClick={() => onOpenRecent(filePath)}
                    className="w-full h-12 flex items-center justify-start gap-3 p-4 text-left"
                    variant="ghost"
                  >
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{fileName}</div>
                      <div className="text-sm text-muted-foreground truncate">{fileDir}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {index + 1}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* 快捷键提示 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Keyboard className="w-4 h-4" />
            键盘快捷键
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={shortcut.handler}
              >
                <span className="text-sm text-foreground">{shortcut.action}</span>
                <kbd className="text-xs text-muted-foreground bg-background px-2 py-1 rounded border">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* 提示信息 */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            💡 提示：您可以拖拽文件到编辑器中快速打开
          </p>
          <p className="text-xs text-muted-foreground">
            支持多种文件格式：JavaScript, TypeScript, JSON, Markdown, CSS 等
          </p>
        </div>
      </div>
    </div>
  );
};

// 快捷操作面板的紧凑版本（用于小面板）
export const CompactQuickActions: React.FC<QuickActionsProps> = ({
  onNewFile,
  onOpenFile,
  onOpenRecent,
  recentFiles
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        {/* 简化的标题 */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">开始编码</h2>
        </div>

        {/* 紧凑的操作按钮 */}
        <div className="space-y-2">
          <Button
            onClick={onNewFile}
            className="w-full justify-start gap-3"
            variant="outline"
          >
            <FileText className="w-4 h-4" />
            创建新文件
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+N</span>
          </Button>

          <Button
            onClick={onOpenFile}
            className="w-full justify-start gap-3"
            variant="outline"
          >
            <FolderOpen className="w-4 h-4" />
            打开文件
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+O</span>
          </Button>
        </div>

        {/* 最近文件（紧凑版） */}
        {recentFiles.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              最近文件
            </div>
            <div className="space-y-1">
              {recentFiles.slice(0, 3).map((filePath) => {
                const fileName = filePath.split('/').pop() || filePath;
                
                return (
                  <Button
                    key={filePath}
                    onClick={() => onOpenRecent(filePath)}
                    className="w-full justify-start text-left h-8 px-2"
                    variant="ghost"
                    size="sm"
                  >
                    <FileText className="w-3 h-3 mr-2 flex-shrink-0" />
                    <span className="truncate text-xs">{fileName}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 空状态组件（当没有任何内容时显示）
export const EmptyState: React.FC<{
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({
  title = "暂无内容",
  description = "这里还没有任何内容",
  icon,
  actions
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="space-y-4">
        {icon && (
          <div className="w-16 h-16 mx-auto bg-muted/30 rounded-full flex items-center justify-center">
            {icon}
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        </div>
        {actions && (
          <div className="pt-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};