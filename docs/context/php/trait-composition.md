# Trait Composition

Site Kit uses PHP traits extensively to share functionality across classes without deep inheritance hierarchies, following a composition-over-inheritance approach.

## What are Traits?

Traits are a mechanism for code reuse in PHP that enables a class to use methods from multiple traits, avoiding the limitations of single inheritance.

### Benefits

-   **Horizontal code reuse**: Share functionality across unrelated classes
-   **Avoid deep inheritance**: Flatten class hierarchies
-   **Mix-and-match capabilities**: Combine multiple traits as needed
-   **Cleaner architecture**: Separate concerns into focused traits

## Common Traits in Site Kit

### Method_Proxy_Trait

**Location**: `includes/Core/Util/Method_Proxy_Trait.php:1-51`

Provides method proxies for clean WordPress hook registration.

```php
trait Method_Proxy_Trait {
    /**
     * Get a proxy closure for a class method.
     *
     * @&#8203;param string $method Method name.
     * @&#8203;return callable Proxy closure.
     */
    private function get_method_proxy( $method ) {
        return function ( ...$args ) use ( $method ) {
            return $this->{ $method }( ...$args );
        };
    }

    /**
     * Get a proxy closure that only executes once.
     *
     * @&#8203;param string $method Method name.
     * @&#8203;return callable Proxy closure.
     */
    private function get_method_proxy_once( $method ) {
        return function ( ...$args ) use ( $method ) {
            static $called;
            static $return_value;

            if ( ! $called ) {
                $called       = true;
                $return_value = $this->{ $method }( ...$args );
            }

            return $return_value;
        };
    }
}
```

**Usage**:

```php
class MyClass {
    use Method_Proxy_Trait;

    public function register() {
        add_action( 'init', $this->get_method_proxy( 'initialize' ) );
        add_filter( 'the_content', $this->get_method_proxy( 'filter_content' ) );
    }

    private function initialize() {
        // Initialization code
    }

    private function filter_content( $content ) {
        return $content . ' [Modified]';
    }
}
```

### User_Aware_Trait

**Location**: `includes/Core/Storage/User_Aware_Trait.php`

Provides user ID management and context switching.

```php
trait User_Aware_Trait {
    protected $user_id = 0;

    /**
     * Get current user ID.
     *
     * @&#8203;return int User ID.
     */
    public function get_user_id() {
        return $this->user_id;
    }

    /**
     * Switch to a different user context.
     *
     * @&#8203;param int $user_id User ID to switch to.
     * @&#8203;return bool True on success.
     */
    public function switch_user( $user_id ) {
        $this->user_id = (int) $user_id;
        return true;
    }
}
```

**Usage**:

```php
final class User_Options implements User_Options_Interface {
    use User_Aware_Trait;

    private $context;

    public function __construct( Context $context, $user_id = 0 ) {
        $this->context = $context;
        $this->user_id = empty( $user_id ) ? get_current_user_id() : (int) $user_id;
    }

    public function get( $option ) {
        $user_id = $this->get_user_id();  // From trait

        return get_user_option( $option, $user_id );
    }
}
```

## Module-Specific Traits

### Module_With_Settings_Trait

**Location**: `includes/Core/Modules/Module_With_Settings_Trait.php:1-55`

Provides lazy-loaded settings management for modules.

```php
trait Module_With_Settings_Trait {
    protected $settings;

    /**
     * Set up module settings.
     *
     * @&#8203;return Module_Settings Settings instance.
     */
    abstract protected function setup_settings();

    /**
     * Get module settings instance.
     *
     * @&#8203;return Module_Settings Settings instance.
     */
    public function get_settings() {
        if ( ! $this->settings instanceof Module_Settings ) {
            $this->settings = $this->setup_settings();
        }
        return $this->settings;
    }
}
```

**Usage**:

```php
final class Analytics_4 extends Module implements Module_With_Settings {
    use Module_With_Settings_Trait;

    protected function setup_settings() {
        return new Settings( $this->options );
    }

    public function some_method() {
        // Settings are lazily instantiated
        $account_id = $this->get_settings()->get()['accountID'];
    }
}
```

### Module_With_Scopes_Trait

**Location**: `includes/Core/Modules/Module_With_Scopes_Trait.php`

Provides OAuth scope management for modules.

```php
trait Module_With_Scopes_Trait {
    protected $scopes = array();

    /**
     * Set up required OAuth scopes.
     *
     * @&#8203;return array List of OAuth scopes.
     */
    abstract protected function setup_scopes();

    /**
     * Get required OAuth scopes.
     *
     * @&#8203;return array OAuth scopes.
     */
    public function get_scopes() {
        if ( empty( $this->scopes ) ) {
            $this->scopes = (array) $this->setup_scopes();
        }
        return $this->scopes;
    }
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

### Module_With_Owner_Trait

**Location**: `includes/Core/Modules/Module_With_Owner_Trait.php:1-81`

Manages module ownership and provides owner-specific OAuth client.

```php
trait Module_With_Owner_Trait {
    protected $owner_oauth_client;

    /**
     * Get the module owner's user ID.
     *
     * @&#8203;return int Owner user ID.
     */
    public function get_owner_id() {
        if ( ! $this instanceof Module_With_Settings ) {
            return 0;
        }

        $settings = $this->get_settings()->get();
        return empty( $settings['ownerID'] ) ? 0 : $settings['ownerID'];
    }

    /**
     * Get OAuth client for the module owner.
     *
     * @&#8203;return OAuth_Client Owner's OAuth client.
     */
    public function get_owner_oauth_client() {
        if ( $this->owner_oauth_client instanceof OAuth_Client ) {
            return $this->owner_oauth_client;
        }

        // Create user options for module owner
        $user_options = new User_Options(
            $this->context,
            $this->get_owner_id()
        );

        $this->owner_oauth_client = new OAuth_Client(
            $this->context,
            $this->options,
            $user_options,  // Owner's context
            $this->authentication->credentials(),
            $this->authentication->get_google_proxy(),
            new Profile( $user_options ),
            new Token( $user_options )
        );

        return $this->owner_oauth_client;
    }

    /**
     * Set the module owner.
     *
     * @&#8203;param int $owner_id Owner user ID.
     * @&#8203;return bool True on success.
     */
    public function set_owner_id( $owner_id ) {
        if ( ! $this instanceof Module_With_Settings ) {
            return false;
        }

        return $this->get_settings()->merge( array(
            'ownerID' => (int) $owner_id,
        ) );
    }
}
```

**Usage**:

```php
final class Analytics_4 extends Module implements Module_With_Owner {
    use Module_With_Owner_Trait;

    public function fetch_data_as_owner() {
        // Get OAuth client for module owner, not current user
        $client = $this->get_owner_oauth_client();

        // Make API call with owner's credentials
        $response = $client->get_client()->execute( $request );
    }
}
```

### Module_With_Assets_Trait

**Location**: `includes/Core/Modules/Module_With_Assets_Trait.php`

Provides asset management for modules.

```php
trait Module_With_Assets_Trait {
    protected $module_assets;

    /**
     * Set up module assets.
     *
     * @&#8203;return array List of Asset objects.
     */
    abstract protected function setup_assets();

    /**
     * Get module assets.
     *
     * @&#8203;return array Asset objects.
     */
    public function get_assets() {
        if ( null === $this->module_assets ) {
            $this->module_assets = (array) $this->setup_assets();
        }
        return $this->module_assets;
    }
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

### Module_With_Tag_Trait

**Location**: `includes/Core/Modules/Module_With_Tag_Trait.php`

Manages Google tracking tag output.

```php
trait Module_With_Tag_Trait {
    protected $tag;

    /**
     * Set up module tag.
     *
     * @&#8203;return Module_Tag Tag instance.
     */
    abstract protected function setup_tag();

    /**
     * Get module tag instance.
     *
     * @&#8203;return Module_Tag Tag instance.
     */
    public function get_tag() {
        if ( ! $this->tag instanceof Module_Tag ) {
            $this->tag = $this->setup_tag();
        }
        return $this->tag;
    }
}
```

**Usage**:

```php
final class Analytics_4 extends Module implements Module_With_Tag {
    use Module_With_Tag_Trait;

    protected function setup_tag() {
        return new Tag( $this->options, $this->get_settings() );
    }

    public function register() {
        if ( $this->is_connected() ) {
            $this->get_tag()->register();
        }
    }
}
```

### Module_With_Data_Available_State_Trait

**Location**: `includes/Core/Modules/Module_With_Data_Available_State_Trait.php`

Tracks when module data becomes available.

```php
trait Module_With_Data_Available_State_Trait {
    protected $data_available_state;

    /**
     * Set up data available state.
     *
     * @&#8203;return Data_Available_State State instance.
     */
    abstract protected function setup_data_available_state();

    /**
     * Get data available state instance.
     *
     * @&#8203;return Data_Available_State State instance.
     */
    public function get_data_available_state() {
        if ( ! $this->data_available_state instanceof Data_Available_State ) {
            $this->data_available_state = $this->setup_data_available_state();
        }
        return $this->data_available_state;
    }
}
```

## Settings-Specific Traits

### Setting_With_Owned_Keys_Trait

**Location**: `includes/Core/Storage/Setting_With_Owned_Keys_Trait.php`

Tracks which settings are "owned" by the module owner.

```php
trait Setting_With_Owned_Keys_Trait {
    /**
     * Get owned setting keys.
     *
     * @&#8203;return array List of owned keys.
     */
    protected function get_owned_keys() {
        return array();
    }

    /**
     * Check if owned settings have changed.
     *
     * @&#8203;return bool True if owned settings changed.
     */
    public function have_owned_settings_changed() {
        $settings   = $this->get();
        $saved      = $this->get_saved();
        $owned_keys = $this->get_owned_keys();

        foreach ( $owned_keys as $key ) {
            if ( isset( $settings[ $key ], $saved[ $key ] ) ) {
                if ( $settings[ $key ] !== $saved[ $key ] ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get owned settings slugs.
     *
     * @&#8203;return array Owned setting keys.
     */
    public function get_owned_settings_slugs() {
        return $this->get_owned_keys();
    }
}
```

**Usage**:

```php
final class Settings extends Module_Settings {
    use Setting_With_Owned_Keys_Trait;

    protected function get_owned_keys() {
        return array(
            'accountID',
            'propertyID',
            'webDataStreamID',
        );
    }
}

// Check if owned settings changed (requires re-authentication)
if ( $settings->have_owned_settings_changed() ) {
    // Transfer ownership to current user
    $settings->merge( array( 'ownerID' => get_current_user_id() ) );
}
```

## Trait Composition Pattern

Multiple traits can be combined in a single class.

### Example: Full Module Implementation

```php
final class Analytics_4 extends Module implements
    Module_With_Assets,
    Module_With_Settings,
    Module_With_Scopes,
    Module_With_Owner,
    Module_With_Tag,
    Module_With_Data_Available_State {

    // Compose functionality from multiple traits
    use Module_With_Assets_Trait;
    use Module_With_Settings_Trait;
    use Module_With_Scopes_Trait;
    use Module_With_Owner_Trait;
    use Module_With_Tag_Trait;
    use Module_With_Data_Available_State_Trait;

    // Implement abstract methods from traits
    protected function setup_assets() { /* ... */ }
    protected function setup_settings() { /* ... */ }
    protected function setup_scopes() { /* ... */ }
    protected function setup_tag() { /* ... */ }
    protected function setup_data_available_state() { /* ... */ }

    // Module-specific methods
    public function register() {
        // Use functionality from all traits
        $this->get_settings()->register();
        $this->get_tag()->register();

        $assets = $this->get_assets();
        $scopes = $this->get_scopes();
    }
}
```

## Lazy Initialization Pattern

Most Site Kit traits use lazy initialization to defer object creation until first use.

### Pattern Example

```php
trait Lazy_Object_Trait {
    protected $object;

    abstract protected function setup_object();

    public function get_object() {
        // Only create object when first accessed
        if ( ! $this->object instanceof Expected_Class ) {
            $this->object = $this->setup_object();
        }
        return $this->object;
    }
}
```

### Benefits

1. **Performance**: Objects created only when needed
2. **Memory**: Reduced memory usage for unused features
3. **Dependencies**: Allows conditional object creation

### Example in Module Traits

```php
// Settings are only created when get_settings() is first called
public function get_settings() {
    if ( ! $this->settings instanceof Module_Settings ) {
        $this->settings = $this->setup_settings();
    }
    return $this->settings;
}

// OAuth client created only when needed
public function get_owner_oauth_client() {
    if ( $this->owner_oauth_client instanceof OAuth_Client ) {
        return $this->owner_oauth_client;
    }

    // Expensive object creation happens only once
    $user_options = new User_Options( $this->context, $this->get_owner_id() );
    $this->owner_oauth_client = new OAuth_Client( /* ... */ );

    return $this->owner_oauth_client;
}
```

## Abstract Methods in Traits

Traits can define abstract methods that must be implemented by the using class.

```php
trait My_Trait {
    // Abstract method - must be implemented by class
    abstract protected function setup_config();

    // Concrete method - uses abstract method
    public function get_config() {
        if ( ! $this->config ) {
            $this->config = $this->setup_config();
        }
        return $this->config;
    }
}

class My_Class {
    use My_Trait;

    // Required implementation
    protected function setup_config() {
        return array( 'option' => 'value' );
    }
}
```

## Best Practices

### DO

1. **Use traits for horizontal code reuse**

    ```php
    trait Logging_Trait {
        protected function log( $message ) {
            error_log( $message );
        }
    }
    ```

2. **Use lazy initialization in traits**

    ```php
    public function get_service() {
        if ( ! $this->service ) {
            $this->service = $this->setup_service();
        }
        return $this->service;
    }
    ```

3. **Define abstract methods for required implementations**

    ```php
    trait Config_Trait {
        abstract protected function setup_config();
    }
    ```

4. **Name traits descriptively**

    - Use `_Trait` suffix
    - Describe what the trait provides

5. **Document trait usage**
    ```php
    /**
     * Provides OAuth scope management.
     */
    trait Module_With_Scopes_Trait {
    ```

### DON'T

1. **Don't use traits for unrelated functionality**

    ```php
    // Bad - mixed concerns
    trait Everything_Trait {
        protected function get_settings() { }
        protected function send_email() { }
        protected function log() { }
    }

    // Good - focused traits
    trait Settings_Trait { }
    trait Email_Trait { }
    trait Logging_Trait { }
    ```

2. **Don't create property conflicts**

    ```php
    // Bad - both traits use $data property
    trait Trait_A {
        protected $data;
    }

    trait Trait_B {
        protected $data;  // Conflict!
    }

    // Good - use distinct property names
    trait Trait_A {
        protected $config_data;
    }

    trait Trait_B {
        protected $user_data;
    }
    ```

3. **Don't skip lazy initialization checks**

    ```php
    // Bad - creates object every time
    public function get_service() {
        return $this->setup_service();
    }

    // Good - lazy initialization
    public function get_service() {
        if ( ! $this->service ) {
            $this->service = $this->setup_service();
        }
        return $this->service;
    }
    ```

4. **Don't use traits to bypass single inheritance**
    - Traits are for code reuse, not inheritance hierarchies
    - If you need inheritance, use class extension

## Trait Composition Diagram

```
Analytics_4 Module
│
├── Module (base class)
│   ├── Context
│   ├── Options
│   ├── User_Options
│   ├── Authentication
│   └── Assets
│
└── Traits (horizontal composition)
    ├── Module_With_Settings_Trait
    │   └── provides: get_settings()
    │
    ├── Module_With_Scopes_Trait
    │   └── provides: get_scopes()
    │
    ├── Module_With_Owner_Trait
    │   ├── provides: get_owner_id()
    │   └── provides: get_owner_oauth_client()
    │
    ├── Module_With_Assets_Trait
    │   └── provides: get_assets()
    │
    ├── Module_With_Tag_Trait
    │   └── provides: get_tag()
    │
    └── Module_With_Data_Available_State_Trait
        └── provides: get_data_available_state()
```
