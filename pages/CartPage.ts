import { Page, Locator, expect } from '@playwright/test';

export class CartPage {
    readonly page: Page;
    readonly cartItems: Locator;
    readonly checkoutButton: Locator;
    readonly continueShoppingButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.cartItems = page.locator('.cart_item');
        this.checkoutButton = page.locator('[data-test="checkout"]');
        this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
    }

    async isLoaded() {
        await expect(this.page).toHaveURL(/cart.html/, { timeout: 15000 });
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        await expect(this.page.locator('.cart_list')).toBeVisible({ timeout: 10000 });
    }

    async getCartItemsCount() {
        await this.page.waitForLoadState('networkidle', { timeout: 5000 });
        return await this.cartItems.count();
    }
    

    async removeItem(productName: string) {
        const item = this.cartItems.filter({ hasText: productName });
        await item.locator('[data-test^="remove"]').waitFor({ state: 'visible', timeout: 10000 });
        await item.locator('[data-test^="remove"]').click();
        // Wait for the removal to complete
        await this.page.waitForLoadState('networkidle', { timeout: 5000 });
        await this.page.waitForTimeout(1000);
    }

    async verifyItemExists(productName: string) {
        const item = this.cartItems.filter({ hasText: productName });
        await expect(item).toBeVisible({ timeout: 10000 });
    }

    async verifyItemDoesNotExist(productName: string) {
        // Wait for any potential animation or state change
        await this.page.waitForLoadState('networkidle', { timeout: 5000 });
        const item = this.cartItems.filter({ hasText: productName });
        await expect(item).toHaveCount(0);
    }

    async proceedToCheckout() {
        await this.checkoutButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.checkoutButton.click();
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    }

    async continueShopping() {
        await this.continueShoppingButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.continueShoppingButton.click();
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    }
}