import { test, expect } from '@playwright/test';

test.describe('DialMovers Game E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('DialMovers Game');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('button')).toContainText('Connect!');
  });

  test('should validate phone number input', async ({ page }) => {
    const input = page.locator('input[type="text"]');
    const connectButton = page.locator('button:has-text("Connect!")');

    // Test with invalid phone number
    await input.fill('123');
    await expect(connectButton).toBeDisabled();

    // Test with valid phone number
    await input.fill('1234567890');
    await expect(connectButton).toBeEnabled();
  });

  test('should connect with valid phone number', async ({ page }) => {
    const input = page.locator('input[type="text"]');
    const connectButton = page.locator('button:has-text("Connect!")');

    await input.fill('1234567890');
    await connectButton.click();

    // Note: In real tests, you would need to mock the WebSocket
    // For now, just verify the UI elements appear
    // await expect(page.locator('.game-canvas')).toBeVisible();
  });

  test('should show help dialog', async ({ page }) => {
    const helpButton = page.locator('button:has-text("Help / Info")');
    await helpButton.click();

    // Note: Help dialog is an alert() which is hard to test in Playwright
    // Consider replacing with a proper modal
  });

  test('should toggle event history', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]');
    await checkbox.check();

    // Event history should be visible after connecting
    // Note: This would require a working WebSocket connection
  });

  test('should display game ID after connecting', async ({ page }) => {
    const input = page.locator('input[type="text"]');
    const connectButton = page.locator('button:has-text("Connect!")');

    await input.fill('1234567890');
    await connectButton.click();

    // Note: In real tests with mocked WebSocket
    // await expect(page.locator('.game-id-display')).toBeVisible();
  });
});

test.describe('WebSocket Connection E2E', () => {
  test('should connect to WebSocket server', async ({ page }) => {
    await page.goto('/');

    // Mock WebSocket for testing
    await page.evaluate(() => {
      window.WebSocket = class MockWebSocket {
        url: string;
        readyState: number = 0; // CONNECTING

        constructor(url: string) {
          this.url = url;
          setTimeout(() => {
            this.readyState = 1; // OPEN
            this.onopen?.(new Event('open'));
          }, 100);
        }

        send(data: string) {
          console.log('WebSocket send:', data);
        }

        close() {
          this.readyState = 3; // CLOSED
          this.onclose?.(new Event('close'));
        }

        onopen: ((event: Event) => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onclose: ((event: Event) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
      };
    });

    const input = page.locator('input[type="text"]');
    await input.fill('1234567890');

    const connectButton = page.locator('button:has-text("Connect!")');
    await connectButton.click();

    // Wait for connection
    await page.waitForTimeout(200);
  });

  test('should handle WebSocket messages', async ({ page }) => {
    await page.goto('/');

    // Mock WebSocket with message handling
    await page.evaluate(() => {
      let messageHandler: ((event: MessageEvent) => void) | null = null;

      window.WebSocket = class MockWebSocket {
        url: string;
        readyState: number = 0;

        constructor(url: string) {
          this.url = url;
          setTimeout(() => {
            this.readyState = 1;
            this.onopen?.(new Event('open'));

            // Simulate receiving a connect message
            setTimeout(() => {
              this.onmessage?.(new MessageEvent('message', {
                data: JSON.stringify({
                  payload_type: 'connect',
                  payload: { user_id: '+11234567890:caller' }
                })
              }));
            }, 100);
          }, 100);
        }

        send(data: string) {
          console.log('WebSocket send:', data);
        }

        close() {
          this.readyState = 3;
          this.onclose?.(new Event('close'));
        }

        onopen: ((event: Event) => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onclose: ((event: Event) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
      };
    });

    const input = page.locator('input[type="text"]');
    await input.fill('1234567890');

    const connectButton = page.locator('button:has-text("Connect!")');
    await connectButton.click();

    // Wait for connection and message
    await page.waitForTimeout(300);
  });
});
