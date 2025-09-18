import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentName: string;
  timestamp: number;
}

interface UsePerformanceMonitorOptions {
  enabled?: boolean;
  threshold?: number; // 性能警告阈值（毫秒）
  onMetrics?: (metrics: PerformanceMetrics) => void;
}

export function usePerformanceMonitor(
  componentName: string,
  options: UsePerformanceMonitorOptions = {}
) {
  const {
    enabled = process.env.NODE_ENV === 'development',
    threshold = 16, // 60fps = 16.67ms per frame
    onMetrics
  } = options;

  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  const startMeasure = useCallback(() => {
    if (!enabled) return;
    renderStartTime.current = performance.now();
  }, [enabled]);

  const endMeasure = useCallback(() => {
    if (!enabled || renderStartTime.current === 0) return;

    const renderTime = performance.now() - renderStartTime.current;
    renderCount.current++;

    const metrics: PerformanceMetrics = {
      renderTime,
      componentName,
      timestamp: Date.now()
    };

    // 添加内存使用信息（如果可用）
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      metrics.memoryUsage = memoryInfo.usedJSHeapSize;
    }

    // 性能警告
    if (renderTime > threshold) {
      console.warn(
        `Performance Warning: ${componentName} took ${renderTime.toFixed(2)}ms to render (threshold: ${threshold}ms)`
      );
    }

    // 调用自定义回调
    if (onMetrics) {
      onMetrics(metrics);
    }

    // 重置计时器
    renderStartTime.current = 0;
  }, [enabled, componentName, threshold, onMetrics]);

  // 在组件挂载时开始测量
  useEffect(() => {
    startMeasure();
    return endMeasure;
  });

  // 在每次渲染时测量
  useEffect(() => {
    endMeasure();
    startMeasure();
  });

  return {
    startMeasure,
    endMeasure,
    renderCount: renderCount.current
  };
}

// 全局性能监控器
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // 最多保存100个指标

  addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics(componentName?: string): PerformanceMetrics[] {
    if (componentName) {
      return this.metrics.filter(m => m.componentName === componentName);
    }
    return [...this.metrics];
  }

  getAverageRenderTime(componentName: string): number {
    const componentMetrics = this.getMetrics(componentName);
    if (componentMetrics.length === 0) return 0;
    
    const totalTime = componentMetrics.reduce((sum, metric) => sum + metric.renderTime, 0);
    return totalTime / componentMetrics.length;
  }

  getSlowRenders(threshold = 16): PerformanceMetrics[] {
    return this.metrics.filter(m => m.renderTime > threshold);
  }

  clear() {
    this.metrics = [];
  }

  generateReport(): string {
    const components = [...new Set(this.metrics.map(m => m.componentName))];
    
    let report = 'Performance Report\n';
    report += '==================\n\n';
    
    components.forEach(componentName => {
      const avgTime = this.getAverageRenderTime(componentName);
      const slowRenders = this.getSlowRenders().filter(m => m.componentName === componentName);
      
      report += `${componentName}:\n`;
      report += `  Average render time: ${avgTime.toFixed(2)}ms\n`;
      report += `  Slow renders (>16ms): ${slowRenders.length}\n`;
      
      if (slowRenders.length > 0) {
        const maxTime = Math.max(...slowRenders.map(m => m.renderTime));
        report += `  Slowest render: ${maxTime.toFixed(2)}ms\n`;
      }
      
      report += '\n';
    });
    
    return report;
  }
}

export const globalPerformanceMonitor = new PerformanceMonitor();

// 在开发环境下将监控器添加到 window 对象以便调试
if (process.env.NODE_ENV === 'development') {
  (window as any).__performanceMonitor = globalPerformanceMonitor;
}
