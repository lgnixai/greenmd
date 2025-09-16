#!/usr/bin/env node

/**
 * MCP (Model Context Protocol) Test Tool for Molecule 3.x
 * 
 * This tool provides automated testing capabilities for the Molecule 3.x application
 * using Puppeteer and the MCP protocol.
 * 
 * Usage:
 *   node scripts/mcp-test.js [options]
 * 
 * Options:
 *   --url <url>        Application URL (default: http://localhost:3000)
 *   --headless         Run in headless mode
 *   --screenshot       Take screenshot
 *   --verbose          Verbose output
 *   --help             Show help
 */

const puppeteer = require('puppeteer');
const path = require('path');

class MCPTester {
  constructor(options = {}) {
    this.options = {
      url: options.url || 'http://localhost:3002',
      headless: options.headless || false,
      screenshot: options.screenshot || true,
      verbose: options.verbose || false,
      timeout: options.timeout || 10000,
      ...options
    };
    
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    }[type] || 'ℹ️';
    
    if (this.options.verbose || type !== 'info') {
      console.log(`${prefix} [${timestamp}] ${message}`);
    }
  }

  async init() {
    this.log('Initializing MCP Tester...', 'info');
    
    this.browser = await puppeteer.launch({
      headless: this.options.headless,
      defaultViewport: { width: 1280, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    this.log('Browser initialized successfully', 'success');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.log('Browser closed', 'info');
    }
  }

  async runTest(name, testFn) {
    this.log(`Running test: ${name}`, 'test');
    
    try {
      const result = await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'passed', result });
      this.log(`Test passed: ${name}`, 'success');
      return result;
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'failed', error: error.message });
      this.log(`Test failed: ${name} - ${error.message}`, 'error');
      throw error;
    }
  }

  async testNavigation() {
    return this.runTest('Navigation', async () => {
      await this.page.goto(this.options.url, {
        waitUntil: 'domcontentloaded',
        timeout: this.options.timeout
      });
      await this.page.waitForSelector('body', { timeout: this.options.timeout });
      // 等待应用完成首次渲染（Workbench 根容器）
      await this.page.waitForSelector('[class*="h-screen"][class*="w-screen"]', { timeout: this.options.timeout }).catch(() => {});
      
      const title = await this.page.title();
      if (!title) {
        throw new Error('Page title not found');
      }
      
      return { title, url: this.options.url };
    });
  }

  async testComponents() {
    return this.runTest('Component Verification', async () => {
      // 再次等待以确保 React 完成挂载
      await new Promise(r => setTimeout(r, 200));
      // 等待根容器出现
      await this.page.waitForSelector('[data-testid="workbench-root"]', { timeout: this.options.timeout }).catch(() => {});
      const components = [
        { name: 'Workbench', selector: '[data-testid="workbench-root"]' },
        { name: 'Activity Bar', selector: '[data-testid="activity-bar"]' },
        { name: 'Sidebar', selector: '[data-testid="sidebar"]' },
        { name: 'Status Bar', selector: '[data-testid="status-bar"]' },
        { name: 'Menu Bar', selector: '[data-testid="menu-bar"]' }
      ];

      const results = {};
      for (const component of components) {
        // 对每个组件做一次短等待
        await this.page.waitForSelector(component.selector, { timeout: 800 }).catch(() => {});
        const element = await this.page.$(component.selector);
        results[component.name] = !!element;
      }

      const passed = Object.values(results).filter(Boolean).length;
      const total = Object.keys(results).length;
      
      if (passed < total * 0.8) {
        throw new Error(`Only ${passed}/${total} components found`);
      }

      return results;
    });
  }

  async testInteractions() {
    return this.runTest('User Interactions', async () => {
      // Test activity bar buttons
      const activityButtons = await this.page.$$('[class*="w-12 bg-sidebar"] button');
      if (activityButtons.length > 0) {
        await activityButtons[0].click();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Test file explorer
      const explorerItems = await this.page.$$('[class*="w-64 bg-sidebar"] [class*="flex items-center py-1"]');
      if (explorerItems.length > 0) {
        await explorerItems[0].click();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 进入 TestPane
      // 点击活动栏中的“测试”按钮（通过标题属性或图标容器附近文本匹配）
      const testButtons = await this.page.$$('[title="测试"], [aria-label="测试"]');
      if (testButtons[0]) {
        await testButtons[0].click();
        await new Promise(r=>setTimeout(r,300));
      }

      // 断言已进入 TestPane（侧边栏标题或内容包含 TESTPANE）并检查滚动
      const testPaneCheck = await this.page.evaluate(() => {
        const paneTitle = Array.from(document.querySelectorAll('h3'))
          .find(h => h.textContent && h.textContent.toUpperCase().includes('TESTPANE'));
        // 找到包含该标题的最近侧边栏容器（带 bg-sidebar 的祖先）
        function findAncestorSidebar(el) {
          let cur = el;
          while (cur && cur !== document.body) {
            if ((cur.className||'').toString().includes('bg-sidebar')) return cur;
            cur = cur.parentElement;
          }
          return null;
        }
        const sidebar = paneTitle ? findAncestorSidebar(paneTitle) : null;
        const scrollable = sidebar ? Array.from(sidebar.querySelectorAll('*')).find(el => {
          const cs = getComputedStyle(el);
          const ov = cs.overflowY;
          return (ov === 'auto' || ov === 'scroll');
        }) : null;
        return {
          foundTitle: !!paneTitle,
          hasScrollable: !!scrollable,
        };
      });
      if (!testPaneCheck.foundTitle || !testPaneCheck.hasScrollable) {
        throw new Error(`TestPane sidebar check failed: title=${testPaneCheck.foundTitle}, scroll=${testPaneCheck.hasScrollable}`);
      }

      // Panel 标签 CRUD
      // 查找 TestPane 内按钮（使用包含文本的方式）
      async function clickByText(page, text) {
        const handle = await page.evaluateHandle((btnText) => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(b => b.textContent && b.textContent.includes(btnText)) || null;
        }, text);
        const el = handle.asElement();
        if (el) { await el.click(); return true; }
        return false;
      }

      await clickByText(this.page, 'Add Panel Tab');
      await new Promise(r=>setTimeout(r,300));
      await clickByText(this.page, 'Close Current Panel Tab');
      await new Promise(r=>setTimeout(r,300));

      // 状态栏文本更新
      await clickByText(this.page, 'Update Status Text');
      await new Promise(r=>setTimeout(r,200));

      // 通知与菜单
      await clickByText(this.page, 'Add Notification');
      await clickByText(this.page, 'Add Menu Item');

      // TestPane 余下按钮联动
      const actions = [
        'Toggle Loading',
        'Update ReadOnly',
        'Update Welcome Page',
        'Add Execute Action',
        'Update Execute Action',
        'Open File',
        'Toggle Direction'
      ];
      for (const label of actions) {
        await clickByText(this.page, label);
        await new Promise(r=>setTimeout(r,200));
      }

      // 随机主题按钮
      await clickByText(this.page, '随机主题');
      await new Promise(r=>setTimeout(r,200));

      // 验证左右侧边栏具备可滚动容器且未被内容撑破
      const scrollInfo = await this.page.evaluate(() => {
        function findSidebars() {
          const nodes = Array.from(document.querySelectorAll('div'))
            .filter(el => (el.className||'').toString().includes('bg-sidebar'));
          const withRect = nodes
            .map(el => ({ el, rect: el.getBoundingClientRect() }))
            .filter(n => n.rect.height > 0 && n.rect.width > 120); // 过滤掉 ActivityBar 等窄栏
          if (withRect.length === 0) return { left: null, right: null };
          withRect.sort((a,b) => a.rect.left - b.rect.left);
          return { left: withRect[0]?.el || null, right: withRect[withRect.length-1]?.el || null };
        }
        function hasScrollableChild(container) {
          if (!container) return false;
          const list = Array.from(container.querySelectorAll('*'));
          return list.some(el => {
            const cs = getComputedStyle(el);
            const ov = cs.overflowY;
            return (ov === 'auto' || ov === 'scroll');
          });
        }
        const { left, right } = findSidebars();
        return { leftScroll: hasScrollableChild(left), rightScroll: hasScrollableChild(right) };
      });
      if (!scrollInfo.leftScroll || !scrollInfo.rightScroll) {
        throw new Error(`Sidebar scroll check failed: left=${scrollInfo.leftScroll}, right=${scrollInfo.rightScroll}`);
      }

      // 打开命令面板（Cmd/Ctrl+K）
      const isMac = await this.page.evaluate(() => navigator.platform.toLowerCase().includes('mac'));
      if (isMac) {
        await this.page.keyboard.down('Meta');
        await this.page.keyboard.press('KeyK');
        await this.page.keyboard.up('Meta');
      } else {
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('KeyK');
        await this.page.keyboard.up('Control');
      }
      // 等待命令面板出现
      await this.page.waitForFunction(() => {
        return Array.from(document.querySelectorAll('div')).some((el) => el.textContent && el.textContent.includes('命令面板'));
      }, { timeout: this.options.timeout });
      // 点击遮罩关闭
      await this.page.mouse.click(10, 10);
      await new Promise(r=>setTimeout(r,200));

      return {
        activityButtons: activityButtons.length,
        explorerItems: explorerItems.length
      };
    });
  }

  async testPerformance() {
    return this.runTest('Performance Metrics', async () => {
      const metrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart
        };
      });

      if (metrics.totalTime > 5000) {
        throw new Error(`Load time too slow: ${metrics.totalTime}ms`);
      }

      return metrics;
    });
  }

  async testAccessibility() {
    return this.runTest('Accessibility', async () => {
      const a11yInfo = await this.page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        const inputs = document.querySelectorAll('input');
        const links = document.querySelectorAll('a');
        
        return {
          buttons: buttons.length,
          inputs: inputs.length,
          links: links.length,
          hasAriaLabels: Array.from(buttons).some(btn => 
            btn.getAttribute('aria-label') || btn.getAttribute('title')
          )
        };
      });

      if (a11yInfo.buttons === 0) {
        throw new Error('No interactive elements found');
      }

      return a11yInfo;
    });
  }

  async takeScreenshot() {
    if (!this.options.screenshot) return;

    const screenshotPath = path.join(process.cwd(), 'molecule-3x-mcp-test.png');
    await this.page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    this.log(`Screenshot saved: ${screenshotPath}`, 'success');
    return screenshotPath;
  }

  async runAllTests() {
    try {
      await this.init();
      
      await this.testNavigation();
      await this.testComponents();
      await this.testInteractions();
      await this.testPerformance();
      await this.testAccessibility();
      await this.takeScreenshot();

      this.printReport();
      
    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  printReport() {
    console.log('\n🎉 MCP Test Report');
    console.log('==================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total: ${this.results.passed + this.results.failed}`);
    
    if (this.results.failed === 0) {
      console.log('\n🚀 All tests passed! Molecule 3.x is ready for production!');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the results above.');
    }
    
    console.log('\n📋 Test Details:');
    this.results.tests.forEach(test => {
      const status = test.status === 'passed' ? '✅' : '❌';
      console.log(`  ${status} ${test.name}`);
    });
  }
}

// CLI Interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        options.url = args[++i];
        break;
      case '--headless':
        options.headless = true;
        break;
      case '--screenshot':
        options.screenshot = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        console.log(`
MCP Test Tool for Molecule 3.x

Usage: node scripts/mcp-test.js [options]

Options:
  --url <url>        Application URL (default: http://localhost:3000)
  --headless         Run in headless mode
  --screenshot       Take screenshot
  --verbose          Verbose output
  --help             Show this help

Examples:
  node scripts/mcp-test.js
  node scripts/mcp-test.js --url http://localhost:3001
  node scripts/mcp-test.js --headless --verbose
        `);
        process.exit(0);
        break;
    }
  }
  
  return options;
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const tester = new MCPTester(options);
  tester.runAllTests().catch(console.error);
}

module.exports = MCPTester;

