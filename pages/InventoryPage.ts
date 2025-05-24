import { Page, Locator, expect } from '@playwright/test';

export class InventoryPage {
    readonly page: Page;
    readonly productList: Locator;
    readonly cartIcon: Locator;
    readonly sortDropdown: Locator;
    readonly cartBadge: Locator;

    constructor(page: Page) {
        this.page = page;
        this.productList = page.locator('.inventory_item');
        this.cartIcon = page.locator('.shopping_cart_link');
        this.sortDropdown = page.locator('[data-test="product-sort-container"]');
        this.cartBadge = page.locator('.shopping_cart_badge');
    }

    async isLoaded() {
        await expect(this.page).toHaveURL(/inventory.html/, { timeout: 15000 });
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        await expect(this.page.locator('.inventory_list')).toBeVisible({ timeout: 10000 });
    }

    async getProductNames() {
        await this.page.locator('.inventory_item_name').first().waitFor({ state: 'visible', timeout: 10000 });
        return await this.page.locator('.inventory_item_name').allTextContents();
    }

    async getProductPrices() {
        await this.page.locator('.inventory_item_price').first().waitFor({ state: 'visible', timeout: 10000 });
        const priceElements = await this.page.locator('.inventory_item_price').allTextContents();
        return priceElements.map(price => parseFloat(price.replace(/[^0-9.]/g, '')));
    }


    async addProductToCart(productName: string) {
        const productItem = this.page.locator('.inventory_item').filter({ hasText: productName });
        await productItem.waitFor({ state: 'visible', timeout: 10000 });
        await productItem.locator('button').click();
        // Wait for the cart to update
        await this.page.waitForTimeout(500);
    }

    async removeProductFromCart(productName: string) {
        const productItem = this.page.locator('.inventory_item').filter({ hasText: productName });
        await productItem.waitFor({ state: 'visible', timeout: 10000 });
        await productItem.locator('button').click();
        // Wait for the cart to update
        await this.page.waitForTimeout(500);
    }

    async getCartCount() {
        try {
            // First check if the badge exists at all
            const isVisible = await this.cartBadge.isVisible().catch(() => false);
            
            if (!isVisible) {
                return 0;
            }

            // If it's visible, get the text content with a reasonable timeout
            const text = await this.cartBadge.textContent({ timeout: 5000 });
            return text ? parseInt(text) : 0;
        } catch (e) {
            console.log('Error getting cart count:', e);
            return 0;
        }
    }

    async goToCart() {
        await this.cartIcon.waitFor({ state: 'visible', timeout: 10000 });
        await this.cartIcon.click();
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        await this.page.waitForTimeout(1500);
    }

    async sortBy(option: 'az' | 'za' | 'lohi' | 'hilo') {
        const optionValues = {
            'az': 'az',
            'za': 'za',
            'lohi': 'lohi',
            'hilo': 'hilo'
        };

        await this.sortDropdown.waitFor({ state: 'visible', timeout: 10000 });
        await this.sortDropdown.selectOption(optionValues[option]);

        // Wait for sorting to complete
        await this.page.waitForLoadState('networkidle', { timeout: 5000 });
        await this.page.waitForTimeout(1000); // Extra wait for any animations
    }
}