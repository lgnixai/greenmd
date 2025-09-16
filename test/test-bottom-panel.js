const puppeteer = require('puppeteer');

async function testBottomPanel() {
  console.log('🧪 测试底部面板功能...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    
    // 导航到应用
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('✅ 页面加载完成');
    
    // 检查底部面板是否存在
    const bottomPanel = await page.$('[class*="border-t bg-background"]');
    if (bottomPanel) {
      console.log('✅ 底部面板存在');
      
      // 检查面板标签页
      const tabs = await page.$$('[role="tab"]');
      console.log(`✅ 找到 ${tabs.length} 个标签页`);
      
      // 检查控制按钮
      const controlButtons = await page.$$('button[title="最大化"], button[title="关闭"]');
      console.log(`✅ 找到 ${controlButtons.length} 个控制按钮`);
      
      // 测试标签页切换
      const outputTab = await page.$('[value="output"]');
      if (outputTab) {
        await outputTab.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('✅ 输出标签页点击成功');
      }
      
      // 测试面板内容
      const panelContent = await page.$('[class*="h-full bg-background text-foreground"]');
      if (panelContent) {
        console.log('✅ 面板内容区域存在');
      }
      
    } else {
      console.log('❌ 底部面板不存在');
    }
    
    // 检查 Monaco Editor 是否集成
    const monacoEditor = await page.$('.monaco-editor');
    if (monacoEditor) {
      console.log('✅ Monaco Editor 已集成');
    } else {
      console.log('⚠️ Monaco Editor 未找到（可能还未加载）');
    }
    
    // 检查编辑器标签页
    const editorTabs = await page.$$('[class*="TabsTrigger"]');
    console.log(`✅ 找到 ${editorTabs.length} 个编辑器标签页`);
    
    // 测试活动栏功能
    const activityBarItems = await page.$$('[class*="w-12 bg-sidebar"] button');
    console.log(`✅ 找到 ${activityBarItems.length} 个活动栏项目`);
    
    if (activityBarItems.length > 0) {
      await activityBarItems[0].click();
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ 活动栏项目点击成功');
    }
    
    // 测试测试面板
    const testButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.filter(btn => 
        btn.textContent.includes('New Editor') || 
        btn.textContent.includes('Add Toolbar')
      ).map(btn => btn.textContent);
    });
    console.log(`✅ 找到测试按钮: ${testButtons.join(', ')}`);
    
    // 截图
    await page.screenshot({ 
      path: '/Users/leven/space/ai/molecule-3.x/bottom-panel-test.png',
      fullPage: true 
    });
    console.log('📸 截图已保存: bottom-panel-test.png');
    
    console.log('\n🎉 底部面板功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await browser.close();
  }
}

testBottomPanel();
