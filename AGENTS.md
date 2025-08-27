# Code Assistant Context

## Project Overview

This is the repository for **Site Kit by Google**, a WordPress plugin that provides a one-stop solution for WordPress users to use Google's services to improve their sites.

The project is a combination of a PHP backend and a JavaScript frontend. The PHP code is located in the `includes` directory, and the JavaScript code is in the `assets/js` directory. The project uses `npm` to manage JavaScript dependencies and `composer` to manage PHP dependencies.

## Architecture

### High-Level Architecture

The plugin follows a modular architecture with clear separation between PHP backend and JavaScript frontend:

- **PHP Backend**: Handles WordPress integration, Google API communication, data persistence, authentication, and server-side logic
- **JavaScript Frontend**: React-based SPA for admin interfaces, data visualization, and user interactions
- **Modular System**: Each Google service (Analytics, AdSense, Search Console, etc.) is implemented as a separate module

### Core Entry Points

- **Main Plugin File**: `google-site-kit.php` - Plugin header, activation/deactivation hooks, and bootstrap
- **PHP Bootstrap**: `includes/loader.php` - Autoloader setup and plugin initialization
- **Main Plugin Class**: `includes/Plugin.php` - Central plugin registration and service setup
- **Context Class**: `includes/Context.php` - Plugin context and environment information

### PHP Architecture

#### Core Structure
- **`includes/Core/`** - Core functionality classes
  - `Admin/` - WordPress admin integration
  - `Authentication/` - Google OAuth and authentication
  - `Assets/` - Asset management (JS/CSS)
  - `Modules/` - Module system base classes
  - `Storage/` - Data persistence (Options, User Options, Transients)
  - `REST_API/` - REST API endpoints
  - `Tags/` - Google tag management
  - `Util/` - Utility classes and helpers

#### Module System
- **Base Class**: `includes/Core/Modules/Module.php` - Abstract base for all modules
- **Module Traits**: Various traits for common functionality
  - `Module_With_Assets_Trait` - Asset management
  - `Module_With_Settings_Trait` - Settings handling
  - `Module_With_Scopes_Trait` - Google API scopes
  - `Module_With_Tag_Trait` - Tag output management
- **Concrete Modules**: `includes/Modules/` - Individual service implementations
  - `Analytics_4.php`, `AdSense.php`, `Search_Console.php`, etc.

### JavaScript Architecture

#### Build System
- **Webpack-based**: Multiple entry points for different contexts
- **Main Configs**: `assets/webpack.config.js` and `assets/webpack/` directory
- **Bundle Types**:
  - Admin dashboard bundles
  - Settings page bundles
  - Widget bundles
  - Gutenberg block bundles
  - Test bundles

#### Data Management
- **WordPress Data Store**: Built on `@wordpress/data` package
- **Registry**: `assets/js/googlesitekit/data/index.js` - Central data registry
- **Module Datastores**: Each module has its own datastore in `assets/js/modules/{module}/datastore/`
- **Common Patterns**: Actions, selectors, reducers, and controls

#### Component Structure
- **Core Components**: `assets/js/components/` - Shared UI components
- **Module Components**: `assets/js/modules/{module}/components/` - Module-specific UI
- **Widget System**: Modular widget architecture for dashboards
- **Hook System**: Custom hooks for common patterns

### File Organization

#### Key Directories
- **`includes/`** - All PHP code (PSR-4 autoloaded as `Google\Site_Kit\`)
- **`assets/js/`** - All JavaScript code
- **`assets/sass/`** - SCSS stylesheets
- **`assets/svg/`** - SVG assets (icons and graphics)
- **`tests/`** - All test files (PHP, JS, E2E)
- **`docs/`** - Documentation
- **`bin/`** - Build and utility scripts
- **`webpack/`** - Webpack configuration files
- **`third-party/`** - Scoped vendor dependencies
- **`dist/`** - Build output (generated)

#### Module File Structure
Each module follows a consistent structure:
```
includes/Modules/ModuleName.php           # Main module class
includes/Modules/ModuleName/              # Module-specific classes
assets/js/modules/modulename/             # JS module code
  ├── components/                         # React components
  ├── datastore/                          # Data store logic
  ├── utils/                              # Utility functions
  └── constants.js                        # Module constants
```

## Building and Running

### NPM Scripts (JavaScript/Assets)

The project uses `npm` workspaces and has scripts for different build scenarios:

#### Primary Build Commands
- **`npm run build`** - Production build of all JavaScript assets
- **`npm run build:dev`** - Development build (faster, includes source maps)
- **`npm run build:production`** - Production build with optimizations
- **`npm run build:test`** - Build test bundles
- **`npm run watch`** - Watch mode for development (auto-rebuild on changes)
- **`npm run dev`** - Alias for `npm run build:dev`

#### Testing Commands
- **`npm run test`** - Run JavaScript tests (Jest)
- **`npm run test:js`** - Run Jest tests once
- **`npm run test:js:watch`** - Run Jest tests in watch mode
- **`npm run test:e2e`** - Run end-to-end tests (Playwright)
- **`npm run test:visualtest`** - Run visual regression tests (Backstop.js)
- **`npm run test:storybook`** - Run Storybook tests

#### Linting and Quality
- **`npm run lint`** - Lint both JavaScript and CSS
- **`npm run lint:js`** - Lint JavaScript files (ESLint)
- **`npm run lint:js-fix`** - Auto-fix JavaScript linting issues
- **`npm run lint:css`** - Lint SCSS files (Stylelint)
- **`npm run lint:css-fix`** - Auto-fix CSS linting issues

#### Storybook
- **`npm run storybook`** - Start Storybook development server
- **`npm run build:storybook`** - Build Storybook for production

#### Release
- **`npm run zip`** - Create production plugin ZIP file
- **`npm run dev-zip`** - Create development plugin ZIP file

### Composer Scripts (PHP)

#### Primary PHP Commands
- **`composer run lint`** - Run PHP CodeSniffer (PHPCS)
- **`composer run lint-fix`** - Auto-fix PHP code style issues (PHPCBF)
- **`composer run test`** - Run PHPUnit tests
- **`composer run test:multisite`** - Run PHPUnit tests in multisite mode

#### Dependency Management
- **`composer run autoload-includes`** - Generate class maps for includes directory
- **`composer run prefix-dependencies`** - Scope third-party dependencies (avoid conflicts)

### Local Development Setup

1. **WordPress Environment**: Requires WordPress 5.2+ and PHP 7.4+
2. **Install Dependencies**:
   ```bash
   npm install
   composer install
   ```
3. **Build Assets**: `npm run build:dev`
4. **Install Plugin**: Copy repository to `wp-content/plugins/` directory
5. **Development Workflow**: Use `npm run watch` for auto-rebuilding during development

## Development Conventions

### PHP Coding Standards

#### Standards Compliance
- **WordPress Coding Standards**: Extends WordPress-Extra and WordPress-Docs rulesets
- **WordPress VIP Standards**: Includes selected VIPMinimum rules for performance and security
- **PSR-4 Autoloading**: All classes use `Google\Site_Kit\` namespace
- **Custom Standards**: Site Kit specific rules via custom PHPCS standards

#### Configuration Files
- **`phpcs.xml`** - Main PHP CodeSniffer configuration
- **Text Domain**: `google-site-kit` (enforced via PHPCS)
- **PHP Compatibility**: PHP 7.4+ compatibility checking
- **Complexity Limit**: Max cyclomatic complexity of 20

#### Key PHP Conventions
- **Namespace**: All classes use `Google\Site_Kit\` namespace
- **Class Names**: PascalCase with descriptive names
- **File Naming**: Match class names exactly (PSR-4)
- **Method Naming**: snake_case following WordPress conventions
- **Documentation**: Full PHPDoc blocks required for all classes and methods
- **Type Hints**: Use PHP type hints where possible
- **Error Handling**: Use WP_Error objects for error handling

### JavaScript Coding Standards

#### Linting Configuration
- **ESLint Config**: `.eslintrc.json` with WordPress and custom rules
- **Extends**: WordPress ESLint plugin, Jest, React Hooks, Import rules
- **Prettier**: `.prettierrc.js` using WordPress Prettier config
- **Custom Rules**: Site Kit specific ESLint rules via custom plugin

#### Key JavaScript Conventions
- **Function Components**: Prefer function declarations for named components
- **Hooks**: Follow React Hooks rules strictly
- **Imports**: Use member imports for Lodash (`lodash/import-scope`)
- **Complexity**: Max complexity of 15
- **JSDoc**: Required for all functions and components
- **Quotes**: Single quotes preferred
- **Text Domain**: Only 'google-site-kit' text domain allowed
- **Global Usage**: Use `global` instead of `window`

#### File Naming Conventions
- **Components**: PascalCase matching exported component name (enforced in component directories)
- **Utilities**: camelCase for utility functions
- **Constants**: UPPER_SNAKE_CASE
- **Test Files**: `*.test.js` suffix
- **Story Files**: `*.stories.js` suffix

#### Module Naming Conventions
- **Module Directories**: lowercase with hyphens (e.g., `analytics-4`)
- **Component Directories**: Organized by purpose (`components/dashboard/`, `components/settings/`)
- **Datastore Files**: Specific naming pattern (`base.js`, `settings.js`, `service.js`)

### Code Organization Principles

#### Module Structure
Each module follows consistent patterns:
```
ModuleName/
├── Settings.php                    # Settings management
├── Web_Tag.php                     # Frontend tag output
├── AMP_Tag.php                     # AMP tag output (if applicable)
├── Tag_Guard.php                   # Tag output conditions
└── Tag_Matchers.php                # Tag matching logic
```

#### React Component Organization
```
components/
├── dashboard/                      # Dashboard-specific components
├── settings/                       # Settings page components
├── setup/                          # Setup flow components
├── common/                         # Shared components
└── widgets/                        # Widget components
```

#### Data Store Organization
```
datastore/
├── index.js                       # Store registration and exports
├── base.js                        # Base module data and info
├── settings.js                    # Settings management
├── service.js                     # API service calls
├── {feature}.js                   # Feature-specific stores
└── constants.js                   # Store constants
```

### Testing

The project has a comprehensive test suite with multiple types of testing at different levels.

#### PHP Testing (PHPUnit)

**Configuration**:
- **Main Config**: `phpunit.xml.dist`
- **Multisite Config**: `phpunit.multisite.xml`
- **Base Test Case**: `tests/phpunit/includes/TestCase.php`
- **WordPress Test Suite**: Uses WP PHPUnit framework

**Test Organization**:
- **Location**: `tests/phpunit/`
- **Structure**: Mirrors `includes/` directory structure
- **Namespace**: `Google\Site_Kit\Tests\`

**Key Testing Utilities**:
- **Fake Site Kit Class**: For testing plugin integration
- **Mock Services**: Google API service mocking
- **Authentication Mocks**: OAuth and authentication testing utilities
- **Database Helpers**: WordPress database state management

**Commands**:
- `composer run test` - Run all PHP tests
- `composer run test:multisite` - Run multisite-specific tests

#### JavaScript Testing (Jest)

**Configuration**:
- **Main Config**: `tests/js/jest.config.js`
- **Preset**: `@wordpress/jest-preset-default`
- **Setup Files**: Global setup and custom matchers
- **Test Environment**: jsdom for DOM testing

**Test Organization**:
- **Location**: `tests/js/` and `assets/**/*.test.js`
- **Structure**: Co-located with source files or in `tests/js/`
- **Fixtures**: `assets/js/modules/{module}/datastore/__fixtures__/`
- **Factories**: `assets/js/modules/{module}/datastore/__factories__/`

**Testing Libraries**:
- **React Testing Library**: `@testing-library/react` for component testing
- **Jest**: Unit testing framework
- **Custom Matchers**: Site Kit specific test assertions
- **Mock Utils**: Extensive mocking utilities for WordPress and Google APIs

**Key Test Utilities**:
- **`tests/js/test-utils.js`**: Core testing utilities
- **Registry Setup**: WordPress data store testing setup
- **Mock Browser Utils**: Browser API mocking
- **Component Utils**: React component testing helpers
- **Viewport Utils**: Responsive testing utilities

**Commands**:
- `npm run test:js` - Run Jest tests once
- `npm run test:js:watch` - Run Jest tests in watch mode
- `npm run test` - Run Jest tests with coverage

#### End-to-End Testing (Playwright)

**Configuration**:
- **Location**: `tests/e2e/`
- **Framework**: Playwright for browser automation
- **Environment**: Docker-based WordPress setup

**Test Structure**:
- **Specs**: Test specifications for user workflows
- **Utilities**: Helper functions for common actions
- **Setup**: WordPress and plugin setup utilities

**Commands**:
- `npm run test:e2e` - Run E2E tests
- `npm run test:e2e:interactive` - Run E2E tests with browser UI
- `npm run env:start` - Start test environment
- `npm run env:stop` - Stop test environment

#### Visual Regression Testing (Backstop.js)

**Configuration**:
- **Location**: `tests/backstop/`
- **Framework**: Backstop.js for visual testing
- **Storybook Integration**: Tests Storybook stories for visual consistency

**Commands**:
- `npm run test:visualtest` - Run visual regression tests
- `npm run test:visualapprove` - Approve visual changes

#### Storybook Testing

**Purpose**: Component development and testing in isolation
**Location**: Component `.stories.js` files throughout codebase
**Commands**:
- `npm run storybook` - Start Storybook development server
- `npm run test:storybook` - Run Storybook tests

#### Testing Best Practices

**PHP Testing**:
- Use dependency injection for testable code
- Mock external services (Google APIs)
- Test both success and error conditions
- Include multisite testing where applicable
- Use WordPress testing conventions

**JavaScript Testing**:
- Test components in isolation
- Mock data store dependencies
- Test user interactions with React Testing Library
- Test both loading and error states
- Use factories for consistent test data
- Mock browser APIs consistently

**Test Data Management**:
- **Fixtures**: Static test data in JSON files
- **Factories**: Dynamic test data generation
- **Mocks**: Service and API response mocking
- **Clean State**: Proper test isolation and cleanup

## Key Configuration Files

### Build and Asset Configuration
- **`assets/webpack.config.js`** - Main Webpack configuration
- **`assets/webpack/`** - Specific Webpack configs for different build targets
- **`webpack/common.js`** - Shared Webpack utilities
- **`tsconfig.json`** - TypeScript configuration for IDE support

### Code Quality Configuration
- **`.eslintrc.json`** - ESLint configuration with WordPress and custom rules
- **`.prettierrc.js`** - Prettier configuration extending WordPress standards
- **`phpcs.xml`** - PHP CodeSniffer configuration with WordPress and VIP rules

### Package Management
- **`package.json`** - NPM dependencies and scripts (uses workspaces)
- **`composer.json`** - PHP dependencies and scripts
- **`package-lock.json`** - Locked NPM dependency versions
- **`composer.lock`** - Locked Composer dependency versions

### Testing Configuration
- **`tests/js/jest.config.js`** - Jest configuration for JavaScript tests
- **`phpunit.xml.dist`** - PHPUnit configuration for PHP tests
- **`phpunit.multisite.xml`** - Multisite-specific PHPUnit configuration

### WordPress Integration
- **`google-site-kit.php`** - Main plugin file with WordPress headers
- **`includes/loader.php`** - Plugin bootstrap and autoloader setup
- **`uninstall.php`** - Plugin uninstall cleanup logic

## Feature Management

### Feature Flags
- **Location**: `feature-flags.json` - Master list of feature flags
- **Current Flags**: adsPax, googleTagGateway, gtagUserData, privacySandboxModule, proactiveUserEngagement, setupFlowRefresh
- **Usage**: PHP via `Feature_Flags` class, JS via feature detection utilities
- **Purpose**: Gradual feature rollout and A/B testing capabilities

### Remote Features
- **System**: Remote feature flag management via Google services
- **Configuration**: Server-controlled feature activation
- **Fallback**: Local feature-flags.json used as fallback
- **Implementation**: `includes/Core/Remote_Features/` directory

## Development Workflows

### Git Workflow
- **Main Branches**: `develop` (integration), `main` (release)
- **Feature Branches**: Branch from and merge to `develop`
- **Release Process**: Merge `develop` to `main` for releases
- **Commit Messages**: Enforced format via git hooks

### Git Hooks (Husky Configuration)
- **Pre-commit**: Runs lint-staged for code quality
- **Prepare-commit-msg**: Formats commit messages
- **Commit-msg**: Validates commit message format
- **Pre-push**: Protects important branches

### Lint-staged Configuration
- **JavaScript**: ESLint with staged config
- **SCSS**: Stylelint for style files
- **PHP**: PHPCS for PHP files

### Release Process
1. **Version Bump**: Update version in plugin file and package.json
2. **Build Assets**: `npm run build` for production assets
3. **Run Tests**: Full test suite execution
4. **Create ZIP**: `npm run release-zip` for distribution
5. **Git Tag**: Tag release version
6. **Distribution**: WordPress.org SVN deployment

## Module Development Guidelines

### Creating New Modules

#### PHP Module Structure
1. **Extend Base Class**: `extends Core\Modules\Module`
2. **Implement Required Methods**:
   - `register()` - Register module with WordPress
   - `get_data()` - Return module configuration data
   - `get_datapoints()` - Define available data endpoints
3. **Use Appropriate Traits**: Add functionality via module traits
4. **Settings Management**: Extend settings classes if needed
5. **Service Integration**: Implement Google API service classes

#### JavaScript Module Structure
1. **Datastore**: Create complete data store with actions, selectors, reducers
2. **Components**: Organize components by purpose (dashboard, settings, setup)
3. **Constants**: Define module-specific constants
4. **Utilities**: Create utility functions for module logic
5. **Tests**: Comprehensive test coverage for all functionality

### Module Integration Points
- **Registration**: Module registry in `includes/Core/Modules/Modules.php`
- **Assets**: Asset registration via module traits
- **REST API**: Datapoint registration for API endpoints
- **Frontend Tags**: Tag output system for Google service integration
- **Settings**: Integration with WordPress settings API
- **Widgets**: Dashboard widget system integration

## Asset Management

### Build System Architecture
- **Multi-entry**: Separate bundles for different contexts (admin, dashboard, widgets)
- **Code Splitting**: Automatic code splitting for optimal loading
- **Webpack Optimizations**: Tree shaking, minification, compression
- **Source Maps**: Development builds include source maps
- **Asset Manifests**: Generated manifests for WordPress asset enqueuing

### SCSS Architecture
- **Base Styles**: `assets/sass/base/` - Core styling foundations
- **Components**: `assets/sass/components/` - Reusable component styles
- **Utilities**: `assets/sass/utilities/` - Utility classes
- **Variables**: Material UI 3 design system variables
- **Mixins**: Reusable SCSS mixins for common patterns

### JavaScript Module System
- **Custom Modules**: Internal module system for Site Kit JavaScript packages
- **Aliases**: Webpack aliases for clean imports (`@/` for assets root)
- **WordPress Integration**: Deep integration with WordPress data package
- **Tree Shaking**: Optimized imports for smaller bundle sizes

## Important Development Notes

### WordPress Compatibility
- **Minimum WordPress**: 5.2+
- **Minimum PHP**: 7.4+
- **Multisite**: Limited support (network mode notice)
- **WordPress Hooks**: Extensive use of WordPress filter/action system

### Google API Integration
- **Authentication**: OAuth 2.0 with Google proxy service
- **API Clients**: Dedicated client classes for each Google service
- **Scoping**: Module-based scope management
- **Rate Limiting**: Built-in request throttling and caching

### Performance Considerations
- **Lazy Loading**: Components and data loaded on demand
- **Caching**: Extensive caching of API responses and computed data
- **Asset Optimization**: Minified, compressed assets with cache busting
- **Database Optimization**: Minimal database queries with appropriate caching

### Security Practices
- **Nonce Verification**: All AJAX requests use WordPress nonces
- **Capability Checks**: Proper WordPress capability checking
- **Data Sanitization**: All user input sanitized and validated
- **Secure API Communication**: HTTPS-only Google API communication
- **No Secrets in Frontend**: API keys and secrets kept server-side only

### Browser Support
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (recent versions)
- **Polyfills**: Automatic polyfill injection for required features
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Mobile Responsive**: Mobile-first responsive design approach
