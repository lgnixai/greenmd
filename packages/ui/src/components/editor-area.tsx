import React from 'react';
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { useEditorService } from '@dtinsight/molecule-core';
import { WelcomePage } from "@/components/welcome-page";
import { MonacoEditor } from "@/components/monaco-editor";
import { X, Circle } from 'lucide-react';

export interface EditorAreaProps {
  className?: string;
}

export const EditorArea: React.FC<EditorAreaProps> = ({ className }) => {
  const { 
    groups, 
    currentGroupId, 
    switchTab, 
    closeTab, 
    updateTabContent 
  } = useEditorService();

  const currentGroup = groups.find(g => g.id === currentGroupId);
  const currentTab = currentGroup?.tabs.find(tab => tab.isActive);

  if (!currentGroup || currentGroup.tabs.length === 0) {
    return <WelcomePage className={className} />;
  }

  const handleTabClick = (tabId: string) => {
    switchTab(tabId);
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  const handleContentChange = (tabId: string, content: string) => {
    updateTabContent(tabId, content);
  };

  return (
    <div className={cn("flex-1 flex flex-col bg-background", className)}>
      <Tabs value={currentTab?.id} className="flex-1 flex flex-col">
        <TabsList className="flex w-full items-center gap-1 px-2 h-9 bg-muted/50 overflow-x-auto">
          {currentGroup.tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex items-center gap-2 px-3 py-1 text-xs rounded-t-md border border-transparent data-[state=active]:border-b-background data-[state=active]:border-x-border data-[state=active]:border-t-border data-[state=active]:bg-background relative group",
                tab.isActive && "text-foreground"
              )}
              onClick={() => handleTabClick(tab.id)}
            >
              <span className="truncate max-w-32">{tab.name}</span>
              {tab.isDirty && <Circle className="w-3 h-3 fill-current text-orange-500" />}
              <button
                className="opacity-0 group-hover:opacity-100 ml-1 hover:bg-muted rounded p-0.5"
                onClick={(e) => handleTabClose(e, tab.id)}
              >
                <X className="w-3 h-3" />
              </button>
            </TabsTrigger>
          ))}
        </TabsList>

        {currentGroup.tabs.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className="flex-1 m-0"
          >
            <MonacoEditor
              tab={{
                id: tab.id,
                name: tab.name,
                data: { content: tab.content },
                readonly: tab.isReadOnly,
                language: tab.language,
                closable: true,
                editable: !tab.isReadOnly
              }}
              onContentChange={(content) => handleContentChange(tab.id, content)}
              className="h-full"
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
