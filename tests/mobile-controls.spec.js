import { test, expect } from '@playwright/test';

const pagesToCheck = [
    '/demo-button-features.html',
    '/demo-enhanced-button.html',
    '/showcase/components/toggle3d.html',
    '/showcase/components/slider3d.html',
    '/showcase/components/textinput3d.html'
];

test.describe('Mobile Controls & Console Errors', () => {

    for (const pageUrl of pagesToCheck) {
        test(`check ${pageUrl} for console errors`, async ({ page }) => {
            const consoleErrors = [];
            const failedRequests = [];

            // Listen for console errors
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    console.log(`[CONSOLE ERROR] ${msg.text()}`);
                    consoleErrors.push(msg.text());
                }
            });

            // Listen for failed requests (404s, etc)
            page.on('requestfailed', request => {
                const failure = request.failure();
                const err = failure ? failure.errorText : 'Unknown error';
                console.log(`[REQUEST FAILED] ${request.url()} - ${err}`);
                failedRequests.push(`${err} ${request.url()}`);
            });
            page.on('response', response => {
                if (response.status() >= 400) {
                    console.log(`[RESPONSE ERROR] ${response.url()} - ${response.status()}`);
                    failedRequests.push(`${response.status()} ${response.url()}`);
                }
            });

            await page.goto(pageUrl);

            // Wait a bit for initialization
            await page.waitForTimeout(1000);

            expect(consoleErrors, `Found console errors on ${pageUrl}: ${consoleErrors.join('\n')}`).toHaveLength(0);
            expect(failedRequests, `Found failed network requests on ${pageUrl}: ${failedRequests.join('\n')}`).toHaveLength(0);
        });

        test(`check mobile toggle on ${pageUrl}`, async ({ page, isMobile }) => {
            // Only run this check if we are in mobile view
            if (!isMobile) test.skip();

            await page.goto(pageUrl);

            const toggleBtn = page.locator('#mobile-controls-toggle');
            await expect(toggleBtn).toBeVisible();

            const controlsPanel = page.locator('.demo-controls');

            // Initially it should be hidden or visible depending on default? 
            // The script usually starts hidden on mobile.
            // Let's just check that clicking toggles the class or visibility style.

            const initialVisible = await controlsPanel.isVisible();

            await toggleBtn.click();
            await page.waitForTimeout(500);

            const afterClickVisible = await controlsPanel.isVisible();
            expect(afterClickVisible).not.toBe(initialVisible);
        });
    }
});
