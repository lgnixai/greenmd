// Obsidian Editor 常量定义

// 默认值
export const DEFAULT_VALUES = {
  // 面板相关
  PANEL_MIN_SIZE: 20,
  PANEL_DEFAULT_SIZE: 50,
  
  // 标签页相关
  TAB_MAX_WIDTH: 200,
  TAB_HEIGHT: 32,
  
  // 性能相关
  RENDER_THRESHOLD: 16, // 60fps
  MEMORY_CHECK_INTERVAL: 30000, // 30秒
  CLEANUP_INTERVAL: 60000, // 1分钟
  MAX_HISTORY_SIZE: 50,
  
  // 动画相关
  ANIMATION_DURATION: 150,
  TRANSITION_DURATION: 200,
} as const;

// 文本常量
export const TEXT = {
  // 标签页文本
  NEW_TAB: '新标签页',
  TAB_LOCKED_TOOLTIP: '标签页已锁定',
  CLOSE_TAB_TOOLTIP: '关闭标签页',
  ADD_TAB_TOOLTIP: '新建标签页',
  MORE_OPTIONS_TOOLTIP: '更多选项',
  MORE_ACTIONS_TOOLTIP: '更多操作',
  BACK_TOOLTIP: '后退',
  FORWARD_TOOLTIP: '前进',
  
  // 菜单项文本
  CLOSE: '关闭',
  CLOSE_OTHERS: '关闭其他标签页',
  CLOSE_ALL: '全部关闭',
  DUPLICATE: '复制标签页',
  RENAME: '重命名',
  LOCK: '锁定',
  UNLOCK: '解锁',
  COPY_PATH: '复制文件路径',
  REVEAL_IN_EXPLORER: '在资源管理器中显示',
  SPLIT_HORIZONTAL: '左右分屏',
  SPLIT_VERTICAL: '上下分屏',
  
  // 错误信息
  PANEL_CONFIG_ERROR: '面板配置错误',
  INVALID_PANEL_NODE: '无效的面板节点配置',
  UNSUPPORTED_PANEL_TYPE: '不支持的面板类型',
  PANEL_TREE_NOT_INITIALIZED: '面板树未初始化或配置错误',
  EDITOR_ERROR: '编辑器出现错误',
  
  // 按钮文本
  RETRY: '重试',
  RESET_EDITOR: '重置编辑器',
  REFRESH_PAGE: '刷新页面',
  REINITIALIZE: '重新初始化',
  
  // 编辑器文本
  EDITOR_PLACEHOLDER: '在此输入内容...',
  
  // 斜杠命令
  SLASH_COMMANDS: {
    HEADING_1: 'Heading 1',
    BULLET_LIST: 'Bullet List',
    CODE_BLOCK: 'Code Block',
    QUOTE: 'Quote',
  },
} as const;

// CSS 类名常量
export const CSS_CLASSES = {
  // 基础类
  FLEX: 'flex',
  FLEX_COL: 'flex-col',
  H_FULL: 'h-full',
  W_FULL: 'w-full',
  MIN_W_0: 'min-w-0',
  
  // 布局类
  PANEL_CONTAINER: 'h-full w-full min-w-0 flex flex-col bg-background',
  PANEL_LEAF: 'h-full flex flex-col',
  PANEL_SPLIT: 'min-w-0',
  
  // 标签页类
  TAB_CONTAINER: 'group relative flex items-center min-w-0 max-w-[200px] h-8',
  TAB_BORDER: 'border-r border-border',
  TAB_ACTIVE: 'bg-background',
  TAB_INACTIVE: 'bg-muted hover:bg-muted/80',
  TAB_LOCKED: 'opacity-75',
  
  // 按钮类
  BUTTON_BASE: 'flex items-center justify-center',
  BUTTON_HOVER: 'hover:bg-accent rounded',
  BUTTON_OPACITY: 'opacity-0 group-hover:opacity-100',
  BUTTON_TRANSITION: 'transition-opacity duration-150',
  
  // 错误类
  ERROR_CONTAINER: 'flex flex-col items-center justify-center h-full p-4 text-center',
  ERROR_TITLE: 'text-destructive text-lg font-semibold mb-2',
  ERROR_MESSAGE: 'text-muted-foreground text-sm mb-4',
  
  // 动画类
  TRANSITION_COLORS: 'transition-colors',
  TRANSITION_OPACITY: 'transition-opacity',
} as const;

// 键盘快捷键
export const KEYBOARD = {
  SLASH: '/',
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
} as const;

// 事件类型
export const EVENTS = {
  CLICK: 'click',
  KEY_DOWN: 'keydown',
  KEY_UP: 'keyup',
  FOCUS: 'focus',
  BLUR: 'blur',
  CHANGE: 'change',
  INPUT: 'input',
} as const;

// 面板类型
export const PANEL_TYPES = {
  LEAF: 'leaf',
  SPLIT: 'split',
} as const;

// 分屏方向
export const SPLIT_DIRECTIONS = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
} as const;

// 标签页状态
export const TAB_STATES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LOCKED: 'locked',
  DIRTY: 'dirty',
} as const;

// 编辑器节点类型
export const EDITOR_NODE_TYPES = {
  HEADING: 'heading',
  QUOTE: 'quote',
  LIST: 'list',
  LIST_ITEM: 'listItem',
  CODE: 'code',
  LINK: 'link',
} as const;

// Z-index 层级
export const Z_INDEX = {
  SLASH_MENU: 50,
  DROPDOWN: 40,
  TOOLTIP: 30,
  OVERLAY: 20,
  MODAL: 60,
} as const;

// 响应式断点
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const;

export default {
  DEFAULT_VALUES,
  TEXT,
  CSS_CLASSES,
  KEYBOARD,
  EVENTS,
  PANEL_TYPES,
  SPLIT_DIRECTIONS,
  TAB_STATES,
  EDITOR_NODE_TYPES,
  Z_INDEX,
  BREAKPOINTS,
};
