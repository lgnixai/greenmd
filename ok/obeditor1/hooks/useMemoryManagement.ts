import { useEffect, useRef, useCallback } from 'react';

interface MemoryManagerOptions {
  maxHistorySize?: number;
  cleanupInterval?: number;
  enabled?: boolean;
}

export function useMemoryManagement(options: MemoryManagerOptions = {}) {
  const {
    maxHistorySize = 50,
    cleanupInterval = 30000, // 30秒
    enabled = true
  } = options;

  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resourcesRef = useRef<Set<() => void>>(new Set());

  // 注册需要清理的资源
  const registerCleanup = useCallback((cleanupFn: () => void) => {
    resourcesRef.current.add(cleanupFn);
    
    // 返回取消注册的函数
    return () => {
      resourcesRef.current.delete(cleanupFn);
    };
  }, []);

  // 执行清理
  const cleanup = useCallback(() => {
    if (!enabled) return;

    console.log('Running memory cleanup...');
    
    // 执行所有注册的清理函数
    resourcesRef.current.forEach(cleanupFn => {
      try {
        cleanupFn();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });

    // 清理历史记录（如果有的话）
    if (typeof window !== 'undefined' && (window as any).__editorHistory) {
      const history = (window as any).__editorHistory;
      if (Array.isArray(history) && history.length > maxHistorySize) {
        history.splice(0, history.length - maxHistorySize);
      }
    }

    // 建议垃圾回收（仅在开发环境）
    if (process.env.NODE_ENV === 'development' && (window as any).gc) {
      (window as any).gc();
    }
  }, [enabled, maxHistorySize]);

  // 定期清理
  useEffect(() => {
    if (!enabled) return;

    cleanupTimerRef.current = setInterval(cleanup, cleanupInterval);

    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [cleanup, cleanupInterval, enabled]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanup();
      resourcesRef.current.clear();
    };
  }, [cleanup]);

  return {
    registerCleanup,
    cleanup
  };
}

// 编辑器特定的内存管理
export function useEditorMemoryManagement() {
  const { registerCleanup } = useMemoryManagement({
    maxHistorySize: 30, // 编辑器历史记录限制
    cleanupInterval: 60000, // 1分钟清理一次
  });

  // 清理编辑器状态
  const cleanupEditorState = useCallback(() => {
    // 清理 Lexical 编辑器的历史状态
    if (typeof window !== 'undefined') {
      const editorInstances = (window as any).__lexicalEditors || [];
      editorInstances.forEach((editor: any) => {
        try {
          // 清理历史记录
          if (editor.getHistoryState) {
            const historyState = editor.getHistoryState();
            if (historyState && historyState.clear) {
              historyState.clear();
            }
          }
        } catch (error) {
          console.error('Error cleaning editor state:', error);
        }
      });
    }
  }, []);

  // 清理未使用的事件监听器
  const cleanupEventListeners = useCallback(() => {
    // 这里可以添加清理特定事件监听器的逻辑
    console.log('Cleaning up event listeners...');
  }, []);

  // 注册清理函数
  useEffect(() => {
    const unregisterEditor = registerCleanup(cleanupEditorState);
    const unregisterListeners = registerCleanup(cleanupEventListeners);

    return () => {
      unregisterEditor();
      unregisterListeners();
    };
  }, [registerCleanup, cleanupEditorState, cleanupEventListeners]);

  return {
    cleanupEditorState,
    cleanupEventListeners
  };
}

// 内存使用监控
export function useMemoryMonitor() {
  const checkMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024);

      console.log(`Memory Usage: ${usedMB}MB / ${totalMB}MB (Limit: ${limitMB}MB)`);

      // 内存使用警告
      if (usedMB > limitMB * 0.8) {
        console.warn('High memory usage detected! Consider cleaning up resources.');
      }

      return {
        used: usedMB,
        total: totalMB,
        limit: limitMB,
        usage: usedMB / limitMB
      };
    }
    return null;
  }, []);

  useEffect(() => {
    // 定期检查内存使用情况
    const interval = setInterval(checkMemoryUsage, 30000); // 30秒检查一次

    return () => clearInterval(interval);
  }, [checkMemoryUsage]);

  return { checkMemoryUsage };
}
