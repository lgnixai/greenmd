// Obsidian风格编辑器的核心类型定义

export interface Tab {
  id: string;
  title: string;
  filePath?: string;
  content: string;
  isDirty: boolean;
  isLocked: boolean;
  type: 'file' | 'welcome' | 'settings';
  language?: string;
  encoding?: string;
  lineEnding?: 'LF' | 'CRLF';
  createdAt: Date;
  modifiedAt: Date;
}

export interface EditorPane {
  id: string;
  tabs: string[];
  activeTab: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  splitDirection?: 'horizontal' | 'vertical';
  parentPane?: string;
  childPanes?: string[];
}

export interface PaneSplitter {
  id: string;
  direction: 'horizontal' | 'vertical';
  position: number; // 0-1 之间的比例
  paneA: string;
  paneB: string;
}

export interface EditorLayout {
  type: 'single' | 'split';
  panes: EditorPane[];
  splitters: PaneSplitter[];
  activePane: string;
}

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  theme: 'light' | 'dark' | 'auto';
  tabSize: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
}

export interface EditorState {
  panes: Record<string, EditorPane>;
  tabs: Record<string, Tab>;
  layout: EditorLayout;
  recentFiles: string[];
  settings: EditorSettings;
  activePane: string;
  dragState?: DragState;
}

export interface DragState {
  draggedTab: string;
  draggedFrom: string;
  dragOverPane?: string;
  dragPosition?: DragPosition;
}

export interface DragPosition {
  x: number;
  y: number;
  zone: 'tab' | 'pane' | 'split-horizontal' | 'split-vertical';
  targetIndex?: number;
}

export type TabAction = 
  | 'close'
  | 'closeOthers'
  | 'closeAll'
  | 'lock'
  | 'unlock'
  | 'moveToNewWindow'
  | 'splitHorizontal'
  | 'splitVertical'
  | 'duplicate'
  | 'rename';

export interface FileError {
  type: 'read' | 'write' | 'permission' | 'notFound';
  message: string;
  filePath: string;
}

export interface StateError {
  type: 'corruption' | 'version' | 'storage';
  message: string;
  recoverable: boolean;
}

// 事件类型定义
export interface EditorEvents {
  onTabCreate: (tab: Tab) => void;
  onTabClose: (tabId: string) => void;
  onTabSwitch: (tabId: string) => void;
  onTabMove: (tabId: string, fromPane: string, toPane: string) => void;
  onPaneCreate: (pane: EditorPane) => void;
  onPaneClose: (paneId: string) => void;
  onPaneSplit: (paneId: string, direction: 'horizontal' | 'vertical') => void;
  onFileChange: (tabId: string, content: string) => void;
  onError: (error: FileError | StateError) => void;
}

// 组件 Props 类型定义
export interface ObsidianEditorProps {
  className?: string;
  initialFiles?: string[];
  onFileChange?: (filePath: string, content: string) => void;
  onTabClose?: (tabId: string) => void;
  settings?: Partial<EditorSettings>;
}

export interface EditorPaneProps {
  pane: EditorPane;
  tabs: Tab[];
  isActive: boolean;
  onTabSwitch: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabMove: (tabId: string, targetPane: string) => void;
  onSplit: (direction: 'horizontal' | 'vertical') => void;
  onPaneActivate: () => void;
}

export interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  paneId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabDrag: (tabId: string, position: DragPosition) => void;
  onNewTab: () => void;
  onTabAction: (tabId: string, action: TabAction) => void;
}

export interface TabProps {
  tab: Tab;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  onMenuAction: (action: TabAction) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  draggable?: boolean;
}

export interface FileEditorProps {
  tab: Tab;
  onContentChange: (content: string) => void;
  readOnly?: boolean;
  settings: EditorSettings;
}

export interface QuickActionsProps {
  onNewFile: () => void;
  onOpenFile: () => void;
  onOpenRecent: (filePath: string) => void;
  recentFiles: string[];
}

export interface PaneSplitterProps {
  splitter: PaneSplitter;
  onResize: (position: number) => void;
  onDoubleClick: () => void;
}

// 工具函数类型
export type TabCreator = (options?: Partial<Tab>) => Tab;
export type PaneCreator = (options?: Partial<EditorPane>) => EditorPane;
export type LayoutManager = {
  createSplit: (paneId: string, direction: 'horizontal' | 'vertical') => void;
  removeSplit: (paneId: string) => void;
  resizeSplit: (splitterId: string, position: number) => void;
  mergePanes: (paneAId: string, paneBId: string) => void;
};

// 存储相关类型
export interface StorageAdapter {
  save: (key: string, data: any) => Promise<void>;
  load: (key: string) => Promise<any>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

export interface SessionData {
  tabs: Record<string, Tab>;
  panes: Record<string, EditorPane>;
  layout: EditorLayout;
  activePane: string;
  timestamp: number;
  version: string;
}