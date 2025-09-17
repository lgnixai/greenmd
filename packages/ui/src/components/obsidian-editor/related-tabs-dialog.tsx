import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Tab } from '../../types/obsidian-editor';
import { useObsidianEditorStore } from '../../stores/obsidian-editor-store';
import { X, Link, Unlink, FileText, Search } from 'lucide-react';

interface RelatedTabsDialogProps {
  tab: Tab;
  onClose: () => void;
  position: { x: number; y: number };
}

export const RelatedTabsDialog: React.FC<RelatedTabsDialogProps> = ({
  tab,
  onClose,
  position
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
  
  const {
    getRelatedTabs,
    findRelatedFiles,
    linkTabs,
    unlinkTabs,
    tabs,
    openFile
  } = useObsidianEditorStore();

  const relatedTabs = getRelatedTabs(tab.id);
  const suggestedFiles = tab.filePath ? findRelatedFiles(tab.filePath) : [];
  
  // 过滤可用的标签页（排除当前标签页和已关联的标签页）
  const availableTabs = Object.values(tabs).filter(t => 
    t.id !== tab.id && 
    !relatedTabs.some(rt => rt.id === t.id) &&
    (searchTerm === '' || t.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleLinkTab = (targetTabId: string) => {
    linkTabs(tab.id, targetTabId);
  };

  const handleUnlinkTab = (targetTabId: string) => {
    unlinkTabs(tab.id, targetTabId);
  };

  const handleOpenSuggestedFile = (filePath: string) => {
    const tabId = openFile(filePath);
    linkTabs(tab.id, tabId);
  };

  const handleToggleSelection = (tabId: string) => {
    setSelectedTabs(prev => 
      prev.includes(tabId) 
        ? prev.filter(id => id !== tabId)
        : [...prev, tabId]
    );
  };

  const handleBatchLink = () => {
    selectedTabs.forEach(tabId => {
      linkTabs(tab.id, tabId);
    });
    setSelectedTabs([]);
  };

  // 调整对话框位置，确保不超出视窗
  const adjustedPosition = React.useMemo(() => {
    const dialogWidth = 400;
    const dialogHeight = 500;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    if (x + dialogWidth > viewportWidth) {
      x = viewportWidth - dialogWidth - 20;
    }

    if (y + dialogHeight > viewportHeight) {
      y = viewportHeight - dialogHeight - 20;
    }

    return { x: Math.max(20, x), y: Math.max(20, y) };
  }, [position]);

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* 对话框 */}
      <div
        className="fixed z-50 bg-background border rounded-lg shadow-lg p-4 w-96 max-h-[500px] overflow-hidden flex flex-col"
        style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Link className="w-5 h-5" />
            关联标签页
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 当前标签页信息 */}
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4" />
            <span className="font-medium">{tab.title}</span>
          </div>
          {tab.filePath && (
            <div className="text-sm text-muted-foreground">
              {tab.filePath}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* 已关联的标签页 */}
          {relatedTabs.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-sm">已关联的标签页</h4>
              <div className="space-y-1">
                {relatedTabs.map(relatedTab => (
                  <div
                    key={relatedTab.id}
                    className="flex items-center justify-between p-2 bg-accent/50 rounded"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{relatedTab.title}</span>
                    </div>
                    <button
                      onClick={() => handleUnlinkTab(relatedTab.id)}
                      className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded"
                      title="取消关联"
                    >
                      <Unlink className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 建议的相关文件 */}
          {suggestedFiles.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-sm">建议的相关文件</h4>
              <div className="space-y-1">
                {suggestedFiles.map(filePath => (
                  <div
                    key={filePath}
                    className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/20 rounded"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate text-sm">
                        {filePath.split('/').pop()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleOpenSuggestedFile(filePath)}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      打开并关联
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 搜索和添加新关联 */}
          <div>
            <h4 className="font-medium mb-2 text-sm">添加关联标签页</h4>
            
            {/* 搜索框 */}
            <div className="relative mb-2">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索标签页..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border rounded text-sm"
              />
            </div>

            {/* 批量操作 */}
            {selectedTabs.length > 0 && (
              <div className="mb-2 p-2 bg-primary/10 rounded flex items-center justify-between">
                <span className="text-sm">已选择 {selectedTabs.length} 个标签页</span>
                <button
                  onClick={handleBatchLink}
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  批量关联
                </button>
              </div>
            )}

            {/* 可用标签页列表 */}
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {availableTabs.map(availableTab => (
                <div
                  key={availableTab.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded cursor-pointer",
                    selectedTabs.includes(availableTab.id)
                      ? "bg-primary/20"
                      : "hover:bg-accent"
                  )}
                  onClick={() => handleToggleSelection(availableTab.id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedTabs.includes(availableTab.id)}
                      onChange={() => {}} // 由父元素的 onClick 处理
                      className="w-3 h-3"
                    />
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate text-sm">{availableTab.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLinkTab(availableTab.id);
                    }}
                    className="p-1 hover:bg-primary hover:text-primary-foreground rounded"
                    title="立即关联"
                  >
                    <Link className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {availableTabs.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-4">
                  {searchTerm ? '没有找到匹配的标签页' : '没有可关联的标签页'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};