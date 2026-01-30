# Asset Management

Site Kit uses a sophisticated asset management system that handles JavaScript and CSS registration, enqueueing, versioning, and inline data injection with WordPress integration.

## Overview

The asset management system provides:

-   **Type-safe asset classes**: Script, Stylesheet, and Script_Data
-   **Context-aware loading**: Assets load only in appropriate admin contexts
-   **Automatic versioning**: Hash-based cache busting via manifest
-   **Inline data injection**: Type-safe data passing from PHP to JavaScript
-   **Module integration**: Easy asset registration via Module_With_Assets interface
-   **WordPress integration**: Seamless hooks into WordPress enqueue system
-   **AMP compatibility**: Automatic AMP dev mode attributes

## Core Asset Classes

### Asset Base Class

**Location**: `includes/Core/Assets/Asset.php:1-132`

Abstract base class for all assets.

```php
abstract class Asset {
    const CONTEXT_ADMIN_GLOBAL       = 'admin-global';
    const CONTEXT_ADMIN_POST_EDITOR  = 'admin-post-editor';
    const CONTEXT_ADMIN_BLOCK_EDITOR = 'admin-block-editor';
    const CONTEXT_ADMIN_POSTS        = 'admin-posts';
    const CONTEXT_ADMIN_SITEKIT      = 'admin-sitekit';  // Default

    protected $handle;
    protected $args;

    public function __construct( $handle, array $args = array() ) {
        $this->handle = $handle;
        $this->args   = wp_parse_args(
            $args,
            array(
                'src'           => '',
                'dependencies'  => array(),
                'version'       => GOOGLESITEKIT_VERSION,
                'fallback'      => false,
                'before_print'  => null,
                'load_contexts' => array( self::CONTEXT_ADMIN_SITEKIT ),
            )
        );
    }

    abstract public function register( Context $context );
    abstract public function enqueue();
}
```

**Constructor Arguments**:

| Argument        | Type     | Description                              |
| --------------- | -------- | ---------------------------------------- |
| `src`           | string   | Asset source URL (required)              |
| `dependencies`  | array    | Asset handle dependencies                |
| `version`       | string   | Version string (default: plugin version) |
| `fallback`      | bool     | Only register if not already registered  |
| `before_print`  | callable | Callback executed before asset prints    |
| `load_contexts` | array    | Page contexts where asset should load    |

**Key Methods**:

```php
// Get unique asset handle
public function get_handle(): string

// Check if asset loads in given context
public function has_context( $context ): bool

// Execute before-print callback
public function before_print(): void
```

### Script Class

**Location**: `includes/Core/Assets/Script.php:1-174`

Handles JavaScript registration and enqueueing.

```php
final class Script extends Asset {
    public function __construct( $handle, array $args = array() ) {
        parent::__construct(
            $handle,
            wp_parse_args(
                $args,
                array(
                    'in_footer' => true,
                    'execution' => '',  // 'defer' or 'async'
                )
            )
        );
    }
}
```

**Additional Constructor Arguments**:

| Argument    | Type   | Description                               |
| ----------- | ------ | ----------------------------------------- |
| `in_footer` | bool   | Load in footer (default: true)            |
| `execution` | string | Script execution mode: 'defer' or 'async' |

#### Registration Process

**Location**: `includes/Core/Assets/Script.php:63-111`

```php
public function register( Context $context ) {
    // Skip if fallback and already registered
    if ( $this->args['fallback'] && wp_script_is( $this->handle, 'registered' ) ) {
        return;
    }

    $src     = $this->args['src'];
    $version = $this->args['version'];

    // Get manifest entry for versioning
    list( $filename, $hash ) = Manifest::get( $this->handle );

    if ( $filename ) {
        $src     = $context->url( 'dist/assets/js/' . $filename );
        $version = $hash;
    }

    // Register with WordPress
    wp_register_script(
        $this->handle,
        $src,
        (array) $this->args['dependencies'],
        $version,
        $this->args['in_footer']
    );

    // Add execution attributes
    if ( ! empty( $this->args['execution'] ) ) {
        wp_script_add_data( $this->handle, 'script_execution', $this->args['execution'] );
    }

    // Set up localization data
    if ( $src ) {
        $this->set_locale_data();
    }
}
```

#### Automatic Localization

**Location**: `includes/Core/Assets/Script.php:155-173`

```php
private function set_locale_data() {
    $json_translations = load_script_textdomain( $this->handle, 'google-site-kit' );
    if ( ! $json_translations ) {
        return;
    }

    $output = <<<JS
( function( domain, translations ) {
    try {
        var localeData = translations.locale_data[ domain ] || translations.locale_data.messages;
        localeData[""].domain = domain;
        googlesitekit.i18n.setLocaleData( localeData, domain );
    } catch {}
} )( "google-site-kit", {$json_translations} );
JS;

    wp_add_inline_script( $this->handle, $output, 'before' );
}
```

### Stylesheet Class

**Location**: `includes/Core/Assets/Stylesheet.php:1-91`

Handles CSS registration and enqueueing.

```php
final class Stylesheet extends Asset {
    public function __construct( $handle, array $args = array() ) {
        parent::__construct(
            $handle,
            wp_parse_args(
                $args,
                array(
                    'media' => 'all',
                )
            )
        );
    }

    public function register( Context $context ) {
        if ( $this->args['fallback'] && wp_style_is( $this->handle, 'registered' ) ) {
            return;
        }

        $src     = $this->args['src'];
        $version = $this->args['version'];

        list( $filename, $hash ) = Manifest::get( $this->handle );

        if ( $filename ) {
            $src     = $context->url( 'dist/assets/css/' . $filename );
            $version = $hash;
        }

        wp_register_style(
            $this->handle,
            $src,
            (array) $this->args['dependencies'],
            $version,
            $this->args['media']
        );
    }

    public function enqueue() {
        wp_enqueue_style( $this->handle );
    }
}
```

### Script_Data Class

**Location**: `includes/Core/Assets/Script_Data.php:1-80`

Virtual "data-only" script for injecting inline JavaScript data without a physical file.

```php
final class Script_Data extends Script {
    public function __construct( $handle, array $args = array() ) {
        $this->args = wp_parse_args(
            $args,
            array(
                'global'        => '',
                'data_callback' => null,
            )
        );

        // Lazy-load data via before_print callback
        $this->args['before_print'] = function ( $handle ) {
            if ( empty( $this->args['global'] ) || ! is_callable( $this->args['data_callback'] ) ) {
                return;
            }
            $data = call_user_func( $this->args['data_callback'], $handle );
            $this->add_script_data( $data );
        };

        parent::__construct( $handle, $this->args );
    }

    private function add_script_data( $data ) {
        $script_data = wp_scripts()->get_data( $this->handle, 'data' ) ?: '';
        $js = sprintf(
            'var %s = %s;',
            preg_replace( '[^\w\d_-]', '', $this->args['global'] ),
            wp_json_encode( $data )
        );
        wp_scripts()->add_data( $this->handle, 'data', trim( "$script_data\n$js" ) );
    }
}
```

**Constructor Arguments**:

| Argument        | Type     | Description                     |
| --------------- | -------- | ------------------------------- |
| `global`        | string   | JavaScript global variable name |
| `data_callback` | callable | Function returning data array   |
| `dependencies`  | array    | Optional dependencies           |

**Usage Example**:

```php
new Script_Data(
    'googlesitekit-base-data',
    array(
        'global'        => '_googlesitekitBaseData',
        'data_callback' => function () {
            return array(
                'homeURL'      => home_url( '/' ),
                'adminURL'     => admin_url(),
                'ampMode'      => $this->context->get_amp_mode(),
                'isNetworkMode' => $this->context->is_network_mode(),
            );
        },
    )
),
```

This outputs:

```html
<script id="googlesitekit-base-data-js-before">
	var _googlesitekitBaseData = {"homeURL":"https://example.com/","adminURL":"https://example.com/wp-admin/",...};
</script>
```

## Assets Manager

**Location**: `includes/Core/Assets/Assets.php:1-1152`

Central manager responsible for registering, enqueueing, and coordinating all plugin assets.

### Core Responsibilities

1. **Asset Registration**: Register all core and module assets
2. **Context-Based Enqueueing**: Load assets only where needed
3. **Inline Data Management**: Provide data to JavaScript
4. **WordPress Integration**: Hook into WordPress enqueue system
5. **Module Coordination**: Collect and register module assets

### Initialization

```php
final class Assets {
    private $context;
    private $assets = array();
    private $assets_registered = false;

    public function __construct( Context $context ) {
        $this->context = $context;
    }

    public function register() {
        $this->setup_hooks();
    }
}
```

### Asset Definition

**Location**: `includes/Core/Assets/Assets.php:346-751`

```php
private function get_assets() {
    if ( $this->assets ) {
        return $this->assets;
    }

    $base_url = $this->context->url( 'dist/assets/' );

    $this->assets = array(
        // Core runtime
        'googlesitekit-runtime' => new Script(
            'googlesitekit-runtime',
            array(
                'src' => $base_url . 'js/runtime.js',
            )
        ),

        // Vendor libraries
        'googlesitekit-vendor' => new Script(
            'googlesitekit-vendor',
            array(
                'src'          => $base_url . 'js/googlesitekit-vendor.js',
                'dependencies' => array(
                    'googlesitekit-i18n',
                    'googlesitekit-runtime',
                ),
            )
        ),

        // Inline data scripts
        'googlesitekit-base-data' => new Script_Data(
            'googlesitekit-base-data',
            array(
                'global'        => '_googlesitekitBaseData',
                'data_callback' => function () {
                    return $this->get_inline_base_data();
                },
            )
        ),

        // Dashboard script
        'googlesitekit-dashboard' => new Script(
            'googlesitekit-dashboard',
            array(
                'src'          => $base_url . 'js/googlesitekit-dashboard.js',
                'dependencies' => $this->get_asset_dependencies( 'dashboard' ),
            )
        ),

        // Stylesheets
        'googlesitekit-fonts' => new Stylesheet(
            'googlesitekit-fonts',
            array(
                'src'     => $this->get_fonts_src(),
                'version' => null,
            )
        ),
    );

    // Allow modules to add their assets
    $this->assets = apply_filters( 'googlesitekit_assets', $this->assets );

    return $this->assets;
}
```

### WordPress Hook Integration

**Location**: `includes/Core/Assets/Assets.php:79-183`

```php
public function register() {
    // Register assets on enqueue hooks
    $register_callback = function () {
        if ( ! is_admin() ) {
            return;
        }

        if ( $this->assets_registered ) {
            return;
        }

        $this->assets_registered = true;
        $this->register_assets();
    };

    add_action( 'admin_enqueue_scripts', $register_callback );
    add_action( 'wp_enqueue_scripts', $register_callback );

    // Add async/defer attributes
    add_filter(
        'script_loader_tag',
        function ( $tag, $handle ) {
            return $this->add_async_defer_attribute( $tag, $handle );
        },
        10,
        2
    );

    // Context-specific hooks
    $this->register_context_hooks();

    // Before-print callbacks
    $this->register_print_hooks();
}
```

### Context-Specific Loading

```php
private function register_context_hooks() {
    // CONTEXT_ADMIN_POSTS - Post list view
    add_action(
        'admin_print_scripts-edit.php',
        function () {
            global $post_type;
            if ( 'post' !== $post_type ) {
                return;
            }

            $this->enqueue_assets_for_context( Asset::CONTEXT_ADMIN_POSTS );
        }
    );

    // CONTEXT_ADMIN_BLOCK_EDITOR - Block editor
    add_action(
        'enqueue_block_assets',
        function () {
            $this->enqueue_assets_for_context( Asset::CONTEXT_ADMIN_BLOCK_EDITOR );
        }
    );

    // CONTEXT_ADMIN_POST_EDITOR - Post editor
    add_action(
        'enqueue_block_editor_assets',
        function () {
            $this->enqueue_assets_for_context( Asset::CONTEXT_ADMIN_POST_EDITOR );
        }
    );
}

private function enqueue_assets_for_context( $context ) {
    $assets = $this->get_assets();

    array_walk(
        $assets,
        function ( Asset $asset ) use ( $context ) {
            if ( $asset->has_context( $context ) ) {
                $this->enqueue_asset( $asset->get_handle() );
            }
        }
    );
}
```

### Inline Data Methods

#### Base Data

**Location**: `includes/Core/Assets/Assets.php:763-800`

```php
private function get_inline_base_data() {
    return array(
        'homeURL'              => home_url( '/' ),
        'referenceSiteURL'     => $this->context->get_reference_site_url(),
        'userIDHash'           => md5( $this->context->get_reference_site_url() . get_current_user_id() ),
        'adminURL'             => admin_url(),
        'assetsURL'            => $this->context->url( 'dist/assets/' ),
        'ampMode'              => $this->context->get_amp_mode(),
        'isNetworkMode'        => $this->context->is_network_mode(),
        'timezone'             => get_option( 'timezone_string' ),
        'siteName'             => get_bloginfo( 'name' ),
        'enabledFeatures'      => $this->get_enabled_features(),
        'postTypes'            => $this->get_post_types(),
        'storagePrefix'        => $this->get_storage_prefix(),
        'userRoles'            => $this->get_user_roles(),
        'isOwner'              => current_user_can( Permissions::MANAGE_OPTIONS ),
        'splashURL'            => $this->context->admin_url( 'splash' ),
    );
}
```

#### Entity Data

**Location**: `includes/Core/Assets/Assets.php:853-862`

```php
private function get_inline_entity_data() {
    $reference_url = $this->context->get_reference_site_url();
    $entity        = $this->context->get_reference_entity();

    return array(
        'currentEntityURL'   => $reference_url,
        'currentEntityType'  => $entity['type'] ?? null,
        'currentEntityTitle' => $entity['title'] ?? null,
        'currentEntityID'    => $entity['id'] ?? null,
    );
}
```

#### User Data

**Location**: `includes/Core/Assets/Assets.php:871-894`

```php
private function get_inline_user_data() {
    $current_user = wp_get_current_user();

    return array(
        'id'      => $current_user->ID,
        'email'   => $current_user->user_email,
        'name'    => $current_user->display_name,
        'picture' => get_avatar_url( $current_user->user_email ),
    );
}
```

#### Module Data

**Location**: `includes/Core/Assets/Assets.php:1007-1017`

```php
private function get_inline_modules_data() {
    // Modules provide their data via filter
    return apply_filters( 'googlesitekit_inline_modules_data', array() );
}
```

### Manual Enqueueing

```php
public function enqueue_asset( $handle ) {
    // Register assets if not already done
    if ( ! $this->assets_registered ) {
        $this->assets_registered = true;
        $this->register_assets();
    }

    $assets = $this->get_assets();
    if ( empty( $assets[ $handle ] ) ) {
        return;
    }

    $assets[ $handle ]->enqueue();
}
```

## Module Asset Integration

### Module_With_Assets Interface

**Location**: `includes/Core/Modules/Module_With_Assets.php:1-42`

Modules implement this interface to provide assets.

```php
interface Module_With_Assets {
    /**
     * Get assets to register for the module.
     *
     * \@return Asset[] Array of Asset instances.
     */
    public function get_assets();

    /**
     * Enqueue all assets for the module.
     *
     * \@param string $asset_context Context constant (Asset::CONTEXT_*).
     */
    public function enqueue_assets( $asset_context = Asset::CONTEXT_ADMIN_SITEKIT );
}
```

### Module_With_Assets_Trait

**Location**: `includes/Core/Modules/Module_With_Assets_Trait.php:1-79`

Provides default implementation.

```php
trait Module_With_Assets_Trait {
    protected $registerable_assets;

    /**
     * Get module assets.
     */
    public function get_assets() {
        if ( null === $this->registerable_assets ) {
            $this->registerable_assets = $this->setup_assets();
        }
        return $this->registerable_assets;
    }

    /**
     * Enqueue assets for given context.
     */
    public function enqueue_assets( $asset_context = Asset::CONTEXT_ADMIN_SITEKIT ) {
        $assets = $this->get_assets();

        array_walk(
            $assets,
            function ( Asset $asset, $index, $asset_context ) {
                if ( $asset->has_context( $asset_context ) ) {
                    $asset->enqueue();
                }
            },
            $asset_context
        );
    }

    /**
     * Set up module assets.
     *
     * \@return Asset[] Array of Asset instances.
     */
    abstract protected function setup_assets();
}
```

### Module Asset Registration

**Location**: `includes/Core/Modules/Modules.php:233-243`

The Modules registry collects assets from all modules:

```php
add_filter(
    'googlesitekit_assets',
    function ( $assets ) use ( $available_modules ) {
        foreach ( $available_modules as $module ) {
            if ( $module instanceof Module_With_Assets ) {
                $assets = array_merge( $assets, $module->get_assets() );
            }
        }
        return $assets;
    }
);
```

### Module_With_Inline_Data Interface

**Location**: `includes/Core/Modules/Module_With_Inline_Data.php:1-31`

Modules implement this to provide inline data to JavaScript.

```php
interface Module_With_Inline_Data {
    /**
     * Get inline data for the module.
     *
     * \@param array $modules_data Existing modules data.
     * \@return array Updated modules data with module's data added.
     */
    public function get_inline_data( $modules_data );
}
```

### Module_With_Inline_Data_Trait

**Location**: `includes/Core/Modules/Module_With_Inline_Data_Trait.php:1-33`

```php
trait Module_With_Inline_Data_Trait {

    private function register_inline_data() {
        add_filter(
            'googlesitekit_inline_modules_data',
            array( $this, 'get_inline_data' ),
        );
    }
}
```

### Module Examples

#### Simple Module Assets

```php
final class Analytics_4 extends Module implements
    Module_With_Assets,
    Module_With_Inline_Data {

    use Module_With_Assets_Trait;
    use Module_With_Inline_Data_Trait;

    protected function setup_assets() {
        $base_url = $this->context->url( 'dist/assets/' );

        return array(
            new Script(
                'googlesitekit-modules-analytics-4',
                array(
                    'src'          => $base_url . 'js/googlesitekit-modules-analytics-4.js',
                    'dependencies' => array(
                        'googlesitekit-vendor',
                        'googlesitekit-api',
                        'googlesitekit-data',
                        'googlesitekit-modules',
                        'googlesitekit-datastore-site',
                        'googlesitekit-datastore-user',
                    ),
                )
            ),
        );
    }

    public function get_inline_data( $modules_data ) {
        if ( ! $this->is_connected() ) {
            return $modules_data;
        }

        $modules_data[ self::MODULE_SLUG ] = array(
            'propertyID'      => $this->get_settings()->get()['propertyID'],
            'webDataStreamID' => $this->get_settings()->get()['webDataStreamID'],
        );

        return $modules_data;
    }
}
```

#### Context-Aware Assets

```php
protected function setup_assets() {
    $base_url = $this->context->url( 'dist/assets/' );

    $assets = array(
        // Main module script (Site Kit dashboard)
        new Script(
            'googlesitekit-modules-reader-revenue-manager',
            array(
                'src'          => $base_url . 'js/googlesitekit-modules-reader-revenue-manager.js',
                'dependencies' => array(
                    'googlesitekit-vendor',
                    'googlesitekit-api',
                    'googlesitekit-data',
                ),
            )
        ),
    );

    // Block editor assets
    if ( Block_Support::has_block_support() && $this->is_connected() ) {
        $assets[] = new Script(
            'blocks-rrm-block-editor-plugin',
            array(
                'src'           => $base_url . 'blocks/reader-revenue-manager/block-editor-plugin/index.js',
                'dependencies'  => array(
                    'googlesitekit-modules-reader-revenue-manager',
                ),
                'execution'     => 'defer',
                'load_contexts' => array( Asset::CONTEXT_ADMIN_POST_EDITOR ),
            )
        );

        $assets[] = new Stylesheet(
            'blocks-rrm-block-editor-plugin-styles',
            array(
                'src'           => $base_url . 'blocks/reader-revenue-manager/block-editor-plugin/editor-styles.css',
                'load_contexts' => array( Asset::CONTEXT_ADMIN_POST_EDITOR ),
            )
        );
    }

    return $assets;
}
```

#### Conditional Assets with Feature Flags

```php
protected function setup_assets() {
    $base_url = $this->context->url( 'dist/assets/' );

    $assets = array(
        new Script(
            'googlesitekit-modules-ads',
            array(
                'src'          => $base_url . 'js/googlesitekit-modules-ads.js',
                'dependencies' => array(
                    'googlesitekit-vendor',
                    'googlesitekit-api',
                    'googlesitekit-data',
                ),
            )
        ),
    );

    // Conditional asset based on feature flag
    if ( Feature_Flags::enabled( 'adsPax' ) ) {
        $assets[] = new Script_Data(
            'googlesitekit-ads-pax-config',
            array(
                'global'        => '_googlesitekitPAXConfig',
                'data_callback' => function () {
                    if ( ! current_user_can( Permissions::VIEW_AUTHENTICATED_DASHBOARD ) ) {
                        return array();
                    }

                    $config = new PAX_Config( $this->context, $this->authentication->token() );
                    return $config->get();
                },
            )
        );
    }

    return $assets;
}
```

## Asset Contexts

Site Kit uses five page contexts to control where assets load:

| Context            | Constant                     | Use Case                 | Hook                           |
| ------------------ | ---------------------------- | ------------------------ | ------------------------------ |
| Admin Global       | `CONTEXT_ADMIN_GLOBAL`       | All admin pages          | `admin_enqueue_scripts`        |
| Site Kit Dashboard | `CONTEXT_ADMIN_SITEKIT`      | Site Kit pages (default) | `admin_enqueue_scripts`        |
| Post Editor        | `CONTEXT_ADMIN_POST_EDITOR`  | Block editor scripts     | `enqueue_block_editor_assets`  |
| Block Editor       | `CONTEXT_ADMIN_BLOCK_EDITOR` | Block editor assets      | `enqueue_block_assets`         |
| Posts List         | `CONTEXT_ADMIN_POSTS`        | Post list view           | `admin_print_scripts-edit.php` |

### Context Usage

```php
// Load asset only in block editor
new Script(
    'my-block-script',
    array(
        'src'           => $base_url . 'js/my-block.js',
        'load_contexts' => array( Asset::CONTEXT_ADMIN_POST_EDITOR ),
    )
)

// Load in multiple contexts
new Script(
    'my-shared-script',
    array(
        'src'           => $base_url . 'js/shared.js',
        'load_contexts' => array(
            Asset::CONTEXT_ADMIN_SITEKIT,
            Asset::CONTEXT_ADMIN_POST_EDITOR,
        ),
    )
)
```

## Manifest and Versioning

### Manifest Class

**Location**: `includes/Core/Assets/Manifest.php:1-66`

Maps asset handles to filenames and content hashes for cache busting.

```php
final class Manifest {
    private static $data = null;

    /**
     * Get manifest entry for asset handle.
     *
     * \@param string $handle Asset handle.
     * \@return array [ $filename, $hash ] or [ null, null ] if not found.
     */
    public static function get( $handle ) {
        if ( null === self::$data ) {
            self::load();
        }

        if ( isset( self::$data[ $handle ] ) ) {
            return self::$data[ $handle ];
        }

        return array( null, null );
    }

    private static function load() {
        $manifest_path = GOOGLESITEKIT_PLUGIN_DIR_PATH . 'dist/manifest.php';

        if ( file_exists( $manifest_path ) ) {
            self::$data = require $manifest_path;
        } else {
            self::$data = array();
        }
    }
}
```

### Manifest File Format

**Location**: `dist/manifest.php`

```php
<?php
return array(
    'googlesitekit-i18n'    => array( 'googlesitekit-i18n.js', 'ccf695ce475cdcca1ea3' ),
    'googlesitekit-api'     => array( 'googlesitekit-api.js', 'fd23ad80792af408ddcf' ),
    'googlesitekit-vendor'  => array( 'googlesitekit-vendor.js', '8b4d2c71ae36f2e9bc5a' ),
    // ... more entries
);
```

### Versioning Strategy

**Development**: Uses `GOOGLESITEKIT_VERSION` constant

```php
new Script(
    'my-script',
    array(
        'src'     => 'path/to/script.js',
        'version' => GOOGLESITEKIT_VERSION,  // e.g., '1.100.0'
    )
)
```

**Production**: Uses content hash from manifest

```php
// Manifest provides: [ 'my-script.js', 'abc123def456' ]
// Result: path/to/my-script-abc123def456.js?ver=abc123def456
```

## Special Features

### Async and Defer Script Loading

**Location**: `includes/Core/Assets/Assets.php:1028-1051`

```php
new Script(
    'my-async-script',
    array(
        'src'       => $base_url . 'js/my-script.js',
        'execution' => 'async',  // or 'defer'
    )
)
```

Results in:

```html
<script src="path/to/my-script.js" async></script>
```

### Fallback Assets

Only register if not already registered (useful for polyfills):

```php
new Script(
    'polyfill',
    array(
        'src'      => $base_url . 'js/polyfill.js',
        'fallback' => true,
    )
)
```

### Before-Print Callbacks

Execute custom logic just before asset prints:

```php
new Script(
    'my-script',
    array(
        'src'          => $base_url . 'js/my-script.js',
        'before_print' => function ( $handle ) {
            // Add inline data
            $data = array( 'setting' => get_option( 'my_setting' ) );
            wp_add_inline_script( $handle, 'var myData = ' . wp_json_encode( $data ) . ';', 'before' );
        },
    )
)
```

### AMP Compatibility

**Location**: `includes/Core/Assets/Assets.php:274-299`

Assets automatically receive AMP dev mode attributes when in AMP context:

```html
<!-- In AMP mode -->
<script src="path/to/script.js" data-ampdevmode></script>
<link rel="stylesheet" href="path/to/style.css" data-ampdevmode />
```

## Best Practices

### DO

1. **Use the Asset classes instead of direct WordPress functions**

    ```php
    // Good
    new Script(
        'my-script',
        array(
            'src'          => $base_url . 'js/my-script.js',
            'dependencies' => array( 'googlesitekit-vendor' ),
        )
    )

    // Bad - bypass asset system
    wp_register_script( 'my-script', 'path/to/script.js' );
    ```

2. **Always define dependencies**

    ```php
    new Script(
        'my-script',
        array(
            'src'          => $base_url . 'js/my-script.js',
            'dependencies' => array(
                'googlesitekit-vendor',
                'googlesitekit-data',
                'googlesitekit-api',
            ),
        )
    )
    ```

3. **Use appropriate load contexts**

    ```php
    // Block editor script
    new Script(
        'my-block',
        array(
            'src'           => $base_url . 'js/my-block.js',
            'load_contexts' => array( Asset::CONTEXT_ADMIN_POST_EDITOR ),
        )
    )
    ```

4. **Leverage Script_Data for inline data**

    ```php
    new Script_Data(
        'my-config',
        array(
            'global'        => '_myConfig',
            'data_callback' => function () {
                return $this->get_config_data();
            },
        )
    )
    ```

5. **Use before_print callbacks for just-in-time data**
    ```php
    new Script(
        'my-script',
        array(
            'src'          => $base_url . 'js/my-script.js',
            'before_print' => function () {
                // Load data only when script is actually printed
                $data = $this->get_expensive_data();
                wp_add_inline_script( 'my-script', 'var data = ' . wp_json_encode( $data ) . ';', 'before' );
            },
        )
    )
    ```

### DON'T

1. **Don't use WordPress enqueue functions directly**

    ```php
    // Bad
    wp_enqueue_script( 'my-script', 'path/to/script.js' );

    // Good
    $this->assets->enqueue_asset( 'my-script' );
    ```

2. **Don't hardcode asset URLs**

    ```php
    // Bad
    'src' => GOOGLESITEKIT_PLUGIN_URL . '/dist/assets/js/script.js',

    // Good
    'src' => $this->context->url( 'dist/assets/js/script.js' ),
    ```

3. **Don't skip version parameter**

    ```php
    // Bad - no cache busting
    'version' => null,

    // Good - uses manifest hash or plugin version
    'version' => GOOGLESITEKIT_VERSION,
    ```

4. **Don't add assets without checking permissions**

    ```php
    // Bad
    protected function setup_assets() {
        return array(
            new Script( /* sensitive admin script */ ),
        );
    }

    // Good
    protected function setup_assets() {
        $assets = array();

        if ( current_user_can( Permissions::VIEW_AUTHENTICATED_DASHBOARD ) ) {
            $assets[] = new Script( /* sensitive admin script */ );
        }

        return $assets;
    }
    ```

5. **Don't load assets globally when context-specific loading is possible**

    ```php
    // Bad - loads everywhere
    new Script(
        'my-block-script',
        array(
            'src' => $base_url . 'js/my-block.js',
        )
    )

    // Good - loads only in block editor
    new Script(
        'my-block-script',
        array(
            'src'           => $base_url . 'js/my-block.js',
            'load_contexts' => array( Asset::CONTEXT_ADMIN_POST_EDITOR ),
        )
    )
    ```

### Getting Standard Dependencies

**Location**: `includes/Core/Assets/Assets.php:309-335`

```php
private function get_asset_dependencies( $context = '' ) {
    $dependencies = array(
        'googlesitekit-tracking-data',
        'googlesitekit-runtime',
        'googlesitekit-i18n',
        'googlesitekit-vendor',
        'googlesitekit-commons',
        'googlesitekit-data',
        'googlesitekit-datastore-forms',
        'googlesitekit-datastore-location',
        'googlesitekit-datastore-site',
        'googlesitekit-datastore-user',
        'googlesitekit-datastore-ui',
        'googlesitekit-widgets',
        'googlesitekit-notifications',
    );

    if ( 'dashboard' === $context ) {
        array_push( $dependencies, 'googlesitekit-components' );
    }

    return $dependencies;
}
```

### Module Asset Dependencies

Modules typically depend on core assets:

```php
protected function setup_assets() {
    return array(
        new Script(
            'googlesitekit-modules-mymodule',
            array(
                'src'          => $this->context->url( 'dist/assets/js/googlesitekit-modules-mymodule.js' ),
                'dependencies' => array(
                    'googlesitekit-vendor',      // React, Redux
                    'googlesitekit-api',         // API client
                    'googlesitekit-data',        // Core data
                    'googlesitekit-modules',     // Module utilities
                    'googlesitekit-datastore-site',
                    'googlesitekit-datastore-user',
                    'googlesitekit-components',  // UI components
                ),
            )
        ),
    );
}
```
