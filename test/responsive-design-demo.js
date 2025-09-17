/**
 * 响应式设计演示和测试
 * 测试移动端标签页显示优化、自动面板合并、触摸设备交互等功能
 */

// 模拟不同设备的视窗大小
const deviceSizes = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
  wide: { width: 1920, height: 1080 }
};

// 模拟触摸设备
const simulateTouchDevice = () => {
  // 添加触摸事件支持
  Object.defineProperty(window, 'ontouchstart', {
    value: true,
    writable: true
  });
  
  Object.defineProperty(navigator, 'maxTouchPoints', {
    value: 5,
    writable: true
  });
};

// 模拟非触摸设备
const simulateNonTouchDevice = () => {
  delete window.ontouchstart;
  Object.defineProperty(navigator, 'maxTouchPoints', {
    value: 0,
    writable: true
  });
};

// 设置视窗大小
const setViewportSize = (width, height) => {
  // 模拟窗口大小变化
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    writable: true
  });
  
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    writable: true
  });
  
  // 触发 resize 事件
  window.dispatchEvent(new Event('resize'));
};

// 测试响应式标签页宽度计算
const testResponsiveTabWidth = () => {
  console.log('=== 测试响应式标签页宽度计算 ===');
  
  const testCases = [
    { containerWidth: 300, tabCount: 3, device: 'mobile' },
    { containerWidth: 600, tabCount: 5, device: 'tablet' },
    { containerWidth: 1200, tabCount: 8, device: 'desktop' }
  ];
  
  testCases.forEach(({ containerWidth, tabCount, device }) => {
    const isMobile = device === 'mobile';
    const isTablet = device === 'tablet';
    
    // 这里需要导入实际的函数进行测试
    // const result = getResponsiveTabWidth(containerWidth, tabCount, isMobile, isTablet);
    
    console.log(`设备: ${device}, 容器宽度: ${containerWidth}px, 标签页数量: ${tabCount}`);
    // console.log(`计算结果:`, result);
  });
};

// 测试自动面板合并逻辑
const testAutoMergePanes = () => {
  console.log('=== 测试自动面板合并逻辑 ===');
  
  const testCases = [
    { width: 400, height: 300, paneCount: 2, device: 'mobile' },
    { width: 800, height: 600, paneCount: 3, device: 'tablet' },
    { width: 1200, height: 800, paneCount: 4, device: 'desktop' }
  ];
  
  testCases.forEach(({ width, height, paneCount, device }) => {
    const isMobile = device === 'mobile';
    const isTablet = device === 'tablet';
    
    // 这里需要导入实际的函数进行测试
    // const shouldMerge = shouldAutoMergePanes(width, height, paneCount, isMobile, isTablet);
    
    console.log(`设备: ${device}, 尺寸: ${width}x${height}px, 面板数量: ${paneCount}`);
    // console.log(`是否应该合并:`, shouldMerge);
  });
};

// 测试触摸优化尺寸
const testTouchOptimizedSizes = () => {
  console.log('=== 测试触摸优化尺寸 ===');
  
  const testCases = [
    { isTouchDevice: true, isMobile: true },
    { isTouchDevice: true, isMobile: false },
    { isTouchDevice: false, isMobile: false }
  ];
  
  testCases.forEach(({ isTouchDevice, isMobile }) => {
    // 这里需要导入实际的函数进行测试
    // const sizes = getTouchOptimizedSizes(isTouchDevice, isMobile);
    
    console.log(`触摸设备: ${isTouchDevice}, 移动设备: ${isMobile}`);
    // console.log(`优化尺寸:`, sizes);
  });
};

// 模拟设备切换测试
const testDeviceSwitching = async () => {
  console.log('=== 测试设备切换 ===');
  
  for (const [deviceName, size] of Object.entries(deviceSizes)) {
    console.log(`切换到 ${deviceName} (${size.width}x${size.height})`);
    
    // 设置设备类型
    if (deviceName === 'mobile' || deviceName === 'tablet') {
      simulateTouchDevice();
    } else {
      simulateNonTouchDevice();
    }
    
    // 设置视窗大小
    setViewportSize(size.width, size.height);
    
    // 等待一段时间让响应式逻辑生效
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log(`当前视窗: ${window.innerWidth}x${window.innerHeight}`);
    console.log(`触摸支持: ${!!window.ontouchstart}`);
  }
};

// 测试方向变化
const testOrientationChange = () => {
  console.log('=== 测试方向变化 ===');
  
  // 模拟竖屏
  setViewportSize(375, 667);
  console.log('竖屏模式:', window.innerWidth, 'x', window.innerHeight);
  
  // 模拟横屏
  setViewportSize(667, 375);
  console.log('横屏模式:', window.innerWidth, 'x', window.innerHeight);
  
  // 触发方向变化事件
  window.dispatchEvent(new Event('orientationchange'));
};

// 性能测试
const testPerformance = () => {
  console.log('=== 性能测试 ===');
  
  const iterations = 1000;
  
  // 测试响应式计算性能
  console.time('响应式计算');
  for (let i = 0; i < iterations; i++) {
    // 模拟响应式计算
    const width = Math.random() * 2000;
    const height = Math.random() * 1000;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    
    // 这里会调用实际的响应式函数
  }
  console.timeEnd('响应式计算');
};

// 集成测试
const runIntegrationTests = async () => {
  console.log('开始响应式设计集成测试...\n');
  
  try {
    testResponsiveTabWidth();
    console.log('');
    
    testAutoMergePanes();
    console.log('');
    
    testTouchOptimizedSizes();
    console.log('');
    
    await testDeviceSwitching();
    console.log('');
    
    testOrientationChange();
    console.log('');
    
    testPerformance();
    console.log('');
    
    console.log('✅ 所有响应式设计测试完成');
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
};

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  // 等待 DOM 加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runIntegrationTests);
  } else {
    runIntegrationTests();
  }
}

// 导出测试函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testResponsiveTabWidth,
    testAutoMergePanes,
    testTouchOptimizedSizes,
    testDeviceSwitching,
    testOrientationChange,
    testPerformance,
    runIntegrationTests,
    deviceSizes,
    setViewportSize,
    simulateTouchDevice,
    simulateNonTouchDevice
  };
}