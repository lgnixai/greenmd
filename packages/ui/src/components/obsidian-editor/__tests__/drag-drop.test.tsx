import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Tab } from '../tab';
import { TabBar } from '../tab-bar';
import { dragDropManager } from '../../../utils/drag-drop-manager';
import { Tab as TabType } from '../../../types/obsidian-editor';

// Mock the store
vi.mock('../../../stores/obsidian-editor-store', () => ({
  useObsidianEditorStore: () => ({
    reorderTab: vi.fn()
  })
}));

describe('Drag and Drop Functionality', () => {
  const mockTab: TabType = {
    id: 'test-tab-1',
    title: 'Test Tab',
    content: 'Test content',
    isDirty: false,
    isLocked: false,
    type: 'file',
    createdAt: new Date(),
    modifiedAt: new Date()
  };

  const mockTabs: TabType[] = [
    mockTab,
    {
      id: 'test-tab-2',
      title: 'Test Tab 2',
      content: 'Test content 2',
      isDirty: false,
      isLocked: false,
      type: 'file',
      createdAt: new Date(),
      modifiedAt: new Date()
    }
  ];

  beforeEach(() => {
    // Reset drag drop manager state
    dragDropManager.endDrag();
  });

  describe('Tab Component', () => {
    it('should be draggable by default', () => {
      render(
        <Tab
          tab={mockTab}
          isActive={false}
          onSelect={vi.fn()}
          onClose={vi.fn()}
          onMenuAction={vi.fn()}
          onDragStart={vi.fn()}
          onDragEnd={vi.fn()}
        />
      );

      const tabElement = screen.getByRole('generic');
      expect(tabElement).toHaveAttribute('draggable', 'true');
    });

    it('should not be draggable when draggable prop is false', () => {
      render(
        <Tab
          tab={mockTab}
          isActive={false}
          onSelect={vi.fn()}
          onClose={vi.fn()}
          onMenuAction={vi.fn()}
          onDragStart={vi.fn()}
          onDragEnd={vi.fn()}
          draggable={false}
        />
      );

      const tabElement = screen.getByRole('generic');
      expect(tabElement).toHaveAttribute('draggable', 'false');
    });

    it('should call onDragStart when drag starts', () => {
      const onDragStart = vi.fn();
      
      render(
        <div data-pane-id="test-pane">
          <Tab
            tab={mockTab}
            isActive={false}
            onSelect={vi.fn()}
            onClose={vi.fn()}
            onMenuAction={vi.fn()}
            onDragStart={onDragStart}
            onDragEnd={vi.fn()}
          />
        </div>
      );

      const tabElement = screen.getByRole('generic');
      fireEvent.dragStart(tabElement, {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
          setDragImage: vi.fn()
        }
      });

      expect(onDragStart).toHaveBeenCalled();
    });

    it('should call onDragEnd when drag ends', () => {
      const onDragEnd = vi.fn();
      
      render(
        <Tab
          tab={mockTab}
          isActive={false}
          onSelect={vi.fn()}
          onClose={vi.fn()}
          onMenuAction={vi.fn()}
          onDragStart={vi.fn()}
          onDragEnd={onDragEnd}
        />
      );

      const tabElement = screen.getByRole('generic');
      fireEvent.dragEnd(tabElement);

      expect(onDragEnd).toHaveBeenCalled();
    });
  });

  describe('TabBar Component', () => {
    it('should handle drag over events', () => {
      const onTabDrag = vi.fn();
      
      render(
        <TabBar
          tabs={mockTabs}
          activeTab="test-tab-1"
          paneId="test-pane"
          onTabClick={vi.fn()}
          onTabClose={vi.fn()}
          onTabDrag={onTabDrag}
          onNewTab={vi.fn()}
          onTabAction={vi.fn()}
        />
      );

      const tabBarContainer = screen.getByRole('generic');
      fireEvent.dragOver(tabBarContainer, {
        clientX: 100,
        clientY: 50,
        dataTransfer: {
          dropEffect: ''
        }
      });

      // Should not throw any errors
      expect(tabBarContainer).toBeInTheDocument();
    });

    it('should handle drop events for tab reordering', () => {
      const onTabDrag = vi.fn();
      
      render(
        <TabBar
          tabs={mockTabs}
          activeTab="test-tab-1"
          paneId="test-pane"
          onTabClick={vi.fn()}
          onTabClose={vi.fn()}
          onTabDrag={onTabDrag}
          onNewTab={vi.fn()}
          onTabAction={vi.fn()}
        />
      );

      const tabBarContainer = screen.getByRole('generic');
      
      // Simulate drop event
      fireEvent.drop(tabBarContainer, {
        clientX: 100,
        clientY: 50,
        dataTransfer: {
          getData: (type: string) => {
            if (type === 'text/plain') return 'test-tab-1';
            if (type === 'application/source-pane') return 'test-pane';
            return '';
          }
        }
      });

      // Should handle the drop without errors
      expect(tabBarContainer).toBeInTheDocument();
    });
  });

  describe('Drag Drop Manager', () => {
    it('should start drag correctly', () => {
      const mockDragEvent = new DragEvent('dragstart', {
        dataTransfer: new DataTransfer()
      });

      dragDropManager.startDrag('test-tab', 'test-pane', mockDragEvent);
      
      const state = dragDropManager.getState();
      expect(state.isDragging).toBe(true);
      expect(state.draggedTabId).toBe('test-tab');
      expect(state.draggedFromPane).toBe('test-pane');
    });

    it('should end drag correctly', () => {
      const mockDragEvent = new DragEvent('dragstart', {
        dataTransfer: new DataTransfer()
      });

      dragDropManager.startDrag('test-tab', 'test-pane', mockDragEvent);
      dragDropManager.endDrag();
      
      const state = dragDropManager.getState();
      expect(state.isDragging).toBe(false);
      expect(state.draggedTabId).toBe(null);
      expect(state.draggedFromPane).toBe(null);
    });

    it('should calculate drag position correctly', () => {
      const mockContainer = document.createElement('div');
      mockContainer.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        right: 200,
        bottom: 50,
        width: 200,
        height: 50,
        x: 0,
        y: 0,
        toJSON: vi.fn()
      }));

      const mockTabElements = [
        {
          getBoundingClientRect: vi.fn(() => ({
            left: 0,
            top: 0,
            right: 100,
            bottom: 50,
            width: 100,
            height: 50,
            x: 0,
            y: 0,
            toJSON: vi.fn()
          }))
        } as unknown as HTMLElement
      ];

      const position = dragDropManager.calculateDragPosition(
        50, // clientX - middle of first tab
        25, // clientY - middle of container
        mockContainer,
        mockTabElements
      );

      expect(position).toBeDefined();
      expect(position?.zone).toBe('tab');
    });
  });
});