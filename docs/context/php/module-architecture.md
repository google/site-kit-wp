# Module Architecture

Site Kit uses a plugin-based architecture where each Google service (Analytics, AdSense, Search Console, etc.) is implemented as an independent module with a consistent structure and lifecycle.

## Overview

The module architecture provides:

-   **Modular design**: Each Google service is self-contained
-   **Dependency management**: Modules can depend on other modules
-   **Lifecycle hooks**: Activation, deactivation, and registration
-   **Common interfaces**: Consistent API across all modules
-   **Trait composition**: Shared functionality through PHP traits

## Core Components

### Base Module Class

**Location**: `includes/Core/Modules/Module.php:1-819`

All modules extend the abstract `Module` base class which provides:

-   Common dependencies (Context, Options, User_Options, Authentication, Assets)
-   Abstract methods that modules must implement
-   Shared functionality for all modules

```php
abstract class Module {
    protected $context;
    protected $options;
    protected $user_options;
    protected $authentication;
    protected $assets;

    /**
     * Constructor.
     */
    public function __construct(
        Context $context,
        ?Options $options = null,
        ?User_Options $user_options = null,
        ?Authentication $authentication = null,
        ?Assets $assets = null
    ) {
        $this->context        = $context;
        $this->options        = $options ?: new Options( $this->context );
        $this->user_options   = $user_options ?: new User_Options( $this->context );
        $this->authentication = $authentication ?: new Authentication( $this->context, $this->options, $this->user_options );
        $this->assets         = $assets ?: new Assets( $this->context );
    }

    /**
     * Register module functionality.
     */
    abstract public function register();

    /**
     * Set up module information.
     */
    abstract protected function setup_info();
}
```

### Module Registry

**Location**: `includes/Core/Modules/Modules.php:1-1015`

The `Modules` class manages all available modules, handles registration, and resolves dependencies.

```php
final class Modules {
    private $context;
    private $options;
    private $user_options;
    private $authentication;
    private $assets;

    private $modules = array();
    private $dependencies = array();
    private $dependants = array();

    public function register() {
        add_action( 'googlesitekit_init', function () {
            $this->register_modules();
        });
    }

    private function register_modules() {
        $modules = $this->get_available_modules();

        foreach ( $modules as $module ) {
            if ( $module->is_connected() && $module->is_active() ) {
                $module->register();
            }
        }
    }
}
```

**Location**: `includes/Core/Modules/Modules.php:428-477`

## Module Interfaces

Modules implement various interfaces to add specific functionality. Each interface represents a capability.

### Core Interfaces

#### Module_With_Settings

Adds settings management capabilities.

**Location**: `includes/Core/Modules/Module_With_Settings.php`

**When to use**: When the module needs to store and manage settings in the database.

```php
interface Module_With_Settings {
    /**
     * Get module settings instance.
     *
     * \@return Module_Settings
     */
    public function get_settings();
}
```

**Usage**:

```php
final class Analytics_4 extends Module implements Module_With_Settings {
    use Module_With_Settings_Trait;

    protected function setup_settings() {
        return new Settings( $this->options );
    }
}

// Access settings
$settings = $module->get_settings();
$account_id = $settings->get()['accountID'];
```

#### Module_With_Scopes

Defines OAuth scopes required by the module.

**Location**: `includes/Core/Modules/Module_With_Scopes.php`

**When to use**: When the module requires specific Google OAuth scopes to access data.

```php
interface Module_With_Scopes {
    /**
     * Get required OAuth scopes.
     *
     * \@return array List of Google OAuth scopes.
     */
    public function get_scopes();
}
```

**Usage**:

```php
final class Analytics_4 extends Module implements Module_With_Scopes {
    use Module_With_Scopes_Trait;

    protected function setup_scopes() {
        return array(
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/analytics.edit',
        );
    }
}
```

#### Module_With_Assets

Enables JavaScript/CSS asset enqueueing.

**Location**: `includes/Core/Modules/Module_With_Assets.php`

**When to use**: When the module needs to enqueue specific JavaScript or CSS assets.

```php
interface Module_With_Assets {
    /**
     * Get module assets to enqueue.
     *
     * \@return array Array of Asset objects.
     */
    public function get_assets();
}
```

**Usage**:

```php
final class Analytics_4 extends Module implements Module_With_Assets {
    use Module_With_Assets_Trait;

    protected function setup_assets() {
        $base_url = $this->context->url( 'dist/assets/' );

        return array(
            new Script(
                'googlesitekit-modules-analytics-4',
                array(
                    'src'          => $base_url . 'js/googlesitekit-modules-analytics-4.js',
                    'dependencies' => array( 'googlesitekit-vendor' ),
                )
            ),
        );
    }
}
```

#### Module_With_Tag

Manages Google tracking tag output.

**Location**: `includes/Core/Modules/Module_With_Tag.php`

**When to use**: When the module outputs a tracking tag (e.g., Analytics, AdSense) on the frontend.

```php
interface Module_With_Tag {
    /**
     * Get the module tag instance.
     *
     * \@return Module_Tag
     */
    public function get_tag();
}
```

**Usage**:

```php
final class Analytics_4 extends Module implements Module_With_Tag {
    use Module_With_Tag_Trait;

    protected function setup_tag() {
        return new Tag( $this->options, $this->get_settings() );
    }
}
```

#### Module_With_Service_Entity

Associates module with a Google service entity (property, account, etc.).

**Location**: `includes/Core/Modules/Module_With_Service_Entity.php`

**When to use**: When the module maps to a specific Google service entity (like a property or account) and needs to expose that relationship.

```php
interface Module_With_Service_Entity {
    /**
     * Get the service entity access.
     *
     * \@return Service_Entity_Access
     */
    public function get_service_entity();
}
```

#### Module_With_Inline_Data

Provides inline data to be passed from the server to the client.

**Location**: `includes/Core/Modules/Module_With_Inline_Data.php`

**When to use**: When the module needs to pass server-side data to JavaScript, such as configuration or initial state.

```php
interface Module_With_Inline_Data {
    /**
     * Get inline data for the module.
     *
     * \@return array Associative array of inline data.
     */
    public function get_inline_data();
}
```

**Usage**:

```php
final class Analytics_4 extends Module implements Module_With_Inline_Data {
    use Module_With_Inline_Data_Trait;

    protected function setup_inline_data() {
        return array(
            'propertyID' => $this->get_settings()->get()['propertyID'],
            'webDataStreamID' => $this->get_settings()->get()['webDataStreamID'],
            'isGA4Connected' => true,
        );
    }
}

// Data is automatically made available to JavaScript via:
// googlesitekit.modules['analytics-4'].propertyID
```

#### Provides_Feature_Metrics

Indicates the module provides feature-level metrics.

**Location**: `includes/Core/Modules/Provides_Feature_Metrics.php`

**When to use**: When the module tracks and provides metrics for specific features (e.g., top cities, top content, user engagement).

```php
interface Provides_Feature_Metrics {
    /**
     * Get the feature metrics instance.
     *
     * \@return Feature_Metrics
     */
    public function get_feature_metrics();
}
```

**Usage**:

```php
final class Analytics_4 extends Module implements Provides_Feature_Metrics {
    use Feature_Metrics_Trait;

    protected function setup_feature_metrics() {
        return new Feature_Metrics( $this );
    }
}
```

#### Module_With_Persistent_Registration

Marks modules that need to remain registered even when not connected or active.

**Location**: `includes/Core/Modules/Module_With_Persistent_Registration.php`

**When to use**: When the module needs to register certain functionality (like REST endpoints or hooks) regardless of connection or activation status.

```php
interface Module_With_Persistent_Registration {
    /**
     * Register module functionality that persists.
     */
    public function register_persistent();
}
```

**Usage**:

```php
final class Analytics extends Module implements Module_With_Persistent_Registration {
    public function register_persistent() {
        // Register migration endpoints that should be available
        // even when the module is not fully connected
        $this->get_migration_controller()->register();
    }
}
```

#### Module_With_Activation / Module_With_Deactivation

Hooks for module lifecycle events.

**When to use**: When the module needs to perform specific actions during activation (e.g., clearing caches) or deactivation.

```php
interface Module_With_Activation {
    /**
     * Handle module activation.
     */
    public function on_activation();
}

interface Module_With_Deactivation {
    /**
     * Handle module deactivation.
     */
    public function on_deactivation();
}
```

**Usage**:

```php
final class Analytics_4 extends Module implements Module_With_Activation {
    public function on_activation() {
        // Reset data availability dates
        $this->resource_data_availability_date->reset_all();

        // Clear caches
        delete_transient( 'googlesitekit_analytics_4_properties' );
    }
}
```

## Module Information

Each module defines its metadata in the `setup_info()` method:

```php
protected function setup_info() {
    return array(
        'slug'        => 'analytics-4',
        'name'        => __( 'Analytics', 'google-site-kit' ),
        'description' => __( 'Get a deeper understanding of your customers.', 'google-site-kit' ),
        'order'       => 3,
        'homepage'    => __( 'https://analytics.google.com/', 'google-site-kit' ),
        'depends_on'  => array( 'analytics' ),  // Module dependencies
        'force_active' => false,                  // Cannot be deactivated
        'internal'    => false,                   // Not visible to users
    );
}
```

### Module Properties

-   **slug**: Unique identifier (e.g., 'analytics-4', 'adsense')
-   **name**: Display name shown in UI
-   **description**: Short description of the module
-   **order**: Display order in module lists
-   **homepage**: Link to the Google service
-   **depends_on**: Array of module slugs this module requires
-   **force_active**: If true, module cannot be deactivated
-   **internal**: If true, module is hidden from users

## Module Dependencies

Modules can depend on other modules. The Modules registry handles dependency resolution.

**Location**: `includes/Core/Modules/Modules.php:454-473`

```php
// Set up dependency maps
foreach ( $this->modules as $module ) {
    foreach ( $module->depends_on as $dependency ) {
        $this->dependencies[ $module->slug ][] = $dependency;
        $this->dependants[ $dependency ][]     = $module->slug;
    }
}
```

### Example: Module Dependencies

```php
// Analytics 4 depends on Tag Manager
protected function setup_info() {
    return array(
        'slug'       => 'analytics-4',
        'depends_on' => array( 'tagmanager' ),
    );
}

// When activating Analytics 4:
// 1. Check if Tag Manager is active
// 2. If not, activate Tag Manager first
// 3. Then activate Analytics 4
```

### Checking Dependencies

```php
// Get modules that this module depends on
$dependencies = $modules->get_module_dependencies( 'analytics-4' );
// Returns: array( 'tagmanager' )

// Get modules that depend on this module
$dependants = $modules->get_module_dependants( 'tagmanager' );
// Returns: array( 'analytics-4', 'ads' )
```

## Module Lifecycle

### 1. Registration

Modules are discovered and registered automatically:

```php
// In Modules::get_available_modules()
$module_classes = $this->get_registry()->get_all();

foreach ( $module_classes as $module_class ) {
    $instance = new $module_class(
        $this->context,
        $this->options,
        $this->user_options,
        $this->authentication,
        $this->assets
    );

    $this->modules[ $instance->slug ] = $instance;
}
```

### 2. Activation

**Location**: `includes/Core/Modules/Modules.php:644-726`

```php
public function activate_module( $slug ) {
    $module = $this->get_module( $slug );

    if ( ! $module ) {
        return new WP_Error( 'invalid_module', 'Invalid module.' );
    }

    // Activate dependencies first
    $dependencies = $this->get_module_dependencies( $slug );
    foreach ( $dependencies as $dependency_slug ) {
        if ( ! $this->is_module_active( $dependency_slug ) ) {
            $result = $this->activate_module( $dependency_slug );
            if ( is_wp_error( $result ) ) {
                return $result;
            }
        }
    }

    // Call module activation hook
    if ( $module instanceof Module_With_Activation ) {
        $module->on_activation();
    }

    // Mark module as active
    $active_modules = $this->get_active_modules();
    $active_modules[] = $slug;
    $this->set_active_modules( array_unique( $active_modules ) );

    do_action( "googlesitekit_activate_module_{$slug}", $module );

    return true;
}
```

### 3. Module Registration (Hook Setup)

**Location**: `includes/Core/Modules/Modules.php:350-380`

```php
private function register_modules() {
    $modules = $this->get_available_modules();

    foreach ( $modules as $module ) {
        // Only register connected and active modules
        if ( $module->is_connected() && $module->is_active() ) {
            $module->register();
        }
    }
}
```

### 4. Deactivation

**Location**: `includes/Core/Modules/Modules.php:728-800`

```php
public function deactivate_module( $slug ) {
    $module = $this->get_module( $slug );

    // Check if other modules depend on this one
    $dependants = $this->get_module_dependants( $slug );
    $active_dependants = array_filter( $dependants, array( $this, 'is_module_active' ) );

    if ( ! empty( $active_dependants ) ) {
        return new WP_Error(
            'module_has_dependants',
            'Cannot deactivate module with active dependants.',
            array( 'dependants' => $active_dependants )
        );
    }

    // Call module deactivation hook
    if ( $module instanceof Module_With_Deactivation ) {
        $module->on_deactivation();
    }

    // Remove from active modules
    $active_modules = $this->get_active_modules();
    $active_modules = array_diff( $active_modules, array( $slug ) );
    $this->set_active_modules( $active_modules );

    do_action( "googlesitekit_deactivate_module_{$slug}", $module );

    return true;
}
```

## Complete Module Example

**Location**: `includes/Modules/Analytics_4.php:119-400`

```php
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Tag;
use Google\Site_Kit\Core\Modules\Module_With_Tag_Trait;

final class Analytics_4 extends Module implements
    Module_With_Assets,
    Module_With_Settings,
    Module_With_Scopes,
    Module_With_Tag {

    use Module_With_Assets_Trait;
    use Module_With_Settings_Trait;
    use Module_With_Scopes_Trait;
    use Module_With_Tag_Trait;

    /**
     * Set up module information.
     */
    protected function setup_info() {
        return array(
            'slug'         => 'analytics-4',
            'name'         => __( 'Analytics', 'google-site-kit' ),
            'description'  => __( 'Get a deeper understanding of your customers.', 'google-site-kit' ),
            'order'        => 3,
            'homepage'     => __( 'https://analytics.google.com/', 'google-site-kit' ),
        );
    }

    /**
     * Set up module settings.
     */
    protected function setup_settings() {
        return new Settings( $this->options );
    }

    /**
     * Set up OAuth scopes.
     */
    protected function setup_scopes() {
        return array(
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/analytics.edit',
        );
    }

    /**
     * Set up module assets.
     */
    protected function setup_assets() {
        $base_url = $this->context->url( 'dist/assets/' );

        return array(
            new Script(
                'googlesitekit-modules-analytics-4',
                array(
                    'src'          => $base_url . 'js/googlesitekit-modules-analytics-4.js',
                    'dependencies' => array( 'googlesitekit-vendor', 'googlesitekit-runtime' ),
                )
            ),
        );
    }

    /**
     * Set up tracking tag.
     */
    protected function setup_tag() {
        return new Tag( $this->options, $this->get_settings() );
    }

    /**
     * Register module functionality.
     */
    public function register() {
        // Register REST routes
        $this->get_rest_controller()->register();

        // Register settings
        $this->get_settings()->register();

        // Setup tracking tag
        if ( $this->is_connected() ) {
            $this->get_tag()->register();
        }
    }
}
```

## Module Data Access

Modules provide data through the datapoint pattern.

**Location**: `includes/Core/Modules/Module.php:240-278`

```php
final public function get_data( $datapoint, $data = array() ) {
    return $this->execute_data_request(
        new Data_Request( 'GET', 'modules', $this->slug, $datapoint, $data )
    );
}

final public function set_data( $datapoint, $data ) {
    return $this->execute_data_request(
        new Data_Request( 'POST', 'modules', $this->slug, $datapoint, $data )
    );
}
```

### Defining Datapoints

```php
protected function get_datapoint_definitions() {
    return array(
        'GET:accounts' => new Datapoint(
            'analyticsadmin',
            array(
                'https://www.googleapis.com/auth/analytics.readonly',
            ),
            false, // Not shareable
            'Request Google OAuth access to list Analytics accounts'
        ),
        'POST:create-property' => new Datapoint(
            'analyticsadmin',
            array(
                'https://www.googleapis.com/auth/analytics.edit',
            )
        ),
    );
}
```

### Using Datapoints

```php
// Get data (typically in REST controller)
$accounts = $module->get_data( 'accounts' );

// Set data
$result = $module->set_data( 'create-property', array(
    'accountID' => 'accounts/12345',
) );
```

## Module State

### Connection Status

```php
// Check if module is connected (has necessary settings)
if ( $module->is_connected() ) {
    // Module is configured with Google account
}

// Check if module is active
if ( $module->is_active() ) {
    // Module is enabled by admin
}
```

### Activation Status

**Location**: `includes/Core/Modules/Modules.php:569-590`

```php
public function is_module_active( $slug ) {
    if ( ! $this->module_exists( $slug ) ) {
        return false;
    }

    $module = $this->get_module( $slug );

    // Force-active modules are always active
    if ( $module->force_active ) {
        return true;
    }

    // Check if module is in active modules list
    $active_modules = $this->get_active_modules();
    return in_array( $slug, $active_modules, true );
}
```

## Best Practices

### Creating a New Module

1. **Extend the Module base class**

    ```php
    final class My_Module extends Module {
    ```

2. **Implement required interfaces**

    ```php
    final class My_Module extends Module implements
        Module_With_Settings,
        Module_With_Scopes {
    ```

3. **Use appropriate traits**

    ```php
    use Module_With_Settings_Trait;
    use Module_With_Scopes_Trait;
    ```

4. **Implement setup_info()**

    ```php
    protected function setup_info() {
        return array(
            'slug' => 'my-module',
            'name' => __( 'My Module', 'google-site-kit' ),
        );
    }
    ```

5. **Implement abstract methods**
    ```php
    public function register() {
        // Register module functionality
    }
    ```

### Module Naming

-   **Class name**: PascalCase (e.g., `Analytics_4`, `Search_Console`)
-   **File name**: lowercase with hyphens (e.g., `analytics-4.php`)
-   **Slug**: lowercase with hyphens (e.g., 'analytics-4')

### Module Organization

```
includes/Modules/ModuleName/
├── ModuleName.php          # Main module class
├── Settings.php            # Module settings
├── Tag.php                 # Tracking tag (if applicable)
├── REST_Controller.php     # REST API endpoints
└── ...                     # Other module-specific classes
```
