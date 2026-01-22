import { test, expect } from '@playwright/test';

test.describe('Claude Forge Main Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Claude Forge');
    await expect(page.locator('text=Transform ideas into Claude-compatible artifacts')).toBeVisible();
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.click('[aria-label="Settings"]');
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator('h1')).toContainText('Settings');
  });

  test('should open and close history panel', async ({ page }) => {
    await page.click('[aria-label="History"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Close by pressing Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should switch between artifact types', async ({ page }) => {
    // Check that skill type is selected by default
    await expect(page.locator('[data-state="checked"]').filter({ hasText: 'Skill' })).toBeVisible();

    // Click on Agent type
    await page.click('button:has-text("Agent")');
    await expect(page.locator('[data-state="checked"]').filter({ hasText: 'Agent' })).toBeVisible();

    // Click on Ruleset type
    await page.click('button:has-text("Ruleset")');
    await expect(page.locator('[data-state="checked"]').filter({ hasText: 'Ruleset' })).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    const themeButton = page.locator('[aria-label="Toggle theme"]');

    // Get initial state (could be either sun or moon)
    const initialIcon = await themeButton.locator('svg').getAttribute('data-lucide');

    // Click to toggle
    await themeButton.click();

    // Wait for theme change
    await page.waitForTimeout(100);

    // Icon should have changed
    const newIcon = await themeButton.locator('svg').getAttribute('data-lucide');
    expect(newIcon).not.toBe(initialIcon);
  });

  test('should show keyboard shortcuts', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('text=Keyboard Shortcuts')).toBeVisible();
    await expect(page.locator('text=Generate artifact')).toBeVisible();
    await expect(page.locator('text=Save artifact')).toBeVisible();
    await expect(page.locator('text=Open history')).toBeVisible();
    await expect(page.locator('text=Open settings')).toBeVisible();
  });
});

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should load settings page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Settings');
  });

  test('should select provider presets', async ({ page }) => {
    // Click on the preset selector
    await page.click('button:has-text("Provider Preset")');

    // Select Z.ai
    await page.click('div[role="option"]:has-text("Z.ai")');

    // Verify the URL and model were updated
    const baseUrlInput = page.locator('#baseUrl');
    await expect(baseUrlInput).toHaveValue('https://api.z.ai/api/coding/paas/v4');
  });

  test('should switch themes in settings', async ({ page }) => {
    await page.click('#theme');
    await page.click('div[role="option"]:has-text("Dark")');

    // The theme class should be applied
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should navigate back to home', async ({ page }) => {
    await page.click('[aria-label="Arrow Left"]');
    await expect(page).toHaveURL('/');
  });
});

test.describe('Security Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should show security section', async ({ page }) => {
    await expect(page.locator('text=Security')).toBeVisible();
    await expect(page.locator('text=Encrypt your API key')).toBeVisible();
  });

  test('should open password setup dialog', async ({ page }) => {
    // Click the "Set Up Encryption" button
    const setupButton = page.locator('button:has-text("Set Up Encryption")');
    if (await setupButton.isVisible()) {
      await setupButton.click();

      // Password input should appear
      await expect(page.locator('#newPassword')).toBeVisible();
      await expect(page.locator('#confirmPassword')).toBeVisible();
    }
  });
});
