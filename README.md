# SauceDemo Playwright Automation Framework

This project contains automated tests for [SauceDemo](https://www.saucedemo.com/) website using Playwright with TypeScript.

## Features Tested

1. **Login** - Test various login scenarios with different user types
2. **Cart** - Add/remove items from cart both from inventory and cart pages
3. **Checkout** - Complete checkout flow with validation checks
4. **Sort** - Verify product sorting functionality (A-Z, Z-A, price high-low, price low-high)

## Project Structure

```
 sauce-demo-tests/
├── .env                    # Environment variables (credentials)
├── package.json            # Project configuration and dependencies
├── playwright.config.ts    # Playwright configuration
├── tsconfig.json           # TypeScript configuration
├── tests/                  # Test files organized by feature
│   ├── login.spec.ts       # Login feature tests
│   ├── cart.spec.ts        # Cart feature tests
│   ├── checkout.spec.ts    # Checkout feature tests
│   └── sort.spec.ts        # Sort feature tests
└── pages/                  # Page Object Model files
    ├── LoginPage.ts        # Login page interactions
    ├── InventoryPage.ts    # Inventory page interactions
    ├── CartPage.ts         # Cart page interactions
    └── CheckoutPage.ts     # Checkout page interactions
```

## Prerequisites

* Node.js (v14 or higher)
* npm or yarn

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sauce-demo-tests.git
   cd sauce-demo-tests
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install Playwright browsers:
   ```bash
   npx playwright install
   ```
4. Configure environment variables:
   * The `.env` file already contains necessary credentials for testing
   * You can modify values if needed

## Running Tests

### Run all tests on all configured browsers:

```bash
npm test
```

### Run tests on a specific browser:

```bash
npm run test:chrome
# or
npm run test:firefox
```

### Run specific test file:

```bash
npx playwright test tests/login.spec.ts
```

### Run tests in debug mode:

```bash
npx playwright test --debug
```

### View HTML test report:

```bash
npm run report
```

## Implementation Details

### Page Object Model

The framework implements the Page Object Model (POM) design pattern to:

* Separate test logic from page interactions
* Improve maintainability
* Make tests more readable

### Key Playwright Features Used

1. **Parameterized Tests** : Environment variables from `.env` file
2. **Hooks** : `beforeEach` for setup and login
3. **Multi-browser Testing** : Tests run on Chrome and Firefox
4. **Page Object Model** : Separation of concerns
5. **Locators** : Data-test attributes for stable element selection
6. **Assertions** : Expectations for verification
7. **Screenshots & Videos** : On test failures
8. **Reporting** : HTML report generation

## Notes

* Tests are designed to be independent and can run in parallel
* Login is performed before each test to ensure a clean state
* Error handling is implemented for better stability
* The framework follows best practices for Playwright automation

## Future Improvements

* Add CI/CD pipeline integration
* Implement data-driven testing for more scenarios
* Add visual testing capabilities
* Extend test coverage for additional features
