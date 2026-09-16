# Context Pattern

The Context pattern in Site Kit provides a centralized service container that offers environment-aware access to plugin configuration, paths, URLs, and environmental information.

## What is the Context Pattern?

The Context is a central object that encapsulates all environment-specific information and provides a consistent API for accessing plugin-related data. It's the first dependency injected into almost every Site Kit class.

**Location**: `includes/Context.php`

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
 * \@param string $relative_path Optional. Relative path within plugin. Default '/'.
 * \@return string Absolute path.
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
 * \@param string $relative_path Optional. Relative path within plugin. Default '/'.
 * \@return string URL.
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

**Location**: `path()` at `includes/Context.php`, `url()` at `includes/Context.php`

#### Admin URLs

```php
/**
 * Get admin URL for a specific Site Kit page.
 *
 * \@param string $slug       Page slug (e.g., 'dashboard', 'settings').
 * \@param array  $query_args Optional query parameters.
 * \@return string Admin URL.
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

The `page` query arg is always derived from the slug (`Core\Admin\Screens::PREFIX . $slug`, i.e. `googlesitekit-{slug}`); any `page` key passed in `$query_args` is ignored. In network mode the base URL is `network_admin_url( 'admin.php' )` instead of `admin_url( 'admin.php' )`.

**Location**: `includes/Context.php`

### 2. Environment Detection

#### AMP Detection

```php
/**
 * Check if current request is an AMP request.
 *
 * \@return bool True if AMP request.
 */
public function is_amp()

/**
 * Get the current AMP mode.
 *
 * \@return bool|string 'primary' (standard mode), 'secondary' (transitional/reader
 *                     mode or Web Stories active), or false if AMP is not active.
 */
public function get_amp_mode()
```

The string values returned by `get_amp_mode()` correspond to the `Context::AMP_MODE_PRIMARY` (`'primary'`) and `Context::AMP_MODE_SECONDARY` (`'secondary'`) class constants.

**Usage Example**:

```php
if ( $context->is_amp() ) {
    // Load AMP-specific assets
    $amp_script = $context->url( 'dist/assets/js/amp-analytics.js' );
}

$amp_mode = $context->get_amp_mode();
if ( Context::AMP_MODE_PRIMARY === $amp_mode ) {
    // Site is AMP-first (standard mode)
} elseif ( Context::AMP_MODE_SECONDARY === $amp_mode ) {
    // Site has paired AMP (transitional/reader mode)
}
```

**Location**: `is_amp()` at `includes/Context.php`, `get_amp_mode()` at `includes/Context.php`

#### Network Mode Detection

```php
/**
 * Check if plugin is in network mode (multisite).
 *
 * \@return bool True if network mode.
 */
public function is_network_mode()

/**
 * Check if plugin is network active.
 *
 * \@return bool True if network active.
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

Note: `is_network_mode()` returns the value of the `googlesitekit_is_network_mode` filter (added in 1.86.0), which defaults to `false` because Site Kit does not yet support a network mode. It always returns `false` when the plugin is not network active.

**Location**: `is_network_mode()` at `includes/Context.php`, `is_network_active()` at `includes/Context.php`

### 3. Site Information

#### Reference Site URL

```php
/**
 * Get the reference site URL for the current request context.
 *
 * \@return string Reference site URL.
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

**Location**: `includes/Context.php`

**Implementation**: `includes/Context.php`

```php
private function filter_reference_url( $url = '' ) {
    $site_url = untrailingslashit( $this->get_canonical_home_url() );

    /**
     * Filters the reference site URL to use for stats.
     *
     * This can be used to override the current site URL, for example when using the
     * plugin on a non-public site, such as in a staging environment.
     */
    $reference_site_url = apply_filters( 'googlesitekit_site_url', $site_url );
    $reference_site_url = untrailingslashit( $reference_site_url );

    // Ensure this is not empty.
    if ( empty( $reference_site_url ) ) {
        $reference_site_url = $site_url;
    }

    // If no URL given, just return the reference site URL.
    if ( empty( $url ) ) {
        return $reference_site_url;
    }

    // Replace the site URL with the reference site URL.
    if ( $reference_site_url !== $site_url ) {
        $url = str_replace( $site_url, $reference_site_url, $url );
    }

    return $url;
}
```

#### Canonical Home URL

```php
/**
 * Get the canonical home URL.
 *
 * \@return string Canonical home URL.
 */
public function get_canonical_home_url()
```

**Usage Example**:

```php
$home_url = $context->get_canonical_home_url();
// Result: https://example.com
```

Returns the value of the `googlesitekit_canonical_home_url` filter (added in 1.18.0), which defaults to `home_url()`. Plugins that dynamically modify `home_url()` per context (e.g. multilingual plugins) can use this filter to keep the URL considered by Site Kit stable.

**Location**: `includes/Context.php`

#### Reference Entity

```php
/**
 * Get the entity for the current request context.
 *
 * \@return Entity|null The current entity, or null if none could be determined.
 */
public function get_reference_entity()
```

This returns a `Google\Site_Kit\Core\Util\Entity` instance (not an array), or `null` when no entity can be determined. The `Entity` class exposes `get_url()`, `get_type()`, `get_title()`, `get_id()`, and `get_mode()`.

**Usage Example**:

```php
$entity = $context->get_reference_entity();
if ( $entity ) {
    $url   = $entity->get_url();   // e.g. https://example.com/?p=123
    $type  = $entity->get_type();  // e.g. 'post', 'term', 'blog'
    $title = $entity->get_title(); // e.g. 'Post Title'
    $id    = $entity->get_id();    // e.g. 123
}
```

To resolve an entity from an arbitrary URL instead of the current context, use `get_reference_entity_from_url( $url )`.

**Location**: `includes/Context.php`

### 4. Localization

#### Site Locale

```php
/**
 * Get locale for a specific context.
 *
 * \@param string $context Optional. 'site' or 'user'. Default 'site'.
 * \@param string $format  Optional. 'default', 'language-code', or 'language-variant'. Default 'default'.
 * \@return string Locale in the required format.
 */
public function get_locale( $context = 'site', $format = 'default' )
```

The `$context` selects which WordPress core function is called: `'user'` uses `get_user_locale()`, anything else uses `get_locale()`. The `$format` controls the returned shape:

- `'default'` returns the raw WordPress locale, e.g. `en_US`.
- `'language-code'` returns the part before the first underscore, e.g. `en`.
- `'language-variant'` returns the first two underscore-delimited segments, e.g. `en_US`.

**Usage Example**:

```php
// Get site locale in default format
$locale = $context->get_locale();
// Result: en_US

// Get site locale as language code
$lang = $context->get_locale( 'site', 'language-code' );
// Result: en

// Get user locale
$user_locale = $context->get_locale( 'user' );
// Result: es_ES (if user has Spanish preference)
```

**Location**: `includes/Context.php`

### 5. Input Access

The Context provides a safe abstraction for accessing superglobals (GET, POST, etc.) via the `Input` class.

#### Filter Input

```php
/**
 * Gets a specific external variable by name and optionally filters it.
 *
 * \@param int    $type               One of INPUT_GET, INPUT_POST, INPUT_COOKIE, INPUT_SERVER, or INPUT_ENV.
 * \@param string $variable_name      Name of a variable to get.
 * \@param int    $filter [optional]  The ID of the filter to apply. Default FILTER_DEFAULT.
 * \@param mixed  $options [optional] Associative array of options or bitwise disjunction of flags.
 * \@return mixed                     Value of the requested variable on success.
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

`filter()` is a method of the `Input` class, reached via `$context->input()`. `Input::filter()` wraps PHP's `filter_input()` and adds a fallback for `INPUT_ENV`/`INPUT_SERVER` in environments where `filter_input()` does not work for those types.

**Location**: `input()` (Context method) at `includes/Context.php`; `filter()` (Input class) at `includes/Core/Util/Input.php`

## Common Usage Patterns

### Pattern 1: Asset URL Generation

**Location**: `includes/Core/Assets/Assets.php` (see `get_assets()` and the `dist/assets/` base URL built from `$this->context->url( 'dist/assets/' )`)

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

**Location**: `includes/Core/Storage/Options.php` (`Options` implements `Options_Interface`)

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

**Location**: `includes/Core/Admin/Plugin_Action_Links.php`

```php
class Plugin_Action_Links {
    private $context;

    public function __construct( Context $context ) {
        $this->context = $context;
    }

    public function register() {
        add_filter(
            'plugin_action_links_' . GOOGLESITEKIT_PLUGIN_BASENAME,
            function ( $links ) {
                $settings_link = sprintf(
                    '<a href="%s">%s</a>',
                    esc_url( $this->context->admin_url( 'settings' ) ),
                    esc_html__( 'Settings', 'google-site-kit' )
                );

                array_unshift( $links, $settings_link );

                return $links;
            }
        );
    }
}
```

### Pattern 4: Entity-Specific Data

**Location**: Module code (e.g. `includes/Modules/Analytics_4.php`)

Modules use the reference URL and entity to scope data to the current context. The reference site URL is the most common value passed through (for example as `reference_site_url` in tag/inline data), while the entity gives the URL, type, title, and ID of the current page when needed.

```php
class Analytics_4 extends Module {
    private function get_reference_data() {
        // Reference site URL, honoring the googlesitekit_site_url filter.
        $site_url = $this->context->get_reference_site_url();

        // Entity for the current request (an Entity object, or null).
        $entity = $this->context->get_reference_entity();

        $data = array(
            'reference_site_url' => $site_url,
        );

        if ( $entity ) {
            $data['url']   = $entity->get_url();
            $data['title'] = $entity->get_title();
        }

        return $data;
    }
}
```

## Context Initialization

The Context object is created once by the main `Plugin` class and passed throughout the application. It is constructed from the plugin main file in `Plugin::__construct()` and exposed via `Plugin::context()`.

**Location**: `includes/Plugin.php` (`__construct()`, `register()`)

```php
final class Plugin {
    private $context;

    public function __construct( $main_file ) {
        $this->context = new Context( $main_file );
    }

    public function context() {
        return $this->context;
    }

    public function register() {
        // Pass context to all subsystems.
        $options = new Core\Storage\Options( $this->context );

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
