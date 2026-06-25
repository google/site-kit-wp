# Admin Features

Site Kit provides a comprehensive set of admin features for WordPress integration, including screen management, notices, pointers, dashboard widgets, and plugin list customization.

## Overview

The admin feature system provides:

- **Screen Management**: Register and manage custom admin pages
- **Notice System**: Display contextual admin notices
- **Pointer System**: WordPress pointer-based onboarding
- **Dashboard Widget**: WordPress dashboard integration
- **Plugin Customization**: Action links and meta links in plugin list
- **Authorization Screen**: Custom styling for the WordPress Authorize Application screen
- **Tools Integration**: Reset utility in WordPress Tools page
- **Standalone Mode**: Embedded iframe-ready admin pages

**Location**: `includes/Core/Admin/`

All of these classes are `@access private` / `@ignore` internals and each begins with the standard Apache 2.0 license header docblock. New files in this directory must keep that header.

## Screen Management

### Screen Class

**Location**: `includes/Core/Admin/Screen.php`

Represents a single admin screen (page) in Site Kit. The class uses `Requires_Javascript_Trait` (to render the no-JS fallback markup) and exposes a `MENU_SLUG` constant used as the default parent.

```php
final class Screen {
	use Requires_Javascript_Trait;

	const MENU_SLUG = 'googlesitekit';

	private $slug;
	private $args = array();

	public function __construct( $slug, array $args ) {
		$this->slug = $slug;
		$this->args = wp_parse_args(
			$args,
			array(
				'render_callback'     => null,
				'title'               => '',
				'capability'          => 'manage_options',
				'menu_title'          => '',
				'parent_slug'         => self::MENU_SLUG,
				'enqueue_callback'    => null,
				'initialize_callback' => null,
			)
		);

		if ( empty( $this->args['menu_title'] ) ) {
			$this->args['menu_title'] = $this->args['title'];
		}

		$this->args['title'] = __( 'Site Kit by Google', 'google-site-kit' ) . ' ' . $this->args['title'];
	}
}
```

**Constructor Arguments**:

| Argument | Type | Description |
|----------|------|-------------|
| `render_callback` | callable | Callback to render the page content. Defaults to an empty `<div id="js-{slug}" class="googlesitekit-page">`. Receives the `Context` instance. |
| `title` | string | Screen title. The constructor prefixes it with `Site Kit by Google`. A screen with an empty title is not added to the admin. |
| `capability` | string | Required user capability. Default is the literal string `'manage_options'`. |
| `menu_title` | string | Title to display in the menu. Defaults to `$title`. |
| `parent_slug` | string | Parent menu slug. Defaults to `self::MENU_SLUG` (`'googlesitekit'`), which means it is added under the main Site Kit menu. |
| `enqueue_callback` | callable | Callback to enqueue additional assets. The base admin stylesheet is always enqueued. Receives the `Assets` instance. |
| `initialize_callback` | callable | Callback run on page load, before headers are sent. Receives the `Context` instance. |

> Note: there is no `active_callback` or `parent` argument on `Screen`. Conditional visibility is handled by the `Screens` manager (e.g. via `capability` and the `PARENT_SLUG_NULL` sentinel) rather than per-screen callbacks.

#### Menu Registration

**Location**: `includes/Core/Admin/Screen.php` (`add()` method)

The screen is registered via `add( Context $context )`, which returns the hook suffix (or an empty string if the screen has no title). The first screen whose `parent_slug` is `MENU_SLUG` registers the top-level menu via `add_menu_page()`; every screen is then added with `add_submenu_page()`. The menu icon uses the `Google_Icon` helper, and a `current_screen` action recolors the icon to match the admin color scheme.

```php
public function add( Context $context ) {
	static $menu_slug = null;

	if ( ! $this->args['title'] ) {
		return '';
	}

	$parent_slug = null;

	if ( ! empty( $this->args['parent_slug'] ) ) {
		$parent_slug = $this->args['parent_slug'];

		if ( self::MENU_SLUG === $parent_slug ) {
			if ( null === $menu_slug ) {
				add_menu_page(
					$this->args['title'],
					__( 'Site Kit', 'google-site-kit' ),
					$this->args['capability'],
					$this->slug,
					'',
					'data:image/svg+xml;base64,' . Google_Icon::to_base64()
				);
				$menu_slug = $this->slug;

				// Recolor the icon to match the admin color scheme on current_screen.
				add_action( 'current_screen', /* ... */, 100 );
			}

			$parent_slug = $menu_slug;
		}
	}

	return (string) add_submenu_page(
		$parent_slug,
		$this->args['title'],
		$this->args['menu_title'],
		$this->args['capability'],
		$this->slug,
		function () use ( $context ) {
			$this->render( $context );
		}
	);
}
```

#### Menu Icon

**Location**: `includes/Core/Util/Google_Icon.php`

The menu icon is produced by the `Google_Icon` helper rather than reading an SVG file directly. `Google_Icon::to_base64()` returns the base64-encoded SVG, and `Google_Icon::with_fill( $color )` returns a copy of the SVG XML filled with the given color (used by the `current_screen` recolor logic so the icon matches the active admin color scheme):

```php
// Initial (uncolored) icon when registering the menu.
'data:image/svg+xml;base64,' . Google_Icon::to_base64();

// Recolored icon, applied on the `current_screen` action.
'data:image/svg+xml;base64,' . Google_Icon::to_base64( Google_Icon::with_fill( $color ) );
```

#### Screen Lifecycle

The `Screen` instance also exposes:

- `get_slug()` — returns the screen slug.
- `initialize( Context $context )` — runs the `initialize_callback` (called from `load-{$hook_suffix}`).
- `enqueue_assets( Assets $assets )` — always enqueues `googlesitekit-admin-css`, then runs the `enqueue_callback` (or, by default, enqueues the asset matching the screen slug).
- `render( Context $context )` — private; wraps the rendered content in `<div class="googlesitekit-plugin">`, prepended by the no-JS HTML from `Requires_Javascript_Trait`.

### Screens Class

**Location**: `includes/Core/Admin/Screens.php`

Central manager for all admin screens.

```php
final class Screens {

	const PREFIX           = 'googlesitekit-';
	const PARENT_SLUG_NULL = self::PREFIX . 'null';

	private $context;
	private $assets;
	private $modules;
	private $authentication;
	private $user_options;
	private $screens = array();

	public function __construct(
		Context $context,
		?Assets $assets = null,
		?Modules $modules = null,
		?Authentication $authentication = null,
		?User_Options $user_options = null
	) {
		$this->context        = $context;
		$this->assets         = $assets ?: new Assets( $this->context );
		$this->modules        = $modules ?: new Modules( $this->context );
		$this->authentication = $authentication ?: new Authentication( $this->context );
		$this->user_options   = $user_options ?: new User_Options( $this->context );
	}
}
```

#### Registration

**Location**: `includes/Core/Admin/Screens.php` (`register()` method)

`register()` wires up several hooks rather than a single one:

- `admin_menu` (and `network_admin_menu` in network mode) → `add_screens()`.
- `admin_enqueue_scripts` → `enqueue_screen_assets( $hook_suffix )`.
- `admin_page_access_denied` → redirect helpers (dashboard ↔ splash, module pages → dashboard).
- `admin_head` → inline CSS to size the menu icon.
- `admin_notices` / `network_admin_notices` / `all_admin_notices` at priority `-9999` → remove all admin notices on Site Kit screens.
- `custom_menu_order` / `menu_order` → move the Site Kit menu directly below the WordPress dashboard item.

```php
public function register() {
	if ( $this->context->is_network_mode() ) {
		add_action( 'network_admin_menu', function () { $this->add_screens(); } );
	}

	add_action( 'admin_menu', function () { $this->add_screens(); } );

	add_action(
		'admin_enqueue_scripts',
		function ( $hook_suffix ) {
			$this->enqueue_screen_assets( $hook_suffix );
		}
	);

	// ... admin_page_access_denied redirects, admin_head icon CSS,
	// notice removal, and menu reordering.
}
```

`add_screens()` calls `$screen->add( $this->context )` for each screen, registers a `load-{$hook_suffix}` action that calls `$screen->initialize( $this->context )`, and stores `$this->screens[ $hook_suffix ] = $screen`.

#### Registered Screens

**Location**: `includes/Core/Admin/Screens.php` (`get_screens()` method)

The registered screens are: `dashboard`, `splash`, `settings`, `user-input`, `ad-blocking-recovery`, `metric-selection`, and `key-metrics-setup`. Screens not meant to appear in the menu use `parent_slug => self::PARENT_SLUG_NULL`. The splash screen is only shown in the menu when the user can view the splash but not the dashboard.

```php
private function get_screens() {
	$show_splash_in_menu = current_user_can( Permissions::VIEW_SPLASH ) && ! current_user_can( Permissions::VIEW_DASHBOARD );

	$screens = array(
		new Screen(
			self::PREFIX . 'dashboard',
			array(
				'title'               => __( 'Dashboard', 'google-site-kit' ),
				'capability'          => Permissions::VIEW_DASHBOARD,
				'enqueue_callback'    => function ( Assets $assets ) {
					if ( $this->context->input()->filter( INPUT_GET, 'permaLink' ) ) {
						$assets->enqueue_asset( 'googlesitekit-entity-dashboard' );
					} else {
						$assets->enqueue_asset( 'googlesitekit-main-dashboard' );
					}
				},
				'initialize_callback' => function ( Context $context ) { /* setupFlowRefresh redirects */ },
				'render_callback'     => function ( Context $context ) { /* renders the dashboard root element */ },
			)
		),
		new Screen(
			self::PREFIX . 'splash',
			array(
				'title'               => __( 'Dashboard', 'google-site-kit' ),
				'capability'          => Permissions::VIEW_SPLASH,
				'parent_slug'         => $show_splash_in_menu ? Screen::MENU_SLUG : self::PARENT_SLUG_NULL,
				'initialize_callback' => function ( Context $context ) { /* redirect to dashboard when appropriate */ },
			)
		),
		new Screen(
			self::PREFIX . 'settings',
			array(
				'title'      => __( 'Settings', 'google-site-kit' ),
				'capability' => Permissions::MANAGE_OPTIONS,
			)
		),
	);

	$screens[] = new Screen( self::PREFIX . 'user-input', /* ... PARENT_SLUG_NULL ... */ );
	$screens[] = new Screen( self::PREFIX . 'ad-blocking-recovery', /* ... PARENT_SLUG_NULL ... */ );
	$screens[] = new Screen( self::PREFIX . 'metric-selection', /* ... PARENT_SLUG_NULL ... */ );
	$screens[] = new Screen( self::PREFIX . 'key-metrics-setup', /* ... PARENT_SLUG_NULL ... */ );

	return $screens;
}
```

#### Screen Rendering

Most screens rely on the default `render_callback`, which prints an empty `<div id="js-{slug}" class="googlesitekit-page">` element that the React app mounts onto. The dashboard screen provides a custom `render_callback` that switches between the main and entity dashboard roots and sets `data-view-only` / `data-setup-module-slug` attributes:

```php
'render_callback' => function ( Context $context ) {
	$is_view_only = ! $this->authentication->is_authenticated();
	// ...
	?>
	<div id="js-googlesitekit-main-dashboard" data-view-only="<?php echo esc_attr( $is_view_only ); ?>" data-setup-module-slug="<?php echo esc_attr( $setup_module_slug ); ?>" class="googlesitekit-page"></div>
	<?php
},
```

#### Asset Enqueueing

**Location**: `includes/Core/Admin/Screens.php` (`enqueue_screen_assets()` method)

Asset enqueueing is delegated to the matching `Screen` (via its `enqueue_callback`), and module assets are enqueued on top:

```php
private function enqueue_screen_assets( $hook_suffix ) {
	if ( ! isset( $this->screens[ $hook_suffix ] ) ) {
		return;
	}

	$this->screens[ $hook_suffix ]->enqueue_assets( $this->assets );
	$this->modules->enqueue_assets();
}
```

## Notice System

### Notice Class

**Location**: `includes/Core/Admin/Notice.php`

Represents a single admin notice.

```php
final class Notice {
	const TYPE_SUCCESS = 'success';
	const TYPE_INFO    = 'info';
	const TYPE_WARNING = 'warning';
	const TYPE_ERROR   = 'error';

	private $slug;
	private $args = array();

	public function __construct( $slug, array $args ) {
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
| `content` | string\|callable | Notice content. A string is wrapped in `<p>` and passed through `wp_kses( ..., 'googlesitekit_admin_notice' )`. A callable should return the (already-escaped) markup; if it returns empty, nothing is rendered. |
| `type` | string | Notice type: success, info, warning, error. Default `info`. |
| `active_callback` | callable | Function to determine if the notice should show. Receives the current admin screen hook suffix. |
| `dismissible` | bool | Whether the notice is dismissible (adds the `is-dismissible` class). Default `false`. |

#### Notice Activation and Rendering

**Location**: `includes/Core/Admin/Notice.php` (`is_active()` and `render()` methods)

Whether a notice should display is determined by `is_active( $hook_suffix )` (called by the `Notices` manager), not inside `render()`. `render()` builds the content, applies the type/dismissible classes, and prints the markup with an id of `googlesitekit-notice-{slug}`.

```php
public function is_active( $hook_suffix ) {
	if ( ! $this->args['content'] ) {
		return false;
	}

	if ( ! $this->args['active_callback'] ) {
		return true;
	}

	return (bool) call_user_func( $this->args['active_callback'], $hook_suffix );
}

public function render() {
	if ( is_callable( $this->args['content'] ) ) {
		$content = call_user_func( $this->args['content'] );
		if ( empty( $content ) ) {
			return;
		}
	} else {
		$content = '<p>' . wp_kses( $this->args['content'], 'googlesitekit_admin_notice' ) . '</p>';
	}

	$class = 'notice notice-' . $this->args['type'];
	if ( $this->args['dismissible'] ) {
		$class .= ' is-dismissible';
	}

	?>
	<div id="<?php echo esc_attr( 'googlesitekit-notice-' . $this->slug ); ?>" class="<?php echo esc_attr( $class ); ?>">
		<?php echo $content; /* phpcs:ignore WordPress.Security.EscapeOutput */ ?>
	</div>
	<?php
}
```

### Notices Class

**Location**: `includes/Core/Admin/Notices.php`

Central manager for all admin notices. It hooks both `admin_notices` and `network_admin_notices`, reads the global `$hook_suffix`, and renders each active notice. The notice list comes from the `googlesitekit_admin_notices` filter and is filtered down to `Notice` instances.

```php
final class Notices {

	public function register() {
		$callback = function () {
			global $hook_suffix;

			if ( empty( $hook_suffix ) ) {
				return;
			}

			$this->render_notices( $hook_suffix );
		};

		add_action( 'admin_notices', $callback );
		add_action( 'network_admin_notices', $callback );
	}

	private function render_notices( $hook_suffix ) {
		$notices = $this->get_notices();
		if ( empty( $notices ) ) {
			return;
		}

		foreach ( $notices as $notice ) {
			if ( ! $notice->is_active( $hook_suffix ) ) {
				continue;
			}

			$notice->render();
		}
	}

	private function get_notices() {
		$notices = apply_filters( 'googlesitekit_admin_notices', array() );

		return array_filter(
			$notices,
			function ( $notice ) {
				return $notice instanceof Notice;
			}
		);
	}
}
```

### Notice Examples

#### Activation Notice

**Location**: `includes/Core/Util/Activation_Notice.php`

`Activation_Notice` registers a notice on the `googlesitekit_admin_notices` filter and only shows it on `plugins.php` when the activation flag is set. The notice content is rendered via a callable, and the `active_callback` clears the activation flag so the notice only appears once.

```php
public function register() {
	add_filter(
		'googlesitekit_admin_notices',
		function ( $notices ) {
			$notices[] = $this->get_activation_notice();
			return $notices;
		}
	);

	// ... enqueue assets on plugins.php ...
}

private function get_activation_notice() {
	return new Notice(
		'activated',
		array(
			'content'         => function () {
				ob_start();
				// ... renders the googlesitekit-activation loading markup ...
				return ob_get_clean();
			},
			'type'            => Notice::TYPE_SUCCESS,
			'active_callback' => function ( $hook_suffix ) {
				if ( 'plugins.php' !== $hook_suffix ) {
					return false;
				}
				$network_wide = is_network_admin();
				$flag         = $this->activation_flag->get_activation_flag( $network_wide );
				if ( $flag ) {
					$this->activation_flag->delete_activation_flag( $network_wide );
				}
				return $flag;
			},
			'dismissible'     => true,
		)
	);
}
```

#### Re-authentication Notice

**Location**: `includes/Core/Authentication/Authentication.php` (`get_reauthentication_needed_notice()` method)

Authentication registers its notices via `authentication_admin_notices()` on the `googlesitekit_admin_notices` filter. The re-authentication notice uses the slug `needs_reauthentication`, renders its content via a callable, and prints an inline script through `BC_Functions::wp_print_inline_script_tag()`.

```php
private function get_reauthentication_needed_notice() {
	return new Notice(
		'needs_reauthentication',
		array(
			'content'         => function () {
				ob_start();
				?>
				<p>
					<?php /* ... "You need to reauthenticate your Google account." ... */ ?>
					<a href="#" onclick="reauthenticateAndContinueSetup()"><?php esc_html_e( 'Click here', 'google-site-kit' ); ?></a>
				</p>
				<?php
				BC_Functions::wp_print_inline_script_tag( /* reauthenticateAndContinueSetup() */ );
				return ob_get_clean();
			},
			// ...
		)
	);
}
```

#### URL Mismatch Notice

**Location**: `includes/Core/Authentication/Authentication.php` (`get_reconnect_after_url_mismatch_notice()` method)

The URL mismatch notice uses the slug `reconnect_after_url_mismatch` and an `active_callback` that checks the disconnected reason and credentials. It is of type `info`.

```php
private function get_reconnect_after_url_mismatch_notice() {
	return new Notice(
		'reconnect_after_url_mismatch',
		array(
			'content'         => function () {
				// ... builds the "Looks like the URL of your site has changed ..." content,
				// optionally appending an old URL / new URL comparison list.
			},
			'type'            => Notice::TYPE_INFO,
			'active_callback' => function () {
				return $this->disconnected_reason->get() === Disconnected_Reason::REASON_CONNECTED_URL_MISMATCH
					&& $this->credentials->has();
			},
		)
	);
}
```

## Pointer System

### Pointer Class

**Location**: `includes/Core/Admin/Pointer.php`

Represents a WordPress pointer for onboarding (`@since 1.83.0`).

```php
final class Pointer {
	private $slug;
	private $args = array();

	public function __construct( $slug, array $args ) {
		$this->slug = $slug;
		$this->args = wp_parse_args(
			$args,
			array(
				'title'           => '',
				'content'         => '',
				'target_id'       => '',
				'position'        => 'top',
				'active_callback' => null,
				'buttons'         => null,
				'class'           => '',
				'tracking'        => array(),
			)
		);
	}
}
```

**Constructor Arguments**:

| Argument | Type | Description |
|----------|------|-------------|
| `title` | string | Required. Pointer title (rendered inside an `<h3>`). |
| `content` | string\|callable | Required. Pointer content. A string is wrapped in `<p>` and passed through `wp_kses( ..., 'googlesitekit_admin_pointer' )`; a callable should return the markup. |
| `target_id` | string | Required. ID of the element the pointer attaches to (resolved as `#{target_id}` in JS). |
| `position` | string\|array | Position of the pointer: `'top'`, `'bottom'`, `'left'`, `'right'`, or an array of `edge`/`align`. Default `'top'`. |
| `active_callback` | callable | Determines whether the pointer is active. Receives the current admin screen hook suffix. |
| `buttons` | string | Optional HTML for the pointer buttons (rendered in a `googlesitekit-pointer-buttons` container). Default `null`. |
| `class` | string\|array | Optional additional CSS class(es). Default `''`. |
| `tracking` | array | Optional tracking config for `view`, `dismiss`, and `click` events. Default `array()`. |

> Note: the real argument names are `target_id` and `position`, not `target`/`edge`/`align`/`pointer_class`.

#### Pointer Accessors and Activation

**Location**: `includes/Core/Admin/Pointer.php`

`Pointer` is a value object with getters (`get_slug()`, `get_title()`, `get_content()`, `get_target_id()`, `get_position()`, `get_buttons()`, `get_class()`, `get_tracking()`) and an `is_active( $hook_suffix )` method. There is no `get_pointer_data()` method, and dismissal is not checked here — individual pointers check `dismissed_wp_pointers` user meta in their own `active_callback` (see the view-only example below).

```php
public function get_content() {
	if ( is_callable( $this->args['content'] ) ) {
		return call_user_func( $this->args['content'] );
	} else {
		return '<p>' . wp_kses( $this->args['content'], 'googlesitekit_admin_pointer' ) . '</p>';
	}
}

public function is_active( $hook_suffix ) {
	if ( empty( $this->args['title'] ) || empty( $this->args['content'] ) || empty( $this->args['target_id'] ) ) {
		return false;
	}

	if ( ! is_callable( $this->args['active_callback'] ) ) {
		return true;
	}

	return (bool) call_user_func( $this->args['active_callback'], $hook_suffix );
}
```

### Pointers Class

**Location**: `includes/Core/Admin/Pointers.php`

Central manager for all pointers. It uses `Method_Proxy_Trait`, hooks only `admin_enqueue_scripts`, filters the pointers down to the active ones for the current screen, enqueues the WordPress `wp-pointer` assets plus Site Kit's dashboard styles and the `googlesitekit-admin-pointers-tracking` script, then prints one script per active pointer on `admin_print_footer_scripts`.

```php
class Pointers {

	use Method_Proxy_Trait;

	public function register() {
		add_action( 'admin_enqueue_scripts', $this->get_method_proxy( 'enqueue_pointers' ) );
	}

	private function enqueue_pointers( $hook_suffix ) {
		if ( empty( $hook_suffix ) ) {
			return;
		}

		$pointers = $this->get_pointers();
		if ( empty( $pointers ) ) {
			return;
		}

		$active_pointers = array_filter(
			$pointers,
			function ( Pointer $pointer ) use ( $hook_suffix ) {
				return $pointer->is_active( $hook_suffix );
			}
		);

		if ( empty( $active_pointers ) ) {
			return;
		}

		wp_enqueue_style( 'wp-pointer' );
		wp_enqueue_style( 'googlesitekit-wp-dashboard-css' );
		wp_enqueue_script( 'wp-pointer' );
		wp_enqueue_script( 'googlesitekit-admin-pointers-tracking' );

		add_action(
			'admin_print_footer_scripts',
			function () use ( $active_pointers ) {
				foreach ( $active_pointers as $pointer ) {
					$this->print_pointer_script( $pointer );
				}
			}
		);
	}

	private function get_pointers() {
		$pointers = apply_filters( 'googlesitekit_admin_pointers', array() );

		return array_filter(
			$pointers,
			function ( $pointer ) {
				return $pointer instanceof Pointer;
			}
		);
	}
}
```

#### Pointer Script Generation

**Location**: `includes/Core/Admin/Pointers.php` (`print_pointer_script()` method)

Each pointer is printed as a single inline script via `BC_Functions::wp_print_inline_script_tag()`. The pointer's data (slug, class, target id, `wp_kses`-escaped title/content, JSON-encoded position, and optional tracking config) is passed through `data-*` attributes and read back via `document.currentScript.dataset`. The inline JS initializes the WordPress pointer and (when tracking is configured) registers handlers with `window.googlesitekitAdminPointersTracking`.

```php
private function print_pointer_script( $pointer ) {
	$content = $pointer->get_content();
	if ( empty( $content ) ) {
		return;
	}

	$buttons = $pointer->get_buttons();
	if ( $buttons ) {
		$content .= '<div class="googlesitekit-pointer-buttons">' . $buttons . '</div>';
	}

	$class      = array( 'wp-pointer' );
	$class[]    = sanitize_html_class( $pointer->get_slug() );
	if ( $pointer->get_class() ) {
		$class[] = $pointer->get_class();
	}

	// ... build $kses_title / $kses_content allowlists ...

	$data = array(
		'data-slug'      => $pointer->get_slug(),
		'data-class'     => implode( ' ', $class ),
		'data-target-id' => $pointer->get_target_id(),
		'data-title'     => wp_kses( $pointer->get_title(), $kses_title ),
		'data-content'   => wp_kses( $content, $kses_content ),
		'data-position'  => wp_json_encode( $pointer->get_position() ),
	);

	if ( ! empty( $pointer->get_tracking() ) ) {
		$data['data-tracking'] = wp_json_encode( $pointer->get_tracking() );
	}

	BC_Functions::wp_print_inline_script_tag(
		// inline JS that calls target.pointer( options ).pointer( 'open' )
		// and dismisses via wp.ajax.post( 'dismiss-wp-pointer', { pointer: config.slug } )
		$inline_js,
		$data
	);
}
```

### Pointer Examples

#### View-Only Dashboard Pointer

**Location**: `includes/Core/Dashboard_Sharing/View_Only_Pointer.php`

`View_Only_Pointer` registers a pointer (slug constant `View_Only_Pointer::SLUG === 'googlesitekit-view-only-pointer'`) on the `googlesitekit_admin_pointers` filter. It targets the Site Kit top-level menu item (`toplevel_page_googlesitekit-dashboard`), only shows on the WordPress dashboard (`index.php`) for view-only users, checks `dismissed_wp_pointers` in its `active_callback`, and supplies `buttons` and `tracking`.

```php
private function get_view_only_pointer() {
	return new Pointer(
		self::SLUG,
		array(
			'title'           => sprintf(
				'%s %s',
				__( 'You now have access to Site Kit', 'google-site-kit' ),
				'<button type="button" class="googlesitekit-pointer-cta--dismiss dashicons dashicons-no" data-action="dismiss">' .
					'<span class="screen-reader-text">' . esc_html__( 'Dismiss this notice.', 'google-site-kit' ) . '</span>' .
				'</button>'
			),
			'content'         => __( 'Check Site Kit’s dashboard to find out how much traffic your site is getting, …', 'google-site-kit' ),
			'target_id'       => 'toplevel_page_googlesitekit-dashboard',
			'active_callback' => function ( $hook_suffix ) {
				if ( 'index.php' !== $hook_suffix
					|| current_user_can( Permissions::AUTHENTICATE )
					|| ! current_user_can( Permissions::VIEW_SPLASH )
				) {
					return false;
				}

				$dismissed_wp_pointers = get_user_meta( get_current_user_id(), 'dismissed_wp_pointers', true );
				if ( ! is_array( $dismissed_wp_pointers ) ) {
					$dismissed_wp_pointers = explode( ',', (string) $dismissed_wp_pointers );
				}
				return ! in_array( self::SLUG, $dismissed_wp_pointers, true );
			},
			'class'           => 'googlesitekit-view-only-pointer',
			'tracking'        => array( /* view / dismiss / click events */ ),
			'buttons'         => sprintf(
				'<a class="googlesitekit-pointer-cta button-primary" href="%s" data-action="dismiss">%s</a>',
				esc_attr( $this->context->admin_url( 'dashboard' ) ),
				esc_html__( 'View dashboard', 'google-site-kit' )
			),
		)
	);
}
```

## Dashboard Widget

**Location**: `includes/Core/Admin/Dashboard.php`

WordPress dashboard widget integration. The class uses `Requires_Javascript_Trait`. Its constructor takes `Context` plus optional `Assets`, `Modules`, and `Dismissed_Items` (note: `Authentication` is constructed internally, not injected).

```php
final class Dashboard {
	use Requires_Javascript_Trait;

	private $context;
	private $assets;
	private $modules;
	private $authentication;
	private $dismissed_items;

	public function __construct(
		Context $context,
		?Assets $assets = null,
		?Modules $modules = null,
		?Dismissed_Items $dismissed_items = null
	) {
		$this->context = $context;
		$this->assets  = $assets ?: new Assets( $this->context );
		$this->modules = $modules ?: new Modules( $this->context );

		$this->authentication  = new Authentication( $this->context );
		$this->dismissed_items = $dismissed_items;
	}

	public function register() {
		add_action(
			'wp_dashboard_setup',
			function () {
				$this->add_widgets();
			}
		);
	}
}
```

### Widget Registration

**Location**: `includes/Core/Admin/Dashboard.php` (`add_widgets()` method)

```php
private function add_widgets() {
	if ( ! current_user_can( Permissions::VIEW_WP_DASHBOARD_WIDGET ) ) {
		return;
	}

	$this->assets->enqueue_asset( 'googlesitekit-wp-dashboard-css' );
	$this->assets->enqueue_asset( 'googlesitekit-wp-dashboard' );
	$this->modules->enqueue_assets();

	wp_add_dashboard_widget(
		'google_dashboard_widget',
		__( 'Site Kit Summary – last 28 days', 'google-site-kit' ),
		function () {
			$this->render_googlesitekit_wp_dashboard();
		}
	);
}
```

### Widget Rendering

**Location**: `includes/Core/Admin/Dashboard.php` (`render_googlesitekit_wp_dashboard()` method)

The widget renders a single React root (`#js-googlesitekit-wp-dashboard`) plus preview/loading blocks. It computes connection state from the active modules and view-only / shared-data permissions, optionally suppressing the Analytics setup CTA when `analytics-setup-cta-wp-dashboard` has been dismissed. The React app (not PHP) renders the Analytics / Search Console widgets into the loading containers.

```php
private function render_googlesitekit_wp_dashboard() {
	$active_modules                 = $this->modules->get_active_modules();
	$analytics_connected            = isset( $active_modules['analytics-4'] ) && $active_modules['analytics-4']->is_connected();
	$search_console_connected       = isset( $active_modules['search-console'] ) && $active_modules['search-console']->is_connected();
	$is_view_only                   = ! $this->authentication->is_authenticated();
	$can_view_shared_analytics      = current_user_can( Permissions::READ_SHARED_MODULE_DATA, 'analytics-4' );
	$can_view_shared_search_console = current_user_can( Permissions::READ_SHARED_MODULE_DATA, 'search-console' );
	// ... compute $display_* flags and $class_names ...

	$this->render_noscript_html();
	?>
	<div id="js-googlesitekit-wp-dashboard" data-view-only="<?php echo esc_attr( $is_view_only ); ?>" class="googlesitekit-plugin <?php echo esc_attr( $class_names ); ?>">
		<div class="googlesitekit-wp-dashboard googlesitekit-wp-dashboard-loading">
			<?php // render_loading_container( ... ) preview blocks ?>
		</div>
	</div>
	<?php
}
```

## Plugin List Customization

### Plugin_Action_Links

**Location**: `includes/Core/Admin/Plugin_Action_Links.php`

Adds action links to the Site Kit plugin row on plugins.php. The filter callback adds a "Start setup" link for users who can set up but cannot view the dashboard, and a "Settings" link for users who can manage options. Links are prepended with `array_unshift()`.

```php
class Plugin_Action_Links {

	private $context;

	public function __construct( Context $context ) {
		$this->context = $context;
	}

	public function register() {
		add_filter(
			'plugin_action_links_' . GOOGLESITEKIT_PLUGIN_BASENAME,
			function ( $links ) {
				if ( current_user_can( Permissions::SETUP ) && ! current_user_can( Permissions::VIEW_DASHBOARD ) ) {
					$setup_link = sprintf(
						'<a href="%s">%s</a>',
						esc_url( $this->context->admin_url() ),
						esc_html__( 'Start setup', 'google-site-kit' )
					);
					array_unshift( $links, $setup_link );
				}

				if ( current_user_can( Permissions::MANAGE_OPTIONS ) ) {
					$settings_link = sprintf(
						'<a href="%s">%s</a>',
						esc_url( $this->context->admin_url( 'settings' ) ),
						esc_html__( 'Settings', 'google-site-kit' )
					);
					array_unshift( $links, $settings_link );
				}

				return $links;
			}
		);
	}
}
```

### Plugin_Row_Meta

**Location**: `includes/Core/Admin/Plugin_Row_Meta.php`

Adds "Rate Site Kit" and "Support" meta links to the Site Kit plugin row. The callback matches on `GOOGLESITEKIT_PLUGIN_BASENAME` and appends the links with `array_merge()`.

```php
class Plugin_Row_Meta {

	public function register() {
		add_filter(
			'plugin_row_meta',
			function ( $meta, $plugin_file ) {
				if ( GOOGLESITEKIT_PLUGIN_BASENAME === $plugin_file ) {
					return array_merge( $meta, $this->get_plugin_row_meta() );
				}
				return $meta;
			},
			10,
			2
		);
	}

	private function get_plugin_row_meta() {
		return array(
			'<a href="https://wordpress.org/support/plugin/google-site-kit/reviews/#new-post">' . __( 'Rate Site Kit', 'google-site-kit' ) . '</a>',
			'<a href="https://wordpress.org/support/plugin/google-site-kit/#new-post">' . __( 'Support', 'google-site-kit' ) . '</a>',
		);
	}
}
```

## Authorization Screen

**Location**: `includes/Core/Admin/Authorize_Application.php` (`@since 1.126.0`)

Custom styling and footer for the WordPress Authorize Application screen when the request targets a Google service. The class uses `Method_Proxy_Trait` and takes `Context` plus an optional `Assets` instance.

```php
final class Authorize_Application {

	use Method_Proxy_Trait;

	private $context;
	private $assets;

	public function __construct( Context $context, ?Assets $assets = null ) {
		$this->context = $context;
		$this->assets  = $assets ?: new Assets( $this->context );
	}

	public function register() {
		add_action( 'admin_enqueue_scripts', $this->get_method_proxy( 'enqueue_assets' ) );
		add_action( 'admin_footer', $this->get_method_proxy( 'render_custom_footer' ) );
	}
}
```

### Screen Detection

**Location**: `includes/Core/Admin/Authorize_Application.php` (`is_authorize_application_screen()` / `is_google_service()` methods)

Screen detection uses the `Current_Screen` helper (it checks the screen id is `authorize-application`), and the Google-service check parses the `success_url` query parameter for a `*.google.com` host.

```php
protected function is_authorize_application_screen() {
	$current_screen = Current_Screen::get();

	return null !== $current_screen && 'authorize-application' === $current_screen->id;
}

protected function is_google_service() {
	$success_url = isset( $_GET['success_url'] ) ? esc_url_raw( wp_unslash( $_GET['success_url'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
	$success_url = sanitize_text_field( $success_url );

	$parsed_url = wp_parse_url( $success_url );

	if ( empty( $parsed_url['host'] ) ) {
		return false;
	}

	return preg_match( '/\.google\.com$/', $parsed_url['host'] ) === 1;
}
```

### Custom Styling and Footer

**Location**: `includes/Core/Admin/Authorize_Application.php` (`enqueue_assets()` / `render_custom_footer()` methods)

Both the stylesheet and the footer only apply when on the authorize-application screen for a Google service. The custom styling is delivered via the `googlesitekit-authorize-application-css` asset (not inline `<style>` here), and the footer renders a simple "Powered by Site Kit" block.

```php
private function enqueue_assets() {
	if ( $this->is_authorize_application_screen() && $this->is_google_service() ) {
		$this->assets->enqueue_asset( 'googlesitekit-authorize-application-css' );
	}
}

private function render_custom_footer() {
	if ( $this->is_authorize_application_screen() && $this->is_google_service() ) {
		echo '<div class="googlesitekit-authorize-application__footer"><p>' . esc_html__( 'Powered by Site Kit', 'google-site-kit' ) . '</p></div>';
	}
}
```

## Tools Page Integration

**Location**: `includes/Core/Admin/Available_Tools.php` (`@since 1.30.0`)

Adds a "Reset Site Kit" card to the WordPress Tools page. The class uses `Method_Proxy_Trait`, hooks `tool_box`, gates rendering on `Permissions::SETUP`, and links to the reset URL from `Reset::url()`.

```php
class Available_Tools {
	use Method_Proxy_Trait;

	public function register() {
		add_action( 'tool_box', $this->get_method_proxy( 'render_tool_box' ) );
	}

	private function render_tool_box() {
		if ( ! current_user_can( Permissions::SETUP ) ) {
			return;
		}
		?>
		<div class="card">
			<h2 class="title"><?php esc_html_e( 'Reset Site Kit', 'google-site-kit' ); ?></h2>
			<p>
				<?php
				esc_html_e(
					'Resetting will disconnect all users and remove all Site Kit settings and data within WordPress. You and any other users who wish to use Site Kit will need to reconnect to restore access.',
					'google-site-kit'
				)
				?>
			</p>
			<p>
				<a class="button button-primary" href="<?php echo esc_url( Reset::url() ); ?>">
					<?php esc_html_e( 'Reset Site Kit', 'google-site-kit' ); ?>
				</a>
			</p>
		</div>
		<?php
	}
}
```

## Standalone Mode

**Location**: `includes/Core/Admin/Standalone.php` (`@since 1.8.0`)

Enables standalone/embedded admin pages (useful for iframes). `register()` no-ops unless in standalone mode, then appends a body class, removes the admin bar, empties the footer text, and prints inline styles.

```php
final class Standalone {

	private $context;

	public function __construct( Context $context ) {
		$this->context = $context;
	}

	public function register() {
		if ( ! $this->is_standalone() ) {
			return;
		}

		add_filter(
			'admin_body_class',
			function ( $admin_body_classes ) {
				return "{$admin_body_classes} googlesitekit-standalone";
			}
		);

		remove_action( 'in_admin_header', 'wp_admin_bar_render', 0 );

		add_filter( 'admin_footer_text', '__return_empty_string', PHP_INT_MAX );
		add_filter( 'update_footer', '__return_empty_string', PHP_INT_MAX );

		add_action(
			'admin_head',
			function () {
				$this->print_standalone_styles();
			}
		);
	}
}
```

### Detection Logic

**Location**: `includes/Core/Admin/Standalone.php` (`is_standalone()` method)

Standalone mode requires `admin.php`, a `page` query arg containing `googlesitekit`, and a truthy `googlesitekit-standalone` query arg (validated as a boolean).

```php
public function is_standalone() {
	global $pagenow;

	$page       = htmlspecialchars( $this->context->input()->filter( INPUT_GET, 'page' ) ?: '' );
	$standalone = $this->context->input()->filter( INPUT_GET, 'googlesitekit-standalone', FILTER_VALIDATE_BOOLEAN );

	return ( 'admin.php' === $pagenow && false !== strpos( $page, 'googlesitekit' ) && $standalone );
}
```

### Standalone Styling

**Location**: `includes/Core/Admin/Standalone.php` (`print_standalone_styles()` method)

```php
private function print_standalone_styles() {
	?>
	<style type="text/css">
	html {
		padding-top: 0 !important;
	}

	body.googlesitekit-standalone #adminmenumain {
		display: none;
	}

	body.googlesitekit-standalone #wpcontent {
		margin-left: 0;
	}
	</style>
	<?php
}
```

## Initialization

All admin features are registered from `Plugin.php`. Most are instantiated inside the `init`-time bootstrap closure (priority `-999`); `Plugin_Row_Meta` and `Plugin_Action_Links` are registered outside that closure.

**Location**: `includes/Plugin.php`

```php
// Inside the init bootstrap closure:
$screens = new Core\Admin\Screens( $this->context, $assets, $modules, $authentication );
$screens->register();

// ...

( new Core\Admin\Available_Tools() )->register();
( new Core\Admin\Notices() )->register();
( new Core\Admin\Pointers() )->register();
( new Core\Admin\Dashboard( $this->context, $assets, $modules, $dismissed_items ) )->register();
( new Core\Admin\Authorize_Application( $this->context, $assets ) )->register();
( new Core\Admin\Standalone( $this->context ) )->register();
( new Core\Util\Activation_Notice( $this->context, $activation_flag, $assets ) )->register();

// Outside the closure (plugin row meta and action links):
( new Core\Admin\Plugin_Row_Meta() )->register();
( new Core\Admin\Plugin_Action_Links( $this->context ) )->register();
```

> Note: `Notices`, `Pointers`, and the various notice/pointer providers (e.g. `Activation_Notice`, `Authentication`, `View_Only_Pointer`) are registered independently. The providers add their notices/pointers through the `googlesitekit_admin_notices` and `googlesitekit_admin_pointers` filters; the `Notices`/`Pointers` managers consume those filters.

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
    private function add_widgets() {
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
                ob_start();
                // ... render markup ...
                return ob_get_clean();
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

    // Good - allow specific tags via a registered wp_kses context
    echo wp_kses( $content, 'googlesitekit_admin_notice' );
    ```

5. **Use consistent slug prefixes**
    ```php
    // Screens (Screens::PREFIX is 'googlesitekit-')
    'googlesitekit-dashboard'

    // Notices
    'activated'

    // Pointers
    'googlesitekit-view-only-pointer'
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

    // Good - screen-specific, via the Screen enqueue_callback
    new Screen(
        'googlesitekit-my-screen',
        array(
            'enqueue_callback' => function ( Assets $assets ) {
                $assets->enqueue_asset( 'googlesitekit-my-screen' );
            },
        )
    )
    ```

5. **Don't add screens to the menu when they should be hidden**
    ```php
    // Bad - appears under the main Site Kit menu (default parent_slug).
    new Screen(
        'googlesitekit-user-input',
        array(
            'title' => __( 'User Input', 'google-site-kit' ),
        )
    )

    // Good - hidden from the menu using the null sentinel.
    new Screen(
        'googlesitekit-user-input',
        array(
            'title'       => __( 'User Input', 'google-site-kit' ),
            'parent_slug' => self::PARENT_SLUG_NULL,
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
                'active_callback' => function ( $hook_suffix ) {
                    return 'plugins.php' === $hook_suffix;
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
                'title'     => __( 'Welcome!', 'google-site-kit' ),
                'content'   => __( 'Check out this feature.', 'google-site-kit' ),
                'target_id' => 'my-menu-item',
                'position'  => array(
                    'edge'  => 'left',
                    'align' => 'middle',
                ),
            )
        );

        return $pointers;
    }
);
```

### Adding Custom Screens

Screens are defined in the `Screens::get_screens()` method. Add a new `Screen` instance there (use `self::PARENT_SLUG_NULL` to keep it out of the menu):

```php
private function get_screens() {
    $screens = array(
        // ... existing screens
    );

    $screens[] = new Screen(
        self::PREFIX . 'custom',
        array(
            'title'            => __( 'Custom Page', 'google-site-kit' ),
            'capability'       => Permissions::VIEW_DASHBOARD,
            'parent_slug'      => self::PARENT_SLUG_NULL,
            'render_callback'  => function ( Context $context ) { /* ... */ },
            'enqueue_callback' => function ( Assets $assets ) {
                $assets->enqueue_asset( 'googlesitekit-custom' );
            },
        )
    );

    return $screens;
}
```
