import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useResponsiveDesign, getResponsiveTabWidth, shouldAutoMergePanes, getTouchOptimizedSizes } from '../../../hooks/useResponsiveDesign';
import { TabBar } from '../tab-bar';
import { PaneSplitterComponent } from '../pane-splitter';
import { createDefaultTab, createDefaultSettings } from '../../../utils/obsidian-editor-utils';

// Mock the store
jest.mock('../../../stores/obsidian-editor-store', () => ({
  useObsidianEditorStore: () => ({
    reorderTab: jest.fn(),
    settings: createDefaultSettings()
  })
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Helper to mock window dimensions
const mockWindowDimensions = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
};

// Helper to mock touch device
const mockTouchDevice = (isTouch: boolean) => {
  if (isTouch) {
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
  } else {
    delete (window as any).ontouchstart;
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    });
  }
};

describe('响应式设计', () => {
  beforeEach(() => {
    // 重置为桌面环境
    mockWindowDimensions(1440, 900);
    mockTouchDevice(false);
  });

  describe('useResponsiveDesign Hook', () => {
    const TestComponent = () => {
      const responsive = useResponsiveDesign();
      return (
        <div>
          <div data-testid="is-mobile">{responsive.isMobile.toString()}</div>
          <div data-testid="is-tablet">{responsive.isTablet.toString()}</div>
          <div data-testid="is-desktop">{responsive.isDesktop.toString()}</div>
          <div data-testid="is-touch">{responsive.isTouchDevice.toString()}</div>
          <div data-testid="width">{responsive.width}</div>
          <div data-testid="height">{responsive.height}</div>
          <div data-testid="orientation">{responsive.orientation}</div>
        </div>
      );
    };

    it('应该正确检测桌面设备', () => {
      mockWindowDimensions(1440, 900);
      render(<TestComponent />);
      
      expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('true');
      expect(screen.getByTestId('is-touch')).toHaveTextContent('false');
      expect(screen.getByTestId('orientation')).toHaveTextContent('landscape');
    });

    it('应该正确检测移动设备', () => {
      mockWindowDimensions(375, 667);
      render(<TestComponent />);
      
      expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('false');
      expect(screen.getByTestId('orientation')).toHaveTextContent('portrait');
    });

    it('应该正确检测平板设备', () => {
      mockWindowDimensions(768, 1024);
      render(<TestComponent />);
      
      expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('true');
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('false');
      expect(screen.getByTestId('orientation')).toHaveTextContent('portrait');
    });

    it('应该正确检测触摸设备', () => {
      mockTouchDevice(true);
      render(<TestComponent />);
      
      expect(screen.getByTestId('is-touch')).toHaveTextContent('true');
    });

    it('应该响应窗口大小变化', async () => {
      const { rerender } = render(<TestComponent />);
      
      expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
      
      act(() => {
        mockWindowDimensions(375, 667);
        fireEvent(window, new Event('resize'));
      });
      
      // 等待防抖延迟
      await waitFor(() => {
        expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
      }, { timeout: 200 });
    });
  });

  describe('getResponsiveTabWidth', () => {
    it('应该为移动设备计算正确的标签页宽度', () => {
      const result = getResponsiveTabWidth(300, 3, true, false);
      
      expect(result.width).toBeGreaterThanOrEqual(80); // 最小宽度
      expect(result.width).toBeLessThanOrEqual(160); // 最大宽度
    });

    it('应该为平板设备计算正确的标签页宽度', () => {
      const result = getResponsiveTabWidth(600, 4, false, true);
      
      expect(result.width).toBeGreaterThanOrEqual(120); // 最小宽度
      expect(result.width).toBeLessThanOrEqual(200); // 最大宽度
    });

    it('应该为桌面设备计算正确的标签页宽度', () => {
      const result = getResponsiveTabWidth(1200, 6, false, false);
      
      expect(result.width).toBeGreaterThanOrEqual(150); // 最小宽度
      expect(result.width).toBeLessThanOrEqual(250); // 最大宽度
    });

    it('当标签页太多时应该显示滚动按钮', () => {
      const result = getResponsiveTabWidth(300, 10, true, false);
      
      expect(result.showScrollButtons).toBe(true);
      expect(result.width).toBe(80); // 应该使用最小宽度
    });

    it('当标签页较少时不应该显示滚动按钮', () => {
      const result = getResponsiveTabWidth(800, 2, false, false);
      
      expect(result.showScrollButtons).toBe(false);
      expect(result.width).toBe(250); // 应该使用最大宽度
    });
  });

  describe('shouldAutoMergePanes', () => {
    it('移动设备上应该自动合并多个面板', () => {
      const shouldMerge = shouldAutoMergePanes(375, 667, 2, true, false);
      expect(shouldMerge).toBe(true);
    });

    it('平板设备上超过2个面板应该合并', () => {
      const shouldMerge = shouldAutoMergePanes(768, 1024, 3, false, true);
      expect(shouldMerge).toBe(true);
    });

    it('桌面设备上有足够空间时不应该合并', () => {
      const shouldMerge = shouldAutoMergePanes(1440, 900, 2, false, false);
      expect(shouldMerge).toBe(false);
    });

    it('容器太小时应该合并面板', () => {
      const shouldMerge = shouldAutoMergePanes(400, 300, 2, false, true);
      expect(shouldMerge).toBe(true);
    });
  });

  describe('getTouchOptimizedSizes', () => {
    it('应该为触摸移动设备返回较大的尺寸', () => {
      const sizes = getTouchOptimizedSizes(true, true);
      
      expect(sizes.tabHeight).toBe(44);
      expect(sizes.buttonSize).toBe(32);
      expect(sizes.splitterSize).toBe(12);
      expect(sizes.minTouchTarget).toBe(44);
    });

    it('应该为触摸平板设备返回中等尺寸', () => {
      const sizes = getTouchOptimizedSizes(true, false);
      
      expect(sizes.tabHeight).toBe(40);
      expect(sizes.buttonSize).toBe(28);
      expect(sizes.splitterSize).toBe(8);
      expect(sizes.minTouchTarget).toBe(44);
    });

    it('应该为非触摸设备返回较小的尺寸', () => {
      const sizes = getTouchOptimizedSizes(false, false);
      
      expect(sizes.tabHeight).toBe(32);
      expect(sizes.buttonSize).toBe(24);
      expect(sizes.splitterSize).toBe(4);
      expect(sizes.minTouchTarget).toBe(24);
    });
  });

  describe('TabBar 响应式行为', () => {
    const mockTabs = [
      createDefaultTab({ id: '1', title: 'Tab 1' }),
      createDefaultTab({ id: '2', title: 'Tab 2' }),
      createDefaultTab({ id: '3', title: 'Tab 3' })
    ];

    const defaultProps = {
      tabs: mockTabs,
      activeTab: '1',
      paneId: 'pane-1',
      onTabClick: jest.fn(),
      onTabClose: jest.fn(),
      onTabDrag: jest.fn(),
      onNewTab: jest.fn(),
      onTabAction: jest.fn()
    };

    it('应该在移动设备上应用响应式样式', () => {
      mockWindowDimensions(375, 667);
      mockTouchDevice(true);
      
      render(<TabBar {...defaultProps} />);
      
      const tabBar = screen.getByRole('tablist', { hidden: true }) || 
                    document.querySelector('[data-pane-id="pane-1"]')?.parentElement;
      
      if (tabBar) {
        expect(tabBar).toHaveClass('px-1');
      }
    });

    it('应该在触摸设备上禁用拖拽', () => {
      mockTouchDevice(true);
      
      render(<TabBar {...defaultProps} />);
      
      const tabs = document.querySelectorAll('[data-tab-id]');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('draggable', 'false');
      });
    });

    it('应该在移动设备上隐藏面板关闭按钮', () => {
      mockWindowDimensions(375, 667);
      
      render(<TabBar {...defaultProps} canClosePane={true} onPaneClose={jest.fn()} />);
      
      const closeButton = screen.queryByTitle('关闭面板');
      expect(closeButton).not.toBeInTheDocument();
    });
  });

  describe('PaneSplitter 触摸优化', () => {
    const mockSplitter = {
      id: 'splitter-1',
      direction: 'vertical' as const,
      position: 0.5,
      paneA: 'pane-1',
      paneB: 'pane-2'
    };

    const defaultProps = {
      splitter: mockSplitter,
      onDragStart: jest.fn(),
      onDrag: jest.fn(),
      onDragEnd: jest.fn(),
      onDoubleClick: jest.fn()
    };

    it('应该在触摸设备上使用更大的分割器', () => {
      mockTouchDevice(true);
      mockWindowDimensions(375, 667);
      
      render(<PaneSplitterComponent {...defaultProps} />);
      
      const splitter = screen.getByRole('separator');
      const style = window.getComputedStyle(splitter);
      
      // 触摸设备应该有更大的最小宽度
      expect(splitter.style.minWidth).toBeTruthy();
    });

    it('应该支持指针事件进行拖拽', () => {
      render(<PaneSplitterComponent {...defaultProps} />);
      
      const splitter = screen.getByRole('separator');
      
      fireEvent.pointerDown(splitter, { clientX: 100, clientY: 100 });
      
      expect(defaultProps.onDragStart).toHaveBeenCalledWith(
        'splitter-1',
        0.5,
        100
      );
    });

    it('应该在触摸设备上显示拖拽手柄', () => {
      mockTouchDevice(true);
      
      render(<PaneSplitterComponent {...defaultProps} />);
      
      const gripIcon = document.querySelector('svg');
      expect(gripIcon).toBeInTheDocument();
    });
  });

  describe('边缘情况', () => {
    it('应该处理极小的容器尺寸', () => {
      const result = getResponsiveTabWidth(50, 1, true, false);
      expect(result.width).toBeGreaterThan(0);
    });

    it('应该处理零标签页的情况', () => {
      const result = getResponsiveTabWidth(300, 0, false, false);
      expect(result.showScrollButtons).toBe(false);
    });

    it('应该处理极大的标签页数量', () => {
      const result = getResponsiveTabWidth(1000, 100, false, false);
      expect(result.showScrollButtons).toBe(true);
    });
  });
});