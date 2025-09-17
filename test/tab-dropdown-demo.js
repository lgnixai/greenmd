const puppeteer = require('puppeteer');
const path = require('path');

async function testTabDropdown() {
  console.log('🧪 Testing Tab Dropdown Menu Implementation...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Navigate to the web app
    await page.goto('http://localhost:3001');
    
    console.log('📄 Page loaded, waiting for content...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Debug: Check what's actually on the page
    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);
    
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 200));
    console.log(`📄 Page content preview: ${bodyText}...`);
    
    // Take initial screenshot
    await page.screenshot({ path: 'tab-dropdown-initial.png', fullPage: true });
    console.log('📸 Initial screenshot taken');
    
    // Look for obsidian editor tabs
    console.log('🔍 Looking for tab elements...');
    
    // First check if the obsidian editor container exists
    const obsidianContainer = await page.$('.obsidian-editor, [class*="obsidian"], [data-testid*="obsidian"]');
    if (obsidianContainer) {
      console.log('✅ Found obsidian editor container');
    } else {
      console.log('❌ No obsidian editor container found');
    }
    
    // Check for any tab-related elements
    const tabElements = await page.$$('[data-tab-id], .tab, [class*="tab"]');
    console.log(`📋 Found ${tabElements.length} tab-related elements`);
    
    // Try to create a new tab first
    console.log('🆕 Attempting to create a new tab...');
    
    // Look for new tab button or similar
    const newTabButton = await page.$('button[title*="新建"], button[title*="新标签"], [aria-label*="新建"]');
    if (newTabButton) {
      console.log('✅ Found new tab button, clicking...');
      await newTabButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check again for tabs
      const tabsAfterCreate = await page.$$('[data-tab-id]');
      console.log(`📋 Found ${tabsAfterCreate.length} tabs after creation attempt`);
    }
    
    // Wait for tabs to be present
    try {
      await page.waitForSelector('[data-tab-id]', { timeout: 5000 });
      console.log('✅ Found tab elements');
      
      // Find dropdown buttons
      const dropdownButtons = await page.$$('button[title*="更多选项"]');
      console.log(`📋 Found ${dropdownButtons.length} dropdown buttons`);
      
      if (dropdownButtons.length > 0) {
        // Click the first dropdown button
        console.log('🖱️ Clicking first dropdown button...');
        await dropdownButtons[0].click();
        
        // Wait for dropdown menu to appear
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if dropdown menu is visible
        const dropdownMenu = await page.$('[role="menu"]');
        if (dropdownMenu) {
          console.log('✅ Dropdown menu appeared');
          
          // Take screenshot with dropdown open
          await page.screenshot({ path: 'tab-dropdown-open.png', fullPage: true });
          console.log('📸 Dropdown screenshot taken');
          
          // Check for expected menu items
          const menuItems = [
            '新标签',
            '关闭',
            '关闭其他标签页',
            '全部关闭',
            '复制标签页',
            '锁定',
            '上下分屏',
            '左右分屏',
            '重命名'
          ];
          
          let foundItems = 0;
          for (const item of menuItems) {
            const element = await page.$(`text=${item}`);
            if (element) {
              foundItems++;
              console.log(`✅ Found menu item: ${item}`);
            } else {
              console.log(`❌ Missing menu item: ${item}`);
            }
          }
          
          console.log(`📊 Found ${foundItems}/${menuItems.length} expected menu items`);
          
          // Test keyboard shortcuts display
          const shortcuts = await page.$$eval('[role="menuitem"] span:last-child', 
            elements => elements.map(el => el.textContent).filter(text => text && text.includes('Ctrl'))
          );
          console.log(`⌨️ Found keyboard shortcuts: ${shortcuts.join(', ')}`);
          
          // Test clicking a menu item
          console.log('🖱️ Testing menu item click...');
          const newTabItem = await page.$('text=新标签');
          if (newTabItem) {
            await newTabItem.click();
            console.log('✅ Clicked "新标签" menu item');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Take final screenshot
            await page.screenshot({ path: 'tab-dropdown-after-click.png', fullPage: true });
            console.log('📸 Final screenshot taken');;
          }
          
        } else {
          console.log('❌ Dropdown menu did not appear');
        }
      } else {
        console.log('❌ No dropdown buttons found');
      }
      
    } catch (error) {
      console.log('❌ No tab elements found, checking if obsidian editor is loaded...');
      
      // Check if we can find any obsidian editor components
      const obsidianEditor = await page.$('.obsidian-editor, [class*="obsidian"]');
      if (obsidianEditor) {
        console.log('✅ Found obsidian editor component');
      } else {
        console.log('❌ No obsidian editor found');
      }
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'tab-dropdown-debug.png', fullPage: true });
      console.log('📸 Debug screenshot taken');
    }
    
    console.log('✅ Tab dropdown test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testTabDropdown().catch(console.error);