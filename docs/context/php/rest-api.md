# REST API Patterns

Site Kit uses a filter-based REST API architecture that provides a clean, modular approach to registering REST routes with consistent error handling, permission callbacks, and schema validation.

## Overview

The REST API system consists of:

-   **REST_Routes**: Central route aggregator
-   **REST_Route**: Route object wrapper
-   **Controllers**: Route handlers organized by feature
-   **Permission callbacks**: Centralized authorization
-   **Schema validation**: Type-safe parameter handling

## Core Components

### REST Routes Registry

**Location**: `includes/Core/REST_API/REST_Routes.php:1-127`

The `REST_Routes` class aggregates all routes using WordPress filters.

```php
final class REST_Routes {
    const REST_ROOT = 'google-site-kit/v1';

    private $context;
    private $authentication;
    private $modules;
    private $user_options;

    public function __construct(
        Context $context,
        Authentication $authentication,
        Modules $modules,
        User_Options $user_options
    ) {
        $this->context        = $context;
        $this->authentication = $authentication;
        $this->modules        = $modules;
        $this->user_options   = $user_options;
    }

    public function register() {
        add_action(
            'rest_api_init',
            function () {
                $this->register_routes();
            }
        );
    }

    private function register_routes() {
        $routes = $this->get_routes();

        foreach ( $routes as $route ) {
            $route->register();
        }
    }

    private function get_routes() {
        $routes = array();

        /**
         * Filters the list of available REST routes.
         *
         * @param array $routes List of REST_Route objects.
         */
        return apply_filters( 'googlesitekit_rest_routes', $routes );
    }
}
```

### REST Route Object

**Location**: `includes/Core/REST_API/REST_Route.php:1-172`

The `REST_Route` class wraps WordPress REST route registration.

```php
final class REST_Route {
    private $uri;
    private $args = array();

    /**
     * Constructor.
     *
     * @param string $uri       Route URI pattern.
     * @param array  $endpoints Route endpoints configuration.
     * @param array  $args      Optional route arguments.
     */
    public function __construct( $uri, array $endpoints, array $args = array() ) {
        $this->uri = trim( $uri, '/' );

        $endpoint_defaults = array(
            'methods'             => WP_REST_Server::READABLE,  // GET by default
            'callback'            => null,
            'permission_callback' => '__return_true',
            'args'                => array(),
        );

        foreach ( $endpoints as $endpoint ) {
            $endpoint = wp_parse_args( $endpoint, $endpoint_defaults );

            // Parse parameter schema
            $endpoint['args'] = $this->parse_param_args( $endpoint['args'] );

            $this->args[] = $endpoint;
        }

        if ( isset( $args['schema'] ) ) {
            $this->args['schema'] = $args['schema'];
        }
    }

    /**
     * Register this route with WordPress.
     */
    public function register() {
        register_rest_route(
            REST_Routes::REST_ROOT,
            $this->get_uri(),
            $this->get_args()
        );
    }

    public function get_uri() {
        return $this->uri;
    }

    public function get_args() {
        return $this->args;
    }

    /**
     * Parse parameter arguments to ensure proper schema.
     *
     * @param array $args Parameter arguments.
     * @return array Parsed arguments.
     */
    private function parse_param_args( $args ) {
        $parsed_args = array();

        foreach ( $args as $key => $arg ) {
            if ( ! is_array( $arg ) ) {
                $arg = array( 'type' => $arg );
            }

            $parsed_args[ $key ] = $arg;
        }

        return $parsed_args;
    }
}
```

## REST Controller Pattern

Controllers provide route definitions and callbacks for specific features.

### Basic Controller Structure

```php
class REST_Feature_Controller {
    protected $context;
    protected $authentication;

    public function __construct( Context $context, Authentication $authentication ) {
        $this->context        = $context;
        $this->authentication = $authentication;
    }

    /**
     * Register REST routes.
     */
    public function register() {
        add_filter(
            'googlesitekit_rest_routes',
            function ( $routes ) {
                return array_merge( $routes, $this->get_rest_routes() );
            }
        );
    }

    /**
     * Get REST route definitions.
     *
     * @return array Array of REST_Route objects.
     */
    private function get_rest_routes() {
        // Permission callbacks
        $can_setup = function () {
            return current_user_can( Permissions::SETUP );
        };

        $can_authenticate = function () {
            return current_user_can( Permissions::AUTHENTICATE );
        };

        return array(
            new REST_Route(
                'core/feature/data/list',
                array(
                    array(
                        'methods'             => WP_REST_Server::READABLE,
                        'callback'            => array( $this, 'get_list' ),
                        'permission_callback' => $can_authenticate,
                        'args'                => array(
                            'status' => array(
                                'type'    => 'string',
                                'enum'    => array( 'active', 'inactive', 'all' ),
                                'default' => 'all',
                            ),
                        ),
                    ),
                )
            ),
            new REST_Route(
                'core/feature/data/item',
                array(
                    array(
                        'methods'             => WP_REST_Server::EDITABLE,
                        'callback'            => array( $this, 'save_item' ),
                        'permission_callback' => $can_setup,
                        'args'                => array(
                            'name' => array(
                                'type'     => 'string',
                                'required' => true,
                            ),
                            'value' => array(
                                'type'     => 'string',
                                'required' => true,
                            ),
                        ),
                    ),
                )
            ),
        );
    }

    /**
     * GET callback for list endpoint.
     *
     * @param WP_REST_Request $request REST request object.
     * @return WP_REST_Response|WP_Error Response object or error.
     */
    public function get_list( WP_REST_Request $request ) {
        $status = $request->get_param( 'status' );

        // Implement logic
        $items = $this->fetch_items( $status );

        return new WP_REST_Response( $items );
    }

    /**
     * POST callback for save endpoint.
     *
     * @param WP_REST_Request $request REST request object.
     * @return WP_REST_Response|WP_Error Response object or error.
     */
    public function save_item( WP_REST_Request $request ) {
        $name  = $request->get_param( 'name' );
        $value = $request->get_param( 'value' );

        $result = $this->save( $name, $value );

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return new WP_REST_Response( $result );
    }
}
```

### Real Example: Modules Controller

**Location**: `includes/Core/Modules/REST_Modules_Controller.php:1-200+`

```php
final class REST_Modules_Controller {
    protected $modules;

    public function __construct( Modules $modules ) {
        $this->modules = $modules;
    }

    public function register() {
        add_filter(
            'googlesitekit_rest_routes',
            function ( $routes ) {
                return array_merge( $routes, $this->get_rest_routes() );
            }
        );
    }

    private function get_rest_routes() {
        $can_setup = function () {
            return current_user_can( Permissions::SETUP );
        };

        $can_authenticate = function () {
            return current_user_can( Permissions::AUTHENTICATE );
        };

        return array(
            // List modules
            new REST_Route(
                'core/modules/data/list',
                array(
                    array(
                        'methods'             => WP_REST_Server::READABLE,
                        'callback'            => array( $this, 'get_modules' ),
                        'permission_callback' => $can_authenticate,
                    ),
                )
            ),

            // Activate module
            new REST_Route(
                'core/modules/data/activation',
                array(
                    array(
                        'methods'             => WP_REST_Server::EDITABLE,
                        'callback'            => array( $this, 'activate_module' ),
                        'permission_callback' => $can_setup,
                        'args'                => array(
                            'slug' => array(
                                'type'              => 'string',
                                'required'          => true,
                                'sanitize_callback' => 'sanitize_key',
                            ),
                        ),
                    ),
                )
            ),

            // Check module access
            new REST_Route(
                'core/modules/data/check-access',
                array(
                    array(
                        'methods'             => WP_REST_Server::EDITABLE,
                        'callback'            => array( $this, 'check_module_access' ),
                        'permission_callback' => $can_authenticate,
                        'args'                => array(
                            'slug' => array(
                                'type'              => 'string',
                                'required'          => true,
                                'sanitize_callback' => 'sanitize_key',
                            ),
                        ),
                    ),
                )
            ),
        );
    }

    /**
     * Get list of modules.
     *
     * @return WP_REST_Response Response with modules list.
     */
    public function get_modules() {
        $modules = array_values(
            $this->modules->get_available_modules()
        );

        return new WP_REST_Response( $modules );
    }

    /**
     * Activate a module.
     *
     * @param WP_REST_Request $request REST request.
     * @return WP_REST_Response|WP_Error Response or error.
     */
    public function activate_module( WP_REST_Request $request ) {
        $slug = $request->get_param( 'slug' );

        $result = $this->modules->activate_module( $slug );

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return new WP_REST_Response( array( 'success' => true ) );
    }
}
```

## Permission Callbacks

Permission callbacks control access to REST endpoints.

### Common Permission Patterns

```php
// Allow only authenticated users with SETUP permission
$can_setup = function () {
    return current_user_can( Permissions::SETUP );
};

// Allow only authenticated users with AUTHENTICATE permission
$can_authenticate = function () {
    return current_user_can( Permissions::AUTHENTICATE );
};

// Allow only users who can view the dashboard
$can_view_dashboard = function () {
    return current_user_can( Permissions::VIEW_DASHBOARD );
};

// Public endpoint (use with caution)
$public = '__return_true';

// Combine multiple permissions
$can_manage_modules = function () {
    return current_user_can( Permissions::SETUP )
        && current_user_can( Permissions::AUTHENTICATE );
};
```

### Custom Permission Logic

```php
// Check module ownership
$can_edit_module = function ( WP_REST_Request $request ) use ( $module ) {
    if ( ! current_user_can( Permissions::SETUP ) ) {
        return false;
    }

    $slug = $request->get_param( 'slug' );
    $module = $this->modules->get_module( $slug );

    if ( ! $module ) {
        return new WP_Error(
            'invalid_module',
            'Invalid module.',
            array( 'status' => 404 )
        );
    }

    // Check if current user is module owner
    if ( $module instanceof Module_With_Owner ) {
        $owner_id = $module->get_owner_id();
        if ( $owner_id && $owner_id !== get_current_user_id() ) {
            return new WP_Error(
                'insufficient_permissions',
                'You do not have permission to edit this module.',
                array( 'status' => 403 )
            );
        }
    }

    return true;
};
```

## Parameter Schema

REST route parameters use schema validation for type safety.

### Basic Parameter Types

```php
'args' => array(
    // String parameter
    'name' => array(
        'type'              => 'string',
        'required'          => true,
        'sanitize_callback' => 'sanitize_text_field',
    ),

    // Integer parameter
    'count' => array(
        'type'              => 'integer',
        'required'          => false,
        'default'           => 10,
        'sanitize_callback' => 'absint',
    ),

    // Boolean parameter
    'enabled' => array(
        'type'    => 'boolean',
        'default' => false,
    ),

    // Enum parameter
    'status' => array(
        'type' => 'string',
        'enum' => array( 'draft', 'published', 'archived' ),
    ),

    // Array parameter
    'items' => array(
        'type'  => 'array',
        'items' => array(
            'type' => 'string',
        ),
    ),

    // Object parameter
    'settings' => array(
        'type'       => 'object',
        'properties' => array(
            'accountID'  => array( 'type' => 'string' ),
            'propertyID' => array( 'type' => 'string' ),
        ),
    ),
),
```

### Custom Validation

```php
'args' => array(
    'email' => array(
        'type'              => 'string',
        'required'          => true,
        'sanitize_callback' => 'sanitize_email',
        'validate_callback' => function ( $value ) {
            if ( ! is_email( $value ) ) {
                return new WP_Error(
                    'invalid_email',
                    'Please provide a valid email address.'
                );
            }
            return true;
        },
    ),

    'url' => array(
        'type'              => 'string',
        'sanitize_callback' => 'esc_url_raw',
        'validate_callback' => function ( $value ) {
            if ( ! filter_var( $value, FILTER_VALIDATE_URL ) ) {
                return new WP_Error(
                    'invalid_url',
                    'Please provide a valid URL.'
                );
            }
            return true;
        },
    ),
),
```

## Error Handling

REST endpoints should return WP_Error for failures.

### Error Response Format

```php
return new WP_Error(
    'error_code',           // Machine-readable error code
    'Error message',        // Human-readable message
    array( 'status' => 400 ) // HTTP status code
);
```

### Common Error Patterns

```php
// Missing required parameter
if ( empty( $required_param ) ) {
    return new WP_Error(
        'missing_required_param',
        'Required parameter is missing.',
        array( 'status' => 400 )
    );
}

// Invalid resource
$item = $this->get_item( $id );
if ( ! $item ) {
    return new WP_Error(
        'item_not_found',
        'Item not found.',
        array( 'status' => 404 )
    );
}

// Permission denied
if ( ! $this->can_edit( $item ) ) {
    return new WP_Error(
        'insufficient_permissions',
        'You do not have permission to perform this action.',
        array( 'status' => 403 )
    );
}

// External API error
$result = $this->api_call();
if ( is_wp_error( $result ) ) {
    return $result; // Pass through WP_Error
}

// Validation error
if ( ! $this->validate( $data ) ) {
    return new WP_Error(
        'validation_failed',
        'Data validation failed.',
        array(
            'status' => 400,
            'errors' => $this->get_validation_errors(),
        )
    );
}
```

## Module Data Endpoints

Modules use a datapoint pattern for REST endpoints.

**Location**: `includes/Core/Modules/REST_Module_Data_Controller.php`

```php
// Route pattern: modules/{module-slug}/data/{datapoint}
// Example: modules/analytics-4/data/accounts

new REST_Route(
    sprintf( 'modules/%s/data/(?P<datapoint>[a-z-]+)', $module->slug ),
    array(
        array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array( $this, 'get_data' ),
            'permission_callback' => $this->can_access_datapoint(),
            'args'                => array(
                'datapoint' => array(
                    'type'              => 'string',
                    'required'          => true,
                    'sanitize_callback' => 'sanitize_key',
                ),
            ),
        ),
        array(
            'methods'             => WP_REST_Server::EDITABLE,
            'callback'            => array( $this, 'set_data' ),
            'permission_callback' => $this->can_access_datapoint(),
            'args'                => array(
                'datapoint' => array(
                    'type'     => 'string',
                    'required' => true,
                ),
                'data' => array(
                    'type'     => 'object',
                    'required' => false,
                ),
            ),
        ),
    )
),
```

## Route Namespacing

All Site Kit routes use the `google-site-kit/v1` namespace.

```php
// Full URL format
https://example.com/wp-json/google-site-kit/v1/core/modules/data/list

// Components
// - /wp-json/                     - WordPress REST API base
// - google-site-kit/v1/           - Site Kit namespace
// - core/modules/data/list        - Route path
```

## Best Practices

### DO

1. **Use the filter pattern for route registration**

    ```php
    add_filter( 'googlesitekit_rest_routes', function ( $routes ) {
        return array_merge( $routes, $this->get_rest_routes() );
    });
    ```

2. **Define permission callbacks as closures**

    ```php
    $can_setup = function () {
        return current_user_can( Permissions::SETUP );
    };
    ```

3. **Validate and sanitize all parameters**

    ```php
    'args' => array(
        'slug' => array(
            'type'              => 'string',
            'required'          => true,
            'sanitize_callback' => 'sanitize_key',
        ),
    ),
    ```

4. **Return WP_Error for failures**

    ```php
    if ( ! $valid ) {
        return new WP_Error( 'error_code', 'Message', array( 'status' => 400 ) );
    }
    ```

5. **Use WP_REST_Response for success**
    ```php
    return new WP_REST_Response( $data );
    ```

### DON'T

1. **Don't register routes directly**

    ```php
    // Bad
    register_rest_route( 'google-site-kit/v1', '/my-route', $args );

    // Good
    add_filter( 'googlesitekit_rest_routes', function ( $routes ) {
        $routes[] = new REST_Route( 'my-route', $args );
        return $routes;
    });
    ```

2. **Don't skip permission callbacks**

    ```php
    // Bad - no permission check
    'permission_callback' => '__return_true',

    // Good - proper authorization
    'permission_callback' => $can_authenticate,
    ```

3. **Don't return raw arrays**

    ```php
    // Bad
    return array( 'data' => $data );

    // Good
    return new WP_REST_Response( array( 'data' => $data ) );
    ```

4. **Don't forget error handling**

    ```php
    // Bad
    $result = $this->api_call();
    return new WP_REST_Response( $result );

    // Good
    $result = $this->api_call();
    if ( is_wp_error( $result ) ) {
        return $result;
    }
    return new WP_REST_Response( $result );
    ```
