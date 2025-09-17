import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Tab, TabGroup } from '../../types/obsidian-editor';
import { useObsidianEditorStore } from '../../stores/obsidian-editor-store';
import { X, Folder, Plus, Edit, Trash2, Users, Palette } from 'lucide-react';

interface TabGroupsDialogProps {
  tab: Tab;
  onClose: () => void;
  position: { x: number; y: number };
}

const GROUP_COLORS = [
  { name: '蓝色', value: '#3b82f6', bg: 'bg-blue-500' },
  { name: '绿色', value: '#10b981', bg: 'bg-emerald-500' },
  { name: '紫色', value: '#8b5cf6', bg: 'bg-violet-500' },
  { name: '红色', value: '#ef4444', bg: 'bg-red-500' },
  { name: '橙色', value: '#f97316', bg: 'bg-orange-500' },
  { name: '粉色', value: '#ec4899', bg: 'bg-pink-500' },
  { name: '青色', value: '#06b6d4', bg: 'bg-cyan-500' },
  { name: '黄色', value: '#eab308', bg: 'bg-yellow-500' },
];

export const TabGroupsDialog: React.FC<TabGroupsDialogProps> = ({
  tab,
  onClose,
  position
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0]);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');

  const {
    tabGroups,
    createTabGroup,
    deleteTabGroup,
    addTabToGroup,
    removeTabFromGroup,
    updateTabGroup,
    getTabsByGroup
  } = useObsidianEditorStore();

  const currentGroup = tab.groupId ? tabGroups[tab.groupId] : null;
  const availableGroups = Object.values(tabGroups).filter(group => group.id !== tab.groupId);

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      const groupId = createTabGroup(newGroupName.trim(), selectedColor.value, [tab.id]);
      setNewGroupName('');
      setShowCreateForm(false);
      setSelectedColor(GROUP_COLORS[0]);
    }
  };

  const handleJoinGroup = (groupId: string) => {
    addTabToGroup(tab.id, groupId);
  };

  const handleLeaveGroup = () => {
    if (tab.groupId) {
      removeTabFromGroup(tab.id);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('确定要删除这个分组吗？分组中的标签页将不再分组。')) {
      deleteTabGroup(groupId);
    }
  };

  const handleEditGroup = (group: TabGroup) => {
    setEditingGroup(group.id);
    setEditGroupName(group.name);
  };

  const handleSaveEdit = () => {
    if (editingGroup && editGroupName.trim()) {
      updateTabGroup(editingGroup, { name: editGroupName.trim() });
      setEditingGroup(null);
      setEditGroupName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setEditGroupName('');
  };

  // 调整对话框位置
  const adjustedPosition = React.useMemo(() => {
    const dialogWidth = 400;
    const dialogHeight = 600;
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
        className="fixed z-50 bg-background border rounded-lg shadow-lg p-4 w-96 max-h-[600px] overflow-hidden flex flex-col"
        style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Folder className="w-5 h-5" />
            标签页分组
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* 当前分组状态 */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">{tab.title}</span>
              {tab.color && (
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tab.color }}
                />
              )}
            </div>
            
            {currentGroup ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Folder className="w-4 h-4" />
                  <span>当前分组: {currentGroup.name}</span>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentGroup.color }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  分组中有 {currentGroup.tabs.length} 个标签页
                </div>
                <button
                  onClick={handleLeaveGroup}
                  className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
                >
                  离开分组
                </button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                此标签页未加入任何分组
              </div>
            )}
          </div>

          {/* 创建新分组 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">创建新分组</h4>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="p-1 hover:bg-accent rounded"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showCreateForm && (
              <div className="space-y-3 p-3 border rounded-lg">
                <input
                  type="text"
                  placeholder="分组名称"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateGroup();
                    } else if (e.key === 'Escape') {
                      setShowCreateForm(false);
                    }
                  }}
                />
                
                <div>
                  <div className="text-xs text-muted-foreground mb-2">选择颜色:</div>
                  <div className="flex gap-1 flex-wrap">
                    {GROUP_COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2",
                          selectedColor.value === color.value 
                            ? "border-foreground" 
                            : "border-transparent"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim()}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                  >
                    创建并加入
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-3 py-1 text-sm border rounded hover:bg-accent"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 现有分组列表 */}
          {availableGroups.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-sm">加入现有分组</h4>
              <div className="space-y-2">
                {availableGroups.map(group => {
                  const groupTabs = getTabsByGroup(group.id);
                  
                  return (
                    <div
                      key={group.id}
                      className="p-3 border rounded-lg hover:bg-accent/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {editingGroup === group.id ? (
                            <input
                              type="text"
                              value={editGroupName}
                              onChange={(e) => setEditGroupName(e.target.value)}
                              className="px-2 py-1 text-sm border rounded"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEdit();
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium">{group.name}</span>
                          )}
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {editingGroup === group.id ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                className="p-1 hover:bg-primary hover:text-primary-foreground rounded"
                                title="保存"
                              >
                                ✓
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded"
                                title="取消"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditGroup(group)}
                                className="p-1 hover:bg-accent rounded"
                                title="编辑分组名称"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(group.id)}
                                className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded"
                                title="删除分组"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{groupTabs.length} 个标签页</span>
                        </div>
                        
                        <button
                          onClick={() => handleJoinGroup(group.id)}
                          className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                        >
                          加入分组
                        </button>
                      </div>
                      
                      {/* 显示分组中的标签页 */}
                      {groupTabs.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="text-xs text-muted-foreground mb-1">分组中的标签页:</div>
                          <div className="flex flex-wrap gap-1">
                            {groupTabs.slice(0, 3).map(groupTab => (
                              <span
                                key={groupTab.id}
                                className="px-2 py-1 text-xs bg-muted rounded truncate max-w-20"
                                title={groupTab.title}
                              >
                                {groupTab.title}
                              </span>
                            ))}
                            {groupTabs.length > 3 && (
                              <span className="px-2 py-1 text-xs text-muted-foreground">
                                +{groupTabs.length - 3} 更多
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 所有分组概览 */}
          {Object.keys(tabGroups).length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-sm">所有分组</h4>
              <div className="space-y-1">
                {Object.values(tabGroups).map(group => {
                  const groupTabs = getTabsByGroup(group.id);
                  return (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <span>{group.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {groupTabs.length} 个标签页
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};