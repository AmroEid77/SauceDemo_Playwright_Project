import { test, expect } from './fixtures';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Configuration for this test file
const TEST_FILE_NAME = 'cart_feature';
const TEST_DISPLAY_NAME = 'Cart Feature Tests';

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
    logToFile(`🛒 Cart Add Tests: ${stats.cartAddTests}`, 'SUMMARY');
    logToFile(`🗑️  Cart Remove Tests: ${stats.cartRemoveTests}`, 'SUMMARY');
    logToFile(`📦 Multi-Item Tests: ${stats.multiItemTests}`, 'SUMMARY');
    logToFile(`🔄 Navigation Tests: ${stats.navigationTests}`, 'SUMMARY');
    logToFile('='.repeat(60), 'SUMMARY');
};

// Track test statistics
let testStats = {
    startTime: Date.now(),
    passed: 0,
    failed: 0,
    warnings: 0,
    slowOps: 0,
    cartAddTests: 0,
    cartRemoveTests: 0,
    multiItemTests: 0,
    navigationTests: 0
};

test.describe('Cart Feature', () => {
    // Use beforeAll to set up any test suite level requirements
    test.beforeAll(async ({ authenticatedPage }) => {
        logTestEnvironment();
        cleanupOldLogs();
        
        logToFile(`🚀 [BeforeAll] Starting ${TEST_DISPLAY_NAME} suite setup...`, 'SUMMARY');
        
        await timeAction('Wait for authenticated page network idle', async () => {
            await authenticatedPage.waitForLoadState('networkidle');
        }, 'BeforeAll Setup');
        
        logToFile(`🔧 Authenticated session established`, 'INFO');
        logToFile(`✅ [BeforeAll] ${TEST_DISPLAY_NAME} suite setup completed`, 'SUMMARY');
    });

    test.beforeEach(async ({ inventoryPage, authenticatedPage }) => {
        logToFile('🔄 [BeforeEach] Starting individual test setup...', 'INFO');
        
        await timeAction('Navigate to inventory page', async () => {
            await authenticatedPage.goto('/inventory.html');
        }, 'BeforeEach Navigation');

        await timeAction('Verify inventory page loaded', async () => {
            await inventoryPage.isLoaded();
        }, 'BeforeEach Verification');
        
        logToFile('✅ [BeforeEach] Individual test setup completed - Cart state reset', 'INFO');
    });

    test('should add item to cart', async ({ inventoryPage }) => {
        logToFile('🛒 TEST START: Add single item to cart functionality', 'SUMMARY');
        testStats.cartAddTests++;

        try {
            // Arrange
            const productName = 'Sauce Labs Backpack';
            logToFile(`📦 Testing product: ${productName}`, 'INFO');
            
            const initialCount = await timeAction('Get initial cart count', async () => {
                return await inventoryPage.getCartCount();
            }, 'Add Item Test');
            
            logToFile(`🔢 Initial cart count: ${initialCount}`, 'INFO');

            // Act
            await timeAction('Add product to cart', async () => {
                await inventoryPage.addProductToCart(productName);
            }, 'Add Item Test');

            // Assert
            const newCount = await timeAction('Get updated cart count', async () => {
                return await inventoryPage.getCartCount();
            }, 'Add Item Test');
            
            logToFile(`🔢 New cart count: ${newCount}`, 'INFO');
            logToFile(`✔️  Expected count: ${initialCount + 1}`, 'INFO');
            
            expect(newCount).toBe(initialCount + 1);
            
            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Add item to cart test passed successfully', 'SUMMARY');
            
        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Add item to cart test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should remove item from inventory page', async ({ inventoryPage }) => {
        logToFile('🗑️  TEST START: Remove item from inventory page functionality', 'SUMMARY');
        testStats.cartRemoveTests++;

        try {
            // Arrange
            const productName = 'Sauce Labs Bike Light';
            logToFile(`📦 Testing product removal: ${productName}`, 'INFO');
            
            await timeAction('Add product to cart (setup)', async () => {
                await inventoryPage.addProductToCart(productName);
            }, 'Remove Item Test');
            
            const initialCount = await timeAction('Get cart count after adding', async () => {
                return await inventoryPage.getCartCount();
            }, 'Remove Item Test');
            
            logToFile(`🔢 Cart count after adding: ${initialCount}`, 'INFO');

            // Act
            await timeAction('Remove product from cart', async () => {
                await inventoryPage.removeProductFromCart(productName);
            }, 'Remove Item Test');

            // Assert
            const newCount = await timeAction('Get final cart count', async () => {
                return await inventoryPage.getCartCount();
            }, 'Remove Item Test');
            
            logToFile(`🔢 Final cart count: ${newCount}`, 'INFO');
            logToFile(`✔️  Expected count: ${initialCount - 1}`, 'INFO');
            
            expect(newCount).toBe(initialCount - 1);
            
            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Remove item from inventory page test passed successfully', 'SUMMARY');
            
        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Remove item from inventory page test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should add multiple items to cart', async ({ inventoryPage, cartPage }) => {
        logToFile('📦 TEST START: Add multiple items to cart functionality', 'SUMMARY');
        testStats.multiItemTests++;

        try {
            // Arrange
            const products = [
                'Sauce Labs Backpack',
                'Sauce Labs Bike Light',
                'Sauce Labs Bolt T-Shirt'
            ];
            
            logToFile(`📦 Testing multiple products: ${products.join(', ')}`, 'INFO');
            logToFile(`🔢 Expected final count: ${products.length}`, 'INFO');

            // Act
            await timeAction('Add multiple products to cart', async () => {
                for (const product of products) {
                    logToFile(`➕ Adding product: ${product}`, 'INFO');
                    await inventoryPage.addProductToCart(product);
                }
            }, 'Multi-Item Test');

            // Assert - Verify cart count
            const cartCount = await timeAction('Get cart count after adding all items', async () => {
                return await inventoryPage.getCartCount();
            }, 'Multi-Item Test');
            
            logToFile(`🔢 Final cart count: ${cartCount}`, 'INFO');
            expect(cartCount).toBe(products.length);
            
            // Verify cart contents
            await timeAction('Navigate to cart page', async () => {
                await inventoryPage.goToCart();
            }, 'Multi-Item Test');

            await timeAction('Verify cart page loaded', async () => {
                await cartPage.isLoaded();
            }, 'Multi-Item Test');

            const itemsCount = await timeAction('Get cart items count', async () => {
                return await cartPage.getCartItemsCount();
            }, 'Multi-Item Test');
            
            logToFile(`🔢 Cart page items count: ${itemsCount}`, 'INFO');
            expect(itemsCount).toBe(products.length);

            // Verify each product exists in cart
            await timeAction('Verify all products exist in cart', async () => {
                for (const product of products) {
                    logToFile(`🔍 Verifying product exists: ${product}`, 'INFO');
                    await cartPage.verifyItemExists(product);
                }
            }, 'Multi-Item Test');
            
            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Add multiple items to cart test passed successfully', 'SUMMARY');
            
        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Add multiple items to cart test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should remove item from cart page', async ({ inventoryPage, cartPage }) => {
        logToFile('🗑️  TEST START: Remove item from cart page functionality', 'SUMMARY');
        testStats.cartRemoveTests++;

        try {
            // Arrange
            const productName = 'Sauce Labs Fleece Jacket';
            logToFile(`📦 Testing product removal from cart: ${productName}`, 'INFO');
            
            await timeAction('Add product to cart (setup)', async () => {
                await inventoryPage.addProductToCart(productName);
            }, 'Cart Remove Test');

            await timeAction('Navigate to cart page', async () => {
                await inventoryPage.goToCart();
            }, 'Cart Remove Test');

            await timeAction('Verify cart page loaded', async () => {
                await cartPage.isLoaded();
            }, 'Cart Remove Test');

            // Verify product is in cart
            await timeAction('Verify product exists in cart', async () => {
                await cartPage.verifyItemExists(productName);
            }, 'Cart Remove Test');
            
            const initialCount = await timeAction('Get initial cart items count', async () => {
                return await cartPage.getCartItemsCount();
            }, 'Cart Remove Test');
            
            logToFile(`🔢 Initial cart items count: ${initialCount}`, 'INFO');

            // Act
            await timeAction('Remove item from cart', async () => {
                await cartPage.removeItem(productName);
            }, 'Cart Remove Test');

            // Assert
            const newCount = await timeAction('Get final cart items count', async () => {
                return await cartPage.getCartItemsCount();
            }, 'Cart Remove Test');
            
            logToFile(`🔢 Final cart items count: ${newCount}`, 'INFO');
            logToFile(`✔️  Expected count: ${initialCount - 1}`, 'INFO');
            
            expect(newCount).toBe(initialCount - 1);
            
            await timeAction('Verify item no longer exists in cart', async () => {
                await cartPage.verifyItemDoesNotExist(productName);
            }, 'Cart Remove Test');
            
            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Remove item from cart page test passed successfully', 'SUMMARY');
            
        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Remove item from cart page test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should continue shopping from cart', async ({ inventoryPage, cartPage }) => {
        logToFile('🔄 TEST START: Continue shopping navigation functionality', 'SUMMARY');
        testStats.navigationTests++;

        try {
            // Arrange
            await timeAction('Navigate to cart page', async () => {
                await inventoryPage.goToCart();
            }, 'Continue Shopping Test');

            await timeAction('Verify cart page loaded', async () => {
                await cartPage.isLoaded();
            }, 'Continue Shopping Test');

            // Act
            await timeAction('Click continue shopping button', async () => {
                await cartPage.continueShopping();
            }, 'Continue Shopping Test');

            // Assert
            await timeAction('Verify returned to inventory page', async () => {
                await inventoryPage.isLoaded();
            }, 'Continue Shopping Test');
            
            logToFile('🔄 Successfully navigated back to inventory page', 'INFO');
            
            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Continue shopping navigation test passed successfully', 'SUMMARY');
            
        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Continue shopping navigation test - ${error.message}`, 'ERROR');
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
            `Cart Add: ${testStats.cartAddTests}, Cart Remove: ${testStats.cartRemoveTests}, ` +
            `Multi-Item: ${testStats.multiItemTests}, Navigation: ${testStats.navigationTests}, ` +
            `Duration: ${duration}ms\n`
        );
    });
});