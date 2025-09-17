// Drag and Drop Demo for Obsidian Editor
// This script tests the enhanced drag and drop functionality

import { dragDropManager } from '../packages/ui/src/utils/drag-drop-manager.js';

// Test the drag drop manager
console.log('Testing Drag Drop Manager...');

// Test 1: Start and end drag
console.log('\n1. Testing start and end drag:');
const mockDragEvent = {
  dataTransfer: {
    effectAllowed: '',
    setData: () => {},
    setDragImage: () => {}
  }
};

dragDropManager.startDrag('test-tab-1', 'pane-1', mockDragEvent);
let state = dragDropManager.getState();
console.log('After start drag:', {
  isDragging: state.isDragging,
  draggedTabId: state.draggedTabId,
  draggedFromPane: state.draggedFromPane
});

dragDropManager.endDrag();
state = dragDropManager.getState();
console.log('After end drag:', {
  isDragging: state.isDragging,
  draggedTabId: state.draggedTabId,
  draggedFromPane: state.draggedFromPane
});

// Test 2: Calculate drag position
console.log('\n2. Testing drag position calculation:');
const mockContainer = {
  getBoundingClientRect: () => ({
    left: 0,
    top: 0,
    right: 400,
    bottom: 50,
    width: 400,
    height: 50
  })
};

const mockTabElements = [
  {
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      right: 100,
      bottom: 50,
      width: 100,
      height: 50
    })
  },
  {
    getBoundingClientRect: () => ({
      left: 100,
      top: 0,
      right: 200,
      bottom: 50,
      width: 100,
      height: 50
    })
  }
];

// Test different positions
const positions = [
  { x: 50, y: 25, expected: 'middle of first tab' },
  { x: 150, y: 25, expected: 'middle of second tab' },
  { x: 75, y: 25, expected: 'between first and second tab' },
  { x: 10, y: 25, expected: 'left edge - should create split' },
  { x: 390, y: 25, expected: 'right edge - should create split' }
];

positions.forEach(({ x, y, expected }) => {
  const position = dragDropManager.calculateDragPosition(x, y, mockContainer, mockTabElements);
  console.log(`Position (${x}, ${y}) - ${expected}:`, {
    zone: position?.zone,
    targetIndex: position?.targetIndex
  });
});

// Test 3: Listeners
console.log('\n3. Testing state listeners:');
let listenerCallCount = 0;
const testListener = (state) => {
  listenerCallCount++;
  console.log(`Listener called ${listenerCallCount} times, isDragging:`, state.isDragging);
};

dragDropManager.addListener(testListener);
dragDropManager.startDrag('test-tab-2', 'pane-2', mockDragEvent);
dragDropManager.updateDrag('pane-3', { x: 100, y: 50, zone: 'tab', targetIndex: 1 });
dragDropManager.endDrag();
dragDropManager.removeListener(testListener);

console.log('\nDrag and Drop Manager tests completed successfully!');

// Test utility functions
console.log('\n4. Testing utility functions:');

// Test calculateInsertIndex
import { calculateInsertIndex } from '../packages/ui/src/utils/drag-drop-manager.js';

const testInsertIndex = calculateInsertIndex(150, mockTabElements);
console.log('Insert index for position 150:', testInsertIndex);

console.log('\nAll drag and drop tests completed!');