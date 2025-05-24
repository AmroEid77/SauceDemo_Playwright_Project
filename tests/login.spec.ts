import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Configuration for this test file
const TEST_FILE_NAME = 'login_feature';
const TEST_DISPLAY_NAME = 'Login Feature Tests';

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
    logToFile(`🔐 Authentication Tests: ${stats.authTests}`, 'SUMMARY');
    logToFile(`🚫 Error Validation Tests: ${stats.errorTests}`, 'SUMMARY');
    logToFile('='.repeat(60), 'SUMMARY');
};

// Track test statistics
let testStats = {
    startTime: Date.now(),
    passed: 0,
    failed: 0,
    warnings: 0,
    slowOps: 0,
    authTests: 0,
    errorTests: 0
};

test.describe('Login Feature', () => {
    let loginPage: LoginPage;
    let inventoryPage: InventoryPage;

    test.beforeAll(async () => {
        logTestEnvironment();
        cleanupOldLogs();
        
        logToFile(`🚀 [BeforeAll] Starting ${TEST_DISPLAY_NAME} suite setup...`, 'SUMMARY');
        logToFile(`🔧 Environment configuration loaded`, 'INFO');
        logToFile(`✅ [BeforeAll] ${TEST_DISPLAY_NAME} suite setup completed`, 'SUMMARY');
    });

    test.beforeEach(async ({ page }) => {
        logToFile('🔄 [BeforeEach] Starting individual test setup...', 'INFO');
        
        await timeAction('Initialize page objects', async () => {
            loginPage = new LoginPage(page);
            inventoryPage = new InventoryPage(page);
        }, 'BeforeEach Setup');

        await timeAction('Navigate to login page', async () => {
            await loginPage.goto();
        }, 'BeforeEach Navigation');
        
        logToFile('✅ [BeforeEach] Individual test setup completed', 'INFO');
    });

    test('should login with standard user', async ({ page }) => {
        logToFile('🔐 TEST START: Standard user login functionality', 'SUMMARY');
        testStats.authTests++;

        try {
            // Arrange
            const username = process.env.STANDARD_USER || 'standard_user';
            const password = process.env.PASSWORD || 'secret_sauce';
            
            logToFile(`👤 Testing with username: ${username}`, 'INFO');
            logToFile(`🔑 Using password: ${password ? '[MASKED]' : '[EMPTY]'}`, 'INFO');

            // Act
            await timeAction('Perform login', async () => {
                await loginPage.login(username, password);
            }, 'Standard User Login');

            // Assert
            await timeAction('Verify successful login', async () => {
                await inventoryPage.isLoaded();
            }, 'Standard User Login');

            const currentUrl = page.url();
            logToFile(`🌐 Current page URL: ${currentUrl}`, 'INFO');
            
            const urlContainsInventory = currentUrl.includes('/inventory.html');
            logToFile(`🎯 URL validation: ${urlContainsInventory ? 'PASS' : 'FAIL'}`, 'INFO');
            
            expect(page.url()).toContain('/inventory.html');
            
            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Standard user login test passed successfully', 'SUMMARY');
            
        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Standard user login test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should show error with locked out user', async () => {
        logToFile('🚫 TEST START: Locked out user error validation', 'SUMMARY');
        testStats.errorTests++;

        try {
            // Arrange
            const username = process.env.LOCKED_OUT_USER || 'locked_out_user';
            const password = process.env.PASSWORD || 'secret_sauce';
            
            logToFile(`👤 Testing locked out user: ${username}`, 'INFO');
            logToFile(`🔑 Using password: ${password ? '[MASKED]' : '[EMPTY]'}`, 'INFO');

            // Act
            await timeAction('Attempt login with locked user', async () => {
                await loginPage.login(username, password);
            }, 'Locked User Test');

            // Assert
            const expectedErrorMessage = 'Sorry, this user has been locked out';
            logToFile(`🔍 Expected error message: "${expectedErrorMessage}"`, 'INFO');
            
            await timeAction('Verify error message displayed', async () => {
                await loginPage.verifyErrorMessage(expectedErrorMessage);
            }, 'Locked User Test');
            
            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Locked out user error validation passed successfully', 'SUMMARY');
            
        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Locked out user test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should show error with invalid credentials', async () => {
        logToFile('🚫 TEST START: Invalid credentials error validation', 'SUMMARY');
        testStats.errorTests++;

        try {
            // Arrange
            const username = 'invalid_user';
            const password = 'invalid_password';
            
            logToFile(`👤 Testing with invalid username: ${username}`, 'INFO');
            logToFile(`🔑 Testing with invalid password: [MASKED]`, 'INFO');

            // Act
            await timeAction('Attempt login with invalid credentials', async () => {
                await loginPage.login(username, password);
            }, 'Invalid Credentials Test');

            // Assert
            const expectedErrorMessage = 'Username and password do not match';
            logToFile(`🔍 Expected error message: "${expectedErrorMessage}"`, 'INFO');
            
            await timeAction('Verify invalid credentials error message', async () => {
                await loginPage.verifyErrorMessage(expectedErrorMessage);
            }, 'Invalid Credentials Test');
            
            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Invalid credentials error validation passed successfully', 'SUMMARY');
            
        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Invalid credentials test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should show error with empty username', async () => {
        logToFile('🚫 TEST START: Empty username validation', 'SUMMARY');
        testStats.errorTests++;

        try {
            // Arrange
            const username = '';
            const password = process.env.PASSWORD || 'secret_sauce';
            
            logToFile(`👤 Testing with empty username: "${username}"`, 'INFO');
            logToFile(`🔑 Using valid password: ${password ? '[MASKED]' : '[EMPTY]'}`, 'INFO');

            // Act
            await timeAction('Attempt login with empty username', async () => {
                await loginPage.login(username, password);
            }, 'Empty Username Test');

            // Assert
            const expectedErrorMessage = 'Username is required';
            logToFile(`🔍 Expected error message: "${expectedErrorMessage}"`, 'INFO');
            
            await timeAction('Verify empty username error message', async () => {
                await loginPage.verifyErrorMessage(expectedErrorMessage);
            }, 'Empty Username Test');
            
            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Empty username validation passed successfully', 'SUMMARY');
            
        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Empty username test - ${error.message}`, 'ERROR');
            throw error;
        }
    });

    test('should show error with empty password', async () => {
        logToFile('🚫 TEST START: Empty password validation', 'SUMMARY');
        testStats.errorTests++;

        try {
            // Arrange
            const username = process.env.STANDARD_USER || 'standard_user';
            const password = '';
            
            logToFile(`👤 Testing with valid username: ${username}`, 'INFO');
            logToFile(`🔑 Testing with empty password: "${password}"`, 'INFO');

            // Act
            await timeAction('Attempt login with empty password', async () => {
                await loginPage.login(username, password);
            }, 'Empty Password Test');

            // Assert
            const expectedErrorMessage = 'Password is required';
            logToFile(`🔍 Expected error message: "${expectedErrorMessage}"`, 'INFO');
            
            await timeAction('Verify empty password error message', async () => {
                await loginPage.verifyErrorMessage(expectedErrorMessage);
            }, 'Empty Password Test');
            
            testStats.passed++;
            logToFile('✅ TEST COMPLETED: Empty password validation passed successfully', 'SUMMARY');
            
        } catch (error) {
            testStats.failed++;
            logToFile(`❌ TEST FAILED: Empty password test - ${error.message}`, 'ERROR');
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
            `Auth Tests: ${testStats.authTests}, Error Tests: ${testStats.errorTests}, ` +
            `Duration: ${duration}ms\n`
        );
    });
});