# Admin Features

Site Kit provides a comprehensive set of admin features for WordPress integration, including screen management, notices, pointers, dashboard widgets, and plugin list customization.

## Overview

The admin feature system provides:

- **Screen Management**: Register and manage custom admin pages
- **Notice System**: Display contextual admin notices
- **Pointer System**: WordPress pointer-based onboarding
- **Dashboard Widget**: WordPress dashboard integration
- **Plugin Customization**: Action links and meta links in plugin list
- **Authorization Screen**: Custom Google authorization flow
- **Tools Integration**: Reset utility in WordPress Tools page
- **Standalone Mode**: Embedded iframe-ready admin pages

**Location**: `includes/Core/Admin/`

## Screen Management

### Screen Class

**Location**: `includes/Core/Admin/Screen.php:1-260`

Represents a single admin screen (page) in Site Kit.

```php
final class Screen {
    private $slug;
    private $args;

    public function __construct( $slug, array $args = array() ) {
        $this->slug = $slug;
        $this->args = wp_parse_args(
            $args,
            array(
                'title'           => '',
                'capability'      => Permissions::MANAGE_OPTIONS,
                'active_callback' => null,
                'render_callback' => null,
                'enqueue_callback' => null,
                'initialize_callback' => null,
                'parent'          => null,
            )
        );
    }
}
```

**Constructor Arguments**:

| Argument | Type | Description |
|----------|------|-------------|
| `title` | string | Page title |
| `capability` | string | Required user capability |
| `active_callback` | callable | Function to determine if screen should be active |
| `render_callback` | callable | Function to render page content |
| `enqueue_callback` | callable | Function to enqueue assets |
| `initialize_callback` | callable | Function called on page load |
| `parent` | string | Parent menu slug (null for top-level) |

#### Menu Registration

**Location**: `includes/Core/Admin/Screen.php:109-204`

```php
public function register( Context $context ) {
    // Check if screen should be active
    if ( is_callable( $this->args['active_callback'] ) && ! call_user_func( $this->args['active_callback'] ) ) {
        return;
    }

    $parent_slug = $this->args['parent'];
    $menu_title  = $this->args['title'];
    $capability  = $this->args['capability'];
    $page_slug   = $this->slug;

    // Register menu
    if ( null === $parent_slug ) {
        // Top-level menu
        $hook_suffix = add_menu_page(
            $menu_title,
            $menu_title,
            $capability,
            $page_slug,
            array( $this, 'render' ),
            $this->get_menu_icon( $context ),
            99 // Position
        );
    } else {
        // Submenu
        $hook_suffix = add_submenu_page(
            $parent_slug,
            $menu_title,
            $menu_title,
            $capability,
            $page_slug,
            array( $this, 'render' )
        );
    }

    // Register initialize callback
    if ( is_callable( $this->args['initialize_callback'] ) ) {
        add_action( "load-{$hook_suffix}", $this->args['initialize_callback'] );
    }

    // Register enqueue callback
    if ( is_callable( $this->args['enqueue_callback'] ) ) {
        add_action(
            'admin_enqueue_scripts',
            function ( $hook ) use ( $hook_suffix ) {
                if ( $hook !== $hook_suffix ) {
                    return;
                }
                call_user_func( $this->args['enqueue_callback'] );
            }
        );
    }
}
```

#### Menu Icon

**Location**: `includes/Core/Admin/Screen.php:216-258`

Site Kit uses a custom SVG icon with dynamic color matching WordPress admin theme:

```php
private function get_menu_icon( Context $context ) {
    $icon = file_get_contents( $context->path( 'dist/assets/svg/logo-g.svg' ) );

    // Replace color with WordPress menu color
    $icon = str_replace(
        'fill="#666"',
        sprintf( 'fill="%s"', get_user_option( 'admin_color' ) === 'light' ? '#999' : '#a7aaad' ),
        $icon
    );

    // Encode for data URI
    return 'data:image/svg+xml;base64,' . base64_encode( $icon );
}
```

### Screens Class

**Location**: `includes/Core/Admin/Screens.php:1-580`

Central manager for all admin screens.

```php
final class Screens {
    private $context;
    private $assets;
    private $modules;
    private $authentication;

    public function __construct(
        Context $context,
        Assets $assets,
        Modules $modules,
        Authentication $authentication
    ) {
        $this->context        = $context;
        $this->assets         = $assets;
        $this->modules        = $modules;
        $this->authentication = $authentication;
    }

    public function register() {
        add_action( 'admin_menu', array( $this, 'register_screens' ) );
    }

    public function register_screens() {
        $screens = $this->get_screens();

        foreach ( $screens as $screen ) {
            $screen->register( $this->context );
        }
    }
}
```

#### Registered Screens

**Location**: `includes/Core/Admin/Screens.php:80-184`

```php
private function get_screens() {
    return array(
        // Dashboard screen
        'googlesitekit-dashboard' => new Screen(
            'googlesitekit-dashboard',
            array(
                'title'               => __( 'Dashboard', 'google-site-kit' ),
                'capability'          => Permissions::VIEW_DASHBOARD,
                'render_callback'     => function () {
                    $this->render_dashboard();
                },
                'enqueue_callback'    => function () {
                    $this->enqueue_dashboard_assets();
                },
                'initialize_callback' => function () {
                    $this->initialize_dashboard();
                },
            )
        ),

        // Splash screen (onboarding)
        'googlesitekit-splash' => new Screen(
            'googlesitekit-splash',
            array(
                'title'            => __( 'Site Kit', 'google-site-kit' ),
                'capability'       => Permissions::VIEW_SPLASH,
                'active_callback'  => function () {
                    return ! $this->authentication->is_authenticated();
                },
                'render_callback'  => function () {
                    $this->render_splash();
                },
                'enqueue_callback' => function () {
                    $this->enqueue_splash_assets();
                },
            )
        ),

        // Settings screen
        'googlesitekit-settings' => new Screen(
            'googlesitekit-settings',
            array(
                'title'            => __( 'Settings', 'google-site-kit' ),
                'capability'       => Permissions::VIEW_DASHBOARD,
                'render_callback'  => function () {
                    $this->render_settings();
                },
                'enqueue_callback' => function () {
                    $this->enqueue_settings_assets();
                },
                'parent'           => 'googlesitekit-dashboard',
            )
        ),
    );
}
```

#### Screen Rendering

**Location**: `includes/Core/Admin/Screens.php:372-467`

```php
private function render_dashboard() {
    ?>
    <div id="js-googlesitekit-dashboard" class="googlesitekit-page">
        <div class="googlesitekit-loading">
            <div class="googlesitekit-loading__wrapper">
                <div class="googlesitekit-loading__logo">
                    <?php echo $this->get_logo_svg(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                </div>
            </div>
        </div>
    </div>
    <?php
}
```

#### Asset Enqueueing

**Location**: `includes/Core/Admin/Screens.php:196-234`

```php
private function enqueue_dashboard_assets() {
    // Enqueue core dashboard script
    $this->assets->enqueue_asset( 'googlesitekit-dashboard' );

    // Enqueue fonts and admin CSS
    $this->assets->enqueue_asset( 'googlesitekit-fonts' );
    $this->assets->enqueue_asset( 'googlesitekit-admin-css' );

    // Enqueue module assets
    $this->modules->enqueue_assets();
}
```

## Notice System

### Notice Class

**Location**: `includes/Core/Admin/Notice.php:1-132`

Represents a single admin notice.

```php
final class Notice {
    const TYPE_SUCCESS = 'success';
    const TYPE_INFO    = 'info';
    const TYPE_WARNING = 'warning';
    const TYPE_ERROR   = 'error';

    private $slug;
    private $args;

    public function __construct( $slug, array $args = array() ) {
        $this->slug = $slug;
        $this->args = wp_parse_args(
            $args,
            array(
                'content'         => '',
                'type'            => self::TYPE_INFO,
                'active_callback' => null,
                'dismissible'     => false,
            )
        );
    }
}
```

**Constructor Arguments**:

| Argument | Type | Description |
|----------|------|-------------|
| `content` | string\|callable | Notice content (HTML allowed) or callback returning content |
| `type` | string | Notice type: success, info, warning, error |
| `active_callback` | callable | Function to determine if notice should show |
| `dismissible` | bool | Whether notice can be dismissed |

#### Notice Rendering

**Location**: `includes/Core/Admin/Notice.php:76-130`

```php
public function render() {
    // Check active callback
    if ( is_callable( $this->args['active_callback'] ) && ! call_user_func( $this->args['active_callback'] ) ) {
        return;
    }

    $content = $this->args['content'];

    // Get content from callable
    if ( is_callable( $content ) ) {
        ob_start();
        call_user_func( $content );
        $content = ob_get_clean();
    }

    // Build CSS classes
    $classes = array(
        'notice',
        'googlesitekit-notice',
        'notice-' . $this->args['type'],
    );

    if ( $this->args['dismissible'] ) {
        $classes[] = 'is-dismissible';
    }

    printf(
        '<div class="%s">%s</div>',
        esc_attr( implode( ' ', $classes ) ),
        wp_kses(
            $content,
            array(
                'a'      => array( 'href' => true, 'onclick' => true ),
                'p'      => array(),
                'strong' => array(),
                'em'     => array(),
                'br'     => array(),
            )
        )
    );
}
```

### Notices Class

**Location**: `includes/Core/Admin/Notices.php:1-93`

Central manager for all admin notices.

```php
final class Notices {
    private $notices = array();

    public function register() {
        add_action(
            'admin_notices',
            function () {
                $this->render_notices();
            }
        );
    }

    private function render_notices() {
        $notices = $this->get_notices();

        foreach ( $notices as $notice ) {
            $notice->render();
        }
    }

    private function get_notices() {
        if ( empty( $this->notices ) ) {
            $this->notices = apply_filters( 'googlesitekit_admin_notices', array() );
        }

        return $this->notices;
    }
}
```

### Notice Examples

#### Activation Notice

**Location**: `includes/Core/Util/Activation_Notice.php:112-156`

```php
add_filter(
    'googlesitekit_admin_notices',
    function ( $notices ) {
        global $pagenow;

        // Only show on plugins.php
        if ( 'plugins.php' !== $pagenow ) {
            return $notices;
        }

        $notices[] = new Notice(
            'googlesitekit-activation-notice',
            array(
                'content'         => function () {
                    printf(
                        '<p>%s</p>',
                        sprintf(
                            /* translators: %s: setup screen URL */
                            __( 'Thank you for installing Site Kit by Google! <a href="%s">Start setup now</a>', 'google-site-kit' ),
                            esc_url( $this->context->admin_url( 'splash' ) )
                        )
                    );
                },
                'type'            => Notice::TYPE_SUCCESS,
                'active_callback' => function () {
                    return $this->activation->get() && current_user_can( Permissions::SETUP );
                },
                'dismissible'     => true,
            )
        );

        return $notices;
    }
);
```

#### Re-authentication Notice

**Location**: `includes/Core/Authentication/Authentication.php:1128-1160`

```php
$notices[] = new Notice(
    'needs_reauthentication',
    array(
        'content'         => sprintf(
            '<p>%s <a href="#" onclick="%s">%s</a></p>',
            esc_html__( 'Site Kit needs to re-authenticate with Google.', 'google-site-kit' ),
            "googlesitekit.modules.forEach( function( module ) { if ( module.reauthenticate ) { module.reauthenticate(); } } ); return false;",
            esc_html__( 'Click here', 'google-site-kit' )
        ),
        'type'            => Notice::TYPE_WARNING,
        'active_callback' => function () {
            $credentials = $this->credentials()->get();
            return (
                current_user_can( Permissions::AUTHENTICATE )
                && empty( $credentials['oauth2_client_id'] )
            );
        },
    )
);
```

#### URL Mismatch Notice

**Location**: `includes/Core/Authentication/Authentication.php:1074-1118`

```php
$notices[] = new Notice(
    'url_mismatch',
    array(
        'content'         => function () use ( $old_url, $new_url ) {
            ?>
            <p>
                <?php
                printf(
                    /* translators: 1: old URL, 2: new URL */
                    esc_html__( 'Your Site URL has changed from %1$s to %2$s. In order to continue using Site Kit, you will need to reconnect.', 'google-site-kit' ),
                    '<code>' . esc_html( $old_url ) . '</code>',
                    '<code>' . esc_html( $new_url ) . '</code>'
                );
                ?>
            </p>
            <p>
                <a href="<?php echo esc_url( $reconnect_url ); ?>" class="button button-primary">
                    <?php esc_html_e( 'Reconnect Site Kit', 'google-site-kit' ); ?>
                </a>
                <a href="<?php echo esc_url( $support_url ); ?>" class="button button-secondary">
                    <?php esc_html_e( 'Get help', 'google-site-kit' ); ?>
                </a>
            </p>
            <?php
        },
        'type'            => Notice::TYPE_ERROR,
        'active_callback' => function () use ( $old_url, $new_url ) {
            return (
                $old_url !== $new_url
                && current_user_can( Permissions::SETUP )
            );
        },
    )
);
```

## Pointer System

### Pointer Class

**Location**: `includes/Core/Admin/Pointer.php:1-175`

Represents a WordPress pointer for onboarding.

```php
final class Pointer {
    private $slug;
    private $args;

    public function __construct( $slug, array $args = array() ) {
        $this->slug = $slug;
        $this->args = wp_parse_args(
            $args,
            array(
                'active_callback' => null,
                'content'         => '',
                'target'          => '',
                'edge'            => 'left',
                'align'           => 'middle',
                'pointer_class'   => '',
            )
        );
    }
}
```

**Constructor Arguments**:

| Argument | Type | Description |
|----------|------|-------------|
| `active_callback` | callable | Function to determine if pointer should show |
| `content` | string\|callable | Pointer content (HTML) or callback |
| `target` | string | jQuery selector for pointer target |
| `edge` | string | Edge to align to: left, right, top, bottom |
| `align` | string | Alignment: top, bottom, left, right, middle, center |
| `pointer_class` | string | Additional CSS classes |

#### Pointer Data

**Location**: `includes/Core/Admin/Pointer.php:90-149`

```php
public function get_pointer_data() {
    // Check if already dismissed
    $dismissed = get_user_meta( get_current_user_id(), 'dismissed_wp_pointers', true );
    $dismissed = explode( ',', (string) $dismissed );

    if ( in_array( $this->slug, $dismissed, true ) ) {
        return null;
    }

    // Check active callback
    if ( is_callable( $this->args['active_callback'] ) && ! call_user_func( $this->args['active_callback'] ) ) {
        return null;
    }

    $content = $this->args['content'];

    // Get content from callable
    if ( is_callable( $content ) ) {
        ob_start();
        call_user_func( $content );
        $content = ob_get_clean();
    }

    return array(
        'target'        => $this->args['target'],
        'content'       => $content,
        'edge'          => $this->args['edge'],
        'align'         => $this->args['align'],
        'pointerClass'  => $this->args['pointer_class'],
    );
}
```

### Pointers Class

**Location**: `includes/Core/Admin/Pointers.php:1-197`

Central manager for all pointers.

```php
final class Pointers {
    private $pointers = array();

    public function register() {
        add_action(
            'admin_enqueue_scripts',
            function () {
                $this->enqueue_pointer_script();
            }
        );

        add_action(
            'admin_print_footer_scripts',
            function () {
                $this->print_pointer_script();
            }
        );
    }

    private function get_pointers() {
        if ( empty( $this->pointers ) ) {
            $this->pointers = apply_filters( 'googlesitekit_admin_pointers', array() );
        }

        return $this->pointers;
    }
}
```

#### Pointer Script Generation

**Location**: `includes/Core/Admin/Pointers.php:112-196`

```php
private function print_pointer_script() {
    $pointers = $this->get_pointers();
    $data     = array();

    foreach ( $pointers as $pointer ) {
        $pointer_data = $pointer->get_pointer_data();
        if ( $pointer_data ) {
            $data[ $pointer->get_slug() ] = $pointer_data;
        }
    }

    if ( empty( $data ) ) {
        return;
    }

    ?>
    <script type="text/javascript">
    ( function( $ ) {
        var pointers = <?php echo wp_json_encode( $data ); ?>;

        $.each( pointers, function( id, pointer ) {
            var $target = $( pointer.target );

            if ( ! $target.length ) {
                return;
            }

            var options = {
                content: pointer.content,
                position: {
                    edge:  pointer.edge,
                    align: pointer.align
                },
                close: function() {
                    $.post( ajaxurl, {
                        action: 'dismiss-wp-pointer',
                        pointer: id,
                        _ajax_nonce: '<?php echo wp_create_nonce( 'dismiss-wp-pointer' ); ?>'
                    } );
                }
            };

            if ( pointer.pointerClass ) {
                options.pointerClass = pointer.pointerClass;
            }

            $target.pointer( options ).pointer( 'open' );
        } );
    } )( jQuery );
    </script>
    <?php
}
```

### Pointer Examples

#### View-Only Dashboard Pointer

**Location**: `includes/Core/Dashboard_Sharing/View_Only_Pointer.php:70-117`

```php
add_filter(
    'googlesitekit_admin_pointers',
    function ( $pointers ) {
        if ( ! current_user_can( Permissions::VIEW_DASHBOARD ) ) {
            return $pointers;
        }

        if ( current_user_can( Permissions::VIEW_AUTHENTICATED_DASHBOARD ) ) {
            return $pointers;
        }

        $pointers[] = new Pointer(
            'googlesitekit-view-only-dashboard',
            array(
                'target'  => '#toplevel_page_googlesitekit-dashboard',
                'edge'    => 'left',
                'align'   => 'middle',
                'content' => function () {
                    ?>
                    <h3><?php esc_html_e( 'Welcome to Site Kit!', 'google-site-kit' ); ?></h3>
                    <p>
                        <?php
                        esc_html_e(
                            'You have view-only access to Site Kit. This means you can view analytics and insights, but you cannot change settings or connect new modules.',
                            'google-site-kit'
                        );
                        ?>
                    </p>
                    <div class="wp-pointer-buttons">
                        <a class="button button-primary" href="<?php echo esc_url( $this->context->admin_url( 'dashboard' ) ); ?>">
                            <?php esc_html_e( 'Go to Dashboard', 'google-site-kit' ); ?>
                        </a>
                    </div>
                    <?php
                },
            )
        );

        return $pointers;
    }
);
```

## Dashboard Widget

**Location**: `includes/Core/Admin/Dashboard.php:1-203`

WordPress dashboard widget integration.

```php
final class Dashboard {
    private $context;
    private $assets;
    private $modules;
    private $authentication;

    public function __construct(
        Context $context,
        Assets $assets,
        Modules $modules,
        Authentication $authentication
    ) {
        $this->context        = $context;
        $this->assets         = $assets;
        $this->modules        = $modules;
        $this->authentication = $authentication;
    }

    public function register() {
        add_action( 'wp_dashboard_setup', array( $this, 'add_widget' ) );
    }
}
```

### Widget Registration

**Location**: `includes/Core/Admin/Dashboard.php:102-121`

```php
public function add_widget() {
    // Check permissions
    if ( ! current_user_can( Permissions::VIEW_WP_DASHBOARD_WIDGET ) ) {
        return;
    }

    // Enqueue assets
    $this->assets->enqueue_asset( 'googlesitekit-wp-dashboard-css' );
    $this->assets->enqueue_asset( 'googlesitekit-wp-dashboard' );

    // Enqueue module assets
    $this->modules->enqueue_assets();

    // Register widget
    wp_add_dashboard_widget(
        'google_dashboard_widget',
        __( 'Site Kit Summary', 'google-site-kit' ),
        array( $this, 'render_widget' )
    );
}
```

### Widget Rendering

**Location**: `includes/Core/Admin/Dashboard.php:129-187`

```php
public function render_widget() {
    $analytics_module = $this->modules->get_module( 'analytics-4' );
    $search_module    = $this->modules->get_module( 'search-console' );

    ?>
    <div id="js-googlesitekit-wp-dashboard" class="googlesitekit-wp-dashboard">
        <?php if ( $analytics_module && $analytics_module->is_connected() ) : ?>
            <div class="googlesitekit-wp-dashboard__analytics">
                <h3><?php esc_html_e( 'Analytics', 'google-site-kit' ); ?></h3>
                <div id="googlesitekit-analytics-widget"></div>
            </div>
        <?php else : ?>
            <div class="googlesitekit-wp-dashboard__cta">
                <p>
                    <?php
                    printf(
                        /* translators: %s: module name */
                        esc_html__( 'Connect %s to see your site analytics here.', 'google-site-kit' ),
                        esc_html__( 'Analytics', 'google-site-kit' )
                    );
                    ?>
                </p>
                <a href="<?php echo esc_url( $this->context->admin_url( 'dashboard' ) ); ?>" class="button button-primary">
                    <?php esc_html_e( 'Go to Site Kit', 'google-site-kit' ); ?>
                </a>
            </div>
        <?php endif; ?>

        <?php if ( $search_module && $search_module->is_connected() ) : ?>
            <div class="googlesitekit-wp-dashboard__search-console">
                <h3><?php esc_html_e( 'Search Console', 'google-site-kit' ); ?></h3>
                <div id="googlesitekit-search-console-widget"></div>
            </div>
        <?php endif; ?>

        <?php if ( ! current_user_can( Permissions::VIEW_AUTHENTICATED_DASHBOARD ) ) : ?>
            <div class="googlesitekit-wp-dashboard__view-only">
                <p>
                    <?php esc_html_e( 'You have view-only access to Site Kit data.', 'google-site-kit' ); ?>
                </p>
            </div>
        <?php endif; ?>
    </div>
    <?php
}
```

## Plugin List Customization

### Plugin_Action_Links

**Location**: `includes/Core/Admin/Plugin_Action_Links.php:1-71`

Adds action links to plugin row on plugins.php.

```php
final class Plugin_Action_Links {
    private $context;

    public function __construct( Context $context ) {
        $this->context = $context;
    }

    public function register() {
        $plugin_basename = $this->context->get_plugin_basename();

        add_filter(
            "plugin_action_links_{$plugin_basename}",
            function ( $links ) {
                return $this->add_links( $links );
            }
        );
    }

    private function add_links( $links ) {
        if ( ! current_user_can( Permissions::MANAGE_OPTIONS ) ) {
            return $links;
        }

        $settings_url = $this->context->admin_url( 'settings' );

        $action_links = array(
            'settings' => sprintf(
                '<a href="%s">%s</a>',
                esc_url( $settings_url ),
                esc_html__( 'Settings', 'google-site-kit' )
            ),
        );

        // Add to beginning of array
        return array_merge( $action_links, $links );
    }
}
```

### Plugin_Row_Meta

**Location**: `includes/Core/Admin/Plugin_Row_Meta.php:1-54`

Adds meta links to plugin row on plugins.php.

```php
final class Plugin_Row_Meta {
    public function register() {
        add_filter( 'plugin_row_meta', array( $this, 'add_links' ), 10, 2 );
    }

    public function add_links( $links, $file ) {
        if ( GOOGLESITEKIT_PLUGIN_BASENAME !== $file ) {
            return $links;
        }

        $meta_links = array(
            'rate' => sprintf(
                '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
                'https://wordpress.org/support/plugin/google-site-kit/reviews/#new-post',
                esc_html__( 'Rate Site Kit', 'google-site-kit' )
            ),
            'support' => sprintf(
                '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
                'https://wordpress.org/support/plugin/google-site-kit/',
                esc_html__( 'Support', 'google-site-kit' )
            ),
        );

        return array_merge( $links, $meta_links );
    }
}
```

## Authorization Screen

**Location**: `includes/Core/Admin/Authorize_Application.php:1-129`

Custom authorization screen for Google OAuth flow.

```php
final class Authorize_Application {
    private $context;
    private $assets;

    public function __construct( Context $context, Assets $assets ) {
        $this->context = $context;
        $this->assets  = $assets;
    }

    public function register() {
        add_action(
            'admin_enqueue_scripts',
            function () {
                if ( $this->is_authorize_application_screen() ) {
                    $this->enqueue_assets();
                }
            }
        );

        add_action(
            'admin_footer',
            function () {
                if ( $this->is_authorize_application_screen() ) {
                    $this->render_custom_footer();
                }
            }
        );
    }
}
```

### Screen Detection

**Location**: `includes/Core/Admin/Authorize_Application.php:62-87`

```php
private function is_authorize_application_screen() {
    // Must be on admin.php
    if ( ! isset( $_SERVER['REQUEST_URI'] ) || ! strpos( $_SERVER['REQUEST_URI'], 'admin.php' ) ) {
        return false;
    }

    // Get redirect URL parameter
    $redirect = $this->context->input()->filter( INPUT_GET, 'redirect' );

    if ( empty( $redirect ) ) {
        return false;
    }

    // Parse URL
    $parsed = wp_parse_url( esc_url_raw( $redirect ) );

    if ( empty( $parsed['host'] ) ) {
        return false;
    }

    // Check if Google service
    return $this->is_google_service( $parsed['host'] );
}

private function is_google_service( $host ) {
    return (bool) preg_match( '/^(.+\.)?google\.com$/', $host );
}
```

### Custom Styling

**Location**: `includes/Core/Admin/Authorize_Application.php:89-105`

```php
private function enqueue_assets() {
    $this->assets->enqueue_asset( 'googlesitekit-authorize-application-css' );

    // Hide admin menu and header
    add_action(
        'admin_head',
        function () {
            ?>
            <style>
                #wpadminbar, #adminmenumain, .update-nag {
                    display: none !important;
                }
                html.wp-toolbar {
                    padding-top: 0 !important;
                }
            </style>
            <?php
        }
    );
}
```

### Custom Footer

**Location**: `includes/Core/Admin/Authorize_Application.php:107-127`

```php
private function render_custom_footer() {
    ?>
    <div class="googlesitekit-authorize-application__footer">
        <p>
            <?php
            printf(
                /* translators: %s: Site Kit logo */
                esc_html__( 'Powered by %s', 'google-site-kit' ),
                '<strong>' . esc_html__( 'Site Kit', 'google-site-kit' ) . '</strong>'
            );
            ?>
        </p>
    </div>
    <?php
}
```

## Tools Page Integration

**Location**: `includes/Core/Admin/Available_Tools.php:1-67`

Adds Site Kit tools to WordPress Tools page.

```php
final class Available_Tools {
    private $context;

    public function __construct( Context $context ) {
        $this->context = $context;
    }

    public function register() {
        add_action( 'tool_box', array( $this, 'render_tool' ) );
    }

    public function render_tool() {
        if ( ! current_user_can( Permissions::SETUP ) ) {
            return;
        }

        ?>
        <div class="card">
            <h2 class="title"><?php esc_html_e( 'Reset Site Kit', 'google-site-kit' ); ?></h2>
            <p>
                <?php
                esc_html_e(
                    'Reset Site Kit and disconnect all users. This will remove all Site Kit settings and data.',
                    'google-site-kit'
                );
                ?>
            </p>
            <p>
                <a href="<?php echo esc_url( $this->context->admin_url( 'settings', array( 'reset' => '1' ) ) ); ?>" class="button">
                    <?php esc_html_e( 'Reset Site Kit', 'google-site-kit' ); ?>
                </a>
            </p>
        </div>
        <?php
    }
}
```

## Standalone Mode

**Location**: `includes/Core/Admin/Standalone.php:1-122`

Enables standalone/embedded admin pages (perfect for iframes).

```php
final class Standalone {
    private $context;

    public function __construct( Context $context ) {
        $this->context = $context;
    }

    public function register() {
        // Only register if in standalone mode
        if ( ! $this->is_standalone() ) {
            return;
        }

        // Hide admin menu
        add_filter(
            'admin_body_class',
            function ( $classes ) {
                return "$classes googlesitekit-standalone";
            }
        );

        // Remove admin header
        add_action( 'in_admin_header', array( $this, 'remove_admin_header' ), 1000 );

        // Remove admin footer text
        add_filter( 'admin_footer_text', '__return_empty_string', 1000 );

        // Add standalone styles
        add_action( 'admin_head', array( $this, 'add_styles' ) );
    }
}
```

### Detection Logic

**Location**: `includes/Core/Admin/Standalone.php:91-98`

```php
private function is_standalone() {
    global $pagenow;

    // Must be on admin.php
    if ( 'admin.php' !== $pagenow ) {
        return false;
    }

    // Must have googlesitekit page
    $page = $this->context->input()->filter( INPUT_GET, 'page' );
    if ( ! $page || ! strpos( $page, 'googlesitekit-' ) === 0 ) {
        return false;
    }

    // Must have standalone query param
    $standalone = $this->context->input()->filter( INPUT_GET, 'googlesitekit-standalone' );
    return 'true' === $standalone;
}
```

### Standalone Styling

**Location**: `includes/Core/Admin/Standalone.php:100-120`

```php
public function add_styles() {
    ?>
    <style>
        /* Hide WordPress admin UI */
        #wpadminbar,
        #adminmenumain,
        #wpcontent #wpfooter,
        .update-nag,
        .notice {
            display: none !important;
        }

        /* Adjust layout */
        #wpcontent {
            margin-left: 0 !important;
            padding-left: 0 !important;
        }

        html.wp-toolbar {
            padding-top: 0 !important;
        }
    </style>
    <?php
}
```

## Initialization

All admin features are initialized in `Plugin.php`:

**Location**: `includes/Plugin.php:193-216`

```php
// Register admin features
add_action(
    'init',
    function () use ( $context, $options, $user_options ) {
        $assets         = new Core\Assets\Assets( $context );
        $authentication = new Core\Authentication\Authentication( $context, $options, $user_options );
        $modules        = new Core\Modules\Modules( $context, $options, $user_options, $authentication, $assets );

        // Screens
        $screens = new Core\Admin\Screens( $context, $assets, $modules, $authentication );
        $screens->register();

        // Notices
        $notices = new Core\Admin\Notices();
        $notices->register();

        // Pointers
        $pointers = new Core\Admin\Pointers();
        $pointers->register();

        // Dashboard widget
        $dashboard = new Core\Admin\Dashboard( $context, $assets, $modules, $authentication );
        $dashboard->register();

        // Authorization screen
        $authorize_app = new Core\Admin\Authorize_Application( $context, $assets );
        $authorize_app->register();

        // Standalone mode
        $standalone = new Core\Admin\Standalone( $context );
        $standalone->register();

        // Tools page
        $available_tools = new Core\Admin\Available_Tools( $context );
        $available_tools->register();
    }
);

// Early registration (before init)
$plugin_action_links = new Core\Admin\Plugin_Action_Links( $context );
$plugin_action_links->register();

$plugin_row_meta = new Core\Admin\Plugin_Row_Meta();
$plugin_row_meta->register();
```

## Best Practices

### DO

1. **Use active callbacks for conditional features**

    ```php
    new Notice(
        'my-notice',
        array(
            'content'         => 'Notice content',
            'active_callback' => function () {
                return current_user_can( Permissions::MANAGE_OPTIONS );
            },
        )
    )
    ```

2. **Check permissions before rendering**

    ```php
    public function add_widget() {
        if ( ! current_user_can( Permissions::VIEW_WP_DASHBOARD_WIDGET ) ) {
            return;
        }

        wp_add_dashboard_widget( /* ... */ );
    }
    ```

3. **Use callable content for dynamic data**

    ```php
    new Notice(
        'dynamic-notice',
        array(
            'content' => function () {
                $count = $this->get_pending_items_count();
                printf( 'You have %d pending items.', $count );
            },
        )
    )
    ```

4. **Escape all output properly**

    ```php
    // Good
    echo esc_html( $title );
    echo esc_url( $link );
    echo esc_attr( $class );

    // Good - allow specific tags
    echo wp_kses(
        $content,
        array(
            'a'      => array( 'href' => true ),
            'strong' => array(),
        )
    );
    ```

5. **Use consistent slug prefixes**
    ```php
    // Screens
    'googlesitekit-dashboard'

    // Notices
    'googlesitekit-activation-notice'

    // Pointers
    'googlesitekit-view-only-dashboard'
    ```

### DON'T

1. **Don't hardcode capability checks**

    ```php
    // Bad
    if ( current_user_can( 'manage_options' ) ) {
        // ...
    }

    // Good
    if ( current_user_can( Permissions::MANAGE_OPTIONS ) ) {
        // ...
    }
    ```

2. **Don't output unescaped user input**

    ```php
    // Bad
    echo $user_input;

    // Good
    echo esc_html( $user_input );
    ```

3. **Don't skip active callbacks for conditional features**

    ```php
    // Bad - notice always renders
    new Notice(
        'my-notice',
        array(
            'content' => 'This only applies to authenticated users',
        )
    )

    // Good - conditional rendering
    new Notice(
        'my-notice',
        array(
            'content'         => 'This only applies to authenticated users',
            'active_callback' => function () {
                return $this->authentication->is_authenticated();
            },
        )
    )
    ```

4. **Don't register assets globally for screen-specific features**

    ```php
    // Bad - enqueues everywhere
    add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );

    // Good - screen-specific
    new Screen(
        'my-screen',
        array(
            'enqueue_callback' => array( $this, 'enqueue_assets' ),
        )
    )
    ```

5. **Don't create screens without parent for submenu pages**
    ```php
    // Bad - creates top-level menu
    new Screen(
        'googlesitekit-settings',
        array(
            'title' => 'Settings',
        )
    )

    // Good - creates submenu
    new Screen(
        'googlesitekit-settings',
        array(
            'title'  => 'Settings',
            'parent' => 'googlesitekit-dashboard',
        )
    )
    ```

## Extensibility

### Adding Custom Notices

```php
add_filter(
    'googlesitekit_admin_notices',
    function ( $notices ) {
        $notices[] = new Notice(
            'my-custom-notice',
            array(
                'content'         => 'My custom notice content',
                'type'            => Notice::TYPE_INFO,
                'active_callback' => function () {
                    return is_admin();
                },
            )
        );

        return $notices;
    }
);
```

### Adding Custom Pointers

```php
add_filter(
    'googlesitekit_admin_pointers',
    function ( $pointers ) {
        $pointers[] = new Pointer(
            'my-custom-pointer',
            array(
                'target'  => '#my-menu-item',
                'edge'    => 'left',
                'align'   => 'middle',
                'content' => '<h3>Welcome!</h3><p>Check out this feature.</p>',
            )
        );

        return $pointers;
    }
);
```

### Adding Custom Screens

Custom screens must be added by modifying the `Screens::get_screens()` method:

```php
private function get_screens() {
    $screens = array(
        // ... existing screens

        'googlesitekit-custom' => new Screen(
            'googlesitekit-custom',
            array(
                'title'            => __( 'Custom Page', 'google-site-kit' ),
                'capability'       => Permissions::VIEW_DASHBOARD,
                'render_callback'  => array( $this, 'render_custom' ),
                'enqueue_callback' => array( $this, 'enqueue_custom_assets' ),
                'parent'           => 'googlesitekit-dashboard',
            )
        ),
    );

    return $screens;
}
```
