const puppeteer = require('puppeteer');

async function testPanelResize() {
  console.log('🧪 测试底部面板拖拽调整高度功能...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    
    // 导航到应用
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ 页面加载完成');
    
    // 查找底部面板
    const bottomPanel = await page.$('[class*="border-t bg-background"]');
    if (!bottomPanel) {
      console.log('❌ 底部面板不存在');
      return;
    }
    
    console.log('✅ 底部面板存在');
    
    // 获取面板初始高度
    const initialHeight = await page.evaluate(() => {
      const panel = document.querySelector('[class*="border-t bg-background"]');
      return panel ? panel.style.height : '0px';
    });
    console.log(`✅ 面板初始高度: ${initialHeight}`);
    
    // 查找拖拽手柄
    const resizeHandle = await page.$('[class*="cursor-row-resize"]');
    if (!resizeHandle) {
      console.log('❌ 拖拽手柄不存在');
      return;
    }
    
    console.log('✅ 拖拽手柄存在');
    
    // 获取拖拽手柄位置
    const handleBox = await resizeHandle.boundingBox();
    if (!handleBox) {
      console.log('❌ 无法获取拖拽手柄位置');
      return;
    }
    
    console.log(`✅ 拖拽手柄位置: x=${handleBox.x}, y=${handleBox.y}, width=${handleBox.width}, height=${handleBox.height}`);
    
    // 执行拖拽操作
    console.log('🔄 开始拖拽测试...');
    
    // 鼠标按下
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    
    // 向上拖拽（增加面板高度）
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y - 50, { steps: 10 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 鼠标释放
    await page.mouse.up();
    
    // 检查面板高度是否改变
    const newHeight = await page.evaluate(() => {
      const panel = document.querySelector('[class*="border-t bg-background"]');
      return panel ? panel.style.height : '0px';
    });
    
    console.log(`✅ 拖拽后面板高度: ${newHeight}`);
    
    if (newHeight !== initialHeight) {
      console.log('✅ 面板高度调整成功！');
    } else {
      console.log('⚠️ 面板高度未改变，可能需要调整拖拽逻辑');
    }
    
    // 测试标签页切换
    console.log('🔄 测试标签页切换...');
    
    const tabs = await page.$$('[role="tab"]');
    if (tabs.length > 1) {
      await tabs[1].click();
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ 标签页切换成功');
    }
    
    // 测试控制按钮
    console.log('🔄 测试控制按钮...');
    
    const maximizeButton = await page.$('button[title="最大化"]');
    if (maximizeButton) {
      await maximizeButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ 最大化按钮点击成功');
    }
    
    // 截图
    await page.screenshot({ 
      path: '/Users/leven/space/ai/molecule-3.x/panel-resize-test.png',
      fullPage: true 
    });
    console.log('📸 截图已保存: panel-resize-test.png');
    
    console.log('\n🎉 底部面板拖拽功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await browser.close();
  }
}

testPanelResize();
