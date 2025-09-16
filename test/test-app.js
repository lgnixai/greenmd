// Simple test script to verify the Molecule 3.x application
const puppeteer = require('puppeteer');

async function testMoleculeApp() {
  console.log('🚀 Starting Molecule 3.x application test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('📱 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    console.log('✅ Page loaded successfully!');
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'molecule-3x-screenshot.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved as molecule-3x-screenshot.png');
    
    // Check if key components are present
    const workbench = await page.$('[class*="flex h-screen w-screen"]');
    if (workbench) {
      console.log('✅ Workbench component found');
    } else {
      console.log('❌ Workbench component not found');
    }
    
    const activityBar = await page.$('[class*="w-12 bg-sidebar"]');
    if (activityBar) {
      console.log('✅ Activity Bar component found');
    } else {
      console.log('❌ Activity Bar component not found');
    }
    
    const sidebar = await page.$('[class*="w-64 bg-sidebar"]');
    if (sidebar) {
      console.log('✅ Sidebar component found');
    } else {
      console.log('❌ Sidebar component not found');
    }
    
    const statusBar = await page.$('[class*="h-6 bg-statusBar-background"]');
    if (statusBar) {
      console.log('✅ Status Bar component found');
    } else {
      console.log('❌ Status Bar component not found');
    }
    
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testMoleculeApp().catch(console.error);

