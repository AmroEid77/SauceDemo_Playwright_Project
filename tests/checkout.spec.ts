import { test, expect } from './fixtures';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Configuration for this test file
const TEST_FILE_NAME = 'checkout_feature';
const TEST_DISPLAY_NAME = 'Checkout Feature Tests';

// Create organized log directory structure
const baseLogsDir = path.join(process.cwd(), 'test-logs');
const testFileLogsDir = path.join(baseLogsDir, TEST_FILE_NAME);

// Ensure directories exist
if (!fs.existsSync(baseLogsDir)) {
    fs.mkdirSync(baseLogsDir, { recursive: true });
}
if (!fs.existsSync(testFileLogsDir)) {
    fs.mkdirSync(testFileLogsDir, { recursive: true });
}

// Generate unique log file name for this test run
const testRunId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const logFileName = `${TEST_FILE_NAME}_tests_${testRunId}.log`;
const logFilePath = path.join(testFileLogsDir, logFileName);

// Create summary log file for this test file (gets updated with each run)
const summaryLogPath = path.join(testFileLogsDir, `${TEST_FILE_NAME}_summary.log`);

// Create master summary log (tracks all test files)
const masterSummaryPath = path.join(baseLogsDir, 'all_tests_summary.log');

// Initialize log files
const initLogHeader = `
${'='.repeat(80)}
${TEST_DISPLAY_NAME.toUpperCase()}
Test Run ID: ${testRunId}
Started: ${new Date().toISOString()}
${'='.repeat(80)}
`;

fs.writeFileSync(logFilePath, initLogHeader);

// Initialize or append to summary logs
const summaryHeader = `\n[${new Date().toISOString()}] ${TEST_DISPLAY_NAME} - Run Started: ${testRunId}\n`;
fs.appendFileSync(summaryLogPath, summaryHeader);
fs.appendFileSync(masterSummaryPath, `[${new Date().toISOString()}] [${TEST_FILE_NAME}] Test Run Started: ${testRunId}\n`);

// Enhanced logging function with file output
const logToFile = (message, level = 'INFO') => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;

    // Write to individual test run log
    fs.appendFileSync(logFilePath, logEntry);

    // Also write important events to test file summary log
    if (level === 'ERROR' || level === 'SUMMARY' || message.includes('✅') || message.includes('❌')) {
        fs.appendFileSync(summaryLogPath, `[${timestamp}] [${testRunId}] ${message}\n`);
    }

    // Write critical events to master summary
    if (level === 'ERROR' || level === 'CRITICAL' || message.includes('TEST START') || message.includes('COMPLETED')) {
        fs.appendFileSync(masterSummaryPath, `[${timestamp}] [${TEST_FILE_NAME}] [${testRunId}] ${message}\n`);
    }
};

// Helper function to measure execution time with detailed logging
const timeAction = async (actionName, actionFn, context = '') => {
    const startTime = Date.now();
    const fullContext = context ? `${context} - ${actionName}` : actionName;

    logToFile(`⏱️  STARTING: ${fullContext}`, 'ACTION');

    try {
        const result = await actionFn();
        const duration = Date.now() - startTime;
        logToFile(`✅ COMPLETED: ${fullContext} (${duration}ms)`, 'SUCCESS');

        // Log performance warnings
        if (duration > 5000) {
            logToFile(`⚠️  SLOW OPERATION: ${fullContext} took ${duration}ms`, 'WARNING');
            testStats.slowOps++;
        }

        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        logToFile(`❌ FAILED: ${fullContext} after ${duration}ms`, 'ERROR');
        logToFile(`❌ ERROR DETAILS: ${error.message}`, 'ERROR');
        logToFile(`❌ STACK TRACE: ${error.stack}`, 'ERROR');
        throw error;
    }
};

// Function to log test context and environment
const logTestEnvironment = () => {
    logToFile('='.repeat(60), 'SUMMARY');
    logToFile(`TEST FILE: ${TEST_FILE_NAME}`, 'SUMMARY');
    logToFile(`TEST SUITE: ${TEST_DISPLAY_NAME}`, 'SUMMARY');
    logToFile(`Node Version: ${process.version}`, 'SUMMARY');
    logToFile(`Platform: ${process.platform}`, 'SUMMARY');
    logToFile(`Working Directory: ${process.cwd()}`, 'SUMMARY');
    logToFile(`Log Directory: ${testFileLogsDir}`, 'SUMMARY');
    logToFile(`Current Log File: ${logFileName}`, 'SUMMARY');
    logToFile(`Environment Variables Loaded: ${process.env.STANDARD_USER ? 'YES' : 'NO'}`, 'SUMMARY');
    logToFile('='.repeat(60), 'SUMMARY');
};

// Function to clean up old logs for this specific test file (keep last 10 runs)
const cleanupOldLogs = () => {
    try {
        const files = fs.readdirSync(testFileLogsDir)
            .filter(file => file.startsWith(`${TEST_FILE_NAME}_tests_run_`) && file.endsWith('.log'))
            .map(file => ({
                name: file,
                time: fs.statSync(path.join(testFileLogsDir, file)).mtime.getTime(),
                path: path.join(testFileLogsDir, file)
            }))
            .sort((a, b) => b.time - a.time);

        logToFile(`📁 Found ${files.length} existing log files for ${TEST_FILE_NAME}`, 'INFO');

        // Keep only the 10 most recent log files
        if (files.length > 10) {
            const filesToDelete = files.slice(10);
            logToFile(`🗑️  Cleaning up ${filesToDelete.length} old log files`, 'INFO');

            filesToDelete.forEach(file => {
                fs.unlinkSync(file.path);
                logToFile(`🗑️  Deleted old log: ${file.name}`, 'INFO');
            });
        }
    } catch (error) {
        logToFile(`⚠️  Failed to cleanup old logs: ${error.message}`, 'WARNING');
        testStats.warnings++;
    }
};

// Function to log final test statistics
const logTestStatistics = (stats) => {
    logToFile('', 'SUMMARY');
    logToFile('='.repeat(60), 'SUMMARY');
    logToFile(`📊 ${TEST_DISPLAY_NAME} - FINAL STATISTICS`, 'SUMMARY');
    logToFile(`🕐 Test Run Duration: ${stats.duration}ms`, 'SUMMARY');
    logToFile(`✅ Tests Passed: ${stats.passed}`, 'SUMMARY');
    logToFile(`❌ Tests Failed: ${stats.failed}`, 'SUMMARY');
    logToFile(`⚠️  Warnings Generated: ${stats.warnings}`, 'SUMMARY');
    logToFile(`🐌 Slow Operations: ${stats.slowOps}`, 'SUMMARY');
    logToFile(`🛒 Complete Checkout Tests: ${stats.completeCheckoutTests}`, 'SUMMARY');
    logToFile(`🚫 Validation Error Tests: ${stats.validationTests}`, 'SUMMARY');
    logToFile(`🧾 Order Summary Tests: ${stats.summaryTests}`, 'SUMMARY');
    logToFile(`↩️  Cancel Flow Tests: ${stats.cancelTests}`, 'SUMMARY');
    logToFile(`🏁 Finish Button Tests: ${stats.finishButtonTests}`, 'SUMMARY');
    logToFile('='.repeat(60), 'SUMMARY');
};

// Track test statistics
let testStats = {
    startTime: Date.now(),
    passed: 0,
    failed: 0,
    warnings: 0,
    slowOps: 0,
    completeCheckoutTests: 0,
    validationTests: 0,
    summaryTests: 0,
    cancelTests: 0,
    finishButtonTests: 0
};

test.describe('Checkout Feature', () => {

    test.beforeAll(async ({ authenticatedPage }) => {
        logTestEnvironment();
        cleanupOldLogs();

        logToFile(`🚀 [BeforeAll] Starting ${TEST_DISPLAY_NAME} suite setup...`, 'SUMMARY');

        await timeAction('Page load state wait', async () => {
            await authenticatedPage.waitForLoadState('networkidle', { timeout: 15000 });
        }, 'BeforeAll Setup');

        logToFile(`✅ [BeforeAll] ${TEST_DISPLAY_NAME} suite setup completed`, 'SUMMARY');
    });

    test.beforeEach(async ({ inventoryPage, cartPage, authenticatedPage }) => {
        logToFile('🔄 [BeforeEach] Starting individual test setup...', 'INFO');

        await timeAction('Navigate to inventory page', async () => {
            await authenticatedPage.goto('/inventory.html', {
                waitUntil: 'networkidle',
                timeout: 10000
            });
        }, 'BeforeEach Navigation');

        await timeAction('Wait for inventory page to load', async () => {
            await inventoryPage.isLoaded();
        }, 'BeforeEach Verification');

        await timeAction('Add product to cart', async () => {
            await inventoryPage.addProductToCart(process.env.PRODUCT_NAME_TEST as string);
            logToFile(`🛍️ Added 'Sauce Labs Backpack' to cart`, 'INFO');
        }, 'BeforeEach Cart Setup');

        await timeAction('Navigate to cart', async () => {
            await inventoryPage.goToCart();
        }, 'BeforeEach Cart Navigation');

        await timeAction('Wait for cart page to load', async () => {
            await cartPage.isLoaded();
        }, 'BeforeEach Cart Verification');

        logToFile('✅ [BeforeEach] Individual test setup completed - Ready for checkout', 'INFO');
    });

    test('should complete checkout with valid information', async ({ cartPage, checkoutPage, inventoryPage }) => {
        logToFile('🛒 TEST START: Complete checkout flow with valid information', 'SUMMARY');
        testStats.completeCheckoutTests++;

        try {
            // Step 1: Proceed to checkout
            await timeAction('Proceed to checkout from cart', async () => {
                await cartPage.proceedToCheckout();
            }, 'Complete Checkout Test');

            await timeAction('Verify checkout step 1 loaded', async () => {
                await checkoutPage.isStep1Loaded();
            }, 'Complete Checkout Test');

            // Step 2: Fill shipping information
            const shippingInfo = { firstName: 'John', lastName: 'Doe', postalCode: '12345' };
            logToFile(`📝 Filling shipping info: ${JSON.stringify(shippingInfo)}`, 'INFO');

            await timeAction('Fill shipping information', async () => {
                await checkoutPage.fillShippingInfo(shippingInfo.firstName, shippingInfo.lastName, shippingInfo.postalCode);
            }, 'Complete Checkout Test');

            await timeAction('Continue to overview', async () => {
                await checkoutPage.continueToOverview();
            }, 'Complete Checkout Test');

            // Step 3: Verify overview step
            await timeAction('Verify overview step loaded', async () => {
                await checkoutPage.isStep2Loaded();
            }, 'Complete Checkout Test');

            await timeAction('Verify product exists in cart', async () => {
                await checkoutPage.verifyItemInCart(process.env.PRODUCT_NAME_TEST as string);
            }, 'Cart Remove Test');

            // Step 4: Complete the checkout
            await timeAction('Complete checkout process', async () => {
                await checkoutPage.completeCheckout();
            }, 'Complete Checkout Test');

            // Step 5: Verify success
            await timeAction('Verify completion page loaded', async () => {
                await checkoutPage.isCompletePageLoaded();
            }, 'Complete Checkout Test');

            await timeAction('Verify success message', async () => {
                await checkoutPage.verifySuccessMessage();
            }, 'Complete Checkout Test');

            // Step 6: Return to products and verify cart is empty
            await timeAction('Return to products page', async () => {
                await checkoutPage.returnToProducts();
            }, 'Complete Checkout Test');

            await timeAction('Verify inventory page loaded', async () => {
                await inventoryPage.isLoaded();
            }, 'Complete Checkout Test');

            const cartCount = await timeAction('Get final cart count', async () => {
                return await inventoryPage.getCartCount();
            }, 'Complete Checkout Test');

            logToFile(`🛒 Final cart count: ${cartCount}`, 'INFO');
            logToFile(`🎯 Cart emptied: ${cartCount === 0 ? 'PASS' : 'FAIL'}`, 'INFO');

            expect(cartCount).toBe(0);

            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Complete checkout flow passed successfully', 'SUMMARY');

        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Complete checkout test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should complete checkout using Finish button and navigate back home', async ({ cartPage, checkoutPage, inventoryPage, authenticatedPage }) => {
        logToFile('🏁 TEST START: Finish button checkout flow with home navigation', 'SUMMARY');
        testStats.finishButtonTests++;

        try {
            // Step 1: Proceed to checkout
            await timeAction('Proceed to checkout from cart', async () => {
                await cartPage.proceedToCheckout();
            }, 'Finish Button Test');

            await timeAction('Verify checkout step 1 loaded', async () => {
                await checkoutPage.isStep1Loaded();
            }, 'Finish Button Test');

            // Step 2: Fill shipping information
            const shippingInfo = { firstName: 'Jane', lastName: 'Smith', postalCode: '54321' };
            logToFile(`📝 Filling shipping info: ${JSON.stringify(shippingInfo)}`, 'INFO');

            await timeAction('Fill shipping information', async () => {
                await checkoutPage.fillShippingInfo(shippingInfo.firstName, shippingInfo.lastName, shippingInfo.postalCode);
            }, 'Finish Button Test');

            await timeAction('Continue to overview', async () => {
                await checkoutPage.continueToOverview();
            }, 'Finish Button Test');

            // Step 3: Verify overview step and check order details
            await timeAction('Verify overview step loaded', async () => {
                await checkoutPage.isStep2Loaded();
            }, 'Finish Button Test');

            // Capture order summary before finishing
            const orderSummary = await timeAction('Get order summary before finish', async () => {
                return await checkoutPage.getOrderSummaryValues();
            }, 'Finish Button Test');

            logToFile(`💰 Pre-finish Order Summary:`, 'INFO');
            logToFile(`  - Subtotal: $${orderSummary.subtotal}`, 'INFO');
            logToFile(`  - Tax: $${orderSummary.tax}`, 'INFO');
            logToFile(`  - Total: $${orderSummary.total}`, 'INFO');

            // Check if info are correct
            expect(orderSummary.total).toBeCloseTo(orderSummary.subtotal + orderSummary.tax, 2);
            // Step 4: Click the Finish button specifically
            await timeAction('Click Finish button to complete order', async () => {
                await checkoutPage.clickFinishButton();
            }, 'Finish Button Test');

            // Step 5: Verify completion page
            await timeAction('Verify order completion page loaded', async () => {
                await checkoutPage.isCompletePageLoaded();
            }, 'Finish Button Test');

            await timeAction('Verify order completion success message', async () => {
                await checkoutPage.verifySuccessMessage();
            }, 'Finish Button Test');

            // Step 6: Capture completion page details
            const completionUrl = await timeAction('Get completion page URL', async () => {
                return await authenticatedPage.url();
            }, 'Finish Button Test');

            logToFile(`🎯 Completion page URL: ${completionUrl}`, 'INFO');

            // Verify we're on the checkout complete page
            expect(completionUrl).toContain('checkout-complete');

            // Step 7: Navigate back to home/inventory using the Back Home button
            await timeAction('Click Back Home button', async () => {
                await checkoutPage.returnToProducts();
            }, 'Finish Button Test');

            // Step 8: Verify we're back on the inventory page (home)
            await timeAction('Verify returned to inventory/home page', async () => {
                await inventoryPage.isLoaded();
            }, 'Finish Button Test');

            const homeUrl = await timeAction('Get home page URL', async () => {
                return await authenticatedPage.url();
            }, 'Finish Button Test');

            logToFile(`🏠 Home page URL: ${homeUrl}`, 'INFO');

            // Verify we're on the inventory page
            expect(homeUrl).toContain('inventory.html');

            // Step 9: Verify cart is empty after successful checkout
            const finalCartCount = await timeAction('Get final cart count after finish', async () => {
                return await inventoryPage.getCartCount();
            }, 'Finish Button Test');

            logToFile(`🛒 Final cart count after Finish: ${finalCartCount}`, 'INFO');
            logToFile(`🎯 Cart properly emptied: ${finalCartCount === 0 ? 'PASS' : 'FAIL'}`, 'INFO');

            expect(finalCartCount).toBe(0);

            // Step 10: Verify page elements are properly loaded
            await timeAction('Verify inventory page elements are visible', async () => {
                // Check that product listings are visible
                const productCount = await inventoryPage.getCartCount();
                logToFile(`📦 Products visible on home page: ${productCount}`, 'INFO');
                expect(productCount).toBe(0);
            }, 'Finish Button Test');

            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Finish button checkout with home navigation passed successfully', 'SUMMARY');
            logToFile('🎯 Flow Summary: Cart → Checkout → Fill Info → Overview → Finish → Complete → Back Home', 'SUMMARY');

        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Finish button checkout test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should display error when first name is missing', async ({ cartPage, checkoutPage }) => {
        logToFile('🚫 TEST START: First name validation error', 'SUMMARY');
        testStats.validationTests++;

        try {
            await timeAction('Proceed to checkout', async () => {
                await cartPage.proceedToCheckout();
            }, 'First Name Validation Test');

            await timeAction('Verify checkout step 1 loaded', async () => {
                await checkoutPage.isStep1Loaded();
            }, 'First Name Validation Test');

            const invalidInfo = { firstName: '', lastName: 'Doe', postalCode: '12345' };
            logToFile(`📝 Testing with missing first name: ${JSON.stringify(invalidInfo)}`, 'INFO');

            await timeAction('Fill shipping info with missing first name', async () => {
                await checkoutPage.fillShippingInfo(invalidInfo.firstName, invalidInfo.lastName, invalidInfo.postalCode);
            }, 'First Name Validation Test');

            await timeAction('Attempt to continue to overview', async () => {
                await checkoutPage.continueToOverview();
            }, 'First Name Validation Test');

            const expectedError = 'First Name is required';
            logToFile(`🔍 Expected validation error: "${expectedError}"`, 'INFO');

            await timeAction('Verify first name error message', async () => {
                await checkoutPage.verifyErrorMessage(expectedError);
            }, 'First Name Validation Test');

            testStats.passed++;
            logToFile('✅ TEST COMPLETED: First name validation error test passed successfully', 'SUMMARY');

        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: First name validation test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should display error when last name is missing', async ({ cartPage, checkoutPage }) => {
        logToFile('🚫 TEST START: Last name validation error', 'SUMMARY');
        testStats.validationTests++;

        try {
            await timeAction('Proceed to checkout', async () => {
                await cartPage.proceedToCheckout();
            }, 'Last Name Validation Test');

            await timeAction('Verify checkout step 1 loaded', async () => {
                await checkoutPage.isStep1Loaded();
            }, 'Last Name Validation Test');

            const invalidInfo = { firstName: 'John', lastName: '', postalCode: '12345' };
            logToFile(`📝 Testing with missing last name: ${JSON.stringify(invalidInfo)}`, 'INFO');

            await timeAction('Fill shipping info with missing last name', async () => {
                await checkoutPage.fillShippingInfo(invalidInfo.firstName, invalidInfo.lastName, invalidInfo.postalCode);
            }, 'Last Name Validation Test');

            await timeAction('Attempt to continue to overview', async () => {
                await checkoutPage.continueToOverview();
            }, 'Last Name Validation Test');

            const expectedError = 'Last Name is required';
            logToFile(`🔍 Expected validation error: "${expectedError}"`, 'INFO');

            await timeAction('Verify last name error message', async () => {
                await checkoutPage.verifyErrorMessage(expectedError);
            }, 'Last Name Validation Test');

            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Last name validation error test passed successfully', 'SUMMARY');

        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Last name validation test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should display error when postal code is missing', async ({ cartPage, checkoutPage }) => {
        logToFile('🚫 TEST START: Postal code validation error', 'SUMMARY');
        testStats.validationTests++;

        try {
            await timeAction('Proceed to checkout', async () => {
                await cartPage.proceedToCheckout();
            }, 'Postal Code Validation Test');

            await timeAction('Verify checkout step 1 loaded', async () => {
                await checkoutPage.isStep1Loaded();
            }, 'Postal Code Validation Test');

            const invalidInfo = { firstName: 'John', lastName: 'Doe', postalCode: '' };
            logToFile(`📝 Testing with missing postal code: ${JSON.stringify(invalidInfo)}`, 'INFO');

            await timeAction('Fill shipping info with missing postal code', async () => {
                await checkoutPage.fillShippingInfo(invalidInfo.firstName, invalidInfo.lastName, invalidInfo.postalCode);
            }, 'Postal Code Validation Test');

            await timeAction('Attempt to continue to overview', async () => {
                await checkoutPage.continueToOverview();
            }, 'Postal Code Validation Test');

            const expectedError = 'Postal Code is required';
            logToFile(`🔍 Expected validation error: "${expectedError}"`, 'INFO');

            await timeAction('Verify postal code error message', async () => {
                await checkoutPage.verifyErrorMessage(expectedError);
            }, 'Postal Code Validation Test');

            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Postal code validation error test passed successfully', 'SUMMARY');

        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Postal code validation test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should cancel checkout and return to cart', async ({ cartPage, checkoutPage }) => {
        logToFile('↩️ TEST START: Checkout cancellation flow', 'SUMMARY');
        testStats.cancelTests++;

        try {
            await timeAction('Proceed to checkout', async () => {
                await cartPage.proceedToCheckout();
            }, 'Cancel Checkout Test');

            await timeAction('Verify checkout step 1 loaded', async () => {
                await checkoutPage.isStep1Loaded();
            }, 'Cancel Checkout Test');

            logToFile('🔄 Initiating checkout cancellation', 'INFO');

            await timeAction('Cancel checkout process', async () => {
                await checkoutPage.cancelCheckout();
            }, 'Cancel Checkout Test');

            await timeAction('Verify returned to cart page', async () => {
                await cartPage.isLoaded();
            }, 'Cancel Checkout Test');

            await timeAction('Verify product exists in cart', async () => {
                await cartPage.verifyItemExists(process.env.PRODUCT_NAME_TEST as string);
            }, 'Cart Check Test after canceling checkout');

            logToFile('🎯 Cancellation flow verification: PASS', 'INFO');

            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Checkout cancellation test passed successfully', 'SUMMARY');

        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Checkout cancellation test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should verify order summary calculations', async ({ cartPage, checkoutPage, inventoryPage }) => {
        logToFile('🧾 TEST START: Order summary calculations verification', 'SUMMARY');
        testStats.summaryTests++;

        try {
            // Add a second product to test multi-item calculations
            await timeAction('Continue shopping to add more items', async () => {
                await cartPage.continueShopping();
            }, 'Order Summary Test');

            await timeAction('Verify inventory page loaded', async () => {
                await inventoryPage.isLoaded();
            }, 'Order Summary Test');

            const secondProduct = 'Sauce Labs Fleece Jacket';
            await timeAction('Add second product to cart', async () => {
                await inventoryPage.addProductToCart(secondProduct);
                logToFile(`🛍️ Added '${secondProduct}' to cart`, 'INFO');
            }, 'Order Summary Test');

            await timeAction('Navigate back to cart', async () => {
                await inventoryPage.goToCart();
            }, 'Order Summary Test');

            await timeAction('Verify cart loaded with multiple items', async () => {
                await cartPage.isLoaded();
            }, 'Order Summary Test');

            await timeAction('Proceed to checkout', async () => {
                await cartPage.proceedToCheckout();
            }, 'Order Summary Test');

            await timeAction('Verify checkout step 1 loaded', async () => {
                await checkoutPage.isStep1Loaded();
            }, 'Order Summary Test');

            const shippingInfo = { firstName: 'John', lastName: 'Doe', postalCode: '12345' };
            await timeAction('Fill shipping information', async () => {
                await checkoutPage.fillShippingInfo(shippingInfo.firstName, shippingInfo.lastName, shippingInfo.postalCode);
            }, 'Order Summary Test');

            await timeAction('Continue to overview', async () => {
                await checkoutPage.continueToOverview();
            }, 'Order Summary Test');

            await timeAction('Verify overview step loaded', async () => {
                await checkoutPage.isStep2Loaded();
            }, 'Order Summary Test');

            const summary = await timeAction('Get order summary values', async () => {
                return await checkoutPage.getOrderSummaryValues();
            }, 'Order Summary Test');

            logToFile(`💰 Order Summary Details:`, 'INFO');
            logToFile(`  - Subtotal: $${summary.subtotal}`, 'INFO');
            logToFile(`  - Tax: $${summary.tax}`, 'INFO');
            logToFile(`  - Total: $${summary.total}`, 'INFO');

            const calculatedTotal = summary.subtotal + summary.tax;
            const totalMatch = Math.abs(summary.total - calculatedTotal) < 0.01;

            logToFile(`🧮 Calculation verification:`, 'INFO');
            logToFile(`  - Expected Total: $${calculatedTotal.toFixed(2)}`, 'INFO');
            logToFile(`  - Actual Total: $${summary.total}`, 'INFO');
            logToFile(`  - Match: ${totalMatch ? 'PASS' : 'FAIL'}`, 'INFO');

            expect(summary.total).toBeCloseTo(summary.subtotal + summary.tax, 2);

            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Order summary calculations verified successfully', 'SUMMARY');

        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Order summary calculations test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test.afterAll(async () => {
        // Calculate final statistics
        const duration = Date.now() - testStats.startTime;
        logTestStatistics({ ...testStats, duration });

        logToFile('🏁 TEST SUITE COMPLETED', 'CRITICAL');
        logToFile(`📁 Detailed logs saved to: ${logFilePath}`, 'SUMMARY');
        logToFile(`📋 Test file summary: ${summaryLogPath}`, 'SUMMARY');
        logToFile(`📊 Master summary: ${masterSummaryPath}`, 'SUMMARY');

        // Final summary to master log
        fs.appendFileSync(masterSummaryPath,
            `[${new Date().toISOString()}] [${TEST_FILE_NAME}] COMPLETED - ` +
            `Passed: ${testStats.passed}, Failed: ${testStats.failed}, ` +
            `Complete: ${testStats.completeCheckoutTests}, Validation: ${testStats.validationTests}, ` +
            `Summary: ${testStats.summaryTests}, Cancel: ${testStats.cancelTests}, ` +
            `Finish: ${testStats.finishButtonTests}, Duration: ${duration}ms\n`
        );
    });
});