# Settings Management

Site Kit uses a hierarchical settings system with a base `Setting` class that provides common functionality, extended by `Module_Settings` for module-specific configuration.

## Overview

The settings system provides:

-   Type-safe settings storage using WordPress options API
-   Default values and sanitization
-   Change detection for UI state management
-   Observer pattern for reacting to setting changes
-   Owned settings tracking for multi-admin environments
-   View-only settings that can't be modified

## Class Hierarchy

```
Setting (base class)
  └── Module_Settings (module-specific settings)
      └── Analytics_4\Settings (concrete implementation)
```

## Base Setting Class

**Location**: `includes/Core/Storage/Setting.php`

The base `Setting` class provides fundamental setting operations. It is constructed with an
`Options_Interface` instance and delegates storage to it.

### Core Methods

```php
abstract class Setting {

    const OPTION = '';  // Override in a sub-class.

    /**
     * Options instance implementing Options_Interface.
     *
     * \@var Options_Interface
     */
    protected $options;

    public function __construct( Options_Interface $options ) {
        $this->options = $options;
    }

    /**
     * Registers the setting in WordPress.
     */
    public function register() {
        register_setting(
            static::OPTION,
            static::OPTION,
            array(
                'type'              => $this->get_type(),
                'sanitize_callback' => $this->get_sanitize_callback(),
                'default'           => $this->get_default(),
            )
        );
    }

    /**
     * Subscribes to updates for this setting.
     *
     * \@param callable $callback Function taking $old_value & $new_value parameters.
     * \@return \Closure Function to remove the added listeners.
     */
    public function on_change( callable $callback ) {
        // Observer pattern implementation; see "Observer Pattern" section below.
    }

    /**
     * Checks whether or not the option is set with a valid value.
     *
     * \@return bool True on success, false on failure.
     */
    public function has() {
        return $this->options->has( static::OPTION );
    }

    /**
     * Gets the value of the setting.
     *
     * \@return mixed Value set for the option, or registered default if not set.
     */
    public function get() {
        return $this->options->get( static::OPTION );
    }

    /**
     * Sets the value of the setting with the given value.
     *
     * \@param mixed $value Setting value. Must be serializable if non-scalar.
     * \@return bool True on success, false on failure.
     */
    public function set( $value ) {
        return $this->options->set( static::OPTION, $value );
    }

    /**
     * Deletes the setting.
     *
     * \@return bool True on success, false on failure.
     */
    public function delete() {
        return $this->options->delete( static::OPTION );
    }

    /**
     * Gets the expected value type.
     *
     * Returns 'string' by default for consistency with register_setting.
     * Override in a sub-class if different.
     *
     * \@return string The type name.
     */
    protected function get_type() {
        return 'string';
    }

    /**
     * Gets the default value.
     *
     * Returns false by default for consistency with get_option.
     * Override in a sub-class if different.
     *
     * \@return mixed The default value.
     */
    protected function get_default() {
        return false;
    }

    /**
     * Gets the callback for sanitizing the setting's value before saving.
     *
     * Returns null for consistency with the default in register_setting.
     * Override in a sub-class.
     *
     * \@return callable|null
     */
    protected function get_sanitize_callback() {
        return null;
    }
}
```

### Usage Example

```php
class Simple_Setting extends Setting {
    const OPTION = 'googlesitekit_simple_setting';

    protected function get_type() {
        return 'string';
    }

    protected function get_default() {
        return 'default_value';
    }

    protected function get_sanitize_callback() {
        return 'sanitize_text_field';
    }
}

// Usage
$setting = new Simple_Setting( $options );
$setting->register();

$value = $setting->get();  // 'default_value' if not set
$setting->set( 'new_value' );
$setting->delete();
```

## Module Settings

**Location**: `includes/Core/Modules/Module_Settings.php`

The `Module_Settings` class extends `Setting` to provide module-specific functionality. Its
`register()` method calls `parent::register()` and then `add_option_default_filters()`, and it
overrides `get_type()` to return `'object'` (module settings are always associative arrays).

### Key Features

```php
abstract class Module_Settings extends Setting {

    /**
     * Registers the setting in WordPress.
     */
    public function register() {
        parent::register();
        $this->add_option_default_filters();
    }

    /**
     * Merges an array of settings to update.
     *
     * Only existing keys will be updated.
     *
     * \@param array $partial Partial settings array to save.
     * \@return bool True on success, false on failure.
     */
    public function merge( array $partial ) {
        $settings = $this->get();
        $partial  = array_filter(
            $partial,
            function ( $value ) {
                return null !== $value;
            }
        );
        $updated  = array_intersect_key( $partial, $settings );

        return $this->set( array_merge( $settings, $updated ) );
    }

    /**
     * Registers a filter to ensure default values are present in the saved option.
     */
    protected function add_option_default_filters() {
        add_filter(
            'option_' . static::OPTION,
            function ( $option ) {
                if ( ! is_array( $option ) ) {
                    return $this->get_default();
                }
                return $option;
            },
            0
        );

        // Fill in any missing keys with defaults.
        // Must run later to not conflict with legacy key migration.
        add_filter(
            'option_' . static::OPTION,
            function ( $option ) {
                if ( is_array( $option ) ) {
                    return $option + $this->get_default();
                }
                return $option;
            },
            99
        );
    }

    /**
     * Gets the expected value type.
     *
     * \@return string The type name.
     */
    protected function get_type() {
        return 'object';
    }
}
```

> Note: `Module_Settings` does **not** provide a `have_changed()`/`get_saved()` change-detection
> API. Change detection for "owned" settings is handled by `Setting_With_Owned_Keys_Trait`
> (see below); change detection for the settings form in general is handled on the JavaScript
> side via the data store.

## Concrete Settings Implementation

**Location**: `includes/Modules/Analytics_4/Settings.php`

### Example: Analytics 4 Settings

```php
final class Settings extends Module_Settings {
    const OPTION = 'googlesitekit_analytics-4_settings';

    /**
     * Get default settings.
     *
     * \@return array Default settings.
     */
    protected function get_default() {
        return array(
            'ownerID'                       => 0,
            'accountID'                     => '',
            'propertyID'                    => '',
            'webDataStreamID'               => '',
            'measurementID'                 => '',
            'trackingDisabled'              => array( 'loggedinUsers' ),
            'useSnippet'                    => true,
            'googleTagID'                   => '',
            'googleTagAccountID'            => '',
            'googleTagContainerID'          => '',
            'availableCustomDimensions'     => null,
            'propertyCreateTime'            => 0,
        );
    }

    /**
     * Get setting type.
     *
     * \@return string Setting type.
     */
    protected function get_type() {
        return 'array';
    }

    /**
     * Get sanitization callback.
     *
     * \@return callable Sanitization function.
     */
    protected function get_sanitize_callback() {
        return function ( $option ) {
            if ( is_array( $option ) ) {
                // Sanitize boolean fields
                if ( isset( $option['useSnippet'] ) ) {
                    $option['useSnippet'] = (bool) $option['useSnippet'];
                }

                // Sanitize Google Tag ID format
                if ( isset( $option['googleTagID'] ) ) {
                    if ( ! preg_match( '/^(G|GT|AW)-[a-zA-Z0-9]+$/', $option['googleTagID'] ) ) {
                        $option['googleTagID'] = '';
                    }
                }

                // Sanitize property ID
                if ( isset( $option['propertyID'] ) ) {
                    $option['propertyID'] = $this->sanitize_property_id( $option['propertyID'] );
                }

                // Sanitize owner ID
                if ( isset( $option['ownerID'] ) ) {
                    $option['ownerID'] = (int) $option['ownerID'];
                }
            }

            return $option;
        };
    }

    /**
     * Sanitize property ID.
     *
     * \@param string $property_id Property ID to sanitize.
     * \@return string Sanitized property ID.
     */
    private function sanitize_property_id( $property_id ) {
        // Allow special values
        if ( in_array( $property_id, array( self::PROPERTY_CREATE ), true ) ) {
            return $property_id;
        }

        // Validate format: properties/123456789
        if ( ! preg_match( '/^properties\/\d+$/', $property_id ) ) {
            return '';
        }

        return $property_id;
    }
}
```

### Using Settings in a Module

**Location**: Module classes using `Module_With_Settings_Trait`

```php
final class Analytics_4 extends Module implements Module_With_Settings {
    use Module_With_Settings_Trait;

    /**
     * Set up module settings.
     *
     * \@return Module_Settings Settings instance.
     */
    protected function setup_settings() {
        return new Settings( $this->options );
    }

    public function some_method() {
        // Get all settings
        $settings = $this->get_settings()->get();
        $account_id = $settings['accountID'];

        // Update a single setting using merge
        $this->get_settings()->merge( array(
            'propertyID' => 'properties/123456789',
        ) );

        // Check current setting value
        $use_snippet = $settings['useSnippet'];
    }
}
```

## Setting Traits

### Setting_With_Owned_Keys_Trait

Tracks which settings are "owned" by the module owner and require re-authentication when changed by another admin.

**Location**: `includes/Core/Storage/Setting_With_Owned_Keys_Trait.php`

```php
trait Setting_With_Owned_Keys_Trait {
    /**
     * Get owned setting keys.
     *
     * \@return array List of owned setting keys.
     */
    protected function get_owned_keys() {
        return array();
    }

    /**
     * Determines whether the owned settings have changed.
     *
     * \@param array $settings     The new settings.
     * \@param array $old_settings The old settings.
     * \@return bool TRUE if owned settings have changed, otherwise FALSE.
     */
    protected function have_owned_settings_changed( $settings, $old_settings ) {
        $keys = $this->get_owned_keys();

        foreach ( $keys as $key ) {
            if ( isset( $settings[ $key ], $old_settings[ $key ] ) && $settings[ $key ] !== $old_settings[ $key ] ) {
                return true;
            }
        }

        return false;
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

// Check if owned settings changed
if ( $settings->have_owned_settings_changed() ) {
    // Transfer ownership to current user
    $settings->merge( array( 'ownerID' => get_current_user_id() ) );
}
```

### Setting_With_ViewOnly_Keys_Interface

Marks certain settings as view-only (cannot be modified through REST API).

**Location**: `includes/Core/Storage/Setting_With_ViewOnly_Keys_Interface.php`

```php
interface Setting_With_ViewOnly_Keys_Interface {
    /**
     * Get view-only setting keys.
     *
     * \@return array List of view-only keys.
     */
    public function get_view_only_keys();
}
```

**Usage**:

```php
final class Settings extends Module_Settings implements Setting_With_ViewOnly_Keys_Interface {
    public function get_view_only_keys() {
        return array(
            'availableCustomDimensions',  // Fetched from API, not user-editable
            'propertyCreateTime',         // Set once when created
        );
    }
}
```

## Observer Pattern (on_change)

The `on_change` method allows subscribing to setting changes.

**Location**: `includes/Core/Storage/Setting.php`

```php
public function on_change( callable $callback ) {
    $option = static::OPTION;

    // Hook into option add
    $on_add_option = function ( $_, $value ) use ( $callback ) {
        $callback( $this->get_default(), $value );
    };
    add_action( "add_option_{$option}", $on_add_option, 10, 2 );

    // Hook into option update
    $on_update_option = function ( $old_value, $value ) use ( $callback ) {
        $callback( $old_value, $value );
    };
    add_action( "update_option_{$option}", $on_update_option, 10, 2 );

    // Return unsubscribe function
    return function () use ( $option, $on_add_option, $on_update_option ) {
        remove_action( "add_option_{$option}", $on_add_option );
        remove_action( "update_option_{$option}", $on_update_option );
    };
}
```

### Usage Example

**Location**: `includes/Modules/Analytics_4.php`

```php
// In module registration
$this->audience_settings->on_change(
    function ( $old_value, $new_value ) {
        $old_available_audiences = $old_value['availableAudiences'] ?? array();
        $new_available_audiences = $new_value['availableAudiences'] ?? array();

        // Get removed audiences
        $removed_audiences = array_diff(
            $old_available_audiences,
            $new_available_audiences
        );

        // Reset data availability for removed audiences
        foreach ( $removed_audiences as $audience_name ) {
            $this->resource_data_availability_date->reset_resource_date( $audience_name );
        }
    }
);
```

## Settings Registration

Settings must be registered with WordPress to be saved properly.

```php
// In module register() method
public function register() {
    $this->get_settings()->register();
}
```

This calls `register_setting()` which:

1. Registers the option with WordPress
2. Sets up sanitization callbacks
3. Defines the option type for REST API schema
4. Sets default values

## Settings Validation

Settings can be validated before saving using custom sanitization callbacks.

### Example: Complex Validation

```php
protected function get_sanitize_callback() {
    return function ( $option ) {
        if ( ! is_array( $option ) ) {
            return $this->get_default();
        }

        // Validate measurement ID format
        if ( isset( $option['measurementID'] ) ) {
            if ( ! preg_match( '/^G-[A-Z0-9]+$/', $option['measurementID'] ) ) {
                // Invalid format, keep old value
                $old_settings = $this->get();
                $option['measurementID'] = $old_settings['measurementID'];
            }
        }

        // Ensure trackingDisabled is always an array
        if ( ! isset( $option['trackingDisabled'] ) || ! is_array( $option['trackingDisabled'] ) ) {
            $option['trackingDisabled'] = array();
        }

        // Validate custom dimensions
        if ( isset( $option['availableCustomDimensions'] ) ) {
            if ( ! is_array( $option['availableCustomDimensions'] ) ) {
                $option['availableCustomDimensions'] = null;
            } else {
                $option['availableCustomDimensions'] = array_values(
                    array_filter(
                        $option['availableCustomDimensions'],
                        'is_string'
                    )
                );
            }
        }

        return $option;
    };
}
```

## Settings Patterns

### Pattern 1: Partial Updates

Use `merge()` to update only specific settings:

```php
// Instead of getting, modifying, and setting all settings
$settings = $module->get_settings()->get();
$settings['propertyID'] = 'properties/123';
$module->get_settings()->set( $settings );

// Use merge for cleaner code
$module->get_settings()->merge( array(
    'propertyID' => 'properties/123',
) );
```

### Pattern 2: Change Detection

Check if settings have changed before showing UI elements:

```php
$has_changes = $module->get_settings()->have_changed();

if ( $has_changes ) {
    // Show "Save Changes" button
    // Enable settings form submit
}
```

### Pattern 3: Default Value Restoration

Settings can be reset to defaults:

```php
// Delete settings to restore defaults
$module->get_settings()->delete();

// Or explicitly set to defaults
$module->get_settings()->set( $module->get_settings()->get_default() );
```

### Pattern 4: Conditional Setting Updates

```php
public function update_property_settings( $property_id ) {
    $current_property = $this->get_settings()->get()['propertyID'];

    // Only update if property changed
    if ( $current_property !== $property_id ) {
        $this->get_settings()->merge( array(
            'propertyID'        => $property_id,
            'propertyCreateTime' => time(),
        ) );
    }
}
```

## Best Practices

### DO

1. **Always define default values**

    ```php
    protected function get_default() {
        return array(
            'enabled' => false,
            'value'   => '',
        );
    }
    ```

2. **Use proper sanitization**

    ```php
    protected function get_sanitize_callback() {
        return function ( $option ) {
            return array_map( 'sanitize_text_field', $option );
        };
    }
    ```

3. **Use merge() for partial updates**

    ```php
    $settings->merge( array( 'key' => 'value' ) );
    ```

4. **Register settings in module register() method**

    ```php
    public function register() {
        $this->get_settings()->register();
    }
    ```

5. **Document setting keys and types**
    ```php
    /**
     * Settings structure:
     * - accountID (string): Google Analytics account ID
     * - propertyID (string): GA4 property ID
     * - useSnippet (bool): Whether to output tracking snippet
     */
    ```

### DON'T

1. **Don't bypass sanitization**

    ```php
    // Bad - direct database access
    update_option( Settings::OPTION, $unsafe_data );

    // Good - uses sanitization callback
    $settings->set( $data );
    ```

2. **Don't store sensitive data in settings**

    - Use `User_Options` for user-specific tokens
    - Use `Encrypted_Options` for sensitive data

3. **Don't modify settings without checking**

    ```php
    // Bad - always updates
    $settings->merge( array( 'key' => $value ) );

    // Good - check first
    if ( $settings->get()['key'] !== $value ) {
        $settings->merge( array( 'key' => $value ) );
    }
    ```
