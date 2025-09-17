// Obsidian 风格编辑器组件导出

export { ObsidianEditor as default } from './obsidian-editor';
export { ObsidianEditor } from './obsidian-editor';
export { Tab, TabSkeleton, NewTabButton } from './tab';
export { TabBar, TabBarSkeleton } from './tab-bar';
export { FileEditor, FileEditorSkeleton } from './file-editor';
export { EditorPane, EditorPaneSkeleton } from './editor-pane';
export { QuickActions, CompactQuickActions, EmptyState } from './quick-actions';
export { PaneContainer, PaneContainerSkeleton } from './pane-container';
export { PaneSplitterComponent, SplitterPreview } from './pane-splitter';
export { DragDropOverlay, DragPreview, DropZoneHighlight } from './drag-drop-overlay';

// 导出类型
export type {
  Tab as TabType,
  EditorPane as EditorPaneType,
  TabAction,
  DragPosition,
  EditorState,
  EditorSettings,
  ObsidianEditorProps,
  TabProps,
  TabBarProps,
  FileEditorProps,
  EditorPaneProps,
  QuickActionsProps
} from '../../types/obsidian-editor';

// 导出 store
export { useObsidianEditorStore } from '../../stores/obsidian-editor-store';

// 导出工具函数
export {
  generateId,
  createDefaultTab,
  createDefaultPane,
  createDefaultSettings,
  getFileLanguage,
  getFileIcon,
  formatFileSize,
  formatTime,
  truncateText,
  isValidFileName,
  generateUniqueFileName,
  debounce,
  throttle,
  matchesShortcut,
  calculateDropPosition,
  storage
} from '../../utils/obsidian-editor-utils';

// 导出拖拽管理器
export {
  dragDropManager,
  createDragImage,
  getTabElementsInContainer,
  calculateInsertIndex
} from '../../utils/drag-drop-manager';

// 导出持久化相关的工具和组件
export { storageManager } from '../../utils/storage-manager';
export { sessionRecoveryService } from '../../utils/session-recovery';
export { autoSaveService } from '../../utils/auto-save-service';
export { usePersistence, useSessionRecovery, useAutoSaveStatus } from '../../hooks/usePersistence';
export { PersistenceStatus, SimplePersistenceStatus, DetailedPersistenceStatus, PersistenceControlPanel } from '../persistence-status';
export { SessionRecoveryDialog, AutoSaveRecoveryPrompt } from '../session-recovery-dialog';