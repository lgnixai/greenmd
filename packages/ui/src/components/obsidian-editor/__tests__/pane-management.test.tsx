import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { PaneContainer } from '../pane-container';
import { useObsidianEditorStore } from '../../../stores/obsidian-editor-store';

// Mock the store
jest.mock('../../../stores/obsidian-editor-store');

const mockStore = {
  panes: {
    'pane-1': {
      id: 'pane-1',
      tabs: ['tab-1', 'tab-2'],
      activeTab: 'tab-1',
      position: { x: 0, y: 0, width: 400, height: 300 }
    },
    'pane-2': {
      id: 'pane-2',
      tabs: ['tab-3'],
      activeTab: 'tab-3',
      position: { x: 400, y: 0, width: 400, height: 300 }
    }
  },
  tabs: {
    'tab-1': {
      id: 'tab-1',
      title: 'File 1',
      content: 'Content 1',
      isDirty: false,
      isLocked: false,
      type: 'file' as const,
      createdAt: new Date(),
      modifiedAt: new Date()
    },
    'tab-2': {
      id: 'tab-2',
      title: 'File 2',
      content: 'Content 2',
      isDirty: false,
      isLocked: false,
      type: 'file' as const,
      createdAt: new Date(),
      modifiedAt: new Date()
    },
    'tab-3': {
      id: 'tab-3',
      title: 'File 3',
      content: 'Content 3',
      isDirty: false,
      isLocked: false,
      type: 'file' as const,
      createdAt: new Date(),
      modifiedAt: new Date()
    }
  },
  layout: {
    type: 'split' as const,
    panes: [],
    splitters: [{
      id: 'splitter-1',
      direction: 'vertical' as const,
      position: 0.5,
      paneA: 'pane-1',
      paneB: 'pane-2'
    }],
    activePane: 'pane-1'
  },
  activePane: 'pane-1',
  getTabsByPane: jest.fn(),
  activatePane: jest.fn(),
  switchTab: jest.fn(),
  closeTab: jest.fn(),
  moveTab: jest.fn(),
  splitPane: jest.fn(),
  resizeSplit: jest.fn(),
  closePane: jest.fn(),
  mergePanes: jest.fn(),
  canMergePanes: jest.fn(),
  getPaneMinSize: jest.fn(() => ({ width: 200, height: 150 })),
  validatePaneSize: jest.fn(),
  autoMergePanes: jest.fn()
};

describe('PaneContainer - Pane Management', () => {
  beforeEach(() => {
    (useObsidianEditorStore as jest.Mock).mockReturnValue(mockStore);
    mockStore.getTabsByPane.mockImplementation((paneId: string) => {
      const pane = mockStore.panes[paneId];
      return pane ? pane.tabs.map(tabId => mockStore.tabs[tabId]).filter(Boolean) : [];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render multiple panes with splitter', () => {
    render(<PaneContainer />);
    
    // Should render both panes
    expect(screen.getByText('File 1')).toBeInTheDocument();
    expect(screen.getByText('File 3')).toBeInTheDocument();
  });

  it('should handle pane closing', async () => {
    render(<PaneContainer />);
    
    // Find and click the close button for a pane
    const closeButtons = screen.getAllByTitle('关闭面板');
    expect(closeButtons).toHaveLength(2); // Both panes should have close buttons
    
    fireEvent.click(closeButtons[0]);
    
    await waitFor(() => {
      expect(mockStore.closePane).toHaveBeenCalledWith('pane-1');
    });
  });

  it('should handle splitter double-click to reset ratio', async () => {
    render(<PaneContainer />);
    
    // Find the splitter element
    const splitter = screen.getByRole('separator');
    
    fireEvent.doubleClick(splitter);
    
    await waitFor(() => {
      expect(mockStore.resizeSplit).toHaveBeenCalledWith('splitter-1', 0.5);
    });
  });

  it('should handle splitter drag with minimum size validation', async () => {
    const { container } = render(<PaneContainer />);
    
    const splitter = screen.getByRole('separator');
    
    // Simulate drag start
    fireEvent.mouseDown(splitter, { clientX: 400 });
    
    // Simulate drag to very small size (should trigger auto-merge)
    fireEvent.mouseMove(document, { clientX: 50 });
    fireEvent.mouseUp(document);
    
    await waitFor(() => {
      expect(mockStore.autoMergePanes).toHaveBeenCalled();
    });
  });

  it('should validate pane minimum sizes', () => {
    const minSize = mockStore.getPaneMinSize();
    expect(minSize.width).toBe(200);
    expect(minSize.height).toBe(150);
  });

  it('should handle pane merging', () => {
    mockStore.canMergePanes.mockReturnValue(true);
    
    render(<PaneContainer />);
    
    // Test that canMergePanes is called with correct parameters
    expect(mockStore.canMergePanes).toHaveBeenCalled();
  });

  it('should auto-merge panes when container is too small', async () => {
    const { container } = render(<PaneContainer />);
    
    // Mock ResizeObserver
    const mockResizeObserver = jest.fn();
    mockResizeObserver.mockImplementation((callback) => {
      // Simulate small container size
      callback([{
        contentRect: { width: 300, height: 200 } // Smaller than 2 * minSize
      }]);
      
      return {
        observe: jest.fn(),
        disconnect: jest.fn()
      };
    });
    
    global.ResizeObserver = mockResizeObserver;
    
    // Re-render to trigger the effect
    render(<PaneContainer />);
    
    await waitFor(() => {
      expect(mockStore.autoMergePanes).toHaveBeenCalled();
    });
  });

  it('should prevent closing the last pane', () => {
    // Mock single pane scenario
    const singlePaneStore = {
      ...mockStore,
      panes: {
        'pane-1': mockStore.panes['pane-1']
      },
      layout: {
        ...mockStore.layout,
        type: 'single' as const,
        splitters: []
      }
    };
    
    (useObsidianEditorStore as jest.Mock).mockReturnValue(singlePaneStore);
    
    render(<PaneContainer />);
    
    // Should not show close button when there's only one pane
    const closeButtons = screen.queryAllByTitle('关闭面板');
    expect(closeButtons).toHaveLength(0);
  });

  it('should handle keyboard navigation for splitter', async () => {
    render(<PaneContainer />);
    
    const splitter = screen.getByRole('separator');
    
    // Focus the splitter
    splitter.focus();
    
    // Test arrow key navigation
    fireEvent.keyDown(splitter, { key: 'ArrowRight' });
    
    await waitFor(() => {
      expect(mockStore.resizeSplit).toHaveBeenCalled();
    });
  });

  it('should handle splitter accessibility', () => {
    render(<PaneContainer />);
    
    const splitter = screen.getByRole('separator');
    
    expect(splitter).toHaveAttribute('aria-orientation', 'vertical');
    expect(splitter).toHaveAttribute('aria-label', '调整左右面板大小');
    expect(splitter).toHaveAttribute('tabIndex', '0');
  });
});