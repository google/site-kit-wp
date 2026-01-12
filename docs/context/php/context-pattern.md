# Context Pattern

The Context pattern in Site Kit provides a centralized service container that offers environment-aware access to plugin configuration, paths, URLs, and environmental information.

## What is the Context Pattern?

The Context is a central object that encapsulates all environment-specific information and provides a consistent API for accessing plugin-related data. It's the first dependency injected into almost every Site Kit class.

**Location**: `includes/Context.php:1-530`

## Core Responsibilities

The Context object provides five main categories of functionality:

1. **Path and URL Management**: Generate file paths and URLs
2. **Environment Detection**: Detect AMP, multisite, network mode
3. **Site Information**: Reference URLs, entity information
4. **Localization**: Language and locale information
5. **Input Access**: Safe access to the request data

## Key Methods

### 1. Path and URL Management

#### File Paths

```php
/**
 * Get absolute path to plugin directory or file.
 *
 * @&#8203;param string $relative_path Optional. Relative path within plugin. Default '/'.
 * @&#8203;return string Absolute path.
 */
public function path( $relative_path = '/' )
```

**Usage Example**:

```php
$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

// Get plugin root directory
$plugin_dir = $context->path();
// Result: /var/www/html/wp-content/plugins/google-site-kit/

// Get specific file path
$settings_file = $context->path( 'includes/Core/Storage/Options.php' );
// Result: /var/www/html/wp-content/plugins/google-site-kit/includes/Core/Storage/Options.php

// Get assets directory
$assets_dir = $context->path( 'dist/assets/' );
// Result: /var/www/html/wp-content/plugins/google-site-kit/dist/assets/
```

#### URLs

```php
/**
 * Get URL to plugin directory or file.
 *
 * @&#8203;param string $relative_path Optional. Relative path within plugin. Default '/'.
 * @&#8203;return string URL.
 */
public function url( $relative_path = '/' )
```

**Usage Example**:

```php
// Get plugin URL
$plugin_url = $context->url();
// Result: https://example.com/wp-content/plugins/google-site-kit/

// Get asset URL
$script_url = $context->url( 'dist/assets/js/googlesitekit-dashboard.js' );
// Result: https://example.com/wp-content/plugins/google-site-kit/dist/assets/js/googlesitekit-dashboard.js
```

**Location**: `includes/Context.php:92-116`

#### Admin URLs

```php
/**
 * Get admin URL for a specific Site Kit page.
 *
 * @&#8203;param string $slug       Page slug (e.g., 'dashboard', 'settings').
 * @&#8203;param array  $query_args Optional query parameters.
 * @&#8203;return string Admin URL.
 */
public function admin_url( $slug = 'dashboard', array $query_args = array() )
```

**Usage Example**:

```php
// Get dashboard URL
$dashboard_url = $context->admin_url( 'dashboard' );
// Result: https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard

// Get settings URL with parameters
$settings_url = $context->admin_url( 'settings', array(
    'slug'    => 'analytics-4',
    'reAuth'  => '1',
) );
// Result: https://example.com/wp-admin/admin.php?page=googlesitekit-settings&slug=analytics-4&reAuth=1
```

**Location**: `includes/Context.php:128-158`

### 2. Environment Detection

#### AMP Detection

```php
/**
 * Check if current request is an AMP request.
 *
 * @&#8203;return bool True if AMP request.
 */
public function is_amp()

/**
 * Get the AMP mode for the site.
 *
 * @&#8203;return string 'primary', 'secondary', or empty string if not AMP.
 */
public function get_amp_mode()
```

**Usage Example**:

```php
if ( $context->is_amp() ) {
    // Load AMP-specific assets
    $amp_script = $context->url( 'dist/assets/js/amp-analytics.js' );
}

$amp_mode = $context->get_amp_mode();
if ( 'primary' === $amp_mode ) {
    // Site is AMP-first
} elseif ( 'secondary' === $amp_mode ) {
    // Site has paired AMP
}
```

**Location**: `includes/Context.php:291-341`

#### Network Mode Detection

```php
/**
 * Check if plugin is in network mode (multisite).
 *
 * @&#8203;return bool True if network mode.
 */
public function is_network_mode()

/**
 * Check if plugin is network active.
 *
 * @&#8203;return bool True if network active.
 */
public function is_network_active()
```

**Usage Example**:

```php
if ( $context->is_network_mode() ) {
    // Use network options instead of site options
    $value = get_network_option( null, 'googlesitekit_option' );
} else {
    $value = get_option( 'googlesitekit_option' );
}

// Check if plugin is network activated
if ( $context->is_network_active() ) {
    // Show network admin menu
}
```

**Location**: `includes/Context.php:369-398`

### 3. Site Information

#### Reference Site URL

```php
/**
 * Get the reference site URL for the current request context.
 *
 * @&#8203;return string Reference site URL.
 */
public function get_reference_site_url()
```

**Usage Example**:

```php
// Get the reference URL (accounts for entity-specific contexts)
$site_url = $context->get_reference_site_url();
// For main dashboard: https://example.com
// For post editor: https://example.com/?p=123
// For term archive: https://example.com/category/news/

// This URL is sent to Google Analytics for entity-specific data
```

**Location**: `includes/Context.php:197-203`

**Implementation**: `includes/Context.php:420-458`

```php
private function filter_reference_url( $url = '' ) {
    if ( empty( $url ) ) {
        $url = $this->get_canonical_home_url();
    }

    /**
     * Filters the reference URL.
     *
     * Allows modification of the URL used for entity-specific data.
     */
    $url = apply_filters( 'googlesitekit_analytics_reference_url', $url );

    // Ensure URL is properly formatted
    return esc_url_raw( trailingslashit( $url ) );
}
```

#### Canonical Home URL

```php
/**
 * Get the canonical home URL.
 *
 * @&#8203;return string Canonical home URL.
 */
public function get_canonical_home_url()
```

**Usage Example**:

```php
$home_url = $context->get_canonical_home_url();
// Result: https://example.com (with proper scheme detection)
```

**Location**: `includes/Context.php:170-195`

#### Reference Entity

```php
/**
 * Get the reference entity for the current context.
 *
 * @&#8203;return array Entity information array.
 */
public function get_reference_entity()
```

**Usage Example**:

```php
$entity = $context->get_reference_entity();
// For post: array( 'type' => 'post', 'id' => 123, 'title' => 'Post Title' )
// For term: array( 'type' => 'term', 'id' => 456, 'title' => 'Category Name' )
// For front page: array( 'type' => 'front_page' )
```

**Location**: `includes/Context.php:205-213`

### 4. Localization

#### Site Locale

```php
/**
 * Get locale for a specific context.
 *
 * @&#8203;param string $context 'site' or 'user'. Default 'site'.
 * @&#8203;param string $format  'language-code' or 'default'. Default 'default'.
 * @&#8203;return string Locale string.
 */
public function get_locale( $context = 'site', $format = 'default' )
```

**Usage Example**:

```php
// Get site locale in default format
$locale = $context->get_locale();
// Result: en_US

// Get site locale as language code
$lang = $context->get_locale( 'site', 'language-code' );
// Result: en-US

// Get user locale
$user_locale = $context->get_locale( 'user' );
// Result: es_ES (if user has Spanish preference)
```

**Location**: `includes/Context.php:460-503`

### 5. Input Access

The Context provides a safe abstraction for accessing superglobals (GET, POST, etc.) via the `Input` class.

#### Filter Input

```php
/**
 * Gets a specific external variable by name and optionally filters it.
 *
 * @&#8203;param int    $type               One of INPUT_GET, INPUT_POST, INPUT_COOKIE, INPUT_SERVER, or INPUT_ENV.
 * @&#8203;param string $variable_name      Name of a variable to get.
 * @&#8203;param int    $filter [optional]  The ID of the filter to apply. Default FILTER_DEFAULT.
 * @&#8203;param mixed  $options [optional] Associative array of options or bitwise disjunction of flags.
 * @&#8203;return mixed                     Value of the requested variable on success.
 */
public function filter( $type, $variable_name, $filter = FILTER_DEFAULT, $options = 0 )
```

**Usage Example**:

```php
// Get a GET parameter
$page = $context->input()->filter( INPUT_GET, 'page' );

// Get a POST parameter
$action = $context->input()->filter( INPUT_POST, 'action' );

// Get a filtered value
$id = $context->input()->filter( INPUT_GET, 'id', FILTER_VALIDATE_INT );
```

**Location**: `includes/Context.php:114-116` (Context method) and `includes/Core/Util/Input.php` (Input class)

## Common Usage Patterns

### Pattern 1: Asset URL Generation

**Location**: `includes/Core/Assets/Assets.php:200-250`

```php
class Assets {
    private $context;

    public function __construct( Context $context ) {
        $this->context = $context;
    }

    private function get_assets() {
        $base_url = $this->context->url( 'dist/assets/' );

        return array(
            new Script(
                'googlesitekit-dashboard',
                array(
                    'src'          => $base_url . 'js/googlesitekit-dashboard.js',
                    'dependencies' => array( 'googlesitekit-vendor', 'googlesitekit-runtime' ),
                )
            ),
            new Stylesheet(
                'googlesitekit-admin-css',
                array(
                    'src' => $base_url . 'css/googlesitekit-admin-css.css',
                )
            ),
        );
    }
}
```

### Pattern 2: Environment-Aware Data Access

**Location**: `includes/Core/Storage/Options.php:45-85`

```php
final class Options implements Options_Interface {
    private $context;

    public function __construct( Context $context ) {
        $this->context = $context;
    }

    public function get( $option ) {
        if ( $this->context->is_network_mode() ) {
            return get_network_option( null, $option );
        }
        return get_option( $option );
    }

    public function set( $option, $value ) {
        if ( $this->context->is_network_mode() ) {
            return update_network_option( null, $option, $value );
        }
        return update_option( $option, $value );
    }
}
```

### Pattern 3: Admin Navigation

**Location**: `includes/Core/Admin/Notice.php`

```php
class Notice {
    private $context;

    public function render_activation_notice() {
        $dashboard_url = $this->context->admin_url( 'dashboard' );
        $settings_url  = $this->context->admin_url( 'settings' );

        printf(
            '<a href="%s">View Dashboard</a> | <a href="%s">Settings</a>',
            esc_url( $dashboard_url ),
            esc_url( $settings_url )
        );
    }
}
```

### Pattern 4: Entity-Specific Data

**Location**: Module data requests

```php
class Analytics_4 extends Module {
    protected function create_data_request( Data_Request $data ) {
        $base_url = $this->context->get_reference_site_url();
        $entity   = $this->context->get_reference_entity();

        $request_data = array(
            'url'    => $base_url,
            'entity' => $entity,
        );

        // Use entity information for scoped analytics queries
        return $this->get_service( 'analyticsdata' )->properties_runReport(
            $property_id,
            $request_data
        );
    }
}
```

## Context Initialization

The Context object is initialized once in the main plugin file and passed throughout the application.

**Location**: `includes/Plugin.php:56-65`

```php
final class Plugin {
    private $context;

    private function __construct( $main_file ) {
        $this->context = new Context( $main_file );
    }

    public function register() {
        // Pass context to all subsystems
        $options      = new Core\Storage\Options( $this->context );
        $user_options = new Core\Storage\User_Options( $this->context, get_current_user_id() );
        $assets       = new Core\Assets\Assets( $this->context );

        // ... more initialization
    }
}
```

## Testing with Context

When writing tests, you can create a Context with a test file:

```php
class MyTest extends TestCase {
    public function test_with_context() {
        $context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

        $service = new MyService( $context );

        // Context will return test-appropriate values
        $this->assertStringContainsString(
            'google-site-kit',
            $context->path()
        );
    }
}
```

For more control, use mocks:

```php
public function test_with_mock_context() {
    $context = $this->createMock( Context::class );
    $context->method( 'is_network_mode' )->willReturn( true );
    $context->method( 'url' )->willReturn( 'https://example.com/plugin/' );

    $service = new MyService( $context );
    // Test service behavior with mocked context
}
```

## Best Practices

### DO

1. **Always inject Context as the first constructor parameter**

    ```php
    public function __construct( Context $context, /* other params */ ) {
        $this->context = $context;
    }
    ```

2. **Use Context methods instead of global functions**

    ```php
    // Good
    $url = $this->context->url( 'assets/script.js' );

    // Bad
    $url = plugins_url( 'assets/script.js', GOOGLESITEKIT_PLUGIN_MAIN_FILE );
    ```

3. **Store Context as a private property**

    ```php
    private $context;
    ```

4. **Use Context for environment detection**
    ```php
    if ( $this->context->is_network_mode() ) {
        // Network-specific logic
    }
    ```

### DON'T

1. **Don't create multiple Context instances**

    ```php
    // Bad - creates new instance
    $context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

    // Good - use injected instance
    $url = $this->context->url( 'file.js' );
    ```

2. **Don't bypass Context methods**

    ```php
    // Bad
    $home_url = get_home_url();

    // Good - Context handles edge cases
    $home_url = $this->context->get_canonical_home_url();
    ```

3. **Don't hardcode paths or URLs**

    ```php
    // Bad
    $path = WP_PLUGIN_DIR . '/google-site-kit/assets/';

    // Good
    $path = $this->context->path( 'assets/' );
    ```
