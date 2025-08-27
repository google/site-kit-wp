# Gemini Code Assistant Context

## Project Overview

This is the repository for **Site Kit by Google**, a WordPress plugin that provides a one-stop solution for WordPress users to use Google's services to improve their sites.

The project is a combination of a PHP backend and a JavaScript frontend. The PHP code is located in the `includes` directory, and the JavaScript code is in the `assets/js` directory. The project uses `npm` to manage JavaScript dependencies and `composer` to manage PHP dependencies.

### Architecture

The plugin follows a modular architecture. The core plugin provides the basic functionality, and modules are used to add support for specific Google services. Each module is responsible for its own data, UI, and functionality.

The main plugin file is `google-site-kit.php`, which handles plugin activation, deactivation, and loading the main plugin logic. The plugin is initialized in the `includes/loader.php` file, which autoloads the required classes and vendor files.

The JavaScript frontend is a single-page application (SPA) built with React. The main entry point for the SPA is `assets/js/googlesitekit-main-dashboard.js`, which renders the main dashboard component.

### Data Management

The plugin uses a data store to manage the application state. The data store is built on top of the `@wordpress/data` package and provides a centralized location for storing and accessing data. The data store is divided into modules, with each module having its own set of actions, selectors, and reducers.

## Building and Running

The project uses `npm` for its build process. The following commands are available:

*   `npm run build`: Builds the production version of the JavaScript assets.
*   `npm run build:dev`: Builds the development version of the JavaScript assets.
*   `npm run watch`: Watches for changes in the JavaScript files and rebuilds them automatically.
*   `npm run dev`: A shortcut for `npm run build:dev`.

To run the project, you will need a WordPress installation. Once you have that set up, you can install the plugin by cloning this repository into your `wp-content/plugins` directory.

## Development Conventions

The project has a set of development conventions that are enforced by linters and other tools.

### PHP

The PHP code follows the [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/). The project uses `phpcs` to check for compliance with these standards. You can run the linter with the following command:

*   `composer run lint`: Lints the PHP code.
*   `composer run lint-fix`: Automatically fixes some linting errors.

### JavaScript

The JavaScript code follows the [WordPress JavaScript Coding Standards](https://developer.wordpress.org/coding-standards/javascript/). The project uses ESLint and Prettier to enforce these standards. You can run the linters with the following commands:

*   `npm run lint:js`: Lints the JavaScript code.
*   `npm run lint:js-fix`: Automatically fixes some linting errors.

### Testing

The project has a comprehensive test suite that includes unit tests, integration tests, and end-to-end tests.

#### PHP Tests

The PHP tests are written using PHPUnit and are located in the `tests/phpunit` directory. The base test case is `tests/phpunit/includes/TestCase.php`, which provides several helper methods for testing. You can run the PHP tests with the following command:

*   `composer run test`: Runs the PHP unit tests.

#### JavaScript Tests

The JavaScript tests are written using Jest and are located in the `tests/js` directory. The project uses the `@testing-library/react` library for testing React components. The `tests/js/test-utils.js` file provides a set of utility functions for testing. You can run the JavaScript tests with the following command:

*   `npm run test:js`: Runs the JavaScript unit tests.

#### End-to-End Tests

The end-to-end tests are written using Playwright and are located in the `tests/e2e` directory. You can run the end-to-end tests with the following command:

*   `npm run test:e2e`: Runs the end-to-end tests.
