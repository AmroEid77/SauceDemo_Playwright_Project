import { test as base, expect, Page, Browser } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import dotenv from 'dotenv';

dotenv.config();

// Worker-scoped fixtures (shared across tests in the same worker)
type WorkerFixtures = {
    authenticatedBrowser: Browser;
    sharedAuthenticatedPage: Page;
};

// Test-scoped fixtures
type TestFixtures = {
    loginPage: LoginPage;
    inventoryPage: InventoryPage;
    cartPage: CartPage;
    checkoutPage: CheckoutPage;
    authenticatedPage: Page;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
    // Worker-scoped: Login once per worker
    sharedAuthenticatedPage: [async ({ browser }, use) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        const loginPage = new LoginPage(page);

        // Login once
        await loginPage.goto();
        await loginPage.login(
            process.env.STANDARD_USER || 'standard_user',
            process.env.PASSWORD || 'secret_sauce'
        );

        await page.waitForURL(/inventory.html/);
        await page.waitForLoadState('networkidle');

        await use(page);
        await context.close();
    }, { scope: 'worker' }],

    // Test-scoped: Fresh page for each test but reuse authentication
    authenticatedPage: async ({ sharedAuthenticatedPage }, use) => {
        // Create a new page but copy the authentication state
        const context = await sharedAuthenticatedPage.context();
        const newPage = await context.newPage();

        // Navigate to inventory page (already authenticated)
        await newPage.goto('/inventory.html');
        await newPage.waitForLoadState('networkidle');

        await use(newPage);
        await newPage.close();
    },

    // Page Object fixtures
    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await use(loginPage);
    },

    inventoryPage: async ({ authenticatedPage }, use) => {
        const inventoryPage = new InventoryPage(authenticatedPage);
        await use(inventoryPage);
    },

    cartPage: async ({ authenticatedPage }, use) => {
        const cartPage = new CartPage(authenticatedPage);
        await use(cartPage);
    },

    checkoutPage: async ({ authenticatedPage }, use) => {
        const checkoutPage = new CheckoutPage(authenticatedPage);
        await use(checkoutPage);
    }
});

export { expect } from '@playwright/test';