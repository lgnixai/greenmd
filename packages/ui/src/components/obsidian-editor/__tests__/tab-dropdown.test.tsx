import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tab } from '../tab';
import { TabAction } from '../../../types/obsidian-editor';

// Mock the utils
jest.mock('../../../utils/obsidian-editor-utils', () => ({
  getFileIcon: jest.fn(() => '📄'),
  truncateText: jest.fn((text: string) => text)
}));

// Mock the dropdown manager
jest.mock('../dropdown-manager', () => ({
  useDropdownManager: () => ({
    activeDropdown: null,
    position: { x: 0, y: 0 },
    openDropdown: jest.fn(),
    closeDropdown: jest.fn(),
    isDropdownOpen: jest.fn(() => false)
  })
}));

const mockTab = {
  id: 'test-tab-1',
  title: 'Test File.js',
  content: 'console.log("test");',
  isDirty: false,
  isLocked: false,
  type: 'file' as const,
  filePath: '/test/file.js',
  createdAt: new Date(),
  modifiedAt: new Date()
};

const defaultProps = {
  tab: mockTab,
  isActive: true,
  onSelect: jest.fn(),
  onClose: jest.fn(),
  onMenuAction: jest.fn(),
  onDragStart: jest.fn(),
  onDragEnd: jest.fn(),
  draggable: true
};

describe('Tab Dropdown Menu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render tab with dropdown button', () => {
    render(<Tab {...defaultProps} />);
    
    expect(screen.getByText('Test File.js')).toBeInTheDocument();
    expect(screen.getByTitle('更多选项 (点击显示菜单)')).toBeInTheDocument();
  });

  it('should show dropdown menu when dropdown button is clicked', async () => {
    const user = userEvent.setup();
    render(<Tab {...defaultProps} />);
    
    const dropdownButton = screen.getByTitle('更多选项 (点击显示菜单)');
    await user.click(dropdownButton);
    
    await waitFor(() => {
      expect(screen.getByText('新标签')).toBeInTheDocument();
      expect(screen.getByText('关闭')).toBeInTheDocument();
      expect(screen.getByText('关闭其他标签页')).toBeInTheDocument();
      expect(screen.getByText('全部关闭')).toBeInTheDocument();
      expect(screen.getByText('复制标签页')).toBeInTheDocument();
      expect(screen.getByText('锁定')).toBeInTheDocument();
      expect(screen.getByText('上下分屏')).toBeInTheDocument();
      expect(screen.getByText('左右分屏')).toBeInTheDocument();
      expect(screen.getByText('重命名')).toBeInTheDocument();
      expect(screen.getByText('移动至新窗口')).toBeInTheDocument();
    });
  });

  it('should show keyboard shortcuts in dropdown menu', async () => {
    const user = userEvent.setup();
    render(<Tab {...defaultProps} />);
    
    const dropdownButton = screen.getByTitle('更多选项 (点击显示菜单)');
    await user.click(dropdownButton);
    
    await waitFor(() => {
      expect(screen.getByText('Ctrl+T')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+W')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+Shift+W')).toBeInTheDocument();
      expect(screen.getByText('F2')).toBeInTheDocument();
    });
  });

  it('should call onMenuAction when menu item is clicked', async () => {
    const user = userEvent.setup();
    const onMenuAction = jest.fn();
    render(<Tab {...defaultProps} onMenuAction={onMenuAction} />);
    
    const dropdownButton = screen.getByTitle('更多选项 (点击显示菜单)');
    await user.click(dropdownButton);
    
    await waitFor(() => {
      expect(screen.getByText('新标签')).toBeInTheDocument();
    });
    
    const newTabButton = screen.getByText('新标签');
    await user.click(newTabButton);
    
    expect(onMenuAction).toHaveBeenCalledWith('newTab');
  });

  it('should show different lock text for locked tabs', async () => {
    const user = userEvent.setup();
    const lockedTab = { ...mockTab, isLocked: true };
    render(<Tab {...defaultProps} tab={lockedTab} />);
    
    const dropdownButton = screen.getByTitle('更多选项 (点击显示菜单)');
    await user.click(dropdownButton);
    
    await waitFor(() => {
      expect(screen.getByText('解锁')).toBeInTheDocument();
    });
  });

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Tab {...defaultProps} />
        <div data-testid="outside">Outside element</div>
      </div>
    );
    
    const dropdownButton = screen.getByTitle('更多选项 (点击显示菜单)');
    await user.click(dropdownButton);
    
    await waitFor(() => {
      expect(screen.getByText('新标签')).toBeInTheDocument();
    });
    
    const outsideElement = screen.getByTestId('outside');
    await user.click(outsideElement);
    
    await waitFor(() => {
      expect(screen.queryByText('新标签')).not.toBeInTheDocument();
    });
  });

  it('should close dropdown when pressing Escape', async () => {
    const user = userEvent.setup();
    render(<Tab {...defaultProps} />);
    
    const dropdownButton = screen.getByTitle('更多选项 (点击显示菜单)');
    await user.click(dropdownButton);
    
    await waitFor(() => {
      expect(screen.getByText('新标签')).toBeInTheDocument();
    });
    
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByText('新标签')).not.toBeInTheDocument();
    });
  });

  it('should support keyboard navigation in dropdown', async () => {
    const user = userEvent.setup();
    render(<Tab {...defaultProps} />);
    
    const dropdownButton = screen.getByTitle('更多选项 (点击显示菜单)');
    await user.click(dropdownButton);
    
    await waitFor(() => {
      expect(screen.getByText('新标签')).toBeInTheDocument();
    });
    
    // Test arrow down navigation
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    
    // Test Enter key activation
    await user.keyboard('{Enter}');
    
    expect(defaultProps.onMenuAction).toHaveBeenCalled();
  });

  it('should not show "移动至新窗口" option for tabs without filePath', async () => {
    const user = userEvent.setup();
    const tabWithoutFile = { ...mockTab, filePath: undefined };
    render(<Tab {...defaultProps} tab={tabWithoutFile} />);
    
    const dropdownButton = screen.getByTitle('更多选项 (点击显示菜单)');
    await user.click(dropdownButton);
    
    await waitFor(() => {
      expect(screen.getByText('新标签')).toBeInTheDocument();
      expect(screen.queryByText('移动至新窗口')).not.toBeInTheDocument();
    });
  });
});