# Naming Conventions and File Structure

Site Kit follows consistent naming conventions for PHP classes, files, methods, properties, and constants to maintain code quality and readability.

## File and Directory Structure

### Directory Organization

```
includes/
├── Context.php                  # Core context class
├── Plugin.php                   # Main plugin class
├── loader.php                   # Autoloader and initialization
├── Core/                        # Framework-level functionality
│   ├── Admin/                   # Admin UI components
│   ├── Assets/                  # Asset management
│   ├── Authentication/          # OAuth and authentication
│   ├── Modules/                 # Module system
│   ├── REST_API/               # REST API framework
│   ├── Storage/                # Data storage abstractions
│   └── Util/                   # Utility classes and traits
└── Modules/                     # Google service modules
    ├── Analytics_4/            # Analytics 4 module
    │   ├── Settings.php        # Module settings
    │   ├── Tag.php            # Tracking tag
    │   └── ...
    ├── AdSense/                # AdSense module
    └── Search_Console/         # Search Console module
```

### Module Directory Structure

```
includes/Modules/
├── ModuleName.php              # Main module class (e.g., Analytics_4.php)
└── ModuleName/                 # Module-specific subdirectory
    ├── Settings.php            # Module settings class
    ├── Tag.php                 # Tracking tag class (if applicable)
    ├── REST_Controller.php     # REST API endpoints
    ├── Audience_Settings.php   # Additional settings classes
    └── ...                     # Other module-specific classes
```

## Class Naming

### PascalCase for Class Names

All class names use PascalCase with underscores for word separation.

```php
// Good examples
class Analytics_4 { }
class REST_Route { }
class Module_Settings { }
class User_Options { }
class OAuth_Client { }
class Google_Proxy { }

// Bad examples
class analytics4 { }              // lowercase
class restRoute { }               // camelCase
class module_settings { }         // snake_case lowercase
```

### Class Naming Patterns

#### Base Classes

```php
class Module { }                  // Abstract base class
class Setting { }                 // Base setting class
class Asset { }                   // Base asset class
```

#### Concrete Implementations

```php
class Analytics_4 extends Module { }
class Settings extends Module_Settings { }
class Script extends Asset { }
class Stylesheet extends Asset { }
```

#### Interfaces

```php
interface Module_With_Settings { }
interface Options_Interface { }
interface User_Options_Interface { }
```

Interfaces use descriptive names, often with `_Interface` suffix or `Module_With_*` pattern for capabilities.

#### Traits

```php
trait Method_Proxy_Trait { }
trait User_Aware_Trait { }
trait Module_With_Settings_Trait { }
trait Module_With_Owner_Trait { }
```

All traits use the `_Trait` suffix.

#### Controllers

```php
class REST_Modules_Controller { }
class REST_Search_Console_Controller { }
```

REST controllers use `REST_*_Controller` pattern.

## File Naming

### One Class Per File

Each class has its own file named exactly like the class.

```php
// File: includes/Core/Modules/Module.php
class Module { }

// File: includes/Modules/Analytics_4.php
final class Analytics_4 extends Module { }

// File: includes/Core/Storage/User_Options.php
final class User_Options implements User_Options_Interface { }
```

### Directory Matching Namespace

File paths mirror the namespace structure.

```php
// Namespace: Google\Site_Kit\Core\Modules
// File: includes/Core/Modules/Module.php

// Namespace: Google\Site_Kit\Modules\Analytics_4
// File: includes/Modules/Analytics_4/Settings.php
```

## Namespace Conventions

### Namespace Structure

```php
namespace Google\Site_Kit;                    // Root namespace
namespace Google\Site_Kit\Core;               // Core framework
namespace Google\Site_Kit\Core\Modules;       // Module system
namespace Google\Site_Kit\Modules\Analytics_4; // Specific module
```

### Namespace Pattern

```
Google\Site_Kit\{Category}\{SubCategory}\{ClassName}
```

### Examples

```php
// Core classes
namespace Google\Site_Kit\Core\Storage;
final class Options implements Options_Interface { }

// Module classes
namespace Google\Site_Kit\Modules\Analytics_4;
final class Analytics_4 extends Module { }

// Third-party dependencies
namespace Google\Site_Kit_Dependencies\Google\Service\Analytics;
```

## Method Naming

### snake_case for Methods

All methods use snake_case.

```php
class MyClass {
    // Good - snake_case
    public function get_settings() { }
    public function set_property_id( $id ) { }
    public function have_settings_changed() { }
    public function is_connected() { }

    // Bad - other styles
    public function getSettings() { }           // camelCase
    public function SetPropertyId( $id ) { }   // PascalCase
}
```

### Method Naming Patterns

#### Getters

```php
public function get_settings() { }
public function get_owner_id() { }
public function get_module( $slug ) { }
```

Prefix: `get_*`

#### Setters

```php
public function set_settings( $settings ) { }
public function set_owner_id( $owner_id ) { }
public function set_property_id( $property_id ) { }
```

Prefix: `set_*`

#### Boolean Methods

```php
public function is_connected() { }
public function is_active() { }
public function is_network_mode() { }
public function has_settings() { }
public function can_activate() { }
```

Prefixes: `is_*`, `has_*`, `can_*`, `should_*`

#### State Check Methods

```php
public function have_settings_changed() { }
public function have_owned_settings_changed() { }
```

Use `have_*` for plural state checks.

#### Action Methods

```php
public function register() { }
public function activate_module( $slug ) { }
public function deactivate_module( $slug ) { }
public function delete_option( $option ) { }
```

Use descriptive verb + noun pattern.

#### Setup/Initialization Methods

```php
protected function setup_info() { }
protected function setup_settings() { }
protected function setup_scopes() { }
protected function setup_assets() { }
```

Prefix: `setup_*` for abstract methods that configure components.

#### Callback Methods

```php
protected function get_sanitize_callback() { }
protected function get_validate_callback() { }
```

Pattern: `get_*_callback`

## Property Naming

### snake_case for Properties

```php
class MyClass {
    // Good - snake_case
    private $context;
    protected $user_options;
    private $oauth_client;

    // Bad - other styles
    private $Context;              // PascalCase
    private $userOptions;          // camelCase
}
```

### Visibility Modifiers

```php
class MyClass {
    // Private for internal use only
    private $context;
    private $options;

    // Protected for subclass access
    protected $settings;
    protected $module_assets;

    // Public rarely used (prefer private with getters)
    public $slug;  // Simple public properties
}
```

### Property Patterns

#### Dependency Properties

```php
private $context;
private $options;
private $user_options;
private $authentication;
```

Store injected dependencies as private properties.

#### Lazy-Loaded Properties

```php
protected $settings;
protected $oauth_client;
protected $google_client;
```

Properties that are initialized on first access.

#### Array Properties

```php
private $modules = array();
private $dependencies = array();
private $routes = array();
```

Initialize array properties with empty arrays.

## Constant Naming

### SCREAMING_SNAKE_CASE for Constants

```php
class MyClass {
    // Good - SCREAMING_SNAKE_CASE
    const OPTION = 'googlesitekit_settings';
    const REST_ROOT = 'google-site-kit/v1';
    const PROPERTY_CREATE = 'property::create';

    // Bad - other styles
    const option = 'googlesitekit_settings';         // lowercase
    const restRoot = 'google-site-kit/v1';          // camelCase
    const PropertyCreate = 'property::create';       // PascalCase
}
```

### Constant Patterns

#### Option Names

```php
const OPTION = 'googlesitekit_module_settings';
```

#### Module Slugs

```php
const MODULE_SLUG = 'analytics-4';
```

#### Special Values

```php
const PROPERTY_CREATE = 'property::create';
const ACCOUNT_CREATE = 'account::create';
```

#### Namespaces/Roots

```php
const REST_ROOT = 'google-site-kit/v1';
```

## Option and Setting Names

### Pattern: googlesitekit_{category}_{name}

```php
// Core options
const OPTION = 'googlesitekit_credentials';
const OPTION = 'googlesitekit_active_modules';
const OPTION = 'googlesitekit_db_version';

// Module settings
const OPTION = 'googlesitekit_analytics-4_settings';
const OPTION = 'googlesitekit_adsense_settings';
const OPTION = 'googlesitekit_search-console_settings';

// User options (same format, but stored per-user)
const USER_OPTION = 'googlesitekit_oauth_access_token';
const USER_OPTION = 'googlesitekit_user_profile';
```

### Transient Names

```php
// Pattern: googlesitekit_{module}_{data_type}
'googlesitekit_analytics_4_accounts'
'googlesitekit_analytics_4_properties'
'googlesitekit_search_console_sites'
```

## Hook Names

### Action Names

```php
// Pattern: googlesitekit_{action}_{context}
do_action( 'googlesitekit_init' );
do_action( 'googlesitekit_activate_module_analytics-4' );
do_action( 'googlesitekit_deactivate_module_analytics-4' );
```

### Filter Names

```php
// Pattern: googlesitekit_{data_type}_{context}
apply_filters( 'googlesitekit_rest_routes', $routes );
apply_filters( 'googlesitekit_assets', $assets );
apply_filters( 'googlesitekit_canonical_home_url', $url );
```

## REST Route Names

### Pattern: {category}/{feature}/data/{datapoint}

```php
// Core routes
'core/modules/data/list'
'core/modules/data/activation'
'core/user/data/permissions'

// Module routes
'modules/analytics-4/data/accounts'
'modules/analytics-4/data/properties'
'modules/search-console/data/sites'
```

## Variable Naming

### snake_case for Variables

```php
// Good - snake_case
$user_id = get_current_user_id();
$module_slug = 'analytics-4';
$oauth_token = $this->get_token();

// Bad - other styles
$userId = get_current_user_id();        // camelCase
$ModuleSlug = 'analytics-4';           // PascalCase
```

### Descriptive Names

```php
// Good - descriptive
$property_id = $settings['propertyID'];
$measurement_id = $settings['measurementID'];
$start_date = '30daysAgo';

// Bad - abbreviations
$pid = $settings['propertyID'];
$mid = $settings['measurementID'];
$sd = '30daysAgo';
```

### Loop Variables

```php
// Descriptive in foreach
foreach ( $modules as $module ) { }
foreach ( $routes as $route ) { }

// Short in simple for loops
for ( $i = 0; $i < $count; $i++ ) { }
```

## Function Naming

### snake_case for Functions

```php
// Good - snake_case
function googlesitekit_register_module( $module ) { }
function googlesitekit_get_option( $option ) { }

// Bad - other styles
function googlesitekitRegisterModule( $module ) { }
function GoogleSiteKitGetOption( $option ) { }
```

### Function Prefixing

All global functions use the `googlesitekit_` prefix to avoid conflicts.

```php
function googlesitekit_autoload_classes() { }
function googlesitekit_is_network_mode() { }
```

## PHPDoc Conventions

### Class Documentation

```php
/**
 * Class for managing module settings.
 *
 * \@since 1.0.0
 * @access private
 * @ignore
 */
final class Module_Settings extends Setting {
```

### Method Documentation

```php
/**
 * Get module settings.
 *
 * \@since 1.0.0
 *
 * \@param string $key     Optional. Setting key. Default empty string.
 * \@param mixed  $default Optional. Default value. Default null.
 * \@return mixed Setting value or default.
 */
public function get( $key = '', $default = null ) {
```

### Property Documentation

```php
/**
 * Plugin context instance.
 *
 * \@since 1.0.0
 * \@var Context
 */
private $context;
```

### \@since Tag Convention

For all new code (classes, methods, properties, constants), use `\@since n.e.x.t` as a placeholder.

```php
/**
 * New method added in development.
 *
 * \@since n.e.x.t
 *
 * \@param string $param Parameter description.
 * \@return bool True on success, false otherwise.
 */
public function new_method( $param ) {
```

```php
/**
 * New class added in development.
 *
 * \@since n.e.x.t
 */
final class New_Feature {
```

```php
/**
 * New property added in development.
 *
 * \@since n.e.x.t
 * \@var string
 */
private $new_property;
```

The `n.e.x.t` placeholder will be automatically replaced with the actual version number when a new version is released. This ensures consistent version tracking without needing to know the exact release version during development.

## Best Practices Summary

### DO

1. **Use PascalCase for class names**

    ```php
    class Analytics_4 extends Module { }
    ```

2. **Use snake_case for methods and properties**

    ```php
    public function get_settings() { }
    private $user_options;
    ```

3. **Use SCREAMING_SNAKE_CASE for constants**

    ```php
    const OPTION = 'googlesitekit_settings';
    ```

4. **Prefix global functions**

    ```php
    function googlesitekit_init() { }
    ```

5. **Use descriptive names**

    ```php
    $property_id  // Good
    $pid          // Bad
    ```

6. **One class per file**

    ```php
    // File: Module.php
    class Module { }
    ```

7. **Match file names to class names**
    ```php
    // Class: User_Options
    // File: User_Options.php
    ```

### DON'T

1. **Don't use camelCase for methods**

    ```php
    public function getSettings() { }  // Bad
    ```

2. **Don't abbreviate unnecessarily**

    ```php
    $opt   // Bad
    $mod   // Bad
    $usr   // Bad
    ```

3. **Don't mix naming styles**

    ```php
    class myClass { }               // Bad - wrong case
    public function Get_Data() { }  // Bad - mixed case
    ```

4. **Don't create multiple classes in one file**
    ```php
    // Bad - separate into multiple files
    class Module { }
    class Settings { }
    ```
