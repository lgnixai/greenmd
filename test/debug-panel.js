const puppeteer = require('puppeteer');

async function debugPanel() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    
    // 导航到应用
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 调试底部面板结构...');
    
    // 检查所有相关元素
    const panelInfo = await page.evaluate(() => {
      const elements = [];
      
      // 查找所有可能的面板元素
      const selectors = [
        '[class*="border-t bg-background"]',
        '[class*="ResizableBottomPanel"]',
        '[class*="cursor-row-resize"]',
        'div[style*="height"]'
      ];
      
      selectors.forEach(selector => {
        const els = document.querySelectorAll(selector);
        els.forEach((el, index) => {
          elements.push({
            selector,
            index,
            className: el.className,
            style: el.style.cssText,
            height: el.style.height,
            offsetHeight: el.offsetHeight,
            textContent: el.textContent?.substring(0, 100)
          });
        });
      });
      
      return elements;
    });
    
    console.log('📋 找到的面板相关元素:');
    panelInfo.forEach((info, index) => {
      console.log(`${index + 1}. ${info.selector}[${info.index}]`);
      console.log(`   类名: ${info.className}`);
      console.log(`   样式: ${info.style}`);
      console.log(`   高度: ${info.height} (offset: ${info.offsetHeight}px)`);
      console.log(`   内容: ${info.textContent}`);
      console.log('');
    });
    
    // 检查 React 组件树
    const reactInfo = await page.evaluate(() => {
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        return 'React DevTools available';
      }
      return 'No React DevTools';
    });
    console.log('⚛️ React DevTools:', reactInfo);
    
    // 截图
    await page.screenshot({ 
      path: '/Users/leven/space/ai/molecule-3.x/debug-panel.png',
      fullPage: true 
    });
    console.log('📸 调试截图已保存: debug-panel.png');
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  } finally {
    await browser.close();
  }
}

debugPanel();
