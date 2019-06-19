# Site Kit Unit Tests

## Initial Setup

1) Install `phpunit` using composer:

    ```
    $ composer install
    ```

2) Check if the `phpunit` exist:

    ```
    $ vendor/bin/phpunit --version
    ```

2) Install WordPress and the WP Unit Test lib using the `install.sh` script. Change to the plugin root directory and type:

    ```
    $ tests/bin/install.sh <db-name> <db-user> <db-password> [db-host] [wp-version] [skip-database-creation]
    ```

Sample usage:

    $ tests/bin/install.sh googlesitekit_tests root root localhost 4.9.8 false

If you don't have `mysqladmin` installed on your host, please use create database manually. And set `skip-database-creation` to `true`:

    $ tests/bin/install.sh googlesitekit_tests root root localhost 4.9.8 true


**Important**: The `<db-name>` database will be created if it doesn't exist and all data will be removed during testing.

## Running Tests

Simply change to the plugin root directory and type:

    $ vendor/bin/phpunit

You can run specific tests by providing the path and filename to the test class:

    $ vendor/bin/phpunit tests/unit-tests/helpers

You can run specific tests by providing group arguments:

    $ vendor/bin/phpunit --group cache

Available Groups:

- helpers
- cache

Running with the WordPress Core PHPUnit configuration:
    ```
    $WP_TESTS_DIR=/path/to/wp/develop/phpunit vendor/bin/phpunit
    ```

## Automated Tests

Tests are automatically run with [Travis-CI](https://travis-ci.com/google/site-kit-wp) for each commit and pull request.
