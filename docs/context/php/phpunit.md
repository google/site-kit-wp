# PHPUnit Testing

Site Kit uses PHPUnit with the WordPress test framework to provide comprehensive integration testing for all PHP code. All tests are integration tests that interact with WordPress core functionality and the database.

## Overview

The PHPUnit testing system provides:

- **Integration testing**: All tests interact with WordPress and database
- **WordPress test framework**: Uses `wp-phpunit` for WordPress-specific testing
- **Comprehensive test utilities**: Traits, fakes, and custom assertions
- **Contract testing**: Interface compliance validation through traits
- **Mock HTTP handlers**: Simulated Google API responses

## Directory Structure

**Location**: `tests/phpunit/`

```
tests/phpunit/
├── bootstrap.php              # Test suite bootstrap
├── wp-tests-config.php        # WordPress test configuration
├── bin/
│   └── install-wp-tests.sh    # Test environment setup script
├── includes/
│   ├── TestCase.php           # Base test class
│   ├── Core/
│   │   └── Modules/
│   │       ├── SettingsTestCase.php      # Settings test base class
│   │       ├── FakeModule.php            # Module fake implementation
│   │       └── Module_With_*_ContractTests.php  # Contract test traits
│   ├── Fake/
│   │   ├── FakeHttp.php       # Google API HTTP mock
│   │   ├── MethodSpy.php      # Method invocation recorder
│   │   └── ...                # Other test doubles
│   └── Utils/
│       ├── ModulesHelperTrait.php        # Module test helpers
│       ├── UserAuthenticationTrait.php    # Auth test helpers
│       └── ...                # Other utility traits
└── integration/
    ├── Core/                  # Core functionality tests
    │   ├── Authentication/
    │   ├── Modules/
    │   ├── Storage/
    │   └── ...
    └── Modules/               # Module-specific tests
        ├── Analytics_4/
        ├── AdSense/
        └── ...
```

## Base Test Classes

### Primary Test Class

**Location**: `tests/phpunit/includes/TestCase.php`

All tests extend the base `TestCase` which provides WordPress integration:

```php
namespace Google\Site_Kit\Tests;

use WP_UnitTestCase;

class TestCase extends WP_UnitTestCase {
    protected $preserveGlobalState = false;

    public function set_up() {
        parent::set_up();

        // Initialize wp_scripts and wp_styles for each test
        wp_scripts();
        wp_styles();
    }

    public function tear_down() {
        parent::tear_down();

        // Clean up globals
        unset( $GLOBALS['current_screen'] );
        $GLOBALS['wp_scripts'] = null;
        $GLOBALS['wp_styles'] = null;
    }
}
```

**Key Features**:
- Extends WordPress `WP_UnitTestCase` for full WordPress integration
- Sets `$preserveGlobalState = false` to handle closures in global state
- Manages feature flags from `feature-flags.json`
- Provides custom assertions (see Assertions section)

### Settings Test Base Class

**Location**: `tests/phpunit/includes/Modules/SettingsTestCase.php`

For testing module settings classes:

```php
namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Tests\TestCase;

abstract class SettingsTestCase extends TestCase {
    protected $object;

    /**
     * Get the option name for the setting.
     *
     * @&#8203;return string
     */
    abstract protected function get_option_name();

    public function set_up() {
        parent::set_up();

        $option_name = $this->get_option_name();

        // Unregister the setting
        unregister_setting( 'group', $option_name );

        // Remove all filters for the option
        remove_all_filters( "sanitize_option_{$option_name}" );
        remove_all_filters( "default_option_{$option_name}" );

        // Delete option and site_option
        delete_option( $option_name );
        delete_site_option( $option_name );
    }
}
```

**Usage**:

```php
use Google\Site_Kit\Tests\Modules\SettingsTestCase;
use Google\Site_Kit\Modules\Analytics_4\Settings;

class SettingsTest extends SettingsTestCase {
    protected function get_option_name() {
        return Settings::OPTION;
    }

    public function set_up() {
        parent::set_up();

        $this->object = new Settings( $this->options );
    }

    public function test_register() {
        $this->object->register();

        $this->assertSettingRegistered( Settings::OPTION );
    }
}
```

## Test Naming Conventions

### File Naming

Tests mirror the source code structure:

```
Source: includes/Modules/Analytics_4/Settings.php
Test:   tests/phpunit/integration/Modules/Analytics_4/SettingsTest.php

Source: includes/Core/Authentication/Authentication.php
Test:   tests/phpunit/integration/Core/Authentication/AuthenticationTest.php
```

**Pattern**: `{ClassName}Test.php`

### Test Method Naming

```php
// Basic test
public function test_register()

// Test with specific scenario
public function test_get_default()

// Test with multiple scenarios (use descriptive suffixes)
public function test_network_mode_get()
public function test_get_data__current_module_owner_without_shared_role()

// Data provider pattern
/**
 * @dataProvider data_tag_ids
 */
public function test_google_tag_ids( $tag, $id, $expected )

public function data_tag_ids() {
    return array(
        'googleTagID is valid G-XXXX string' => array( 'googleTagID', 'G-XXXX', 'G-XXXX' ),
        'googleTagID is invalid string'      => array( 'googleTagID', 'xxxx', '' ),
    );
}
```

**Pattern**: `test_{method_or_behavior}__{specific_case}`

## Setup and Teardown Patterns

### Standard Setup

```php
private $context;
private $options;
private $user_options;
private $authentication;
private $user;

public function set_up() {
    parent::set_up();

    $this->context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
    $this->options        = new Options( $this->context );
    $this->user_options   = new User_Options( $this->context );
    $this->authentication = new Authentication( $this->context, $this->options, $this->user_options );

    // Create test user
    $this->user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );

    wp_set_current_user( $this->user->ID );
}
```

### Module Test Setup

```php
private $module;

public function set_up() {
    parent::set_up();

    $this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
    $this->options = new Options( $this->context );

    $this->module = new Analytics_4( $this->context, $this->options );

    // Set up module dependencies
    $this->activate_modules( 'analytics-4' );
}
```

### Minimal Teardown

Most cleanup is automatic via WordPress test framework:

```php
public function tear_down() {
    parent::tear_down();
    // Additional cleanup only if needed
}
```

**Note**: The WordPress test framework automatically:
- Resets database between tests
- Clears transients and caches
- Removes registered hooks
- Deletes created posts, users, terms

## Test Doubles and Fakes

### FakeHttp - Google API Mocking

**Location**: `tests/phpunit/includes/Fake/FakeHttp.php`

Mock Google API responses:

```php
use Google\Site_Kit\Tests\Fake\FakeHttp;

public function test_get_accounts() {
    $google_client = new Google_Client();

    $mock_accounts = array(
        array(
            'name'        => 'accounts/12345',
            'displayName' => 'Test Account',
        ),
    );

    FakeHttp::fake_google_http_handler(
        $google_client,
        function ( Request $request ) use ( $mock_accounts ) {
            return new Response( 200, array(), json_encode( $mock_accounts ) );
        }
    );

    $service = new GoogleAnalyticsAdmin( $google_client );
    $accounts = $service->accounts->listAccounts();

    $this->assertCount( 1, $accounts );
}
```

### MethodSpy - Invocation Recording

**Location**: `tests/phpunit/includes/Fake/MethodSpy.php`

Record method calls for verification:

```php
use Google\Site_Kit\Tests\Fake\MethodSpy;

public function test_method_called_with_args() {
    $spy = new MethodSpy();

    // Attach spy to an object method
    add_filter( 'some_filter', array( $spy, 'callback' ) );

    // Trigger the filter
    apply_filters( 'some_filter', 'arg1', 'arg2' );

    // Verify invocations
    $this->assertCount( 1, $spy->invocations['callback'] );
    $this->assertEquals( array( 'arg1', 'arg2' ), $spy->invocations['callback'][0] );
}
```

### FakeModule - Module Testing

**Location**: `tests/phpunit/includes/Core/Modules/FakeModule.php`

Complete fake module for testing module system:

```php
use Google\Site_Kit\Tests\Core\Modules\FakeModule;

public function test_module_registration() {
    $module = new FakeModule( $this->context );

    // Configure module behavior
    $module->set_force_active( true );

    $modules = new Modules( $this->context );
    $modules->register_module( $module );

    $this->assertTrue( $modules->is_module_active( $module->slug ) );
}
```

## Helper Traits

### ModulesHelperTrait

**Location**: `tests/phpunit/includes/Utils/ModulesHelperTrait.php`

Module activation and connection helpers:

```php
use Google\Site_Kit\Tests\Utils\ModulesHelperTrait;

class MyTest extends TestCase {
    use ModulesHelperTrait;

    public function test_module_functionality() {
        // Activate modules
        $this->activate_modules( 'analytics-4', 'adsense' );

        // Force connect modules (skip OAuth)
        $this->force_connect_modules( 'analytics-4' );

        $this->assertTrue( $this->modules->is_module_connected( 'analytics-4' ) );
    }
}
```

### Fake_Site_Connection_Trait

**Location**: `tests/phpunit/includes/Fake_Site_Connection_Trait.php`

Mock Google OAuth connections:

```php
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;

class MyTest extends TestCase {
    use Fake_Site_Connection_Trait;

    public function test_authenticated_request() {
        // Mock site connection and authentication
        $this->fake_site_connection();

        // Now authentication checks will pass
        $this->assertTrue( $this->authentication->is_authenticated() );
    }

    public function test_proxy_connection() {
        // Mock proxy-based connection
        $this->fake_proxy_site_connection();

        $this->assertEquals(
            Authentication::METHOD_PROXY,
            $this->authentication->get_auth_method()
        );
    }
}
```

### RestTestTrait

**Location**: `tests/phpunit/includes/RestTestTrait.php`

Register REST routes for testing:

```php
use Google\Site_Kit\Tests\RestTestTrait;

class REST_Controller_Test extends TestCase {
    use RestTestTrait;

    public function set_up() {
        parent::set_up();

        // Ensure REST routes are registered
        $this->register_rest_routes();
    }

    public function test_list_endpoint() {
        $request = new WP_REST_Request( 'GET', '/google-site-kit/v1/core/modules/data/list' );
        $response = rest_do_request( $request );

        $this->assertEquals( 200, $response->get_status() );
    }
}
```

### UserAuthenticationTrait

**Location**: `tests/phpunit/includes/Utils/UserAuthenticationTrait.php`

Set user access tokens:

```php
use Google\Site_Kit\Tests\Utils\UserAuthenticationTrait;

class MyTest extends TestCase {
    use UserAuthenticationTrait;

    public function test_authenticated_api_request() {
        $access_token = array(
            'access_token' => 'test-access-token',
            'expires_in'   => 3600,
        );

        $this->set_user_access_token( $this->user->ID, $access_token );

        $this->assertTrue( $this->authentication->is_authenticated() );
    }
}
```

## Contract Testing Traits

Contract test traits validate interface implementations.

### Module_With_Settings_ContractTests

**Location**: `tests/phpunit/includes/Core/Modules/Module_With_Settings_ContractTests.php`

```php
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;

class Analytics_4Test extends TestCase {
    use Module_With_Settings_ContractTests;

    public function test_get_settings() {
        $this->assertInstanceOf(
            Settings::class,
            $this->module->get_settings()
        );
    }
}
```

**Available Contract Traits**:
- `Module_With_Settings_ContractTests`
- `Module_With_Owner_ContractTests`
- `Module_With_Scopes_ContractTests`
- `Module_With_Service_Entity_ContractTests`
- `Module_With_Data_Available_State_ContractTests`

## Custom Assertions

### WordPress-Specific Assertions

```php
// Option assertions
$this->assertOptionExists( 'googlesitekit_option_name' );
$this->assertOptionNotExists( 'googlesitekit_option_name' );

// Transient assertions
$this->assertTransientExists( 'googlesitekit_transient' );

// Post meta assertions
$this->assertPostMetaHasValue( $post_id, 'meta_key', 'expected_value' );

// Setting registration
$this->assertSettingRegistered( 'googlesitekit_setting' );

// WP_Error assertions
$result = $this->modules->activate_module( 'invalid-module' );
$this->assertWPError( $result );
$this->assertWPErrorWithMessage( 'Invalid module', $result );
```

### Using force_get_property and force_set_property

Test private/protected properties:

```php
// Set protected property
$this->force_set_property( $object, 'private_property', 'test_value' );

// Get protected property
$value = $this->force_get_property( $object, 'private_property' );

$this->assertEquals( 'test_value', $value );
```

## Testing Patterns

### Testing Module Registration

```php
public function test_register() {
    $this->module->register();

    // Verify settings registered
    $this->assertSettingRegistered( Settings::OPTION );

    // Verify REST routes registered
    $this->register_rest_routes();
    $routes = rest_get_server()->get_routes();
    $this->assertArrayHasKey(
        '/google-site-kit/v1/modules/analytics-4/data/accounts',
        $routes
    );

    // Verify hooks registered
    $this->assertTrue( has_action( 'wp_head' ) );
}
```

### Testing Settings

```php
public function test_get_default() {
    $settings = $this->module->get_settings();

    $expected = array(
        'accountID'       => '',
        'propertyID'      => '',
        'webDataStreamID' => '',
        'measurementID'   => '',
    );

    $this->assertEquals( $expected, $settings->get() );
}

public function test_settings_validation() {
    $settings = $this->module->get_settings();

    // Invalid data should return WP_Error
    $result = $settings->set( array( 'accountID' => 'invalid' ) );
    $this->assertWPError( $result );

    // Valid data should be saved
    $valid_data = array( 'accountID' => 'accounts/12345' );
    $settings->set( $valid_data );

    $this->assertEquals( 'accounts/12345', $settings->get()['accountID'] );
}
```

### Testing REST Endpoints

```php
public function test_get_data_endpoint() {
    $this->register_rest_routes();

    // Mock Google API response
    $this->fake_site_connection();

    $request = new WP_REST_Request(
        'GET',
        '/google-site-kit/v1/modules/analytics-4/data/accounts'
    );

    $response = rest_do_request( $request );

    $this->assertEquals( 200, $response->get_status() );
    $this->assertIsArray( $response->get_data() );
}

public function test_endpoint_requires_authentication() {
    $this->register_rest_routes();

    // Remove authentication
    wp_set_current_user( 0 );

    $request = new WP_REST_Request(
        'GET',
        '/google-site-kit/v1/modules/analytics-4/data/accounts'
    );

    $response = rest_do_request( $request );

    $this->assertEquals( 403, $response->get_status() );
}
```

### Testing with Data Providers

```php
/**
 * @dataProvider provider_invalid_property_ids
 */
public function test_invalid_property_ids( $property_id ) {
    $settings = $this->module->get_settings();

    $result = $settings->set( array( 'propertyID' => $property_id ) );

    $this->assertWPError( $result );
}

public function provider_invalid_property_ids() {
    return array(
        'empty string'     => array( '' ),
        'numeric'          => array( 12345 ),
        'invalid format'   => array( 'properties-12345' ),
        'missing prefix'   => array( '12345' ),
    );
}
```

### Testing Redirects

```php
use Google\Site_Kit\Tests\Exception\RedirectException;

public function test_redirect_on_action() {
    try {
        $this->controller->handle_redirect_action();

        $this->fail( 'Expected RedirectException was not thrown' );
    } catch ( RedirectException $e ) {
        $this->assertEquals( 'https://example.com/redirect', $e->get_location() );
        $this->assertEquals( 302, $e->get_status() );
    }
}
```

### Testing HTTP Requests

```php
public function test_http_request_made() {
    $request_url = null;

    $unsubscribe = $this->subscribe_to_wp_http_requests(
        function ( $url, $args ) use ( &$request_url ) {
            $request_url = $url;
        },
        array(
            'response' => array( 'code' => 200 ),
            'body'     => json_encode( array( 'success' => true ) ),
        )
    );

    $this->module->make_api_request();

    $this->assertStringContainsString(
        'https://www.googleapis.com/analytics',
        $request_url
    );

    $unsubscribe(); // Clean up subscription
}
```

### Testing Multisite

```php
/**
 * @group ms-required
 */
public function test_network_mode_functionality() {
    $this->network_activate_site_kit();

    add_filter( 'googlesitekit_is_network_mode', '__return_true' );

    $this->assertTrue( $this->context->is_network_mode() );
}

/**
 * @group ms-excluded
 */
public function test_single_site_only_feature() {
    // This test only runs on single site
    $this->assertFalse( is_multisite() );
}
```

### Testing Feature Flags

```php
public function test_feature_flag_enabled() {
    $reset = $this->enable_feature( 'userInput' );

    $this->assertTrue( Feature_Flags::enabled( 'userInput' ) );

    // Reset feature flag after test
    $reset();

    $this->assertFalse( Feature_Flags::enabled( 'userInput' ) );
}
```

## PHPUnit Groups

Organize tests with `@group` annotations:

```php
/**
 * @group Modules
 * @group Analytics
 */
class Analytics_4Test extends TestCase {
    // Tests here
}
```

**Common Groups**:
- `@group Modules` - Module tests
- `@group Storage` - Storage-related tests
- `@group Authentication` - Authentication tests
- `@group Assets` - Asset management tests
- `@group Util` - Utility function tests
- `@group ms-required` - Requires multisite
- `@group ms-excluded` - Excluded from multisite

**Running Specific Groups**:
```bash
# Run only module tests
composer test:php -- --group=Modules

# Run only Analytics tests
composer test:php -- --group=Analytics

# Exclude multisite tests
composer test:php -- --exclude-group=ms-required
```

## WordPress Test Configuration

### Test Database

**Location**: `tests/phpunit/wp-tests-config.php`

```php
define( 'DB_NAME', 'wordpress_test' );
define( 'DB_USER', 'root' );
define( 'DB_PASSWORD', '' );
define( 'DB_HOST', 'mysql' );

// Block external HTTP requests
define( 'WP_HTTP_BLOCK_EXTERNAL', true );

// Enable debug mode
define( 'WP_DEBUG', true );
```

### Bootstrap

**Location**: `tests/phpunit/bootstrap.php`

The bootstrap file:
1. Loads WordPress test framework
2. Loads Site Kit plugin
3. Initializes test environment
4. Sets up autoloading for test classes

## Best Practices

### DO

1. **Always extend TestCase**
   ```php
   use Google\Site_Kit\Tests\TestCase;

   class MyTest extends TestCase {
   ```

2. **Use snake_case for setup/teardown**
   ```php
   public function set_up() {
       parent::set_up();
   }

   public function tear_down() {
       parent::tear_down();
   }
   ```

3. **Call parent methods first**
   ```php
   public function set_up() {
       parent::set_up(); // Always first

       // Your setup code
   }
   ```

4. **Use helper traits**
   ```php
   use ModulesHelperTrait;
   use Fake_Site_Connection_Trait;

   $this->activate_modules( 'analytics-4' );
   $this->fake_site_connection();
   ```

5. **Mock Google API calls**
   ```php
   FakeHttp::fake_google_http_handler( $google_client, $handler );
   ```

6. **Use custom assertions**
   ```php
   $this->assertOptionExists( 'option_name' );
   $this->assertWPError( $result );
   ```

7. **Test both success and failure cases**
   ```php
   public function test_valid_input() { /* ... */ }
   public function test_invalid_input() { /* ... */ }
   ```

8. **Use descriptive test names**
   ```php
   public function test_get_accounts__without_authentication__returns_wp_error()
   ```

### DON'T

1. **Don't test WordPress core functionality**
   ```php
   // Bad - testing WordPress core
   public function test_add_option_creates_option() {
       add_option( 'test', 'value' );
       $this->assertEquals( 'value', get_option( 'test' ) );
   }
   ```

2. **Don't make real API requests**
   ```php
   // Bad - makes real HTTP request
   public function test_api_request() {
       $response = wp_remote_get( 'https://www.googleapis.com/...' );
   }

   // Good - mock HTTP requests
   public function test_api_request() {
       FakeHttp::fake_google_http_handler( $client, $handler );
   }
   ```

3. **Don't skip setup/teardown**
   ```php
   // Bad - missing parent call
   public function set_up() {
       $this->object = new MyClass();
   }

   // Good
   public function set_up() {
       parent::set_up();
       $this->object = new MyClass();
   }
   ```

4. **Don't test implementation details**
   ```php
   // Bad - testing private method implementation
   public function test_private_method_logic() {
       $value = $this->force_get_property( $object, 'private_prop' );
       // Testing internal state
   }

   // Good - test public API behavior
   public function test_public_method_returns_expected_result() {
       $result = $object->public_method();
       $this->assertEquals( 'expected', $result );
   }
   ```

5. **Don't leave dangling filters/actions**
   ```php
   // WordPress test framework automatically cleans up hooks
   // But if you need manual cleanup:
   remove_filter( 'filter_name', array( $this, 'callback' ) );
   ```

## Running Tests

### Run All Tests

```bash
composer test:php
```

### Run Specific Test File

```bash
composer test:php tests/phpunit/integration/Modules/Analytics_4/SettingsTest.php
```

### Run Specific Test Method

```bash
composer test:php --filter=test_register
```

### Run Tests with Coverage

```bash
composer test:php -- --coverage-html coverage/
```

### Run Tests for Specific Group

```bash
composer test:php -- --group=Modules
composer test:php -- --group=Analytics
```

## Code Style

PHPUnit tests follow WordPress coding standards with some exceptions:

```php
// Disable assertion message requirement
// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage

public function test_something() {
    // Most tests don't include assertion messages
    $this->assertTrue( $condition );
}
```

**Note**: The codebase intentionally omits assertion messages in most tests for brevity. This is documented in test files.
