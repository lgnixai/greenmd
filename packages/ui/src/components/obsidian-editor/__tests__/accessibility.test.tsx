import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ObsidianEditor } from '../obsidian-editor';
import { useObsidianEditorStore } from '../../../stores/obsidian-editor-store';
import { 
  announceToScreenReader,
  detectHighContrastMode,
  isFocusable,
  getFocusableElements,
  FocusTrap,
  KeyboardNavigationManager
} from '../../../utils/accessibility-utils';

// Mock the store
jest.mock('../../../stores/obsidian-editor-store');
const mockStore = useObsidianEditorStore as jest.MockedFunction<typeof useObsidianEditorStore>;

// Mock accessibility utilities
jest.mock('../../../utils/accessibility-utils', () => ({
  ...jest.requireActual('../../../utils/accessibility-utils'),
  announceToScreenReader: jest.fn(),
  detectHighContrastMode: jest.fn(() => false),
}));

describe('ObsidianEditor Accessibility', () => {
  const mockStoreState = {
    panes: {
      'pane-1': {
        id: 'pane-1',
        tabs: ['tab-1', 'tab-2'],
        activeTab: 'tab-1',
        position: { x: 0, y: 0, width: 800, height: 600 }
      }
    },
    tabs: {
      'tab-1': {
        id: 'tab-1',
        title: 'Test File 1',
        content: 'Content 1',
        isDirty: false,
        isLocked: false,
        type: 'file' as const,
        createdAt: new Date(),
        modifiedAt: new Date()
      },
      'tab-2': {
        id: 'tab-2',
        title: 'Test File 2',
        content: 'Content 2',
        isDirty: true,
        isLocked: false,
        type: 'file' as const,
        createdAt: new Date(),
        modifiedAt: new Date()
      }
    },
    tabGroups: {},
    layout: {
      type: 'single' as const,
      panes: [],
      splitters: [],
      activePane: 'pane-1'
    },
    recentFiles: [],
    settings: {
      fontSize: 14,
      fontFamily: 'monospace',
      theme: 'light' as const,
      tabSize: 2,
      wordWrap: true,
      showLineNumbers: true,
      autoSave: true,
      autoSaveDelay: 1000,
      responsive: {
        autoMergePanes: true,
        adaptiveTabWidth: true,
        touchOptimized: false,
        mobileBreakpoint: 768,
        tabletBreakpoint: 1024
      }
    },
    activePane: 'pane-1',
    createTab: jest.fn(),
    closeTab: jest.fn(),
    switchTab: jest.fn(),
    updateTab: jest.fn(),
    moveTab: jest.fn(),
    duplicateTab: jest.fn(),
    lockTab: jest.fn(),
    reorderTab: jest.fn(),
    createPane: jest.fn(),
    closePane: jest.fn(),
    activatePane: jest.fn(),
    splitPane: jest.fn(),
    splitPaneWithTab: jest.fn(),
    resizePane: jest.fn(),
    mergePanes: jest.fn(),
    canMergePanes: jest.fn(),
    getPaneMinSize: jest.fn(),
    validatePaneSize: jest.fn(),
    autoMergePanes: jest.fn(),
    createSplit: jest.fn(),
    removeSplit: jest.fn(),
    resizeSplit: jest.fn(),
    startDrag: jest.fn(),
    updateDrag: jest.fn(),
    endDrag: jest.fn(),
    openFile: jest.fn(),
    saveFile: jest.fn(),
    saveAllFiles: jest.fn(),
    updateSettings: jest.fn(),
    saveSession: jest.fn(),
    loadSession: jest.fn(),
    clearSession: jest.fn(),
    recoverSession: jest.fn(),
    enableAutoSave: jest.fn(),
    disableAutoSave: jest.fn(),
    triggerAutoSave: jest.fn(),
    saveImmediately: jest.fn(),
    recoverAutoSavedContent: jest.fn(),
    createTabGroup: jest.fn(),
    deleteTabGroup: jest.fn(),
    addTabToGroup: jest.fn(),
    removeTabFromGroup: jest.fn(),
    updateTabGroup: jest.fn(),
    linkTabs: jest.fn(),
    unlinkTabs: jest.fn(),
    getRelatedTabs: jest.fn(),
    findRelatedFiles: jest.fn(),
    moveTabToNewWindow: jest.fn(),
    getActiveTab: jest.fn(() => mockStoreState.tabs['tab-1']),
    getActivePane: jest.fn(() => mockStoreState.panes['pane-1']),
    getTabsByPane: jest.fn(() => [mockStoreState.tabs['tab-1'], mockStoreState.tabs['tab-2']]),
    getPaneById: jest.fn(),
    getTabById: jest.fn(),
    getTabGroupById: jest.fn(),
    getTabsByGroup: jest.fn()
  };

  beforeEach(() => {
    mockStore.mockReturnValue(mockStoreState);
    jest.clearAllMocks();
  });

  describe('ARIA Labels and Semantic Markup', () => {
    it('should have proper ARIA roles and labels', async () => {
      render(<ObsidianEditor />);

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      const editor = screen.getByRole('application');
      expect(editor).toHaveAttribute('aria-label', 'Obsidian 风格编辑器');

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', '编辑器主要内容');
    });

    it('should have proper tablist and tab roles', async () => {
      render(<ObsidianEditor />);

      await waitFor(() => {
        const tablist = screen.getByRole('tablist');
        expect(tablist).toBeInTheDocument();
        expect(tablist).toHaveAttribute('aria-label', '标签页列表');
      });

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
      
      tabs.forEach((tab, index) => {
        expect(tab).toHaveAttribute('aria-selected');
        expect(tab).toHaveAttribute('aria-controls');
      });
    });

    it('should have proper menu roles for dropdown', async () => {
      const user = userEvent.setup();
      render(<ObsidianEditor />);

      await waitFor(() => {
        const dropdownButton = screen.getAllByLabelText(/标签页选项菜单/)[0];
        expect(dropdownButton).toBeInTheDocument();
      });

      const dropdownButton = screen.getAllByLabelText(/标签页选项菜单/)[0];
      await user.click(dropdownButton);

      await waitFor(() => {
        const menu = screen.getByRole('menu');
        expect(menu).toBeInTheDocument();
        expect(menu).toHaveAttribute('aria-label', '标签页操作菜单');
      });

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support arrow key navigation between tabs', async () => {
      const user = userEvent.setup();
      render(<ObsidianEditor />);

      await waitFor(() => {
        const tablist = screen.getByRole('tablist');
        expect(tablist).toBeInTheDocument();
      });

      const tablist = screen.getByRole('tablist');
      tablist.focus();

      // Navigate right
      await user.keyboard('{ArrowRight}');
      expect(mockStoreState.switchTab).toHaveBeenCalled();

      // Navigate left
      await user.keyboard('{ArrowLeft}');
      expect(mockStoreState.switchTab).toHaveBeenCalled();
    });

    it('should support Home and End keys for tab navigation', async () => {
      const user = userEvent.setup();
      render(<ObsidianEditor />);

      await waitFor(() => {
        const tablist = screen.getByRole('tablist');
        expect(tablist).toBeInTheDocument();
      });

      const tablist = screen.getByRole('tablist');
      tablist.focus();

      // Navigate to first tab
      await user.keyboard('{Home}');
      expect(mockStoreState.switchTab).toHaveBeenCalled();

      // Navigate to last tab
      await user.keyboard('{End}');
      expect(mockStoreState.switchTab).toHaveBeenCalled();
    });

    it('should support Enter and Space to activate tabs', async () => {
      const user = userEvent.setup();
      render(<ObsidianEditor />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs[0]).toBeInTheDocument();
      });

      const firstTab = screen.getAllByRole('tab')[0];
      firstTab.focus();

      await user.keyboard('{Enter}');
      expect(mockStoreState.switchTab).toHaveBeenCalled();

      await user.keyboard(' ');
      expect(mockStoreState.switchTab).toHaveBeenCalled();
    });

    it('should support global keyboard shortcuts', async () => {
      const user = userEvent.setup();
      render(<ObsidianEditor />);

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Test Ctrl+T for new tab
      await user.keyboard('{Control>}t{/Control}');
      expect(mockStoreState.createTab).toHaveBeenCalled();

      // Test Ctrl+W for close tab
      await user.keyboard('{Control>}w{/Control}');
      expect(mockStoreState.closeTab).toHaveBeenCalled();
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce tab changes', async () => {
      const user = userEvent.setup();
      render(<ObsidianEditor />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs[1]).toBeInTheDocument();
      });

      const secondTab = screen.getAllByRole('tab')[1];
      await user.click(secondTab);

      expect(announceToScreenReader).toHaveBeenCalledWith(
        expect.stringContaining('Test File 2')
      );
    });

    it('should have screen reader only content for keyboard shortcuts', async () => {
      render(<ObsidianEditor />);

      await waitFor(() => {
        expect(screen.getByText('键盘快捷键')).toBeInTheDocument();
      });

      const shortcutsHeading = screen.getByText('键盘快捷键');
      expect(shortcutsHeading.closest('div')).toHaveClass('sr-only');
    });

    it('should have proper live regions', async () => {
      render(<ObsidianEditor />);

      await waitFor(() => {
        const liveRegion = document.querySelector('[aria-live="polite"]');
        expect(liveRegion).toBeInTheDocument();
      });
    });
  });

  describe('Focus Management', () => {
    it('should have proper focus indicators', async () => {
      render(<ObsidianEditor />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs[0]).toBeInTheDocument();
      });

      const firstTab = screen.getAllByRole('tab')[0];
      firstTab.focus();

      expect(firstTab).toHaveFocus();
      expect(firstTab).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('should trap focus in dropdown menus', async () => {
      const user = userEvent.setup();
      render(<ObsidianEditor />);

      await waitFor(() => {
        const dropdownButton = screen.getAllByLabelText(/标签页选项菜单/)[0];
        expect(dropdownButton).toBeInTheDocument();
      });

      const dropdownButton = screen.getAllByLabelText(/标签页选项菜单/)[0];
      await user.click(dropdownButton);

      await waitFor(() => {
        const menu = screen.getByRole('menu');
        expect(menu).toBeInTheDocument();
      });

      // Focus should be trapped within the menu
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[0]).toHaveFocus();
    });
  });

  describe('High Contrast Support', () => {
    it('should apply high contrast class when detected', () => {
      (detectHighContrastMode as jest.Mock).mockReturnValue(true);
      
      render(<ObsidianEditor />);

      const editor = document.querySelector('.obsidian-editor');
      expect(editor).toHaveClass('high-contrast');
    });

    it('should not apply high contrast class when not detected', () => {
      (detectHighContrastMode as jest.Mock).mockReturnValue(false);
      
      render(<ObsidianEditor />);

      const editor = document.querySelector('.obsidian-editor');
      expect(editor).not.toHaveClass('high-contrast');
    });
  });

  describe('Skip Links', () => {
    it('should create skip link on mount', async () => {
      render(<ObsidianEditor />);

      await waitFor(() => {
        const skipLink = document.querySelector('.skip-link');
        expect(skipLink).toBeInTheDocument();
        expect(skipLink).toHaveTextContent('跳转到主要内容');
      });
    });

    it('should remove skip link on unmount', async () => {
      const { unmount } = render(<ObsidianEditor />);

      await waitFor(() => {
        const skipLink = document.querySelector('.skip-link');
        expect(skipLink).toBeInTheDocument();
      });

      unmount();

      const skipLink = document.querySelector('.skip-link');
      expect(skipLink).not.toBeInTheDocument();
    });
  });
});

describe('Accessibility Utilities', () => {
  describe('isFocusable', () => {
    it('should identify focusable elements', () => {
      const button = document.createElement('button');
      expect(isFocusable(button)).toBe(true);

      const disabledButton = document.createElement('button');
      disabledButton.disabled = true;
      expect(isFocusable(disabledButton)).toBe(false);

      const hiddenElement = document.createElement('div');
      hiddenElement.setAttribute('aria-hidden', 'true');
      expect(isFocusable(hiddenElement)).toBe(false);
    });
  });

  describe('getFocusableElements', () => {
    it('should find all focusable elements in container', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Button 1</button>
        <input type="text" />
        <button disabled>Disabled Button</button>
        <a href="#">Link</a>
        <div tabindex="0">Focusable Div</div>
      `;

      const focusableElements = getFocusableElements(container);
      expect(focusableElements).toHaveLength(4); // Excludes disabled button
    });
  });

  describe('FocusTrap', () => {
    it('should trap focus within container', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>First</button>
        <button>Second</button>
        <button>Last</button>
      `;
      document.body.appendChild(container);

      const focusTrap = new FocusTrap(container);
      focusTrap.activate();

      const buttons = container.querySelectorAll('button');
      expect(document.activeElement).toBe(buttons[0]);

      // Simulate Tab key on last element
      const lastButton = buttons[2];
      lastButton.focus();
      
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      container.dispatchEvent(tabEvent);

      focusTrap.deactivate();
      document.body.removeChild(container);
    });
  });

  describe('KeyboardNavigationManager', () => {
    it('should handle arrow key navigation', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Button 1</button>
        <button>Button 2</button>
        <button>Button 3</button>
      `;
      document.body.appendChild(container);

      const navigationManager = new KeyboardNavigationManager(container, 'horizontal');
      
      const rightArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      const handled = navigationManager.handleKeyDown(rightArrowEvent);
      
      expect(handled).toBe(true);

      document.body.removeChild(container);
    });
  });
});