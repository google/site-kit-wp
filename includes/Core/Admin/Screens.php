<?php
/**
 * Class Google\Site_Kit\Core\Admin\Screens
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Feature_Flags;

/**
 * Class managing admin screens.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Screens {

	const PREFIX           = 'googlesitekit-';
	const PARENT_SLUG_NULL = self::PREFIX . 'null';

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Assets API instance.
	 *
	 * @since 1.0.0
	 * @var Assets
	 */
	private $assets;

	/**
	 * Modules instance.
	 *
	 * @since 1.7.0
	 * @var Modules
	 */
	private $modules;

	/**
	 * Authentication instance.
	 *
	 * @since 1.72.0
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Associative array of $hook_suffix => $screen pairs.
	 *
	 * @since 1.0.0
	 * @var array
	 */
	private $screens = array();

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context        $context Plugin context.
	 * @param Assets         $assets  Optional. Assets API instance. Default is a new instance.
	 * @param Modules        $modules Optional. Modules instance. Default is a new instance.
	 * @param Authentication $authentication  Optional. Authentication instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Assets $assets = null,
		Modules $modules = null,
		Authentication $authentication = null
	) {
		$this->context        = $context;
		$this->assets         = $assets ?: new Assets( $this->context );
		$this->modules        = $modules ?: new Modules( $this->context );
		$this->authentication = $authentication ?: new Authentication( $this->context );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		if ( $this->context->is_network_mode() ) {
			add_action(
				'network_admin_menu',
				function() {
					$this->add_screens();
				}
			);
		}

		add_action(
			'admin_menu',
			function() {
				$this->add_screens();
			}
		);

		add_action(
			'admin_enqueue_scripts',
			function( $hook_suffix ) {
				$this->enqueue_screen_assets( $hook_suffix );
			}
		);

		add_action(
			'admin_page_access_denied',
			function() {
				// Redirect dashboard to splash if no dashboard access (yet).
				$this->no_access_redirect_dashboard_to_splash();
				// Redirect splash to (shared) dashboard if splash is dismissed.
				$this->no_access_redirect_splash_to_dashboard();

				// Redirect module pages to dashboard.
				$this->no_access_redirect_module_to_dashboard();
			}
		);

		// Ensure the menu icon always is rendered correctly, without enqueueing a global CSS file.
		add_action(
			'admin_head',
			function() {
				?>
				<style type="text/css">
					#adminmenu .toplevel_page_googlesitekit-dashboard img {
						width: 16px;
					}
					#adminmenu .toplevel_page_googlesitekit-dashboard.current img,
					#adminmenu .toplevel_page_googlesitekit-dashboard.wp-has-current-submenu img {
						opacity: 1;
					}
				</style>
				<?php
			}
		);

		$remove_notices_callback = function() {
			global $hook_suffix;

			if ( empty( $hook_suffix ) ) {
				return;
			}

			if ( isset( $this->screens[ $hook_suffix ] ) ) {
				remove_all_actions( current_action() );
			}
		};
		add_action( 'admin_notices', $remove_notices_callback, -9999 );
		add_action( 'network_admin_notices', $remove_notices_callback, -9999 );
		add_action( 'all_admin_notices', $remove_notices_callback, -9999 );

		add_filter( 'custom_menu_order', '__return_true' );
		add_filter(
			'menu_order',
			function( array $menu_order ) {
				// Move the Site Kit dashboard menu item to be one after the index.php item if it exists.
				$dashboard_index = array_search( 'index.php', $menu_order, true );

				$sitekit_index = false;
				foreach ( $menu_order as $key => $value ) {
					if ( strpos( $value, self::PREFIX ) === 0 ) {
						$sitekit_index = $key;
						$sitekit_value = $value;
						break;
					}
				}

				if ( false === $dashboard_index || false === $sitekit_index ) {
					return $menu_order;
				}
				unset( $menu_order[ $sitekit_index ] );
				array_splice( $menu_order, $dashboard_index + 1, 0, $sitekit_value );
				return $menu_order;
			}
		);
	}

	/**
	 * Gets the Screen instance for a given hook suffix.
	 *
	 * @since 1.11.0
	 *
	 * @param string $hook_suffix The hook suffix associated with the screen to retrieve.
	 * @return Screen|null Screen instance if available, otherwise null;
	 */
	public function get_screen( $hook_suffix ) {
		return isset( $this->screens[ $hook_suffix ] ) ? $this->screens[ $hook_suffix ] : null;
	}

	/**
	 * Adds all screens to the admin.
	 *
	 * @since 1.0.0
	 */
	private function add_screens() {
		$screens = $this->get_screens();

		array_walk( $screens, array( $this, 'add_screen' ) );
	}

	/**
	 * Adds the given screen to the admin.
	 *
	 * @since 1.0.0
	 *
	 * @param Screen $screen Screen to add.
	 */
	private function add_screen( Screen $screen ) {
		$hook_suffix = $screen->add( $this->context );
		if ( empty( $hook_suffix ) ) {
			return;
		}

		add_action(
			"load-{$hook_suffix}",
			function() use ( $screen ) {
				$screen->initialize( $this->context );
			}
		);

		$this->screens[ $hook_suffix ] = $screen;
	}

	/**
	 * Enqueues assets if a plugin screen matches the given hook suffix.
	 *
	 * @since 1.0.0
	 *
	 * @param string $hook_suffix Hook suffix for the current admin screen.
	 */
	private function enqueue_screen_assets( $hook_suffix ) {
		if ( ! isset( $this->screens[ $hook_suffix ] ) ) {
			return;
		}

		$this->screens[ $hook_suffix ]->enqueue_assets( $this->assets );
		$this->modules->enqueue_assets();
	}

	/**
	 * Redirects from the dashboard to the splash screen if permissions to access the dashboard are currently not met.
	 *
	 * Dashboard permission access is conditional based on whether the user has successfully authenticated. When
	 * e.g. accessing the dashboard manually or having it open in a separate tab while disconnecting in the other tab,
	 * it is a better user experience to redirect to the splash screen so that the user can re-authenticate.
	 *
	 * The only time the dashboard should fail with the regular WordPress permissions error is when the current user is
	 * not eligible for accessing Site Kit entirely, i.e. if they are not allowed to authenticate.
	 *
	 * @since 1.12.0
	 */
	private function no_access_redirect_dashboard_to_splash() {
		global $plugin_page;

		// At this point, our preferred `$hook_suffix` is not set, and the dashboard page will not even be registered,
		// so we need to rely on the `$plugin_page` global here.
		if ( ! isset( $plugin_page ) || self::PREFIX . 'dashboard' !== $plugin_page ) {
			return;
		}

		if ( current_user_can( Permissions::VIEW_SPLASH ) ) {
			wp_safe_redirect(
				$this->context->admin_url( 'splash' )
			);
			exit;
		}
	}

	/**
	 * Redirects from the splash to the dashboard screen if permissions to access the splash are currently not met.
	 *
	 * Admins always have the ability to view the splash page, so this redirects non-admins who have access
	 * to view the shared dashboard if the splash has been dismissed.
	 * Currently the dismissal check is built into the capability for VIEW_SPLASH so this is implied.
	 *
	 * @since 1.77.0
	 */
	private function no_access_redirect_splash_to_dashboard() {
		global $plugin_page;

		if ( ! isset( $plugin_page ) || self::PREFIX . 'splash' !== $plugin_page ) {
			return;
		}

		if ( current_user_can( Permissions::VIEW_DASHBOARD ) ) {
			wp_safe_redirect(
				$this->context->admin_url()
			);
			exit;
		}
	}

	/**
	 * Redirects module pages to the dashboard or splash based on user capability.
	 *
	 * @since 1.69.0
	 */
	private function no_access_redirect_module_to_dashboard() {
		global $plugin_page;

		$legacy_module_pages = array(
			self::PREFIX . 'module-adsense',
			self::PREFIX . 'module-analytics',
			self::PREFIX . 'module-search-console',
		);

		if ( ! in_array( $plugin_page, $legacy_module_pages, true ) ) {
			return;
		}

		// Note: the use of add_query_arg is intentional below because it preserves
		// the current query parameters in the URL.
		if ( current_user_can( Permissions::VIEW_DASHBOARD ) ) {
			wp_safe_redirect(
				add_query_arg( 'page', self::PREFIX . 'dashboard' )
			);
			exit;
		}

		if ( current_user_can( Permissions::VIEW_SPLASH ) ) {
			wp_safe_redirect(
				add_query_arg( 'page', self::PREFIX . 'splash' )
			);
			exit;
		}
	}

	/**
	 * Gets available admin screens.
	 *
	 * @since 1.0.0
	 *
	 * @return array List of Screen instances.
	 */
	private function get_screens() {
		$show_splash_in_menu = current_user_can( Permissions::VIEW_SPLASH ) && ! current_user_can( Permissions::VIEW_DASHBOARD );

		$screens = array(
			new Screen(
				self::PREFIX . 'dashboard',
				array(
					'title'            => __( 'Dashboard', 'google-site-kit' ),
					'capability'       => Permissions::VIEW_DASHBOARD,
					'enqueue_callback' => function( Assets $assets ) {
						if ( $this->context->input()->filter( INPUT_GET, 'permaLink' ) ) {
							$assets->enqueue_asset( 'googlesitekit-entity-dashboard' );
						} else {
							$assets->enqueue_asset( 'googlesitekit-main-dashboard' );
						}
					},
					'render_callback'  => function( Context $context ) {
						$is_view_only = ! $this->authentication->is_authenticated();

						$setup_slug = htmlspecialchars( $context->input()->filter( INPUT_GET, 'slug' ) ?: '' );
						$reauth = $context->input()->filter( INPUT_GET, 'reAuth', FILTER_VALIDATE_BOOLEAN );
						if ( $context->input()->filter( INPUT_GET, 'permaLink' ) ) {
							?>
							<div id="js-googlesitekit-entity-dashboard" data-view-only="<?php echo esc_attr( $is_view_only ); ?>" class="googlesitekit-page"></div>
							<?php
						} else {
							$setup_module_slug = $setup_slug && $reauth ? $setup_slug : '';

							if ( $setup_module_slug ) {
								$active_modules = $this->modules->get_active_modules();

								if ( ! array_key_exists( $setup_module_slug, $active_modules ) ) {
									try {
										$module_details = $this->modules->get_module( $setup_module_slug );
										/* translators: %s: The module name */
										$message        = sprintf( __( 'The %s module cannot be set up as it has not been activated yet.', 'google-site-kit' ), $module_details->name );
									} catch ( \Exception $e ) {
										$message = $e->getMessage();
									}

									wp_die( sprintf( '<span class="googlesitekit-notice">%s</span>', esc_html( $message ) ), 403 );
								}
							}
							?>
							<div id="js-googlesitekit-main-dashboard" data-view-only="<?php echo esc_attr( $is_view_only ); ?>" data-setup-module-slug="<?php echo esc_attr( $setup_module_slug ); ?>" class="googlesitekit-page"></div>
							<?php
						}
					},
				)
			),
			new Screen(
				self::PREFIX . 'splash',
				array(
					'title'               => __( 'Dashboard', 'google-site-kit' ),
					'capability'          => Permissions::VIEW_SPLASH,
					'parent_slug'         => $show_splash_in_menu ? Screen::MENU_SLUG : self::PARENT_SLUG_NULL,
					// This callback will redirect to the dashboard on successful authentication.
					'initialize_callback' => function( Context $context ) {
						// Get the dismissed items for this user.
						$user_options = new User_Options( $context );
						$dismissed_items = new Dismissed_Items( $user_options );

						$splash_context = $context->input()->filter( INPUT_GET, 'googlesitekit_context' );
						$reset_session  = $context->input()->filter( INPUT_GET, 'googlesitekit_reset_session', FILTER_VALIDATE_BOOLEAN );

						// If the user is authenticated, redirect them to the disconnect URL and then send them back here.
						if ( ! $reset_session && 'revoked' === $splash_context && $this->authentication->is_authenticated() ) {
							$this->authentication->disconnect();

							wp_safe_redirect( add_query_arg( array( 'googlesitekit_reset_session' => 1 ) ) );
							exit;
						}

						// Don't consider redirect if the current user cannot access the dashboard (yet).
						if ( ! current_user_can( Permissions::VIEW_DASHBOARD ) ) {
							return;
						}

						// Redirect to dashboard if user is authenticated or if
						// they have already accessed the shared dashboard.
						if (
							$this->authentication->is_authenticated() ||
							(
								! current_user_can( Permissions::AUTHENTICATE ) &&
								$dismissed_items->is_dismissed( 'shared_dashboard_splash' ) &&
								current_user_can( Permissions::VIEW_SHARED_DASHBOARD )
							)
						) {
							wp_safe_redirect(
								$context->admin_url(
									'dashboard',
									array(
										// Pass through the notification parameter, or removes it if none.
										'notification' => $context->input()->filter( INPUT_GET, 'notification' ),
									)
								)
							);
							exit;
						}
					},
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

		$screens[] = new Screen(
			self::PREFIX . 'user-input',
			array(
				'title'       => __( 'User Input', 'google-site-kit' ),
				'capability'  => Permissions::MANAGE_OPTIONS,
				'parent_slug' => self::PARENT_SLUG_NULL,
			)
		);

		$screens[] = new Screen(
			self::PREFIX . 'ad-blocking-recovery',
			array(
				'title'       => __( 'Ad Blocking Recovery', 'google-site-kit' ),
				'capability'  => Permissions::MANAGE_OPTIONS,
				'parent_slug' => self::PARENT_SLUG_NULL,
			)
		);

		return $screens;
	}

}
