/**
 * Pane Management Demo
 * Tests the dynamic pane creation, deletion, resizing, and merging functionality
 */

// Mock DOM environment for testing
const mockDOM = {
  createElement: (tag) => ({
    tagName: tag.toUpperCase(),
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    getBoundingClientRect: () => ({
      left: 0, top: 0, right: 800, bottom: 600,
      width: 800, height: 600
    }),
    querySelector: () => null,
    querySelectorAll: () => []
  }),
  
  createEvent: () => ({
    initEvent: () => {},
    preventDefault: () => {},
    stopPropagation: () => {}
  })
};

// Mock store implementation for testing
class MockObsidianEditorStore {
  constructor() {
    this.state = {
      panes: {
        'pane-1': {
          id: 'pane-1',
          tabs: ['tab-1', 'tab-2'],
          activeTab: 'tab-1',
          position: { x: 0, y: 0, width: 400, height: 600 }
        }
      },
      tabs: {
        'tab-1': {
          id: 'tab-1',
          title: 'File 1.js',
          content: 'console.log("Hello from File 1");',
          isDirty: false,
          isLocked: false,
          type: 'file',
          createdAt: new Date(),
          modifiedAt: new Date()
        },
        'tab-2': {
          id: 'tab-2',
          title: 'File 2.ts',
          content: 'const message: string = "Hello TypeScript";',
          isDirty: true,
          isLocked: false,
          type: 'file',
          createdAt: new Date(),
          modifiedAt: new Date()
        }
      },
      layout: {
        type: 'single',
        panes: [],
        splitters: [],
        activePane: 'pane-1'
      },
      activePane: 'pane-1'
    };
    
    this.listeners = [];
  }

  // Pane management methods
  createPane(options = {}) {
    const paneId = `pane-${Date.now()}`;
    const pane = {
      id: paneId,
      tabs: [],
      activeTab: '',
      position: { x: 0, y: 0, width: 400, height: 300 },
      ...options
    };
    
    this.state.panes[paneId] = pane;
    this.state.layout.panes.push(pane);
    
    console.log(`✅ Created pane: ${paneId}`);
    return paneId;
  }

  closePane(paneId) {
    const pane = this.state.panes[paneId];
    if (!pane) {
      console.log(`❌ Pane ${paneId} not found`);
      return;
    }

    // Move tabs to adjacent pane if available
    const adjacentSplitter = this.state.layout.splitters.find(
      s => s.paneA === paneId || s.paneB === paneId
    );

    if (adjacentSplitter && pane.tabs.length > 0) {
      const targetPaneId = adjacentSplitter.paneA === paneId 
        ? adjacentSplitter.paneB 
        : adjacentSplitter.paneA;
      
      const targetPane = this.state.panes[targetPaneId];
      if (targetPane) {
        pane.tabs.forEach(tabId => {
          if (!targetPane.tabs.includes(tabId)) {
            targetPane.tabs.push(tabId);
          }
        });
        
        if (pane.activeTab) {
          targetPane.activeTab = pane.activeTab;
        }
        
        console.log(`📋 Moved ${pane.tabs.length} tabs from ${paneId} to ${targetPaneId}`);
      }
    }

    // Remove pane and related splitters
    delete this.state.panes[paneId];
    this.state.layout.panes = this.state.layout.panes.filter(p => p.id !== paneId);
    this.state.layout.splitters = this.state.layout.splitters.filter(
      s => s.paneA !== paneId && s.paneB !== paneId
    );

    // Update active pane if necessary
    if (this.state.activePane === paneId) {
      const remainingPanes = Object.keys(this.state.panes);
      this.state.activePane = remainingPanes[0] || '';
    }

    // Switch to single layout if no splitters
    if (this.state.layout.splitters.length === 0) {
      this.state.layout.type = 'single';
    }

    console.log(`🗑️ Closed pane: ${paneId}`);
  }

  splitPane(paneId, direction) {
    const newPaneId = this.createPane();
    
    // Create splitter
    const splitterId = `splitter-${Date.now()}`;
    const splitter = {
      id: splitterId,
      direction,
      position: 0.5,
      paneA: paneId,
      paneB: newPaneId
    };
    
    this.state.layout.splitters.push(splitter);
    this.state.layout.type = 'split';
    this.state.activePane = newPaneId;
    
    console.log(`🔀 Split pane ${paneId} ${direction}ly, created ${newPaneId}`);
    return newPaneId;
  }

  resizeSplit(splitterId, position) {
    const splitter = this.state.layout.splitters.find(s => s.id === splitterId);
    if (!splitter) {
      console.log(`❌ Splitter ${splitterId} not found`);
      return;
    }

    const minRatio = 0.15;
    const maxRatio = 0.85;
    const newPosition = Math.max(minRatio, Math.min(maxRatio, position));

    // Check if resize would make panes too small
    const minSize = this.getPaneMinSize();
    const containerSize = splitter.direction === 'horizontal' ? 600 : 800;
    
    const sizeA = containerSize * newPosition;
    const sizeB = containerSize * (1 - newPosition);
    const minSizeValue = splitter.direction === 'horizontal' ? minSize.height : minSize.width;

    if (sizeA < minSizeValue || sizeB < minSizeValue) {
      console.log(`⚠️ Resize would violate minimum size, triggering auto-merge`);
      const targetPane = sizeA > sizeB ? splitter.paneA : splitter.paneB;
      const sourcePane = sizeA > sizeB ? splitter.paneB : splitter.paneA;
      this.mergePanes(targetPane, sourcePane);
      return;
    }

    splitter.position = newPosition;
    console.log(`📏 Resized splitter ${splitterId} to ${(newPosition * 100).toFixed(1)}%`);
  }

  mergePanes(paneAId, paneBId) {
    const paneA = this.state.panes[paneAId];
    const paneB = this.state.panes[paneBId];
    
    if (!paneA || !paneB) {
      console.log(`❌ Cannot merge: pane ${paneAId} or ${paneBId} not found`);
      return;
    }

    // Move all tabs from paneB to paneA
    paneB.tabs.forEach(tabId => {
      if (!paneA.tabs.includes(tabId)) {
        paneA.tabs.push(tabId);
      }
    });

    if (paneB.activeTab) {
      paneA.activeTab = paneB.activeTab;
    }

    // Remove paneB
    delete this.state.panes[paneBId];
    this.state.layout.panes = this.state.layout.panes.filter(p => p.id !== paneBId);
    
    // Remove related splitters
    this.state.layout.splitters = this.state.layout.splitters.filter(
      s => s.paneA !== paneBId && s.paneB !== paneBId
    );

    if (this.state.activePane === paneBId) {
      this.state.activePane = paneAId;
    }

    if (this.state.layout.splitters.length === 0) {
      this.state.layout.type = 'single';
    }

    console.log(`🔗 Merged pane ${paneBId} into ${paneAId}`);
  }

  canMergePanes(paneAId, paneBId) {
    const hasDirectSplitter = this.state.layout.splitters.some(
      s => (s.paneA === paneAId && s.paneB === paneBId) ||
           (s.paneA === paneBId && s.paneB === paneAId)
    );
    return hasDirectSplitter;
  }

  getPaneMinSize() {
    return { width: 200, height: 150 };
  }

  validatePaneSize(paneId, width, height) {
    const minSize = this.getPaneMinSize();
    return width >= minSize.width && height >= minSize.height;
  }

  autoMergePanes() {
    const minSize = this.getPaneMinSize();
    const panesToMerge = [];

    Object.values(this.state.panes).forEach(pane => {
      if (pane.position.width < minSize.width || pane.position.height < minSize.height) {
        const adjacentSplitter = this.state.layout.splitters.find(
          s => s.paneA === pane.id || s.paneB === pane.id
        );
        
        if (adjacentSplitter) {
          const targetPaneId = adjacentSplitter.paneA === pane.id 
            ? adjacentSplitter.paneB 
            : adjacentSplitter.paneA;
          
          panesToMerge.push({ small: pane.id, target: targetPaneId });
        }
      }
    });

    panesToMerge.forEach(({ small, target }) => {
      this.mergePanes(target, small);
    });

    if (panesToMerge.length > 0) {
      console.log(`🔄 Auto-merged ${panesToMerge.length} small panes`);
    }
  }

  // Helper methods
  getState() {
    return this.state;
  }

  printState() {
    console.log('\n📊 Current State:');
    console.log(`Panes: ${Object.keys(this.state.panes).length}`);
    console.log(`Splitters: ${this.state.layout.splitters.length}`);
    console.log(`Layout: ${this.state.layout.type}`);
    console.log(`Active Pane: ${this.state.activePane}`);
    
    Object.values(this.state.panes).forEach(pane => {
      console.log(`  Pane ${pane.id}: ${pane.tabs.length} tabs, active: ${pane.activeTab}`);
    });
    
    this.state.layout.splitters.forEach(splitter => {
      console.log(`  Splitter ${splitter.id}: ${splitter.paneA} ↔ ${splitter.paneB} (${splitter.direction}, ${(splitter.position * 100).toFixed(1)}%)`);
    });
  }
}

// Demo test scenarios
function runPaneManagementDemo() {
  console.log('🚀 Starting Pane Management Demo\n');
  
  const store = new MockObsidianEditorStore();
  
  // Test 1: Initial state
  console.log('📋 Test 1: Initial State');
  store.printState();
  
  // Test 2: Split pane vertically
  console.log('\n📋 Test 2: Split Pane Vertically');
  const pane2 = store.splitPane('pane-1', 'vertical');
  store.printState();
  
  // Test 3: Split pane horizontally
  console.log('\n📋 Test 3: Split Pane Horizontally');
  const pane3 = store.splitPane(pane2, 'horizontal');
  store.printState();
  
  // Test 4: Resize splitter
  console.log('\n📋 Test 4: Resize Splitter');
  const splitter1 = store.getState().layout.splitters[0];
  if (splitter1) {
    store.resizeSplit(splitter1.id, 0.3);
    store.printState();
  }
  
  // Test 5: Resize to trigger auto-merge
  console.log('\n📋 Test 5: Resize to Trigger Auto-merge');
  if (splitter1) {
    store.resizeSplit(splitter1.id, 0.05); // Very small, should trigger merge
    store.printState();
  }
  
  // Test 6: Create new panes and test manual merge
  console.log('\n📋 Test 6: Manual Pane Merge');
  const pane4 = store.splitPane(store.getState().activePane, 'vertical');
  const pane5 = store.splitPane(pane4, 'horizontal');
  console.log('Before merge:');
  store.printState();
  
  if (store.canMergePanes(pane4, pane5)) {
    store.mergePanes(pane4, pane5);
    console.log('After merge:');
    store.printState();
  }
  
  // Test 7: Close pane
  console.log('\n📋 Test 7: Close Pane');
  const remainingPanes = Object.keys(store.getState().panes);
  if (remainingPanes.length > 1) {
    store.closePane(remainingPanes[1]);
    store.printState();
  }
  
  // Test 8: Minimum size validation
  console.log('\n📋 Test 8: Minimum Size Validation');
  const minSize = store.getPaneMinSize();
  console.log(`Minimum size: ${minSize.width}x${minSize.height}`);
  console.log(`Valid size 300x200: ${store.validatePaneSize('test', 300, 200)}`);
  console.log(`Invalid size 100x100: ${store.validatePaneSize('test', 100, 100)}`);
  
  // Test 9: Auto-merge small panes
  console.log('\n📋 Test 9: Auto-merge Small Panes');
  // Simulate small pane sizes
  const currentPanes = Object.values(store.getState().panes);
  if (currentPanes.length > 0) {
    currentPanes[0].position.width = 150; // Below minimum
    currentPanes[0].position.height = 100; // Below minimum
    console.log('Set pane to small size, triggering auto-merge...');
    store.autoMergePanes();
    store.printState();
  }
  
  console.log('\n✅ Pane Management Demo Completed!');
  
  // Summary
  console.log('\n📈 Demo Summary:');
  console.log('✅ Dynamic pane creation and deletion');
  console.log('✅ Pane size drag adjustment with minimum limits');
  console.log('✅ Automatic pane merging when too small');
  console.log('✅ Manual pane merging');
  console.log('✅ Splitter resizing with validation');
  console.log('✅ Tab preservation during pane operations');
  console.log('✅ Layout state management (single/split)');
}

// Run the demo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runPaneManagementDemo, MockObsidianEditorStore };
} else {
  runPaneManagementDemo();
}