# 🧪 SauceDemo E2E Testing with Playwright

A comprehensive end-to-end testing suite for [SauceDemo](https://www.saucedemo.com/) using **Playwright** framework. This project implements robust test automation with Page Object Model pattern, detailed logging, and comprehensive coverage of core e-commerce functionality.

---

## 🎯 Project Overview

This test automation framework covers critical user journeys on SauceDemo including:
- **Authentication** - Login/logout functionality
- **Shopping Cart** - Add/remove items, cart management
- **Checkout Process** - Complete purchase flow
- **Product Sorting** - Various sorting mechanisms
- **Cross-browser Testing** - Chrome, Firefox, Safari support

---

## 📂 Project Structure

```
project-root/
├── .github/                          # GitHub Actions workflows
│   └── workflows/
│       └── playwright.yml           # CI/CD pipeline configuration
├── node_modules/                     # Node.js dependencies
├── pages/                            # Page Object Models
│   ├── CartPage.ts                  # Shopping cart page interactions
│   ├── CheckoutPage.ts              # Checkout process automation  
│   ├── InventoryPage.ts             # Product inventory page
│   └── LoginPage.ts                 # Login/authentication page
├── playwright-report/               # Playwright test reports (auto-generated)
├── test-logs/                        # Custom test logs and results
│   ├── cart_feature/                # Cart-specific test logs
│   ├── checkout_feature/            # Checkout process logs
│   ├── login_feature/               # Authentication logs
│   ├── sort_feature/                # Sorting functionality logs
│   ├── sort_file/                   # Additional sorting logs
│   └── all_tests_summary.log       # Comprehensive test summary
├── tests/                            # Test specifications
│   ├── cart.spec.ts                 # Shopping cart test cases
│   ├── checkout.spec.ts             # Checkout process tests
│   ├── fixtures.ts                  # Test fixtures and utilities
│   ├── login.spec.ts                # Authentication test cases
│   └── sort.spec.ts                 # Product sorting tests
├── e2e/                             # Legacy/additional E2E tests
│   └── saucedemo.cart-flow.spec.ts # Original cart flow test
├── tests-examples/                  # Playwright example tests
│   └── demo-todo-app.spec.ts       # Official Playwright examples
├── .env                              # Environment variables (not in repo)
├── .gitignore                        # Git ignored files configuration
├── package.json                      # Project dependencies and scripts
├── package-lock.json                 # Dependency versions lock file
├── playwright.config.ts              # Playwright configuration
└── README.md                         # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/saucedemo-playwright-tests.git
   cd saucedemo-playwright-tests
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Install Playwright browsers**
   ```bash
   npx playwright install --with-deps
   ```

---

## ⚙️ Configuration


### Playwright Configuration

The `playwright.config.ts` file includes:
- **Multi-browser support** (Chromium, Firefox, WebKit)
- **Parallel test execution**
- **Automatic retries** on CI environments
- **HTML reporting** with screenshots and traces
- **Custom test directory** structure

---

## 🔬 Test Suites

### Authentication Tests (`tests/login.spec.ts`)
- Valid user login flows
- Invalid credential handling
- Locked user scenarios
- Session management
- Logout functionality

### Shopping Cart Tests (`tests/cart.spec.ts`)
- Add single/multiple items to cart
- Remove items from cart
- Cart quantity management
- Cart persistence across sessions
- Empty cart scenarios

### Checkout Process Tests (`tests/checkout.spec.ts`)
- Complete purchase flow
- Form validation testing
- Payment information handling
- Order confirmation
- Error handling scenarios

### Product Sorting Tests (`tests/sort.spec.ts`)
- Name sorting (A-Z, Z-A)
- Price sorting (Low-High, High-Low)
- Sort persistence
- Multiple sort combinations

### Legacy Cart Flow (`e2e/saucedemo.cart-flow.spec.ts`)
- Original comprehensive cart workflow
- Product detail navigation
- End-to-end user journey

---

## 🎮 Running Tests

### Run all tests
```bash
npx playwright test
```

### Run specific test suite
```bash
npx playwright test login.spec.ts
npx playwright test cart.spec.ts
npx playwright test checkout.spec.ts
npx playwright test sort.spec.ts
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests in headed mode
```bash
npx playwright test --headed
```

### Run tests with debug mode
```bash
npx playwright test --debug
```

### Generate and view reports
```bash
npx playwright show-report
```

---

## 📊 Test Reporting & Logging

### Built-in Playwright Reports
- **HTML Report**: Comprehensive visual test results
- **Screenshots**: Automatic capture on failures
- **Video Recording**: Full test execution videos
- **Trace Files**: Detailed step-by-step debugging

### Custom Logging System
- **Feature-specific logs**: Organized by functionality
- **Detailed test summaries**: In `test-logs/all_tests_summary.log`
- **Error tracking**: Comprehensive failure analysis
- **Performance metrics**: Test execution timing

### Accessing Reports
```bash
# Open HTML report in browser
npx playwright show-report

# View specific log files
cat test-logs/all_tests_summary.log
cat test-logs/cart_feature/cart_tests.log
```

---

## 🏗️ Architecture

### Page Object Model (POM)
The project implements the Page Object Model pattern for maintainable and reusable code:

```typescript
// Example: LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}
  
  async login(username: string, password: string) {
    await this.page.fill('[data-test="username"]', username);
    await this.page.fill('[data-test="password"]', password);
    await this.page.click('[data-test="login-button"]');
  }
}
```

### Test Fixtures
Centralized test setup and teardown logic in `tests/fixtures.ts`:
- Pre-authenticated user sessions
- Test data management
- Common test utilities
- Browser context configuration

---

## 🔧 Development

### Code Quality
- **TypeScript**: Full type safety and IntelliSense
- **ESLint**: Code linting and formatting
- **Prettier**: Consistent code formatting

### Best Practices
- Page Object Model implementation
- Proper wait strategies and locators
- Environment-based configuration
- Comprehensive error handling
- Detailed test documentation

### Adding New Tests
1. Create test file in `tests/` directory
2. Implement corresponding Page Object if needed
3. Add test to appropriate test suite
4. Update documentation

---

## 🚀 CI/CD Integration

### GitHub Actions Workflow
The project includes a complete CI/CD pipeline (`.github/workflows/playwright.yml`):

- **Automated testing** on push/PR to main branches
- **Multi-browser execution** in parallel
- **Artifact preservation** (reports, screenshots, videos)
- **Failure notifications** and detailed reporting

### Pipeline Features
- Node.js environment setup
- Dependency caching
- Playwright browser installation
- Test execution with retries
- Report artifact upload (30-day retention)

---

## 🧪 Test Credentials

The following test accounts are available on SauceDemo:

| Username | Password | Description |
|----------|----------|-------------|
| `standard_user` | `secret_sauce` | Standard user with full access |
| `locked_out_user` | `secret_sauce` | Locked user for negative testing |
| `problem_user` | `secret_sauce` | User with UI/UX issues |
| `performance_glitch_user` | `secret_sauce` | Simulates slow performance |

---

## 📈 Performance & Scalability

### Optimization Features
- **Parallel test execution** across multiple workers
- **Browser context reuse** for faster execution
- **Selective test running** based on file changes
- **Efficient locator strategies** for stability

### Monitoring
- Test execution time tracking
- Failed test analysis and reporting
- Performance regression detection
- Resource usage monitoring

---

## 🐛 Troubleshooting

### Common Issues

**Tests failing intermittently**
```bash
# Increase timeout values
npx playwright test --timeout=60000
```

**Browser installation issues**
```bash
# Reinstall browsers
npx playwright install --force
```

**Port conflicts**
```bash
# Use different port in config
# Update playwright.config.ts webServer port
```

### Debug Mode
```bash
# Run with debug information
DEBUG=pw:api npx playwright test

# Open Playwright Inspector
npx playwright test --debug
```

---

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

### Contribution Guidelines
- Follow existing code style and patterns
- Add comprehensive tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [SauceDemo Application](https://www.saucedemo.com/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

---

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Abdullah Jamal Alharriem**
- GitHub: [@your-github-username](https://github.com/your-github-username)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- Playwright team for the excellent testing framework  
- SauceDemo for providing a reliable test application
- Open source community for inspiration and best practices
