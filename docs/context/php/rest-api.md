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

**Location**: `includes/Core/REST_API/REST_Routes.php`

The `REST_Routes` class aggregates all routes using WordPress filters. It is
constructed with only a `Context` instance (see `includes/Plugin.php`) and other
classes contribute their routes via the `googlesitekit_rest_routes` filter.

```php
final class REST_Routes {
    const REST_ROOT = 'google-site-kit/v1';

    private $context;

    public function __construct( Context $context ) {
        $this->context = $context;
    }

    public function register() {
        add_action(
            'rest_api_init',
            function () {
                $this->register_routes();
            }
        );

        // (Also registers a `do_parse_request` filter to unset conflicting
        // public query vars for Site Kit REST requests.)
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
         * \@param array $routes List of REST_Route objects.
         */
        return apply_filters( 'googlesitekit_rest_routes', $routes );
    }
}
```

### REST Route Object

**Location**: `includes/Core/REST_API/REST_Route.php`

The `REST_Route` class wraps WordPress REST route registration. A single endpoint
may be passed as a flat array — `REST_Route` wraps it in a list automatically — and
route-wide options (`args`, `schema`) are passed as the optional third argument.
Note there is no `permission_callback` default in the endpoint defaults; each
endpoint should define its own. Per-parameter defaults are filled in by
`parse_param_arg()` (including WordPress's `rest_validate_request_arg` /
`rest_sanitize_request_arg` callbacks).

```php
final class REST_Route {
    private $uri;
    private $args = array();

    /**
     * Constructor.
     *
     * \@param string $uri       Unique route URI.
     * \@param array  $endpoints One endpoint array, or a list of endpoint arrays.
     * \@param array  $args      Optional route options, e.g. `args` and `schema`.
     */
    public function __construct( $uri, array $endpoints, array $args = array() ) {
        $this->uri = trim( $uri, '/' );

        $this->args = $args;

        if ( isset( $this->args['args'] ) ) {
            $this->args['args'] = $this->parse_param_args( $this->args['args'] );
        }

        // A single endpoint passed as a string-keyed array is wrapped into a list.
        if ( ! wp_is_numeric_array( $endpoints ) ) {
            $endpoints = array( $endpoints );
        }

        $endpoint_defaults = array(
            'methods'  => WP_REST_Server::READABLE, // GET by default.
            'callback' => null,
            'args'     => array(),
        );

        foreach ( $endpoints as $endpoint ) {
            $endpoint = wp_parse_args( $endpoint, $endpoint_defaults );

            $endpoint['args'] = $this->parse_param_args( $endpoint['args'] );
            if ( ! empty( $this->args['args'] ) ) {
                $endpoint['args'] = array_merge( $this->args['args'], $endpoint['args'] );
            }

            $this->args[] = $endpoint;
        }
    }

    /**
     * Registers the REST route.
     */
    public function register() {
        register_rest_route( REST_Routes::REST_ROOT, $this->get_uri(), $this->get_args() );
    }

    public function get_uri() {
        return $this->uri;
    }

    public function get_args() {
        return $this->args;
    }

    /**
     * Parses all supported request arguments and their data.
     *
     * \@param array $args Associative array of $arg => $data pairs.
     * \@return array Parsed arguments.
     */
    protected function parse_param_args( array $args ) {
        return array_map( array( $this, 'parse_param_arg' ), $args );
    }

    /**
     * Parses data for a single supported request argument, filling in defaults.
     *
     * \@param array $data Request argument data.
     * \@return array Parsed data.
     */
    protected function parse_param_arg( array $data ) {
        return wp_parse_args(
            $data,
            array(
                'type'              => 'string',
                'description'       => '',
                'validate_callback' => 'rest_validate_request_arg',
                'sanitize_callback' => 'rest_sanitize_request_arg',
                'required'          => false,
                'default'           => null,
            )
        );
    }
}
```

## REST Controller Pattern

Controllers provide route definitions and callbacks for specific features.

### Basic Controller Structure

Controllers are typically named `REST_<Feature>_Controller`, live alongside the
feature they serve (e.g. `includes/Core/Feature_Tours/REST_Feature_Tours_Controller.php`),
and expose `get_rest_routes()` as a `protected` or `private` method (private is
common when the controller is not designed to be subclassed — e.g.
`REST_Modules_Controller` uses `private`). Callbacks are most often defined as
inline closures rather than named methods, but referencing instance methods via
`array( $this, 'method' )` is equally valid.

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
     * \@return REST_Route[] Array of REST_Route objects.
     */
    protected function get_rest_routes() {
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
     * \@param WP_REST_Request $request REST request object.
     * \@return WP_REST_Response|WP_Error Response object or error.
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
     * \@param WP_REST_Request $request REST request object.
     * \@return WP_REST_Response|WP_Error Response object or error.
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

**Location**: `includes/Core/Modules/REST_Modules_Controller.php`

The actual controller defines its callbacks as inline closures and reads write
payloads from a single `data` object parameter (e.g. `$request['data']['slug']`),
rather than from top-level params. The example below is condensed from the real
file.

```php
class REST_Modules_Controller {

    const REST_ROUTE_CHECK_ACCESS = 'core/modules/data/check-access';

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

        // Also registers `googlesitekit_apifetch_preload_paths` to preload
        // module data routes.
    }

    private function get_rest_routes() {
        $can_setup = function () {
            return current_user_can( Permissions::SETUP );
        };

        // Allows splash or dashboard viewers to read module listings/settings.
        $can_list_data = function () {
            return current_user_can( Permissions::VIEW_SPLASH )
                || current_user_can( Permissions::VIEW_DASHBOARD );
        };

        // Allows users who can manage options, with a SETUP shortcut for
        // routes that must be callable before setup is complete.
        $can_manage_options = function () {
            if ( current_user_can( Permissions::SETUP ) ) {
                return true;
            }
            return current_user_can( Permissions::MANAGE_OPTIONS );
        };

        // Pre-assign schema closure so it can be reused across multiple routes.
        $get_module_schema = function () {
            return $this->get_module_schema();
        };

        return array(
            // List modules.
            new REST_Route(
                'core/modules/data/list',
                array(
                    array(
                        'methods'             => WP_REST_Server::READABLE,
                        'callback'            => function () {
                            $modules = array_map(
                                array( $this, 'prepare_module_data_for_response' ),
                                $this->modules->get_available_modules()
                            );
                            return new WP_REST_Response( array_values( $modules ) );
                        },
                        'permission_callback' => $can_list_data,
                    ),
                ),
                array(
                    'schema' => $get_module_schema,
                )
            ),

            // Activate / deactivate a module.
            new REST_Route(
                'core/modules/data/activation',
                array(
                    array(
                        'methods'             => WP_REST_Server::EDITABLE,
                        'callback'            => function ( WP_REST_Request $request ) {
                            $data = $request['data'];
                            $slug = isset( $data['slug'] ) ? $data['slug'] : '';

                            try {
                                $this->modules->get_module( $slug );
                            } catch ( Exception $e ) {
                                return new WP_Error( 'invalid_module_slug', $e->getMessage() );
                            }

                            // ...activate or deactivate based on $data['active']...

                            return new WP_REST_Response( /* ... */ );
                        },
                        'permission_callback' => $can_manage_options,
                    ),
                )
            ),

            // Check module access.
            new REST_Route(
                self::REST_ROUTE_CHECK_ACCESS,
                array(
                    array(
                        'methods'             => WP_REST_Server::EDITABLE,
                        'callback'            => function ( WP_REST_Request $request ) {
                            $data = $request['data'];
                            $slug = isset( $data['slug'] ) ? $data['slug'] : '';
                            // ...resolve module, check service entity access...
                            return new WP_REST_Response( array( 'access' => true ) );
                        },
                        'permission_callback' => $can_setup,
                        'args'                => array(
                            'slug' => array(
                                'type'              => 'string',
                                'description'       => __( 'Identifier for the module.', 'google-site-kit' ),
                                'sanitize_callback' => 'sanitize_key',
                            ),
                        ),
                    ),
                )
            ),
        );
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

Modules use a datapoint pattern for REST endpoints. A single route — registered in
`REST_Modules_Controller` (`includes/Core/Modules/REST_Modules_Controller.php`) —
captures both the module `slug` and the `datapoint` from the URI and dispatches to
the resolved module's `get_data()` / `set_data()` methods. The shared `slug` and
`datapoint` parameters are declared once at the route level (third constructor
argument). Per-datapoint permission checks are delegated through a
`$datapoint_permission_callback` closure, which honors a datapoint that implements
`Permission_Aware_Datapoint` (otherwise falling back to the method default —
`$can_view_insights` for reads, `$can_manage_options` for writes).

```php
// Route pattern: modules/{slug}/data/{datapoint}
// Example: modules/analytics-4/data/accounts

new REST_Route(
    'modules/(?P<slug>[a-z0-9\-]+)/data/(?P<datapoint>[a-z\-]+)',
    array(
        array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => function ( WP_REST_Request $request ) {
                $module = $this->modules->get_module( $request['slug'] );
                $data   = $module->get_data( $request['datapoint'], $request->get_params() );
                if ( is_wp_error( $data ) ) {
                    return $data;
                }
                return new WP_REST_Response( $data );
            },
            'permission_callback' => function ( WP_REST_Request $request ) use ( $datapoint_permission_callback, $can_view_insights ) {
                return $datapoint_permission_callback( $request, $can_view_insights );
            },
        ),
        array(
            'methods'             => WP_REST_Server::EDITABLE,
            'callback'            => function ( WP_REST_Request $request ) {
                $module = $this->modules->get_module( $request['slug'] );
                $data   = isset( $request['data'] ) ? (array) $request['data'] : array();
                $data   = $module->set_data( $request['datapoint'], $data );
                if ( is_wp_error( $data ) ) {
                    return $data;
                }
                return new WP_REST_Response( $data );
            },
            'permission_callback' => function ( WP_REST_Request $request ) use ( $datapoint_permission_callback, $can_manage_options ) {
                return $datapoint_permission_callback( $request, $can_manage_options );
            },
            'args'                => array(
                'data' => array(
                    'type'              => 'object',
                    'description'       => __( 'Data to set.', 'google-site-kit' ),
                    'validate_callback' => function ( $value ) {
                        return is_array( $value );
                    },
                ),
            ),
        ),
    ),
    array(
        'args' => array(
            'slug'      => array(
                'type'              => 'string',
                'description'       => __( 'Identifier for the module.', 'google-site-kit' ),
                'sanitize_callback' => 'sanitize_key',
            ),
            'datapoint' => array(
                'type'              => 'string',
                'description'       => __( 'Module data point to address.', 'google-site-kit' ),
                'sanitize_callback' => 'sanitize_key',
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
