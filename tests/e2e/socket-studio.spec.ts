import { test, expect } from '@playwright/test';

test.describe('Socket Studio E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application and show initial tabs', async ({ page }) => {
    await expect(page).toHaveTitle(/Socket Studio/);
    const header = page.getByRole('banner');
    await expect(header.getByText('Example Session')).toBeVisible();
    await expect(header.getByText('New request')).toBeVisible();
  });

  test('should manage tabs correctly', async ({ page }) => {
    const header = page.getByRole('banner');
    // Create a new tab
    await header.getByRole('button', { name: 'Create new request' }).click();
    // We expect 2 "New request" tabs now (one default, one new) in the header
    await expect(header.getByText('New request')).toHaveCount(2);

    // Rename tab (using the header rename)
    const tabItem = header.getByText('New request').first();
    await tabItem.dblclick();
    const renameInput = page.getByLabel('Rename request tab');
    await renameInput.fill('My Test Socket');
    await renameInput.press('Enter');
    await expect(header.getByText('My Test Socket')).toBeVisible();

    // Close first tab
    await page.hover('text=My Test Socket');
    await header.getByRole('button', { name: 'Close tab' }).first().click({ force: true });
    await expect(header.getByText('My Test Socket')).not.toBeVisible();
  });

  test('should connect to demo server and show success logs', async ({ page }) => {
    // Fill URL on the active tab
    const urlInput = page.getByLabel('Connection URL');
    await urlInput.fill('http://localhost:5001');
    
    // Connect
    await page.getByRole('button', { name: 'Connect' }).click();
    
    // Check status
    await expect(page.getByText('Connected', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Disconnect' })).toBeVisible();

    // Check logs - The title is the event kind (e.g. CONNECT, LOG)
    const logs = page.locator('section:has-text("Console")');
    await expect(logs.getByText('CONNECT').first()).toBeVisible();
    await expect(logs.getByText('LOG').first()).toBeVisible();
  });

  test('should emit events and verify in console', async ({ page }) => {
    await page.getByLabel('Connection URL').fill('http://localhost:5001');
    await page.getByRole('button', { name: 'Connect' }).click();
    await expect(page.getByText('Connected', { exact: false })).toBeVisible();

    // Go to Events section
    await page.getByRole('button', { name: 'Events' }).click();
    
    // Add emitter
    await page.getByRole('button', { name: '+ Add Emitter Preset' }).click();
    
    // Fill event name
    const eventNameInput = page.getByPlaceholder('Event Name').last();
    await eventNameInput.fill('test:event');
    
    // Fill payload
    const payloadInput = page.getByPlaceholder('Payload JSON').last();
    await payloadInput.fill('{"hello": "world"}');
    
    // Emit
    await page.getByRole('button', { name: 'Emit' }).last().click();
    
    // Verify in logs - Title should be "EMIT"
    await expect(page.getByText('EMIT').first()).toBeVisible({ timeout: 10000 });
  });

  test('should add listener and see events', async ({ page }) => {
    // Add listener BEFORE connecting to be sure
    await page.getByRole('button', { name: 'Listeners' }).click();
    await page.getByRole('button', { name: '+ Add Listener' }).click();
    await page.getByPlaceholder('Event Name').last().fill('demo:welcome');

    await page.getByLabel('Connection URL').fill('http://localhost:5001');
    await page.getByRole('button', { name: 'Connect' }).click();
    
    // Wait for a log (demo server sends demo:welcome)
    // The title in LogConsole for ANY event is `EVENT ${name}`
    await expect(page.getByText('EVENT demo:welcome', { exact: false }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should toggle theme', async ({ page }) => {
    const html = page.locator('html');
    const themeBtn = page.locator('button[title*="mode"]');
    
    // Toggle
    const initialClass = await html.getAttribute('class');
    await themeBtn.click();
    const afterFirstClick = await html.getAttribute('class');
    expect(initialClass).not.toBe(afterFirstClick);
    
    await themeBtn.click();
    const afterSecondClick = await html.getAttribute('class');
    expect(afterFirstClick).not.toBe(afterSecondClick);
  });

  test('should persist state across reloads', async ({ page }) => {
    const urlInput = page.getByLabel('Connection URL');
    await urlInput.fill('http://localhost:1234');
    
    // Reload
    await page.reload();
    
    // Verify URL is still there
    await expect(page.getByLabel('Connection URL')).toHaveValue('http://localhost:1234');
  });
});
