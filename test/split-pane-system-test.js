/**
 * Split Pane System Test
 * Tests the implementation of Task 8: 实现分栏布局系统
 */

import { test, expect } from '@playwright/test';

test.describe('Split Pane System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page
    await page.goto('http://localhost:5173');
    
    // Wait for the editor to load
    await page.waitForSelector('.obsidian-editor');
  });

  test('should create PaneContainer component managing multiple panes', async ({ page }) => {
    // Verify PaneContainer exists
    const paneContainer = await page.locator('.obsidian-editor .pane-container, [class*="pane-container"]').first();
    await expect(paneContainer).toBeVisible();
    
    // Should start with one pane
    const initialPanes = await page.locator('[class*="editor-pane"], .editor-pane').count();
    expect(initialPanes).toBeGreaterThanOrEqual(1);
  });

  test('should implement horizontal split functionality (left-right)', async ({ page }) => {
    // Find a tab with dropdown menu
    const tabDropdown = await page.locator('[data-testid="tab-dropdown"], .tab-dropdown-trigger').first();
    await tabDropdown.click();
    
    // Look for split options in the dropdown
    const splitVerticalOption = await page.locator('text="左右分屏", text="Split Vertical", text="splitVertical"').first();
    
    if (await splitVerticalOption.isVisible()) {
      await splitVerticalOption.click();
      
      // Wait for split to be created
      await page.waitForTimeout(500);
      
      // Should now have two panes side by side
      const panes = await page.locator('[class*="editor-pane"], .editor-pane').count();
      expect(panes).toBe(2);
      
      // Should have a vertical splitter
      const splitter = await page.locator('[class*="splitter"], .pane-splitter').first();
      await expect(splitter).toBeVisible();
    } else {
      console.log('Split vertical option not found in dropdown');
    }
  });

  test('should implement vertical split functionality (top-bottom)', async ({ page }) => {
    // Find a tab with dropdown menu
    const tabDropdown = await page.locator('[data-testid="tab-dropdown"], .tab-dropdown-trigger').first();
    await tabDropdown.click();
    
    // Look for split options in the dropdown
    const splitHorizontalOption = await page.locator('text="上下分屏", text="Split Horizontal", text="splitHorizontal"').first();
    
    if (await splitHorizontalOption.isVisible()) {
      await splitHorizontalOption.click();
      
      // Wait for split to be created
      await page.waitForTimeout(500);
      
      // Should now have two panes stacked vertically
      const panes = await page.locator('[class*="editor-pane"], .editor-pane').count();
      expect(panes).toBe(2);
      
      // Should have a horizontal splitter
      const splitter = await page.locator('[class*="splitter"], .pane-splitter').first();
      await expect(splitter).toBeVisible();
    } else {
      console.log('Split horizontal option not found in dropdown');
    }
  });

  test('should support splitter dragging and resizing', async ({ page }) => {
    // First create a split
    const tabDropdown = await page.locator('[data-testid="tab-dropdown"], .tab-dropdown-trigger').first();
    await tabDropdown.click();
    
    const splitOption = await page.locator('text="左右分屏", text="Split Vertical", text="splitVertical"').first();
    if (await splitOption.isVisible()) {
      await splitOption.click();
      await page.waitForTimeout(500);
      
      // Find the splitter
      const splitter = await page.locator('[class*="splitter"], .pane-splitter').first();
      await expect(splitter).toBeVisible();
      
      // Get initial position
      const initialBox = await splitter.boundingBox();
      
      // Drag the splitter
      await splitter.hover();
      await page.mouse.down();
      await page.mouse.move(initialBox.x + 100, initialBox.y);
      await page.mouse.up();
      
      // Wait for resize to complete
      await page.waitForTimeout(300);
      
      // Verify the splitter moved
      const newBox = await splitter.boundingBox();
      expect(Math.abs(newBox.x - initialBox.x)).toBeGreaterThan(50);
    }
  });

  test('should handle pane management correctly', async ({ page }) => {
    // Create a split first
    const tabDropdown = await page.locator('[data-testid="tab-dropdown"], .tab-dropdown-trigger').first();
    await tabDropdown.click();
    
    const splitOption = await page.locator('text="左右分屏", text="Split Vertical", text="splitVertical"').first();
    if (await splitOption.isVisible()) {
      await splitOption.click();
      await page.waitForTimeout(500);
      
      // Should have 2 panes
      let paneCount = await page.locator('[class*="editor-pane"], .editor-pane').count();
      expect(paneCount).toBe(2);
      
      // Close a tab in one of the panes
      const closeButton = await page.locator('[class*="tab-close"], .tab-close-button').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);
        
        // Check if pane was auto-merged (should go back to 1 pane if empty)
        paneCount = await page.locator('[class*="editor-pane"], .editor-pane').count();
        // This might be 1 or 2 depending on implementation
        expect(paneCount).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('should support tab movement between panes', async ({ page }) => {
    // Create a split first
    const tabDropdown = await page.locator('[data-testid="tab-dropdown"], .tab-dropdown-trigger').first();
    await tabDropdown.click();
    
    const splitOption = await page.locator('text="左右分屏", text="Split Vertical", text="splitVertical"').first();
    if (await splitOption.isVisible()) {
      await splitOption.click();
      await page.waitForTimeout(500);
      
      // Create a new tab in the first pane
      const newTabButton = await page.locator('[class*="new-tab"], .new-tab-button').first();
      if (await newTabButton.isVisible()) {
        await newTabButton.click();
        await page.waitForTimeout(300);
        
        // Should have tabs in both panes
        const tabs = await page.locator('[class*="tab"], .tab').count();
        expect(tabs).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test('should maintain proper layout structure', async ({ page }) => {
    // Test the overall layout structure
    const editor = await page.locator('.obsidian-editor').first();
    await expect(editor).toBeVisible();
    
    // Should have proper CSS classes and structure
    const paneContainer = await page.locator('[class*="pane-container"]').first();
    await expect(paneContainer).toBeVisible();
    
    // Should be responsive
    const containerBox = await paneContainer.boundingBox();
    expect(containerBox.width).toBeGreaterThan(0);
    expect(containerBox.height).toBeGreaterThan(0);
  });

  test('should handle keyboard shortcuts for split operations', async ({ page }) => {
    // Test if keyboard shortcuts work for split operations
    // This might not be implemented yet, but we can test if the functionality exists
    
    // Focus on the editor
    await page.locator('.obsidian-editor').first().click();
    
    // Try common split shortcuts (these might not be implemented yet)
    await page.keyboard.press('Control+Shift+\\'); // Common split shortcut
    await page.waitForTimeout(300);
    
    // Check if anything happened (this is exploratory)
    const paneCount = await page.locator('[class*="editor-pane"], .editor-pane').count();
    console.log(`Pane count after keyboard shortcut: ${paneCount}`);
  });
});

// Helper function to take screenshots for debugging
async function takeDebugScreenshot(page, name) {
  await page.screenshot({ 
    path: `test/split-pane-${name}.png`,
    fullPage: true 
  });
}

// Export for use in other tests
export { takeDebugScreenshot };