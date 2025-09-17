import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useObsidianEditorStore } from '../../../stores/obsidian-editor-store';
import { Tab } from '../tab';
import { RelatedTabsDialog } from '../related-tabs-dialog';
import { TabGroupsDialog } from '../tab-groups-dialog';

// Mock the store
jest.mock('../../../stores/obsidian-editor-store');

const mockStore = {
  tabs: {
    'tab1': {
      id: 'tab1',
      title: 'App.tsx',
      filePath: '/src/App.tsx',
      content: 'import React from "react";',
      type: 'file',
      isDirty: false,
      isLocked: false,
      createdAt: new Date(),
      modifiedAt: new Date()
    },
    'tab2': {
      id: 'tab2',
      title: 'App.test.tsx',
      filePath: '/src/App.test.tsx',
      content: 'import { render } from "@testing-library/react";',
      type: 'file',
      isDirty: true,
      isLocked: false,
      createdAt: new Date(),
      modifiedAt: new Date()
    },
    'tab3': {
      id: 'tab3',
      title: 'utils.ts',
      filePath: '/src/utils.ts',
      content: 'export function formatDate() {}',
      type: 'file',
      isDirty: false,
      isLocked: true,
      groupId: 'group1',
      color: '#3b82f6',
      createdAt: new Date(),
      modifiedAt: new Date()
    }
  },
  tabGroups: {
    'group1': {
      id: 'group1',
      name: '工具函数',
      color: '#3b82f6',
      tabs: ['tab3'],
      createdAt: new Date()
    }
  },
  getRelatedTabs: jest.fn(() => []),
  findRelatedFiles: jest.fn(() => ['/src/App.test.tsx']),
  linkTabs: jest.fn(),
  unlinkTabs: jest.fn(),
  openFile: jest.fn(() => 'new-tab-id'),
  createTabGroup: jest.fn(() => 'new-group-id'),
  deleteTabGroup: jest.fn(),
  addTabToGroup: jest.fn(),
  removeTabFromGroup: jest.fn(),
  updateTabGroup: jest.fn(),
  getTabsByGroup: jest.fn(() => []),
  moveTabToNewWindow: jest.fn()
};

(useObsidianEditorStore as jest.Mock).mockReturnValue(mockStore);

describe('Advanced Menu Features', () => {
  const defaultProps = {
    isActive: true,
    onSelect: jest.fn(),
    onClose: jest.fn(),
    onMenuAction: jest.fn(),
    onDragStart: jest.fn(),
    onDragEnd: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tab Component with Advanced Menu', () => {
    it('should show advanced menu options in dropdown', async () => {
      const user = userEvent.setup();
      
      render(
        <Tab
          tab={mockStore.tabs.tab1}
          {...defaultProps}
        />
      );

      // Open dropdown menu
      const dropdownButton = screen.getByRole('button', { name: /更多选项/ });
      await user.click(dropdownButton);

      // Check for advanced menu options
      expect(screen.getByText('关联标签页')).toBeInTheDocument();
      expect(screen.getByText('添加到分组')).toBeInTheDocument();
    });

    it('should show "移出分组" for grouped tabs', async () => {
      const user = userEvent.setup();
      
      render(
        <Tab
          tab={mockStore.tabs.tab3} // This tab is in a group
          {...defaultProps}
        />
      );

      // Open dropdown menu
      const dropdownButton = screen.getByRole('button', { name: /更多选项/ });
      await user.click(dropdownButton);

      // Should show "移出分组" instead of "添加到分组"
      expect(screen.getByText('移出分组')).toBeInTheDocument();
    });

    it('should display group color indicator for grouped tabs', () => {
      render(
        <Tab
          tab={mockStore.tabs.tab3} // This tab has a color
          {...defaultProps}
        />
      );

      // Check for color indicator
      const colorIndicator = document.querySelector('[style*="background-color: rgb(59, 130, 246)"]');
      expect(colorIndicator).toBeInTheDocument();
    });

    it('should handle moveToNewWindow action', async () => {
      const user = userEvent.setup();
      
      // Mock window.open
      const mockOpen = jest.fn(() => ({
        document: {
          write: jest.fn(),
          close: jest.fn()
        }
      }));
      Object.defineProperty(window, 'open', { value: mockOpen });

      render(
        <Tab
          tab={mockStore.tabs.tab1}
          {...defaultProps}
        />
      );

      // Open dropdown and click "移动至新窗口"
      const dropdownButton = screen.getByRole('button', { name: /更多选项/ });
      await user.click(dropdownButton);
      
      const moveToNewWindowOption = screen.getByText('移动至新窗口');
      await user.click(moveToNewWindowOption);

      // Should call moveTabToNewWindow
      expect(mockStore.moveTabToNewWindow).toHaveBeenCalledWith('tab1');
    });
  });

  describe('RelatedTabsDialog', () => {
    const dialogProps = {
      tab: mockStore.tabs.tab1,
      onClose: jest.fn(),
      position: { x: 100, y: 100 }
    };

    it('should render related tabs dialog', () => {
      render(<RelatedTabsDialog {...dialogProps} />);

      expect(screen.getByText('关联标签页')).toBeInTheDocument();
      expect(screen.getByText('App.tsx')).toBeInTheDocument();
    });

    it('should show suggested related files', () => {
      render(<RelatedTabsDialog {...dialogProps} />);

      expect(screen.getByText('建议的相关文件')).toBeInTheDocument();
      expect(screen.getByText('App.test.tsx')).toBeInTheDocument();
    });

    it('should handle linking tabs', async () => {
      const user = userEvent.setup();
      
      render(<RelatedTabsDialog {...dialogProps} />);

      // Find and click "打开并关联" button
      const linkButton = screen.getByText('打开并关联');
      await user.click(linkButton);

      expect(mockStore.openFile).toHaveBeenCalledWith('/src/App.test.tsx');
      expect(mockStore.linkTabs).toHaveBeenCalledWith('tab1', 'new-tab-id');
    });

    it('should handle search functionality', async () => {
      const user = userEvent.setup();
      
      render(<RelatedTabsDialog {...dialogProps} />);

      const searchInput = screen.getByPlaceholderText('搜索标签页...');
      await user.type(searchInput, 'test');

      expect(searchInput).toHaveValue('test');
    });

    it('should close dialog when clicking outside', async () => {
      const user = userEvent.setup();
      
      render(<RelatedTabsDialog {...dialogProps} />);

      // Click on the backdrop
      const backdrop = document.querySelector('.fixed.inset-0');
      await user.click(backdrop!);

      expect(dialogProps.onClose).toHaveBeenCalled();
    });
  });

  describe('TabGroupsDialog', () => {
    const dialogProps = {
      tab: mockStore.tabs.tab1,
      onClose: jest.fn(),
      position: { x: 100, y: 100 }
    };

    it('should render tab groups dialog', () => {
      render(<TabGroupsDialog {...dialogProps} />);

      expect(screen.getByText('标签页分组')).toBeInTheDocument();
      expect(screen.getByText('App.tsx')).toBeInTheDocument();
    });

    it('should show create new group form', async () => {
      const user = userEvent.setup();
      
      render(<TabGroupsDialog {...dialogProps} />);

      // Click create new group button
      const createButton = screen.getByRole('button', { name: '' }); // Plus icon button
      await user.click(createButton);

      expect(screen.getByPlaceholderText('分组名称')).toBeInTheDocument();
      expect(screen.getByText('选择颜色:')).toBeInTheDocument();
    });

    it('should handle creating new group', async () => {
      const user = userEvent.setup();
      
      render(<TabGroupsDialog {...dialogProps} />);

      // Open create form
      const createButton = screen.getByRole('button', { name: '' });
      await user.click(createButton);

      // Fill in group name
      const nameInput = screen.getByPlaceholderText('分组名称');
      await user.type(nameInput, '新分组');

      // Click create button
      const submitButton = screen.getByText('创建并加入');
      await user.click(submitButton);

      expect(mockStore.createTabGroup).toHaveBeenCalledWith('新分组', '#3b82f6', ['tab1']);
    });

    it('should show existing groups for ungrouped tab', () => {
      render(<TabGroupsDialog {...dialogProps} />);

      expect(screen.getByText('加入现有分组')).toBeInTheDocument();
    });

    it('should show current group info for grouped tab', () => {
      const groupedTabProps = {
        ...dialogProps,
        tab: mockStore.tabs.tab3 // This tab is in a group
      };

      render(<TabGroupsDialog {...groupedTabProps} />);

      expect(screen.getByText('当前分组: 工具函数')).toBeInTheDocument();
      expect(screen.getByText('离开分组')).toBeInTheDocument();
    });

    it('should handle leaving group', async () => {
      const user = userEvent.setup();
      
      const groupedTabProps = {
        ...dialogProps,
        tab: mockStore.tabs.tab3
      };

      render(<TabGroupsDialog {...groupedTabProps} />);

      const leaveButton = screen.getByText('离开分组');
      await user.click(leaveButton);

      expect(mockStore.removeTabFromGroup).toHaveBeenCalledWith('tab3');
    });
  });

  describe('Store Integration', () => {
    it('should handle tab group operations', () => {
      const store = useObsidianEditorStore();

      // Test creating tab group
      store.createTabGroup('测试分组', '#ff0000', ['tab1', 'tab2']);
      expect(store.createTabGroup).toHaveBeenCalledWith('测试分组', '#ff0000', ['tab1', 'tab2']);

      // Test adding tab to group
      store.addTabToGroup('tab1', 'group1');
      expect(store.addTabToGroup).toHaveBeenCalledWith('tab1', 'group1');

      // Test removing tab from group
      store.removeTabFromGroup('tab1');
      expect(store.removeTabFromGroup).toHaveBeenCalledWith('tab1');
    });

    it('should handle related tabs operations', () => {
      const store = useObsidianEditorStore();

      // Test linking tabs
      store.linkTabs('tab1', 'tab2');
      expect(store.linkTabs).toHaveBeenCalledWith('tab1', 'tab2');

      // Test unlinking tabs
      store.unlinkTabs('tab1', 'tab2');
      expect(store.unlinkTabs).toHaveBeenCalledWith('tab1', 'tab2');

      // Test finding related files
      store.findRelatedFiles('/src/App.tsx');
      expect(store.findRelatedFiles).toHaveBeenCalledWith('/src/App.tsx');
    });

    it('should handle move to new window', () => {
      const store = useObsidianEditorStore();

      store.moveTabToNewWindow('tab1');
      expect(store.moveTabToNewWindow).toHaveBeenCalledWith('tab1');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle escape key in dialogs', async () => {
      const user = userEvent.setup();
      
      render(<RelatedTabsDialog {...{
        tab: mockStore.tabs.tab1,
        onClose: jest.fn(),
        position: { x: 100, y: 100 }
      }} />);

      await user.keyboard('{Escape}');
      // Dialog should close (tested via onClose callback)
    });

    it('should handle enter key in create group form', async () => {
      const user = userEvent.setup();
      
      render(<TabGroupsDialog {...{
        tab: mockStore.tabs.tab1,
        onClose: jest.fn(),
        position: { x: 100, y: 100 }
      }} />);

      // Open create form
      const createButton = screen.getByRole('button', { name: '' });
      await user.click(createButton);

      // Type group name and press enter
      const nameInput = screen.getByPlaceholderText('分组名称');
      await user.type(nameInput, '快速分组{Enter}');

      expect(mockStore.createTabGroup).toHaveBeenCalledWith('快速分组', '#3b82f6', ['tab1']);
    });
  });

  describe('Error Handling', () => {
    it('should handle window.open failure gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock window.open to return null (blocked popup)
      Object.defineProperty(window, 'open', { value: jest.fn(() => null) });
      
      // Mock alert
      const mockAlert = jest.fn();
      Object.defineProperty(window, 'alert', { value: mockAlert });

      render(
        <Tab
          tab={mockStore.tabs.tab1}
          {...defaultProps}
        />
      );

      // Trigger move to new window
      const dropdownButton = screen.getByRole('button', { name: /更多选项/ });
      await user.click(dropdownButton);
      
      const moveOption = screen.getByText('移动至新窗口');
      await user.click(moveOption);

      // Should show alert about popup being blocked
      expect(mockAlert).toHaveBeenCalledWith('无法打开新窗口，请检查浏览器设置');
    });

    it('should handle empty group name gracefully', async () => {
      const user = userEvent.setup();
      
      render(<TabGroupsDialog {...{
        tab: mockStore.tabs.tab1,
        onClose: jest.fn(),
        position: { x: 100, y: 100 }
      }} />);

      // Open create form
      const createButton = screen.getByRole('button', { name: '' });
      await user.click(createButton);

      // Try to create group with empty name
      const submitButton = screen.getByText('创建并加入');
      await user.click(submitButton);

      // Should not call createTabGroup
      expect(mockStore.createTabGroup).not.toHaveBeenCalled();
    });
  });
});