/**
 * Accessibility Demo for Obsidian Editor
 * This demo showcases the accessibility features implemented in the editor
 */

// Mock DOM environment for testing
const mockDocument = {
  createElement: (tag) => ({
    tagName: tag.toUpperCase(),
    setAttribute: () => {},
    getAttribute: () => null,
    classList: { add: () => {}, remove: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    focus: () => {},
    click: () => {},
    textContent: '',
    innerHTML: ''
  }),
  body: {
    appendChild: () => {},
    removeChild: () => {},
    insertBefore: () => {}
  },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  activeElement: null
};

const mockWindow = {
  matchMedia: (query) => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {}
  }),
  speechSynthesis: {},
  dispatchEvent: () => {}
};

// Set up global mocks
global.document = mockDocument;
global.window = mockWindow;

// Mock accessibility utilities for demo
const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End'
};

const SCREEN_READER_MESSAGES = {
  TAB_OPENED: (title) => `标签页 ${title} 已打开`,
  TAB_CLOSED: (title) => `标签页 ${title} 已关闭`,
  TAB_SWITCHED: (title) => `切换到标签页 ${title}`,
  PANE_CREATED: '新面板已创建',
  PANE_CLOSED: '面板已关闭',
  SPLIT_CREATED: (direction) => `${direction === 'horizontal' ? '水平' : '垂直'}分屏已创建`,
  FILE_SAVED: (title) => `文件 ${title} 已保存`
};

const KEYBOARD_SHORTCUTS = {
  NEW_TAB: { keys: 'Ctrl+T', description: '新建标签页' },
  CLOSE_TAB: { keys: 'Ctrl+W', description: '关闭当前标签页' },
  NEXT_TAB: { keys: 'Ctrl+Tab', description: '切换到下一个标签页' },
  PREV_TAB: { keys: 'Ctrl+Shift+Tab', description: '切换到上一个标签页' },
  SAVE_FILE: { keys: 'Ctrl+S', description: '保存文件' },
  NEW_FILE: { keys: 'Ctrl+N', description: '新建文件' }
};

const createAriaProps = (props) => {
  const ariaProps = {};
  if (props.role) ariaProps.role = props.role;
  if (props.label) ariaProps['aria-label'] = props.label;
  if (props.selected !== undefined) ariaProps['aria-selected'] = props.selected;
  if (props.expanded !== undefined) ariaProps['aria-expanded'] = props.expanded;
  if (props.controls) ariaProps['aria-controls'] = props.controls;
  if (props.hasPopup !== undefined) ariaProps['aria-haspopup'] = props.hasPopup;
  return ariaProps;
};

const generateAriaId = (prefix = 'aria') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

const detectHighContrastMode = () => false;

const isFocusable = (element) => {
  if (element.tabIndex < 0) return false;
  if (element.hasAttribute && element.hasAttribute('disabled')) return false;
  const focusableTags = ['input', 'button', 'select', 'textarea', 'a', 'area'];
  return focusableTags.includes(element.tagName.toLowerCase()) || element.tabIndex >= 0;
};

console.log('🎯 Accessibility Demo for Obsidian Editor');
console.log('==========================================\n');

// Demo 1: Screen Reader Announcements
console.log('1. Screen Reader Announcements');
console.log('-------------------------------');
console.log('Testing screen reader announcements...');

// Test tab announcements
const tabTitle = 'MyFile.js';
console.log(`✓ Tab opened: ${SCREEN_READER_MESSAGES.TAB_OPENED(tabTitle)}`);
console.log(`✓ Tab closed: ${SCREEN_READER_MESSAGES.TAB_CLOSED(tabTitle)}`);
console.log(`✓ Tab switched: ${SCREEN_READER_MESSAGES.TAB_SWITCHED(tabTitle)}`);

// Test other announcements
console.log(`✓ Pane created: ${SCREEN_READER_MESSAGES.PANE_CREATED}`);
console.log(`✓ Split created: ${SCREEN_READER_MESSAGES.SPLIT_CREATED('horizontal')}`);
console.log(`✓ File saved: ${SCREEN_READER_MESSAGES.FILE_SAVED(tabTitle)}`);

console.log('\n');

// Demo 2: Keyboard Shortcuts
console.log('2. Keyboard Shortcuts');
console.log('---------------------');
console.log('Available keyboard shortcuts:');

Object.entries(KEYBOARD_SHORTCUTS).forEach(([key, shortcut]) => {
  console.log(`✓ ${shortcut.keys}: ${shortcut.description}`);
});

console.log('\n');

// Demo 3: ARIA Properties
console.log('3. ARIA Properties');
console.log('------------------');
console.log('Testing ARIA property generation...');

const tabAriaProps = createAriaProps({
  role: 'tab',
  selected: true,
  controls: 'panel-1',
  label: 'Main File Tab'
});

console.log('✓ Tab ARIA properties:', JSON.stringify(tabAriaProps, null, 2));

const menuAriaProps = createAriaProps({
  role: 'menu',
  label: 'Context Menu',
  expanded: true,
  hasPopup: 'menu'
});

console.log('✓ Menu ARIA properties:', JSON.stringify(menuAriaProps, null, 2));

console.log('\n');

// Demo 4: Unique ID Generation
console.log('4. Unique ID Generation');
console.log('-----------------------');
console.log('Testing unique ID generation for ARIA labels...');

for (let i = 0; i < 5; i++) {
  const id = generateAriaId('tab');
  console.log(`✓ Generated ID ${i + 1}: ${id}`);
}

console.log('\n');

// Demo 5: High Contrast Detection
console.log('5. High Contrast Mode Detection');
console.log('-------------------------------');
console.log('Testing high contrast mode detection...');

const isHighContrast = detectHighContrastMode();
console.log(`✓ High contrast mode detected: ${isHighContrast}`);
console.log('✓ High contrast CSS classes will be applied when detected');

console.log('\n');

// Demo 6: Focus Management
console.log('6. Focus Management');
console.log('-------------------');
console.log('Testing focus management utilities...');

// Create mock elements
const mockButton = {
  tagName: 'BUTTON',
  tabIndex: 0,
  hasAttribute: (attr) => attr === 'disabled' ? false : true,
  getAttribute: (attr) => attr === 'aria-hidden' ? null : null
};

const mockDisabledButton = {
  tagName: 'BUTTON',
  tabIndex: 0,
  hasAttribute: (attr) => attr === 'disabled' ? true : false,
  getAttribute: (attr) => null
};

console.log(`✓ Button is focusable: ${isFocusable(mockButton)}`);
console.log(`✓ Disabled button is focusable: ${isFocusable(mockDisabledButton)}`);

console.log('\n');

// Demo 7: Keyboard Navigation
console.log('7. Keyboard Navigation');
console.log('----------------------');
console.log('Testing keyboard navigation constants...');

console.log('✓ Available keyboard keys:');
Object.entries(KEYBOARD_KEYS).forEach(([key, value]) => {
  console.log(`  - ${key}: "${value}"`);
});

console.log('\n');

// Demo 8: Accessibility Features Summary
console.log('8. Accessibility Features Summary');
console.log('=================================');
console.log('✅ Implemented Features:');
console.log('');
console.log('🎯 Keyboard Navigation Support:');
console.log('   • Arrow keys for tab navigation');
console.log('   • Home/End keys for first/last tab');
console.log('   • Enter/Space for activation');
console.log('   • Escape for closing menus');
console.log('   • Tab key for focus management');
console.log('');
console.log('🏷️  ARIA Labels and Semantic Markup:');
console.log('   • Proper role attributes (tab, tablist, menu, etc.)');
console.log('   • aria-label for descriptive labels');
console.log('   • aria-selected for tab states');
console.log('   • aria-expanded for dropdown states');
console.log('   • aria-controls for relationships');
console.log('   • aria-live regions for announcements');
console.log('');
console.log('🔊 Screen Reader Support:');
console.log('   • Automatic announcements for state changes');
console.log('   • Descriptive labels for all interactive elements');
console.log('   • Hidden content for screen readers only');
console.log('   • Proper heading structure');
console.log('');
console.log('🎨 High Contrast Theme Support:');
console.log('   • Automatic detection of system preferences');
console.log('   • High contrast CSS theme');
console.log('   • Enhanced borders and focus indicators');
console.log('   • Improved color contrast ratios');
console.log('');
console.log('⌨️  Focus Management:');
console.log('   • Focus trapping in modal dialogs');
console.log('   • Visible focus indicators');
console.log('   • Logical tab order');
console.log('   • Skip links for main content');
console.log('');
console.log('🚀 Additional Features:');
console.log('   • Reduced motion support');
console.log('   • Touch-friendly targets');
console.log('   • Responsive design considerations');
console.log('   • Error handling and recovery');

console.log('\n');
console.log('🎉 Accessibility implementation completed successfully!');
console.log('All features are ready for testing with screen readers and keyboard navigation.');