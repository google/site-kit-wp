# Storage Patterns

Site Kit uses context-aware storage abstractions that automatically handle multisite/network mode, caching, and provide a consistent API for storing data in WordPress.

## Overview

Site Kit provides three main storage classes:

-   **Options**: Site-wide settings (multisite-aware)
-   **User_Options**: Per-user settings (multisite-aware)
-   **Transients**: Temporary cached data with expiration

All storage classes implement interfaces and are context-aware, automatically adapting to the WordPress environment.

## Options Pattern

**Location**: `includes/Core/Storage/Options.php:1-125`

The `Options` class provides a multisite-aware wrapper around WordPress options API.

### Interface

```php
interface Options_Interface {
    public function get( $option );
    public function set( $option, $value );
    public function delete( $option );
    public function has( $option );
}
```

### Implementation

```php
final class Options implements Options_Interface {
    private $context;

    public function __construct( Context $context ) {
        $this->context = $context;
    }

    /**
     * Get option value.
     *
     * \@param string $option Option name.
     * \@return mixed Option value or false if not found.
     */
    public function get( $option ) {
        if ( $this->context->is_network_mode() ) {
            return get_network_option( null, $option );
        }
        return get_option( $option );
    }

    /**
     * Set option value.
     *
     * \@param string $option Option name.
     * \@param mixed  $value  Option value.
     * \@return bool True on success.
     */
    public function set( $option, $value ) {
        if ( $this->context->is_network_mode() ) {
            return update_network_option( null, $option, $value );
        }
        return update_option( $option, $value );
    }

    /**
     * Delete option.
     *
     * \@param string $option Option name.
     * \@return bool True on success.
     */
    public function delete( $option ) {
        if ( $this->context->is_network_mode() ) {
            return delete_network_option( null, $option );
        }
        return delete_option( $option );
    }

    /**
     * Check if option exists.
     *
     * \@param string $option Option name.
     * \@return bool True if option exists.
     */
    public function has( $option ) {
        $value = $this->get( $option );

        if ( $this->context->is_network_mode() ) {
            $network_id = get_current_network_id();
            $notoptions = wp_cache_get( "$network_id:notoptions", 'site-options' );
        } else {
            $notoptions = wp_cache_get( 'notoptions', 'options' );
        }

        return ! isset( $notoptions[ $option ] );
    }
}
```

### Usage Examples

#### Basic Usage

```php
class MyService {
    private $options;

    public function __construct( Options $options ) {
        $this->options = $options;
    }

    public function save_configuration( $config ) {
        // Automatically uses network options in network mode
        $this->options->set( 'googlesitekit_my_config', $config );
    }

    public function get_configuration() {
        return $this->options->get( 'googlesitekit_my_config' );
    }

    public function has_configuration() {
        return $this->options->has( 'googlesitekit_my_config' );
    }

    public function reset_configuration() {
        $this->options->delete( 'googlesitekit_my_config' );
    }
}
```

#### Multisite Behavior

```php
// Single site
$options = new Options( $context );  // $context->is_network_mode() = false
$options->set( 'my_option', 'value' );
// Calls: update_option( 'my_option', 'value' )

// Network mode
$options = new Options( $context );  // $context->is_network_mode() = true
$options->set( 'my_option', 'value' );
// Calls: update_network_option( null, 'my_option', 'value' )
```

## User Options Pattern

**Location**: `includes/Core/Storage/User_Options.php:1-140`

The `User_Options` class provides per-user settings storage with user context switching.

### Interface

```php
interface User_Options_Interface extends Options_Interface {
    public function get_user_id();
    public function switch_user( $user_id );
}
```

### Implementation

```php
final class User_Options implements User_Options_Interface {
    use User_Aware_Trait;

    private $context;

    public function __construct( Context $context, $user_id = 0 ) {
        $this->context = $context;
        $this->user_id = empty( $user_id ) ? get_current_user_id() : (int) $user_id;
    }

    /**
     * Get option for the current user.
     *
     * \@param string $option Option name.
     * \@return mixed Option value or false.
     */
    public function get( $option ) {
        $user_id = $this->get_user_id();
        if ( ! $user_id ) {
            return false;
        }

        if ( $this->context->is_network_mode() ) {
            $value = get_user_meta( $user_id, $option );
            return empty( $value ) ? false : $value[0];
        }

        return get_user_option( $option, $user_id );
    }

    /**
     * Set option for the current user.
     *
     * \@param string $option Option name.
     * \@param mixed  $value  Option value.
     * \@return bool True on success.
     */
    public function set( $option, $value ) {
        $user_id = $this->get_user_id();
        if ( ! $user_id ) {
            return false;
        }

        return update_user_option( $user_id, $option, $value );
    }

    /**
     * Delete user option.
     *
     * \@param string $option Option name.
     * \@return bool True on success.
     */
    public function delete( $option ) {
        $user_id = $this->get_user_id();
        if ( ! $user_id ) {
            return false;
        }

        return delete_user_option( $user_id, $option );
    }

    /**
     * Check if user has option.
     *
     * \@param string $option Option name.
     * \@return bool True if option exists.
     */
    public function has( $option ) {
        return false !== $this->get( $option );
    }

    /**
     * Get current user ID.
     *
     * \@return int User ID.
     */
    public function get_user_id() {
        return $this->user_id;
    }

    /**
     * Switch to a different user context.
     *
     * \@param int $user_id User ID to switch to.
     * \@return bool True on success.
     */
    public function switch_user( $user_id ) {
        $user_id = (int) $user_id;
        if ( ! $user_id ) {
            return false;
        }

        $this->user_id = $user_id;
        return true;
    }
}
```

### User_Aware_Trait

**Location**: `includes/Core/Storage/User_Aware_Trait.php`

```php
trait User_Aware_Trait {
    protected $user_id = 0;

    public function get_user_id() {
        return $this->user_id;
    }

    public function switch_user( $user_id ) {
        $this->user_id = (int) $user_id;
        return true;
    }
}
```

### Usage Examples

#### Per-User Settings

```php
class UserPreferences {
    private $user_options;

    public function __construct( User_Options $user_options ) {
        $this->user_options = $user_options;
    }

    public function save_dashboard_preference( $preference ) {
        // Saves for current user
        $this->user_options->set(
            'googlesitekit_dashboard_preference',
            $preference
        );
    }

    public function get_dashboard_preference() {
        return $this->user_options->get( 'googlesitekit_dashboard_preference' );
    }
}
```

#### User Context Switching

```php
// Initialize for current user
$user_options = new User_Options( $context, get_current_user_id() );
$current_user_data = $user_options->get( 'googlesitekit_preferences' );

// Switch to module owner to access their OAuth tokens
$owner_id = 123;
$user_options->switch_user( $owner_id );
$owner_token = $user_options->get( 'googlesitekit_oauth_access_token' );

// Switch back to current user
$user_options->switch_user( get_current_user_id() );
```

#### Module Owner Pattern

**Location**: `includes/Core/Modules/Module_With_Owner_Trait.php:40-81`

```php
trait Module_With_Owner_Trait {
    protected $owner_oauth_client;

    public function get_owner_oauth_client() {
        if ( $this->owner_oauth_client instanceof OAuth_Client ) {
            return $this->owner_oauth_client;
        }

        // Create user options for module owner
        $user_options = new User_Options(
            $this->context,
            $this->get_owner_id()  // Switch to owner's context
        );

        $this->owner_oauth_client = new OAuth_Client(
            $this->context,
            $this->options,
            $user_options,  // Owner's user options
            $this->authentication->credentials(),
            $this->authentication->get_google_proxy(),
            new Profile( $user_options ),
            new Token( $user_options )
        );

        return $this->owner_oauth_client;
    }
}
```

## Transients Pattern

**Location**: `includes/Core/Storage/Transients.php`

The `Transients` class provides temporary data storage with automatic expiration.

### Implementation

```php
final class Transients {
    private $context;

    public function __construct( Context $context ) {
        $this->context = $context;
    }

    /**
     * Get transient value.
     *
     * \@param string $transient Transient name.
     * \@return mixed Transient value or false if not found/expired.
     */
    public function get( $transient ) {
        if ( $this->context->is_network_mode() ) {
            return get_site_transient( $transient );
        }
        return get_transient( $transient );
    }

    /**
     * Set transient value.
     *
     * \@param string $transient  Transient name.
     * \@param mixed  $value      Transient value.
     * \@param int    $expiration Expiration in seconds.
     * \@return bool True on success.
     */
    public function set( $transient, $value, $expiration = 0 ) {
        if ( $this->context->is_network_mode() ) {
            return set_site_transient( $transient, $value, $expiration );
        }
        return set_transient( $transient, $value, $expiration );
    }

    /**
     * Delete transient.
     *
     * \@param string $transient Transient name.
     * \@return bool True on success.
     */
    public function delete( $transient ) {
        if ( $this->context->is_network_mode() ) {
            return delete_site_transient( $transient );
        }
        return delete_transient( $transient );
    }
}
```

### Usage Examples

#### Caching API Responses

```php
class AnalyticsData {
    private $transients;

    public function __construct( Transients $transients ) {
        $this->transients = $transients;
    }

    public function get_report( $report_options ) {
        $cache_key = 'googlesitekit_analytics_report_' . md5( serialize( $report_options ) );

        // Try to get cached data
        $cached = $this->transients->get( $cache_key );
        if ( false !== $cached ) {
            return $cached;
        }

        // Fetch fresh data from API
        $report_data = $this->fetch_from_api( $report_options );

        // Cache for 1 hour (3600 seconds)
        $this->transients->set( $cache_key, $report_data, HOUR_IN_SECONDS );

        return $report_data;
    }

    public function invalidate_cache( $report_options ) {
        $cache_key = 'googlesitekit_analytics_report_' . md5( serialize( $report_options ) );
        $this->transients->delete( $cache_key );
    }
}
```

#### Temporary State Storage

```php
// Store temporary activation state
$transients->set(
    'googlesitekit_module_activation_pending',
    array(
        'module' => 'analytics-4',
        'timestamp' => time(),
    ),
    5 * MINUTE_IN_SECONDS  // Expire after 5 minutes
);

// Check activation state
$pending = $transients->get( 'googlesitekit_module_activation_pending' );
if ( $pending && $pending['module'] === 'analytics-4' ) {
    // Continue activation flow
}

// Clear activation state
$transients->delete( 'googlesitekit_module_activation_pending' );
```

## Storage Naming Conventions

All Site Kit options and transients follow consistent naming patterns:

### Option Names

```php
// Format: googlesitekit_{category}_{name}
const OPTION_SETTINGS = 'googlesitekit_analytics-4_settings';
const OPTION_CREDENTIALS = 'googlesitekit_credentials';
const OPTION_ACTIVE_MODULES = 'googlesitekit_active_modules';
```

### User Option Names

```php
// Format: googlesitekit_{category}_{name} (same as options, but stored per-user)
const USER_OPTION_OAUTH_TOKEN = 'googlesitekit_oauth_access_token';
const USER_OPTION_PROFILE = 'googlesitekit_user_profile';
```

### Transient Names

```php
// Format: googlesitekit_{category}_{name}
const TRANSIENT_ACCOUNTS = 'googlesitekit_analytics_4_accounts';
const TRANSIENT_REPORT = 'googlesitekit_analytics_4_report_' . $hash;
```

## Encrypted Options

For sensitive data like OAuth credentials, Site Kit uses encrypted storage.

**Location**: `includes/Core/Storage/Encrypted_Options.php`

```php
final class Encrypted_Options extends Options {
    private $encryption;

    public function __construct( Context $context, Encryption $encryption ) {
        parent::__construct( $context );
        $this->encryption = $encryption;
    }

    public function get( $option ) {
        $encrypted = parent::get( $option );

        if ( false === $encrypted ) {
            return false;
        }

        return $this->encryption->decrypt( $encrypted );
    }

    public function set( $option, $value ) {
        $encrypted = $this->encryption->encrypt( $value );
        return parent::set( $option, $encrypted );
    }
}
```

### Usage

```php
// Store encrypted OAuth credentials
$encrypted_options = new Encrypted_Options( $context, $encryption );
$encrypted_options->set(
    'googlesitekit_credentials',
    array(
        'oauth_client_id'     => 'client-id',
        'oauth_client_secret' => 'client-secret',
    )
);

// Retrieve and decrypt
$credentials = $encrypted_options->get( 'googlesitekit_credentials' );
```

## Best Practices

### DO

1. **Always inject storage dependencies**

    ```php
    public function __construct( Options $options, User_Options $user_options ) {
        $this->options = $options;
        $this->user_options = $user_options;
    }
    ```

2. **Use consistent naming conventions**

    ```php
    const OPTION = 'googlesitekit_module_settings';
    ```

3. **Check if options exist before using**

    ```php
    if ( $options->has( 'googlesitekit_settings' ) ) {
        $settings = $options->get( 'googlesitekit_settings' );
    }
    ```

4. **Set transient expiration times**

    ```php
    $transients->set( 'cache_key', $data, HOUR_IN_SECONDS );
    ```

5. **Use User_Options for user-specific data**
    ```php
    $user_options->set( 'googlesitekit_user_preference', $value );
    ```

### DON'T

1. **Don't use WordPress functions directly**

    ```php
    // Bad
    update_option( 'my_option', $value );

    // Good
    $this->options->set( 'my_option', $value );
    ```

2. **Don't hardcode option names**

    ```php
    // Bad
    $options->get( 'googlesitekit_some_setting' );

    // Good
    const OPTION_SETTING = 'googlesitekit_some_setting';
    $options->get( self::OPTION_SETTING );
    ```

3. **Don't store sensitive data unencrypted**

    ```php
    // Bad
    $options->set( 'oauth_token', $token );

    // Good
    $encrypted_options->set( 'oauth_token', $token );
    ```

4. **Don't cache without expiration**

    ```php
    // Bad - never expires
    $transients->set( 'cache_key', $data );

    // Good - expires after 1 hour
    $transients->set( 'cache_key', $data, HOUR_IN_SECONDS );
    ```

5. **Don't use User_Options without switching context for other users**

    ```php
    // Bad - uses current user's context
    $owner_token = $user_options->get( 'oauth_token' );

    // Good - switch to owner's context
    $user_options->switch_user( $owner_id );
    $owner_token = $user_options->get( 'oauth_token' );
    $user_options->switch_user( get_current_user_id() );
    ```

## Storage Architecture Diagram

```
Plugin Instance
    └── Context
        ├── Options (site-wide)
        │   ├── Network Mode: get_network_option()
        │   └── Single Site: get_option()
        │
        ├── User_Options (per-user)
        │   ├── Network Mode: get_user_meta()
        │   └── Single Site: get_user_option()
        │
        ├── Transients (cached)
        │   ├── Network Mode: get_site_transient()
        │   └── Single Site: get_transient()
        │
        └── Encrypted_Options (sensitive)
            └── Options + Encryption
```
