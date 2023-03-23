# Site Kit Unit Tests

All commands listed below should be run from the root of the repository in your local environment.

## Initial Setup

1. Install dependencies using Composer  
    ```
    $ composer install
    ```
1. Install WordPress and the WP Unit Test lib using the `install-wp-tests.sh` script  
    ```
    $ tests/phpunit/bin/install-wp-tests.sh <db-name> <db-user> <db-pass> [db-host] [wp-version] [skip-database-creation]
    ```

### Example Usage

Install the test library and latest WordPress with a new database, using root credentials
```
$ tests/phpunit/bin/install-wp-tests.sh googlesitekit_tests root password
```

If you don't have `mysqladmin` installed on your host, you'll need to create a database manually and set `skip-database-creation` to `true`.  
If you're not sure, run `which mysqladmin` which will output the path to the executable if installed, or nothing if not installed.
```
$ tests/phpunit/bin/install-wp-tests.sh googlesitekit_tests root password localhost latest true
```

**Important**: The `<db-name>` database will be created if it doesn't exist and all data will be removed during testing.

## Running Tests

Run all PHPUnit tests using Composer
```
$ composer test
```
This ensures that the tests are run with the version of PHPUnit required by Google Site Kit rather than requiring it to be globally installed on your system.

You can run specific tests by providing the path and filename to the test class or a directory containing tests:
```
$ composer test -- tests/phpunit/integration/Core
```

You can run specific tests by providing group arguments:
```
$ composer test -- --group Modules
```

Running with the WordPress Core PHPUnit configuration:
```
$WP_TESTS_DIR=/path/to/wp/develop/phpunit composer test
```

## Automated Tests

Tests are automatically run with GitHub Actions for each commit and pull request.
