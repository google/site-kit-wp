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

**Location**: `includes/Core/Modules/Module.php`

All modules extend the abstract `Module` base class which provides:

-   Common dependencies (Context, Options, User_Options, Authentication, Assets, Transients)
-   Abstract methods that modules must implement
-   Shared functionality for all modules

```php
abstract class Module {
    protected $context;
    protected $options;
    protected $user_options;
    protected $authentication;
    protected $assets;
    protected $transients;

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
        $this->transients     = new Transients( $this->context );
        $this->info           = $this->parse_info( (array) $this->setup_info() );
    }

    /**
     * Registers functionality through WordPress hooks.
     */
    abstract public function register();

    /**
     * Set up module information.
     */
    abstract protected function setup_info();
}
```

### Module Registry

**Location**: `includes/Core/Modules/Modules.php`

The `Modules` class manages all available modules, handles registration, and resolves dependencies. The set of core module classes is declared in the private `$core_modules` map (`slug => class`) and registered through a `Module_Registry` instance, filterable via `googlesitekit_available_modules`.

```php
final class Modules {
    private $context;
    private $options;
    private $user_options;
    private $authentication;
    private $assets;

    private $modules      = array();
    private $dependencies = array();
    private $dependants   = array();

    public function register() {
        // ...settings, persistent registration and asset filters...

        // Only active (or force-active) modules have register() called on them.
        $active_modules = $this->get_active_modules();
        array_walk(
            $active_modules,
            function ( Module $module ) {
                $module->register();
            }
        );

        // ...inline data, sharing and capability filters...
    }
}
```

`get_active_modules()` already filters `get_available_modules()` down to force-active or option-enabled modules, so `register()` simply walks that list. There is no separate `is_active()` method on the module instances and no `googlesitekit_init`-gated `register_modules()` helper.

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
    use Module_With_Scopes_Trait; // Provides register_scopes_hook().

    public function get_scopes() {
        return array( self::READONLY_SCOPE );
    }

    public function register() {
        // The trait adds the scopes to the googlesitekit_auth_scopes filter.
        $this->register_scopes_hook();
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
     * Registers the tag.
     */
    public function register_tag();

    /**
     * Returns the Module_Tag_Matchers instance.
     *
     * \@return Module_Tag_Matchers
     */
    public function get_tag_matchers();

    /**
     * Checks if the module tag is found in the provided content.
     *
     * \@param string $content Content to search for the tags.
     * \@return bool
     */
    public function has_placed_tag_in_content( $content );
}
```

**Usage**:

```php
final class Analytics_4 extends Module implements Module_With_Tag {
    use Module_With_Tag_Trait; // Provides has_placed_tag_in_content().

    public function register_tag() {
        $tag = $this->context->is_amp()
            ? new AMP_Tag( $this->get_measurement_id(), self::MODULE_SLUG )
            : new Web_Tag( $this->get_measurement_id(), self::MODULE_SLUG );

        // ...configure and register the tag...
        $tag->register();
    }

    public function get_tag_matchers() {
        return new Tag_Matchers();
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
     * Checks if the current user has access to the current configured service entity.
     *
     * \@return bool|WP_Error
     */
    public function check_service_entity_access();
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
    public function get_inline_data() {
        return array(
            'propertyID'      => $this->get_settings()->get()['propertyID'],
            'webDataStreamID' => $this->get_settings()->get()['webDataStreamID'],
            'isGA4Connected'  => true,
        );
    }
}

// The Modules::inline_modules_data() callback (hooked onto the
// googlesitekit_inline_modules_data filter) merges this under the module slug,
// exposed to JavaScript on the _googlesitekitModulesData global, e.g.:
// _googlesitekitModulesData['analytics-4'].propertyID
```

#### Provides_Feature_Metrics

Indicates the module provides feature-level metrics. This interface lives under
`Core\Tracking`, not `Core\Modules`.

**Location**: `includes/Core/Tracking/Provides_Feature_Metrics.php`

**When to use**: When the module tracks and provides metrics for specific features (e.g., audience segmentation, conversion tracking, custom dimensions).

```php
interface Provides_Feature_Metrics {
    /**
     * Gets feature metrics to be tracked.
     *
     * \@return array Feature metrics tracking data tracked via the
     *               `site-management/features` endpoint.
     */
    public function get_feature_metrics();
}
```

**Usage**:

```php
use Google\Site_Kit\Core\Tracking\Feature_Metrics_Trait;
use Google\Site_Kit\Core\Tracking\Provides_Feature_Metrics;

final class Analytics_4 extends Module implements Provides_Feature_Metrics {
    use Feature_Metrics_Trait; // Provides register_feature_metrics().

    public function get_feature_metrics() {
        return array(
            'analytics_adsense_linked' => $this->is_adsense_connected(),
            // ...other metrics merged into the googlesitekit_feature_metrics filter.
        );
    }

    public function register() {
        // The trait hooks get_feature_metrics() into googlesitekit_feature_metrics.
        $this->register_feature_metrics();
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
final class Ads extends Module implements Module_With_Persistent_Registration {
    public function register_persistent() {
        // Register functionality that should run even when the module is not
        // active, e.g. exposing inline data regardless of activation status.
        add_filter(
            'googlesitekit_inline_modules_data',
            fn ( $data ) => $this->persistent_inline_modules_data( $data )
        );
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
final class Analytics_4 extends Module implements Module_With_Activation, Module_With_Deactivation {
    public function on_activation() {
        // Perform setup work, e.g. clearing a related dismissed item.
        $dismissed_items = new Dismissed_Items( $this->user_options );
        $dismissed_items->remove( 'key-metrics-connect-ga4-cta-widget' );
    }

    public function on_deactivation() {
        // Clean up when the module is deactivated.
        $this->resource_data_availability_date->reset_all_resource_dates();
        $this->get_settings()->delete();
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

**Location**: `includes/Core/Modules/Modules.php`

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

**Location**: `includes/Core/Modules/Modules.php`

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

**Location**: `includes/Core/Modules/Modules.php`

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

**Location**: `includes/Core/Modules/Modules.php`

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

**Location**: `includes/Modules/Analytics_4.php`

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

Modules provide data through the datapoint pattern. A datapoint is identified by an ID in
`METHOD:name` form (e.g. `GET:report`, `POST:create-property`) and is reached from the client
through the `modules/{slug}/data/{datapoint}` REST route (see `rest-api.md`).

**Location**: `includes/Core/Modules/Module.php`

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

### Datapoint Building Blocks

**Location**: `includes/Core/Modules/`

-   **`Datapoint`**: Base class holding the definition — service, required scopes, shareable flag, and the scopes-request message.
-   **`Shareable_Datapoint`**: `Datapoint` subclass whose `is_shareable()` always returns `true`, so the data may be served with the module owner's credentials.
-   **`Executable_Datapoint`**: Interface declaring `create_request()` / `parse_response()`, i.e. the datapoint executes itself instead of the module doing it.
-   **`Permission_Aware_Datapoint`**: Interface declaring `permission_callback()`, overriding the REST method's default permission check.

A datapoint class extends `Datapoint` (or `Shareable_Datapoint`) and implements
`Executable_Datapoint`:

```php
class Get_Accounts extends Datapoint implements Executable_Datapoint {

    public function create_request( Data_Request $data_request ) {
        // Resolves the `service` definition field to the Google service instance.
        $service = $this->get_service();

        return $service->accounts->listAccounts();
    }

    public function parse_response( $response, Data_Request $data ) {
        return array_map( array( Analytics_4::class, 'filter_account_with_ids' ), $response->getAccounts() );
    }
}
```

`create_request()` may return:

-   A `RequestInterface` — a deferred Google service call, executed with the OAuth client resolved for the datapoint (owner's client for a shared request, otherwise the current user's).
-   A `Closure` — invoked directly, for datapoints that only read/write local state and never call a Google API.
-   A `WP_Error` — returned to the caller as-is.
-   Anything else results in an `invalid_datapoint_request` error (HTTP 400).

For missing or malformed request parameters, either return a `WP_Error` or throw one of the
exceptions in `includes/Core/REST_API/Exception/` (`Missing_Required_Param_Exception`,
`Invalid_Param_Exception`); `execute_data_request()` converts thrown exceptions to `WP_Error`.

### Defining Datapoints

`get_datapoint_definitions()` returns a map of datapoint ID to its definition. The definition
fields understood by `Datapoint` are:

-   **service**: Service identifier string, or a callable returning a `Google_Service` instance (preferred; a callable defers service construction until the datapoint runs). Pass `''` for datapoints that don't call a Google API.
-   **scopes**: Additional OAuth scopes required beyond the module's base scopes.
-   **shareable**: Legacy flag for array definitions; class-based datapoints extend `Shareable_Datapoint` instead.
-   **request_scopes_message**: Message shown when the required scopes are missing.

Any other keys are dependencies read by the concrete datapoint's constructor.

```php
protected function get_datapoint_definitions() {
    return array(
        'GET:accounts'         => new Get_Accounts(
            array(
                'service' => function () {
                    return $this->get_service( 'analyticsadmin' );
                },
            )
        ),
        'POST:create-property' => new Create_Property(
            array(
                'reference_site_url'     => $this->context->get_reference_site_url(),
                'service'                => function () {
                    return $this->get_service( 'analyticsadmin' );
                },
                'scopes'                 => array( self::EDIT_SCOPE ),
                'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics property on your behalf.', 'google-site-kit' ),
            )
        ),
    );
}
```

`Module::get_datapoint_definition( 'GET:accounts' )` resolves a single definition (throwing
`Invalid_Datapoint_Exception` for an unknown ID) and memoizes the whole map, because a single
request resolves the same datapoint twice — once for the REST permission check and once to
execute it.

### Datapoint Classes

**Reference implementation**: `includes/Modules/Analytics_4/Datapoints/`

Analytics 4 defines one class per datapoint in a `Datapoints/` subdirectory of the module,
which keeps request building, response parsing and per-datapoint dependencies together instead
of in module-wide `switch` statements. Class names are the datapoint's action in PascalCase,
prefixed with a verb matching the operation — `Get_Report`, `Get_Account_Summaries`,
`Create_Property`, `Save_Audience_Settings`, `Sync_Custom_Dimensions`,
`Set_Google_Tag_ID_Mismatch`, `Update_Enhanced_Measurement_Settings` — so the class name and
the datapoint ID stay recognizably related without being mechanically derived from it
(`POST:enhanced-measurement-settings` → `Update_Enhanced_Measurement_Settings`).

Dependencies (settings, storage, transients, utility objects) are injected through the
definition array and unpacked in the constructor:

```php
class Set_Google_Tag_ID_Mismatch extends Datapoint implements Executable_Datapoint {

    private $transients;

    public function __construct( array $definition ) {
        parent::__construct( $definition );
        $this->transients = $definition['transients'];
    }

    public function create_request( Data_Request $data_request ) {
        if ( ! isset( $data_request['hasMismatchedTag'] ) ) {
            throw new Missing_Required_Param_Exception( 'hasMismatchedTag' );
        }

        // No Google API call — return a closure that mutates local state.
        return function () use ( $data_request ) {
            $this->transients->set( 'googlesitekit_inline_tag_id_mismatch', $data_request['hasMismatchedTag'] );
            return $data_request['hasMismatchedTag'];
        };
    }

    public function parse_response( $response, Data_Request $data ) {
        return $response;
    }
}
```

Datapoints that share behavior extend a common abstract base in the same directory — e.g.
`Site_Goals_Settings_Datapoint` centralizes the settings dependency, the pass-through
`parse_response()` and the permission callback for `Get_Site_Goals_Settings` and
`Save_Site_Goals_Settings`.

Each datapoint class has a matching test class under
`tests/phpunit/integration/Modules/Analytics_4/Datapoints/`, tagged `@group Datapoints`, that
instantiates the datapoint directly with fake services rather than going through the module.

### Registering Datapoints in the Module

The module composes the map and memoizes it, since building it instantiates every datapoint
object. Feature-flagged datapoints are appended conditionally:

**Location**: `includes/Modules/Analytics_4.php`

```php
protected function get_datapoint_definitions() {
    if ( $this->datapoints ) {
        return $this->datapoints;
    }

    $this->datapoints = array(
        // ...datapoint instances keyed by `METHOD:name`...
    );

    if ( Feature_Flags::enabled( 'siteGoals' ) ) {
        $this->datapoints['GET:form-metadata'] = new Get_Form_Metadata(
            array( 'service' => '' )
        );
    }

    return $this->datapoints;
}
```

### Shareable Datapoints

Shareable datapoints can be served to view-only users on a shared dashboard using the module
owner's credentials. `Module::is_shareable()` reports `true` when the module has an owner, is
connected, and defines at least one shareable datapoint.

A datapoint that needs to know whether the current request is a shared one receives a closure,
because `Module::is_shared_datapoint_request()` is protected:

```php
'GET:report' => new Get_Report(
    array(
        'service'           => function () {
            return $this->get_service( 'analyticsdata' );
        },
        'settings'          => $this->get_settings(),
        'context'           => $this->context,
        'is_shared_request' => function ( Datapoint $datapoint ) {
            return $this->is_shared_datapoint_request( $datapoint );
        },
    )
),
```

Datapoints that expose settings can also narrow what they return for non-admins — e.g.
`Get_Audience_Settings` returns the full settings for users with `MANAGE_OPTIONS` and only the
view-only keys otherwise.

### Permission-Aware Datapoints

By default a datapoint inherits the permission check of its HTTP method: readable datapoints
require view access, editable ones require `manage_options`. A datapoint implementing
`Permission_Aware_Datapoint` overrides that default — used, for example, so any
dashboard-viewing user can read form metadata or persist a per-user setting:

```php
class Get_Form_Metadata extends Shareable_Datapoint implements Executable_Datapoint, Permission_Aware_Datapoint {

    public function permission_callback() {
        return current_user_can( Permissions::VIEW_DASHBOARD );
    }
}
```

`REST_Modules_Controller` resolves the datapoint before running the permission check and
fails closed: if a datapoint's own `permission_callback()` throws, access is denied rather
than falling back to the broader default.

### Scope Validation

Before a datapoint runs, `execute_data_request()` validates the datapoint's `scopes` and then
the module's base scopes against the resolved OAuth client. A shortfall throws
`Insufficient_Scopes_Exception` carrying the required scopes and the datapoint's
`request_scopes_message` (defaulting to a generic “grant Site Kit permission” message), which
the client uses to prompt for the additional grant.

### Legacy Array Definitions

Modules that predate the datapoint classes still map datapoint IDs to plain definition arrays
and implement the request/response logic in the module's own `create_data_request()` and
`parse_data_response()` `switch` statements (AdSense, Tag Manager, PageSpeed Insights,
Reader Revenue Manager, Site Verification). `get_datapoint_definition()` wraps such an array in
a `Datapoint` instance, and `execute_data_request()` falls back to the module methods when the
datapoint doesn't implement `Executable_Datapoint`.

Search Console shows the intermediate state: `GET:matched-sites`, `GET:sites` and `POST:site`
remain array definitions, while `GET:searchanalytics` and `POST:searchanalytics-batch` use
datapoint classes (`includes/Modules/Search_Console/Datapoints/`) that delegate back to the
module through `prepare_args` / `create_request` callables passed in the definition.

Sign in with Google is fully class-based, with its single datapoint in a `Datapoint/`
subdirectory (`includes/Modules/Sign_In_With_Google/Datapoint/Compatibility_Checks.php`) —
follow Analytics 4's plural `Datapoints/` for new modules.

**New datapoints should be implemented as classes** following the Analytics 4 structure.

### Using Datapoints

```php
// Get data (typically in REST controller)
$accounts = $module->get_data( 'accounts' );

// Set data
$result = $module->set_data( 'create-property', array(
    'accountID' => 'accounts/12345',
) );

// List datapoint names (method prefixes stripped, de-duplicated)
$datapoints = $module->get_datapoints();
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

**Location**: `includes/Core/Modules/Modules.php`

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
