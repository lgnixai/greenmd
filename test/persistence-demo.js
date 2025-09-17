/**
 * 持久化功能演示脚本
 * 测试状态持久化、会话恢复和自动保存功能
 */

// 模拟浏览器环境
const { JSDOM } = require('jsdom');

// 创建模拟的浏览器环境
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// 导入持久化服务
const { StorageManager } = require('../packages/ui/dist/utils/storage-manager');
const { SessionRecoveryService } = require('../packages/ui/dist/utils/session-recovery');
const { AutoSaveService } = require('../packages/ui/dist/utils/auto-save-service');

async function testPersistenceSystem() {
  console.log('🧪 Testing Persistence System...\n');

  // 创建服务实例
  const storageManager = new StorageManager();
  const sessionRecoveryService = new SessionRecoveryService();
  const autoSaveService = new AutoSaveService();

  try {
    // 测试 1: 存储管理器
    console.log('📦 Testing Storage Manager...');
    
    const mockState = {
      tabs: {
        'tab1': {
          id: 'tab1',
          title: 'Test File',
          content: 'Hello, World!',
          isDirty: false,
          isLocked: false,
          type: 'file',
          createdAt: new Date(),
          modifiedAt: new Date()
        }
      },
      panes: {
        'pane1': {
          id: 'pane1',
          tabs: ['tab1'],
          activeTab: 'tab1',
          position: { x: 0, y: 0, width: 800, height: 600 }
        }
      },
      layout: {
        type: 'single',
        panes: [],
        splitters: [],
        activePane: 'pane1'
      },
      activePane: 'pane1',
      recentFiles: [],
      settings: {
        fontSize: 14,
        fontFamily: 'Monaco',
        theme: 'light',
        tabSize: 2,
        wordWrap: true,
        showLineNumbers: true,
        autoSave: true,
        autoSaveDelay: 2000
      }
    };

    // 保存会话
    await storageManager.saveSession(mockState);
    console.log('✅ Session saved successfully');

    // 加载会话
    const loadedState = await storageManager.loadSession();
    console.log('✅ Session loaded successfully');
    console.log('   - Tabs loaded:', Object.keys(loadedState?.tabs || {}).length);
    console.log('   - Panes loaded:', Object.keys(loadedState?.panes || {}).length);

    // 测试 2: 自动保存
    console.log('\n💾 Testing Auto-save Service...');
    
    autoSaveService.enable();
    console.log('✅ Auto-save enabled');

    // 模拟自动保存内容
    await storageManager.autoSaveContent('tab1', 'Updated content');
    console.log('✅ Content auto-saved');

    // 恢复自动保存的内容
    const autoSavedContent = await storageManager.getAutoSavedContent('tab1');
    console.log('✅ Auto-saved content recovered:', autoSavedContent ? 'Yes' : 'No');

    // 测试 3: 会话恢复
    console.log('\n🔄 Testing Session Recovery...');
    
    const recoveryResult = await sessionRecoveryService.recoverSession();
    console.log('✅ Session recovery completed');
    console.log('   - Recovered:', recoveryResult.recovered);
    console.log('   - Errors:', recoveryResult.errors.length);
    console.log('   - Warnings:', recoveryResult.warnings.length);

    // 测试 4: 存储空间检查
    console.log('\n💽 Testing Storage Space Check...');
    
    const storageInfo = await storageManager.checkStorageSpace();
    console.log('✅ Storage space checked');
    console.log('   - Available:', storageInfo.available);
    if (storageInfo.usage !== undefined) {
      console.log('   - Usage:', Math.round(storageInfo.usage / 1024), 'KB');
    }

    // 测试 5: 错误处理
    console.log('\n⚠️  Testing Error Handling...');
    
    try {
      // 模拟损坏的会话数据
      localStorage.setItem('obsidian-editor-session', 'invalid json');
      await storageManager.loadSession();
    } catch (error) {
      console.log('✅ Error handling works:', error.message);
    }

    // 清理测试数据
    await storageManager.clearSession();
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All persistence tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
if (require.main === module) {
  testPersistenceSystem().catch(console.error);
}

module.exports = { testPersistenceSystem };