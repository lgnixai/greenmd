const puppeteer = require('puppeteer');

async function debugPage() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    
    // 导航到应用
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 获取页面HTML内容
    const html = await page.content();
    console.log('页面HTML长度:', html.length);
    
    // 检查是否有底部面板相关的类
    const hasBottomPanel = html.includes('ResizableBottomPanel') || html.includes('border-t bg-background');
    console.log('包含底部面板相关类:', hasBottomPanel);
    
    // 检查布局状态
    const layoutInfo = await page.evaluate(() => {
      // 尝试获取布局状态
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        return 'React DevTools available';
      }
      return 'No React DevTools';
    });
    console.log('React DevTools状态:', layoutInfo);
    
    // 检查所有div元素
    const divs = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      return divs.map(div => ({
        className: div.className,
        textContent: div.textContent?.substring(0, 50)
      })).filter(div => div.className.includes('border-t') || div.className.includes('panel'));
    });
    console.log('相关div元素:', divs);
    
    // 截图
    await page.screenshot({ 
      path: '/Users/leven/space/ai/molecule-3.x/debug-screenshot.png',
      fullPage: true 
    });
    console.log('📸 调试截图已保存');
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  } finally {
    await browser.close();
  }
}

debugPage();
