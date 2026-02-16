import { test, expect } from '@playwright/test';

// demo-enhanced-button and others likely use the same shared mobile-controls.js
// We only need to test one or two representative pages to verify the mobile toggle works globally
const pagesToCheck = [
    '/demo-button-features.html',
    '/showcase/components/toggle3d.html'
];

test.describe('Mobile Controls & Console Errors', () => {

    for (const pageUrl of pagesToCheck) {
        test(`check ${pageUrl} for console errors`, async ({ page }) => {
            const consoleErrors = [];
            const failedRequests = [];

            // Listen for console errors
            page.on('console', msg => {
                const text = msg.text();
                if (msg.type() === 'error') {
                    // Ignore expected 404s for favicons or specific known non-critical issues
                    if (text.includes('favicon.ico')) return;
                    console.log(`[CONSOLE ERROR] ${text}`);
                    consoleErrors.push(text);
                }
            });

            // Listen for failed requests (404s, etc)
            page.on('requestfailed', request => {
                const failure = request.failure();
                const err = failure ? failure.errorText : 'Unknown error';
                const url = request.url();
                if (url.includes('favicon.ico')) return;
                console.log(`[REQUEST FAILED] ${url} - ${err}`);
                failedRequests.push(`${err} ${url}`);
            });

            await page.goto(pageUrl);
            await page.waitForTimeout(1000);

            expect(consoleErrors, `Found console errors on ${pageUrl}: ${consoleErrors.join('\n')}`).toHaveLength(0);
            expect(failedRequests, `Found failed network requests on ${pageUrl}: ${failedRequests.join('\n')}`).toHaveLength(0);
        });

        test(`check mobile toggle on ${pageUrl}`, async ({ page, isMobile }) => {
            if (!isMobile) test.skip();

            await page.goto(pageUrl);

            // Wait for the script to load and inject the toggle
            const toggleBtn = page.locator('#mobile-controls-toggle');
            await toggleBtn.waitFor({ state: 'visible', timeout: 5000 });

            const controlsPanel = page.locator('.demo-controls');

            // Check initial state (should NOT have .mobile-visible class)
            await expect(controlsPanel).not.toHaveClass(/mobile-visible/);

            // Click to open
            await toggleBtn.click();

            // Check if class is added (wait for transition)
            await expect(controlsPanel).toHaveClass(/mobile-visible/, { timeout: 2000 });

            // Click to close
            await toggleBtn.click();

            // Check if class is removed
            await expect(controlsPanel).not.toHaveClass(/mobile-visible/, { timeout: 2000 });
        });
    }
});
