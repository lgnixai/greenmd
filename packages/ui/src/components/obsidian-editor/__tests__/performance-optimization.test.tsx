import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ObsidianEditor } from '../obsidian-editor';
import { VirtualizedTabBar } from '../virtualized-tab-bar';
import { FileEditor } from '../file-editor';
import { 
  memoryManager, 
  performanceMonitor, 
  chunkLoader, 
  TabVirtualizer 
} from '../../utils/performance-optimizer';
import { ErrorBoundary } from '../../error-boundary';

// Mock performance APIs
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => [{ duration: 10 }])
  }
});

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn()
}));

describe('Performance Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memoryManager.clearCache();
  });

  afterEach(() => {
    performanceMonitor.disconnect();
  });

  describe('Memory Management', () => {
    it('should cache tab content efficiently', () => {
      const tabId = 'test-tab';
      const content = 'Test content for caching';
      
      memoryManager.cacheTabContent(tabId, content);
      
      const cachedContent = memoryManager.getCachedTabContent(tabId);
      expect(cachedContent).toBe(content);
    });

    it('should evict least recently used content when cache is full', () => {
      // Fill cache beyond limit
      const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
      
      for (let i = 0; i < 10; i++) {
        memoryManager.cacheTabContent(`tab-${i}`, largeContent);
      }
      
      const stats = memoryManager.getCacheStats();
      expect(stats.itemCount).toBeLessThan(10);
    });

    it('should provide accurate cache statistics', () => {
      const content = 'Test content';
      memoryManager.cacheTabContent('test', content);
      
      const stats = memoryManager.getCacheStats();
      expect(stats.itemCount).toBe(1);
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.utilization).toBeGreaterThan(0);
    });
  });

  describe('Tab Virtualization', () => {
    it('should create virtualizer with correct configuration', () => {
      const config = {
        itemHeight: 40,
        containerHeight: 400,
        overscan: 3
      };
      
      const virtualizer = new TabVirtualizer(config);
      expect(virtualizer).toBeDefined();
    });

    it('should calculate visible range correctly', () => {
      const virtualizer = new TabVirtualizer({
        itemHeight: 40,
        containerHeight: 400,
        overscan: 2
      });
      
      virtualizer.updateScrollTop(200);
      const range = virtualizer.getVisibleRange();
      
      expect(range.start).toBeGreaterThanOrEqual(0);
      expect(range.end).toBeGreaterThan(range.start);
    });

    it('should render virtualized tab bar for many tabs', () => {
      const manyTabs = Array.from({ length: 25 }, (_, i) => ({
        id: `tab-${i}`,
        title: `Tab ${i}`,
        content: `Content ${i}`,
        type: 'file' as const,
        isDirty: false,
        isLocked: false,
        createdAt: new Date(),
        modifiedAt: new Date()
      }));

      render(
        <VirtualizedTabBar
          tabs={manyTabs}
          activeTab="tab-0"
          paneId="pane-1"
          onTabClick={vi.fn()}
          onTabClose={vi.fn()}
          onTabDrag={vi.fn()}
          onNewTab={vi.fn()}
          onTabAction={vi.fn()}
          virtualizationThreshold={20}
        />
      );

      // Should render container but not all tabs at once
      expect(screen.getByRole('tablist', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Chunk Loading', () => {
    it('should load chunks for large content', async () => {
      const tabId = 'large-tab';
      const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
      
      const chunk = await chunkLoader.loadChunk(tabId, 0, largeContent);
      expect(chunk).toBeDefined();
      expect(chunk.length).toBeLessThanOrEqual(1024 * 1024); // Should be <= 1MB chunk
    });

    it('should handle concurrent chunk loading', async () => {
      const tabId = 'concurrent-tab';
      const content = 'x'.repeat(3 * 1024 * 1024); // 3MB
      
      const promises = [
        chunkLoader.loadChunk(tabId, 0, content),
        chunkLoader.loadChunk(tabId, 1, content),
        chunkLoader.loadChunk(tabId, 2, content)
      ];
      
      const chunks = await Promise.all(promises);
      expect(chunks).toHaveLength(3);
      chunks.forEach(chunk => expect(chunk).toBeDefined());
    });

    it('should calculate total chunks correctly', () => {
      const contentLength = 2.5 * 1024 * 1024; // 2.5MB
      const totalChunks = chunkLoader.getTotalChunks(contentLength);
      expect(totalChunks).toBe(3); // Should need 3 chunks for 2.5MB
    });
  });

  describe('Performance Monitoring', () => {
    it('should measure operation duration', () => {
      performanceMonitor.startMeasure('test-operation');
      performanceMonitor.endMeasure('test-operation');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics['test-operation']).toBeDefined();
      expect(metrics['test-operation'].count).toBe(1);
    });

    it('should calculate average times correctly', () => {
      performanceMonitor.startMeasure('avg-test');
      performanceMonitor.endMeasure('avg-test');
      performanceMonitor.startMeasure('avg-test');
      performanceMonitor.endMeasure('avg-test');
      
      const avgTime = performanceMonitor.getAverageTime('avg-test');
      expect(avgTime).toBeGreaterThan(0);
    });

    it('should observe long tasks when supported', () => {
      performanceMonitor.observeLongTasks();
      // Should not throw error even if not supported
      expect(true).toBe(true);
    });
  });

  describe('Large File Handling', () => {
    it('should detect large files and enable chunking', () => {
      const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
      const tab = {
        id: 'large-file',
        title: 'Large File',
        content: largeContent,
        type: 'file' as const,
        isDirty: false,
        isLocked: false,
        createdAt: new Date(),
        modifiedAt: new Date()
      };

      render(
        <FileEditor
          tab={tab}
          onContentChange={vi.fn()}
          settings={{
            fontSize: 14,
            fontFamily: 'monospace',
            tabSize: 2,
            wordWrap: true,
            showLineNumbers: true,
            autoSave: true,
            autoSaveDelay: 1000,
            theme: 'light',
            responsive: {
              enabled: true,
              mobileBreakpoint: 768,
              tabletBreakpoint: 1024,
              adaptiveTabWidth: true
            }
          }}
        />
      );

      // Should show large file indicator
      expect(screen.getByText('大文件')).toBeInTheDocument();
    });

    it('should handle visible content range for large files', () => {
      const largeContent = Array.from({ length: 10000 }, (_, i) => `Line ${i}`).join('\n');
      
      const visibleContent = chunkLoader.getVisibleContent('test', 0, 100, largeContent);
      const lines = visibleContent.split('\n');
      expect(lines.length).toBe(101); // Lines 0-100 inclusive
    });
  });

  describe('Error Boundaries', () => {
    it('should catch and display errors gracefully', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should reset error state when retry is clicked', () => {
      let shouldThrow = true;
      const ConditionalError = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Success</div>;
      };

      render(
        <ErrorBoundary>
          <ConditionalError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      shouldThrow = false;
      fireEvent.click(screen.getByText('Try Again'));
      
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('should provide error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const ThrowError = () => {
        throw new Error('Detailed test error');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Details')).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Integration Tests', () => {
    it('should handle editor initialization with performance monitoring', async () => {
      const onFileChange = vi.fn();
      
      await act(async () => {
        render(
          <ObsidianEditor
            onFileChange={onFileChange}
            settings={{
              fontSize: 14,
              fontFamily: 'monospace',
              tabSize: 2,
              wordWrap: true,
              showLineNumbers: true,
              autoSave: true,
              autoSaveDelay: 1000,
              theme: 'light',
              responsive: {
                enabled: true,
                mobileBreakpoint: 768,
                tabletBreakpoint: 1024,
                adaptiveTabWidth: true
              }
            }}
          />
        );
      });

      // Should initialize without errors
      await waitFor(() => {
        expect(screen.queryByText('Initializing editor...')).not.toBeInTheDocument();
      });
    });

    it('should switch to virtualized tabs when threshold is exceeded', () => {
      const manyTabs = Array.from({ length: 20 }, (_, i) => ({
        id: `tab-${i}`,
        title: `Tab ${i}`,
        content: `Content ${i}`,
        type: 'file' as const,
        isDirty: false,
        isLocked: false,
        createdAt: new Date(),
        modifiedAt: new Date()
      }));

      const { rerender } = render(
        <VirtualizedTabBar
          tabs={manyTabs.slice(0, 10)}
          activeTab="tab-0"
          paneId="pane-1"
          onTabClick={vi.fn()}
          onTabClose={vi.fn()}
          onTabDrag={vi.fn()}
          onNewTab={vi.fn()}
          onTabAction={vi.fn()}
          virtualizationThreshold={15}
        />
      );

      // Add more tabs to exceed threshold
      rerender(
        <VirtualizedTabBar
          tabs={manyTabs}
          activeTab="tab-0"
          paneId="pane-1"
          onTabClick={vi.fn()}
          onTabClose={vi.fn()}
          onTabDrag={vi.fn()}
          onNewTab={vi.fn()}
          onTabAction={vi.fn()}
          virtualizationThreshold={15}
        />
      );

      // Should handle the transition gracefully
      expect(screen.getByRole('tablist', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Memory Cleanup', () => {
    it('should clean up resources on unmount', () => {
      const { unmount } = render(
        <ObsidianEditor
          settings={{
            fontSize: 14,
            fontFamily: 'monospace',
            tabSize: 2,
            wordWrap: true,
            showLineNumbers: true,
            autoSave: true,
            autoSaveDelay: 1000,
            theme: 'light',
            responsive: {
              enabled: true,
              mobileBreakpoint: 768,
              tabletBreakpoint: 1024,
              adaptiveTabWidth: true
            }
          }}
        />
      );

      const disconnectSpy = vi.spyOn(performanceMonitor, 'disconnect');
      const clearCacheSpy = vi.spyOn(memoryManager, 'clearCache');

      unmount();

      expect(disconnectSpy).toHaveBeenCalled();
      expect(clearCacheSpy).toHaveBeenCalled();
    });
  });
});