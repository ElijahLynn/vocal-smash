import { test, expect } from '@playwright/test';

test.describe('Vocal Smash App', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should show the title and start button', async ({ page }) => {
        await expect(page.getByText('Vocal Smash')).toBeVisible();
        await expect(page.getByText('Real-time pitch detection')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
    });

    test('should show error message when microphone access is denied', async ({ page, context }) => {
        // Mock denied microphone access
        await context.grantPermissions([]);
        await page.getByRole('button', { name: 'Start' }).click();

        await expect(page.getByText('Failed to access microphone')).toBeVisible();
    });

    test('should start recording when microphone access is granted', async ({ page, context }) => {
        // Mock granted microphone access
        await context.grantPermissions(['microphone']);
        await page.getByRole('button', { name: 'Start' }).click();

        await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
        await expect(page.getByText('Listening...')).toBeVisible();
    });

    test('should stop recording when stop button is clicked', async ({ page, context }) => {
        // Mock granted microphone access
        await context.grantPermissions(['microphone']);

        // Start recording
        await page.getByRole('button', { name: 'Start' }).click();
        await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();

        // Stop recording
        await page.getByRole('button', { name: 'Stop' }).click();
        await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
        await expect(page.getByText('Press Start to begin')).toBeVisible();
    });

    test('should show PWA install button on compatible browsers', async ({ page }) => {
        // Mock beforeinstallprompt event
        await page.evaluate(() => {
            const event = new Event('beforeinstallprompt');
            Object.defineProperty(event, 'prompt', { value: () => Promise.resolve() });
            Object.defineProperty(event, 'userChoice', { value: Promise.resolve({ outcome: 'accepted', platform: 'web' }) });
            window.dispatchEvent(event);
        });

        await expect(page.getByText('Install App')).toBeVisible();
    });

    test('should show update button when service worker update is available', async ({ page }) => {
        // Mock service worker update available
        await page.evaluate(() => {
            const event = new Event('controllerchange');
            navigator.serviceWorker?.dispatchEvent(event);
        });

        await expect(page.getByText('Update available!')).toBeVisible();
    });
});

