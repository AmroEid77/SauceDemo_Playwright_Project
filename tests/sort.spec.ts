import { test, expect } from './fixtures';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Configuration for this test file
const TEST_FILE_NAME = 'sort_feature';  // Change this for each test file
const TEST_DISPLAY_NAME = 'Sort Feature Tests';

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
    logToFile('='.repeat(60), 'SUMMARY');
};

// Track test statistics
let testStats = {
    startTime: Date.now(),
    passed: 0,
    failed: 0,
    warnings: 0,
    slowOps: 0
};

test.describe('Sort Feature', () => {

    test.beforeAll(async ({ authenticatedPage }) => {
        logTestEnvironment();
        cleanupOldLogs();
        
        logToFile(`🚀 [BeforeAll] Starting ${TEST_DISPLAY_NAME} suite setup...`, 'SUMMARY');
        
        await timeAction('Page load state wait', async () => {
            await authenticatedPage.waitForLoadState('networkidle', { timeout: 15000 });
        }, 'BeforeAll Setup');
        
        logToFile(`✅ [BeforeAll] ${TEST_DISPLAY_NAME} suite setup completed`, 'SUMMARY');
    });

    test.beforeEach(async ({ inventoryPage, authenticatedPage }) => {
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
        
        logToFile('✅ [BeforeEach] Individual test setup completed', 'INFO');
    });

    test('should sort products from A to Z', async ({ inventoryPage }) => {
        logToFile('🔤 TEST START: A to Z sort functionality', 'SUMMARY');

        try {
            // Get initial state
            const initialProducts = await timeAction('Get initial product list', async () => {
                return await inventoryPage.getProductNames();
            }, 'A-Z Test');
            
            logToFile(`📋 Initial products found: ${initialProducts.length}`, 'INFO');
            logToFile(`📋 Initial product list: [${initialProducts.join(', ')}]`, 'INFO');

            // Apply sort
            await timeAction('Apply A-Z sort', async () => {
                await inventoryPage.sortBy('az');
                await inventoryPage.page.waitForTimeout(2000);
            }, 'A-Z Test');

            // Verify DOM updated
            await timeAction('Wait for sort to apply', async () => {
                await inventoryPage.page.waitForFunction(() => {
                    const products = Array.from(document.querySelectorAll('.inventory_item_name'));
                    return products.length > 0;
                }, { timeout: 5000 });
            }, 'A-Z Test');

            // Get sorted results
            const productNames = await timeAction('Get sorted product names', async () => {
                return await inventoryPage.getProductNames();
            }, 'A-Z Test');
            
            logToFile(`📊 Products after A-Z sort: [${productNames.join(', ')}]`, 'INFO');

            // Verify sort order
            const sortedNames = [...productNames].sort();
            logToFile(`🔍 Expected A-Z order: [${sortedNames.join(', ')}]`, 'INFO');

            const isCorrectOrder = JSON.stringify(productNames) === JSON.stringify(sortedNames);
            logToFile(`🎯 A-Z Sort Result: ${isCorrectOrder ? 'PASS' : 'FAIL'}`, 'SUMMARY');

            expect(productNames).toEqual(sortedNames);
            
            testStats.passed++;
            logToFile('✅ TEST COMPLETED: A-Z sort test passed successfully', 'SUMMARY');
            
        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: A-Z sort test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should sort products from Z to A', async ({ inventoryPage }) => {
        logToFile('🔤 TEST START: Z to A sort functionality', 'SUMMARY');

        try {
            const initialProducts = await timeAction('Get initial product list', async () => {
                return await inventoryPage.getProductNames();
            }, 'Z-A Test');
            
            logToFile(`📋 Initial products found: ${initialProducts.length}`, 'INFO');
            logToFile(`📋 Initial product list: [${initialProducts.join(', ')}]`, 'INFO');

            await timeAction('Apply Z-A sort', async () => {
                await inventoryPage.sortBy('za');
                await inventoryPage.page.waitForTimeout(2000);
            }, 'Z-A Test');

            await timeAction('Wait for sort to apply', async () => {
                await inventoryPage.page.waitForFunction(() => {
                    const products = Array.from(document.querySelectorAll('.inventory_item_name'));
                    return products.length > 0;
                }, { timeout: 5000 });
            }, 'Z-A Test');

            const productNames = await timeAction('Get sorted product names', async () => {
                return await inventoryPage.getProductNames();
            }, 'Z-A Test');
            
            logToFile(`📊 Products after Z-A sort: [${productNames.join(', ')}]`, 'INFO');

            const sortedNames = [...productNames].sort().reverse();
            logToFile(`🔍 Expected Z-A order: [${sortedNames.join(', ')}]`, 'INFO');

            const isCorrectOrder = JSON.stringify(productNames) === JSON.stringify(sortedNames);
            logToFile(`🎯 Z-A Sort Result: ${isCorrectOrder ? 'PASS' : 'FAIL'}`, 'SUMMARY');

            expect(productNames).toEqual(sortedNames);
            
            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Z-A sort test passed successfully', 'SUMMARY');
            
        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Z-A sort test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should sort products by price low to high', async ({ inventoryPage }) => {
        logToFile('💰 TEST START: Price low to high sort functionality', 'SUMMARY');

        try {
            const initialPrices = await timeAction('Get initial prices', async () => {
                return await inventoryPage.getProductPrices();
            }, 'Price Low-High Test');
            
            logToFile(`💲 Initial prices found: ${initialPrices.length}`, 'INFO');
            logToFile(`💲 Initial price range: $${Math.min(...initialPrices)} - $${Math.max(...initialPrices)}`, 'INFO');
            logToFile(`💲 Initial prices: [$${initialPrices.join(', $')}]`, 'INFO');

            await timeAction('Apply low-to-high price sort', async () => {
                await inventoryPage.sortBy('lohi');
                await inventoryPage.page.waitForTimeout(2000);
            }, 'Price Low-High Test');

            await timeAction('Wait for price sort to apply', async () => {
                await inventoryPage.page.waitForFunction(() => {
                    const prices = Array.from(document.querySelectorAll('.inventory_item_price'));
                    return prices.length > 0;
                }, { timeout: 5000 });
            }, 'Price Low-High Test');

            const prices = await timeAction('Get sorted prices', async () => {
                return await inventoryPage.getProductPrices();
            }, 'Price Low-High Test');
            
            logToFile(`📊 Prices after low-high sort: [$${prices.join(', $')}]`, 'INFO');
            logToFile(`💲 Sorted price range: $${Math.min(...prices)} - $${Math.max(...prices)}`, 'INFO');

            let orderCorrect = true;
            await timeAction('Verify price order', async () => {
                for (let i = 1; i < prices.length; i++) {
                    const comparison = `$${prices[i-1]} <= $${prices[i]}`;
                    const isValid = prices[i] >= prices[i - 1];
                    logToFile(`🔍 Price comparison ${i}: ${comparison} = ${isValid}`, 'INFO');
                    
                    if (!isValid) {
                        orderCorrect = false;
                        logToFile(`❌ Price order violation at index ${i}: ${comparison}`, 'ERROR');
                    }
                    expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
                }
            }, 'Price Low-High Test');
            
            logToFile(`🎯 Price Low-High Sort Result: ${orderCorrect ? 'PASS' : 'FAIL'}`, 'SUMMARY');
            
            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Low-to-high price sort test passed successfully', 'SUMMARY');
            
        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Low-to-high price sort test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should sort products by price high to low', async ({ inventoryPage }) => {
        logToFile('💰 TEST START: Price high to low sort functionality', 'SUMMARY');

        try {
            const initialPrices = await timeAction('Get initial prices', async () => {
                return await inventoryPage.getProductPrices();
            }, 'Price High-Low Test');
            
            logToFile(`💲 Initial prices found: ${initialPrices.length}`, 'INFO');
            logToFile(`💲 Initial price range: $${Math.max(...initialPrices)} - $${Math.min(...initialPrices)}`, 'INFO');
            logToFile(`💲 Initial prices: [$${initialPrices.join(', $')}]`, 'INFO');

            await timeAction('Apply high-to-low price sort', async () => {
                await inventoryPage.sortBy('hilo');
                await inventoryPage.page.waitForTimeout(2000);
            }, 'Price High-Low Test');

            await timeAction('Wait for price sort to apply', async () => {
                await inventoryPage.page.waitForFunction(() => {
                    const prices = Array.from(document.querySelectorAll('.inventory_item_price'));
                    return prices.length > 0;
                }, { timeout: 5000 });
            }, 'Price High-Low Test');

            const prices = await timeAction('Get sorted prices', async () => {
                return await inventoryPage.getProductPrices();
            }, 'Price High-Low Test');
            
            logToFile(`📊 Prices after high-low sort: [$${prices.join(', $')}]`, 'INFO');
            logToFile(`💲 Sorted price range: $${Math.max(...prices)} - $${Math.min(...prices)}`, 'INFO');

            let orderCorrect = true;
            await timeAction('Verify price order', async () => {
                for (let i = 1; i < prices.length; i++) {
                    const comparison = `$${prices[i-1]} >= $${prices[i]}`;
                    const isValid = prices[i] <= prices[i - 1];
                    logToFile(`🔍 Price comparison ${i}: ${comparison} = ${isValid}`, 'INFO');
                    
                    if (!isValid) {
                        orderCorrect = false;
                        logToFile(`❌ Price order violation at index ${i}: ${comparison}`, 'ERROR');
                    }
                    expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
                }
            }, 'Price High-Low Test');
            
            logToFile(`🎯 Price High-Low Sort Result: ${orderCorrect ? 'PASS' : 'FAIL'}`, 'SUMMARY');
            
            testStats.passed++;
            logToFile('✅ TEST COMPLETED: High-to-low price sort test passed successfully', 'SUMMARY');
            
        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: High-to-low price sort test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test.afterAll(async () => {
        // Calculate final statistics
        const duration = Date.now() - testStats.startTime;
        logTestStatistics({ ...testStats, duration });
        
        logTestStatistics(testStats);
        
        logToFile('🏁 TEST SUITE COMPLETED', 'CRITICAL');
        logToFile(`📁 Detailed logs saved to: ${logFilePath}`, 'SUMMARY');
        logToFile(`📋 Test file summary: ${summaryLogPath}`, 'SUMMARY');
        logToFile(`📊 Master summary: ${masterSummaryPath}`, 'SUMMARY');
        
        // Final summary to master log
        fs.appendFileSync(masterSummaryPath, 
            `[${new Date().toISOString()}] [${TEST_FILE_NAME}] COMPLETED - ` +
            `Passed: ${testStats.passed}, Failed: ${testStats.failed}, Duration: ${Date.now() - testStats.startTime}ms\n`
        );
    });
});