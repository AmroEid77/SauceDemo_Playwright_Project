import { Page, Locator, expect } from '@playwright/test';

export class CheckoutPage {
    readonly page: Page;
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly postalCodeInput: Locator;
    readonly continueButton: Locator;
    readonly cancelButton: Locator;
    readonly finishButton: Locator;
    readonly errorMessage: Locator;
    readonly checkoutCompleteHeader: Locator;
    readonly backHomeButton: Locator;
    readonly cartItems: Locator;
    readonly subtotalLabel: Locator;
    readonly taxLabel: Locator;
    readonly totalLabel: Locator;

    constructor(page: Page) {
        this.page = page;
        this.firstNameInput = page.locator('[data-test="firstName"]');
        this.lastNameInput = page.locator('[data-test="lastName"]');
        this.postalCodeInput = page.locator('[data-test="postalCode"]');
        this.continueButton = page.locator('[data-test="continue"]');
        this.cancelButton = page.locator('[data-test="cancel"]');
        this.finishButton = page.locator('[data-test="finish"]');
        this.errorMessage = page.locator('[data-test="error"]');
        this.checkoutCompleteHeader = page.locator('.complete-header');
        this.backHomeButton = page.locator('[data-test="back-to-products"]');
        this.cartItems = page.locator('.cart_item');
        this.subtotalLabel = page.locator('.summary_subtotal_label');
        this.taxLabel = page.locator('.summary_tax_label');
        this.totalLabel = page.locator('.summary_total_label');
    }

    async isStep1Loaded() {
        await expect(this.page).toHaveURL(/checkout-step-one.html/, { timeout: 15000 });
        await expect(this.firstNameInput).toBeVisible({ timeout: 10000 });
        await expect(this.lastNameInput).toBeVisible({ timeout: 10000 });
        await expect(this.postalCodeInput).toBeVisible({ timeout: 10000 });
    }

    async isStep2Loaded() {
        await expect(this.page).toHaveURL(/checkout-step-two.html/, { timeout: 15000 });
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        await expect(this.finishButton).toBeVisible({ timeout: 10000 });
    }

    async isCompletePageLoaded() {
        await expect(this.page).toHaveURL(/checkout-complete.html/, { timeout: 15000 });
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        await expect(this.checkoutCompleteHeader).toBeVisible({ timeout: 10000 });
    }

    async fillShippingInfo(firstName: string, lastName: string, postalCode: string) {
        await this.firstNameInput.waitFor({ state: 'visible', timeout: 10000 });
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);
        await this.postalCodeInput.fill(postalCode);
    }

    async continueToOverview() {
        await this.continueButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.continueButton.click();
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    }

    async cancelCheckout() {
        await this.cancelButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.cancelButton.click();
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    }

    async completeCheckout() {
        await this.finishButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.finishButton.click();
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    }
    async clickFinishButton() {
        await this.finishButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.finishButton.click();
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    }

    async verifyErrorMessage(message: string) {
        await expect(this.errorMessage).toBeVisible({ timeout: 10000 });
        await expect(this.errorMessage).toContainText(message);
    }

    async verifySuccessMessage() {
        await expect(this.checkoutCompleteHeader).toBeVisible({ timeout: 10000 });
        await expect(this.checkoutCompleteHeader).toContainText('Thank you for your order');
    }

    async returnToProducts() {
        await this.backHomeButton.waitFor({ state: 'visible', timeout: 10000 });
        await this.backHomeButton.click();
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    }

    async getCartItemsCount() {
        await this.cartItems.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => { });
        return await this.cartItems.count();
    }

    async verifyItemInCart(productName: string) {
        const item = this.cartItems.filter({ hasText: productName });
        await expect(item).toBeVisible({ timeout: 10000 });
    }

    async getOrderSummaryValues() {
        await this.subtotalLabel.waitFor({ state: 'visible', timeout: 10000 });

        const subtotalText = await this.subtotalLabel.textContent() || '';
        const taxText = await this.taxLabel.textContent() || '';
        const totalText = await this.totalLabel.textContent() || '';

        const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, ''));
        const tax = parseFloat(taxText.replace(/[^0-9.]/g, ''));
        const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));

        return { subtotal, tax, total };
    }
}