<?php
/**
 * Class Google\Site_Kit\Core\Assets\Assets
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Assets;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\URL;
use WP_Dependencies;
use WP_Post_Type;
use WP_Post;

/**
 * Class managing assets.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Assets {

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Lazy-loaded assets as $handle => $instance pairs.
	 *
	 * @since 1.0.0
	 * @var array
	 */
	private $assets = array();

	/**
	 * Internal flag for whether assets have been registered yet.
	 *
	 * @since 1.2.0
	 * @var bool
	 */
	private $assets_registered = false;

	/**
	 * Internal list of print callbacks already done.
	 *
	 * @since 1.2.0
	 * @var array
	 */
	private $print_callbacks_done = array();

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 * @since 1.37.0 Enqueues Block Editor assets.
	 */
	public function register() {
		$register_callback = function() {
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

		add_filter(
			'script_loader_tag',
			function( $tag, $handle ) {
				return $this->add_async_defer_attribute( $tag, $handle );
			},
			10,
			2
		);

		// All other asset-related general logic should only be active when the
		// current user can actually use Site Kit.
		if ( false === (
				current_user_can( Permissions::VIEW_SPLASH ) || current_user_can( Permissions::VIEW_DASHBOARD )
			)
		) {
			return;
		}

		$this->add_amp_dev_mode_attributes( $this->get_assets() );

		add_action(
			'admin_print_scripts-edit.php',
			function() {
				global $post_type;
				if ( 'post' !== $post_type ) {
					// For CONTEXT_ADMIN_POSTS we only load scripts for the 'post' post type.
					return;
				}
				$assets = $this->get_assets();

				array_walk(
					$assets,
					function( Asset $asset ) {
						if ( $asset->has_context( Asset::CONTEXT_ADMIN_POSTS ) ) {
							$this->enqueue_asset( $asset->get_handle() );
						}
					}
				);
			}
		);

		add_action(
			'enqueue_block_editor_assets',
			function() {
				$assets = $this->get_assets();

				array_walk(
					$assets,
					function( $asset ) {
						if ( $asset->has_context( Asset::CONTEXT_ADMIN_POST_EDITOR ) ) {
							$this->enqueue_asset( $asset->get_handle() );
						}
					}
				);
			}
		);

		$scripts_print_callback = function() {
			$scripts = wp_scripts();
			$this->run_before_print_callbacks( $scripts, $scripts->queue );
		};
		add_action( 'wp_print_scripts', $scripts_print_callback );
		add_action( 'admin_print_scripts', $scripts_print_callback );

		$styles_print_callback = function() {
			$styles = wp_styles();
			$this->run_before_print_callbacks( $styles, $styles->queue );
		};
		add_action( 'wp_print_styles', $styles_print_callback );
		add_action( 'admin_print_styles', $styles_print_callback );
	}

	/**
	 * Enqueues the given plugin asset (script or stylesheet).
	 *
	 * The asset must already be registered in order to be enqueued.
	 *
	 * @since 1.0.0
	 *
	 * @param string $handle Asset handle.
	 */
	public function enqueue_asset( $handle ) {
		// Register assets on-the-fly if necessary (currently the case for admin bar in frontend).
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

	/**
	 * Enqueues Google fonts.
	 *
	 * @since 1.0.0
	 * @deprecated  1.41.0 This method is no longer used as fonts are loaded as a normal style dependency now.
	 */
	public function enqueue_fonts() {
		_deprecated_function( __METHOD__, '1.41.0' );

		$assets = $this->get_assets();

		if ( ! empty( $assets['googlesitekit-fonts'] ) && $assets['googlesitekit-fonts'] instanceof Asset ) {
			$assets['googlesitekit-fonts']->enqueue();
		}
	}

	/**
	 * Get Google fonts src for CSS.
	 *
	 * @since 1.41.0
	 *
	 * @return string String URL src.
	 */
	protected function get_fonts_src() {
		$font_families = array(
			'Google+Sans+Text:400,500',
			'Google+Sans+Display:400,500,700',
		);

		if ( Feature_Flags::enabled( 'gm3Components' ) ) {
			$font_families[] = 'Roboto:300,400,500';
		}

		$filtered_font_families = apply_filters( 'googlesitekit_font_families', $font_families );

		if ( empty( $filtered_font_families ) ) {
			return '';
		}

		return add_query_arg(
			array(
				'family'  => implode( '|', $filtered_font_families ),
				'subset'  => 'latin-ext',
				'display' => 'fallback',
			),
			'https://fonts.googleapis.com/css'
		);
	}

	/**
	 * Registers all plugin assets.
	 *
	 * @since 1.0.0
	 */
	private function register_assets() {
		$assets = $this->get_assets();

		foreach ( $assets as $asset ) {
			$asset->register( $this->context );
		}
	}

	/**
	 * Add data-ampdevmode attributes to assets.
	 *
	 * @todo What about dependencies?
	 *
	 * @param Asset[] $assets Assets.
	 */
	private function add_amp_dev_mode_attributes( $assets ) {
		add_filter(
			'script_loader_tag',
			function ( $tag, $handle ) use ( $assets ) {
				// TODO: 'hoverintent-js' can be removed from here at some point, see https://github.com/ampproject/amp-wp/pull/3928.
				if ( $this->context->is_amp() && ( isset( $assets[ $handle ] ) && $assets[ $handle ] instanceof Script || 'hoverintent-js' === $handle ) ) {
					$tag = preg_replace( '/(?<=<script)(?=\s|>)/i', ' data-ampdevmode', $tag );
				}
				return $tag;
			},
			10,
			2
		);

		add_filter(
			'style_loader_tag',
			function ( $tag, $handle ) use ( $assets ) {
				if ( $this->context->is_amp() && isset( $assets[ $handle ] ) && $assets[ $handle ] instanceof Stylesheet ) {
					$tag = preg_replace( '/(?<=<link)(?=\s|>)/i', ' data-ampdevmode', $tag );
				}
				return $tag;
			},
			10,
			2
		);
	}

	/**
	 * Forms an array of dependencies based on the necessary context.
	 *
	 * @since 1.87.0
	 *
	 * @param string $context The context for which dependencies should be formed.
	 * @return array The array of dependencies.
	 */
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
		);

		if ( 'dashboard' === $context || 'dashboard-sharing' === $context ) {
			array_push( $dependencies, 'googlesitekit-components' );
		}

		if ( 'dashboard-sharing' === $context && Feature_Flags::enabled( 'dashboardSharing' ) ) {
			array_push( $dependencies, 'googlesitekit-dashboard-sharing-data' );
		}

		return $dependencies;
	}

	/**
	 * Gets all plugin assets.
	 *
	 * The method will lazy-load assets in an internal property so that the processing only happens once.
	 *
	 * @since 1.0.0
	 *
	 * @return Asset[] Associative array of asset $handle => $instance pairs.
	 */
	private function get_assets() {
		if ( $this->assets ) {
			return $this->assets;
		}

		$base_url     = $this->context->url( 'dist/assets/' );
		$dependencies = $this->get_asset_dependencies();

		// Register plugin scripts.
		$assets = array(
			new Script_Data(
				'googlesitekit-commons',
				array(
					'global'        => '_googlesitekitLegacyData',
					'data_callback' => function () {
						return $this->get_inline_data();
					},
				)
			),
			new Script_Data(
				'googlesitekit-base-data',
				array(
					'global'        => '_googlesitekitBaseData',
					'data_callback' => function () {
						return $this->get_inline_base_data();
					},
				)
			),
			new Script_Data(
				'googlesitekit-entity-data',
				array(
					'global'        => '_googlesitekitEntityData',
					'data_callback' => function () {
						return $this->get_inline_entity_data();
					},
				)
			),
			new Script_Data(
				'googlesitekit-user-data',
				array(
					'global'        => '_googlesitekitUserData',
					'data_callback' => function() {
						return $this->get_inline_user_data();
					},
				)
			),
			new Script_Data(
				'googlesitekit-apifetch-data',
				array(
					'global'        => '_googlesitekitAPIFetchData',
					'data_callback' => function () {
						/**
						 * Preload common data by specifying an array of REST API paths that will be preloaded.
						 *
						 * Filters the array of paths that will be preloaded.
						 *
						 * @since 1.7.0
						 *
						 * @param array $preload_paths Array of paths to preload.
						 */
						$preload_paths = apply_filters( 'googlesitekit_apifetch_preload_paths', array() );
						$preloaded     = array_reduce(
							array_unique( $preload_paths ),
							'rest_preload_api_request',
							array()
						);

						return array(
							'nonce'         => ( wp_installing() && ! is_multisite() ) ? '' : wp_create_nonce( 'wp_rest' ),
							'nonceEndpoint' => admin_url( 'admin-ajax.php?action=rest-nonce' ),
							'preloadedData' => $preloaded,
							'rootURL'       => esc_url_raw( get_rest_url() ),
						);
					},
				)
			),
			new Script_Data(
				'googlesitekit-dashboard-sharing-data',
				array(
					'global'        => '_googlesitekitDashboardSharingData',
					'data_callback' => function() {
						return $this->get_inline_dashboard_sharing_data();
					},
				)
			),
			new Script_Data(
				'googlesitekit-tracking-data',
				array(
					'global'        => '_googlesitekitTrackingData',
					'data_callback' => function() {
						return $this->get_inline_tracking_data();
					},
				)
			),
			new Script_Data(
				'googlesitekit-modules-data',
				array(
					'global'        => '_googlesitekitModulesData',
					'data_callback' => function() {
						return $this->get_inline_modules_data();
					},
				)
			),
			new Script(
				'googlesitekit-runtime',
				array(
					'src' => $base_url . 'js/runtime.js',
				)
			),
			new Script(
				'googlesitekit-polyfills',
				array(
					'src'          => $base_url . 'js/googlesitekit-polyfills.js',
					'dependencies' => array(
						'googlesitekit-base-data',
					),
				)
			),
			new Script(
				'googlesitekit-i18n',
				array(
					'src' => $base_url . 'js/googlesitekit-i18n.js',
				)
			),
			new Script(
				'googlesitekit-vendor',
				array(
					'src'          => $base_url . 'js/googlesitekit-vendor.js',
					'dependencies' => array(
						'googlesitekit-i18n',
						'googlesitekit-runtime',
						'googlesitekit-polyfills',
					),
				)
			),
			// Admin assets.
			new Script(
				'googlesitekit-components',
				array(
					'src' => $base_url . (
						Feature_Flags::enabled( 'gm3Components' )
							? 'js/googlesitekit-components-gm3.js'
							: 'js/googlesitekit-components-gm2.js'
						),
				)
			),
			new Script(
				'googlesitekit-activation',
				array(
					'src'          => $base_url . 'js/googlesitekit-activation.js',
					'dependencies' => $this->get_asset_dependencies( 'dashboard' ),
				)
			),
			// Begin JSR Assets.
			new Script(
				'googlesitekit-api',
				array(
					'src'          => $base_url . 'js/googlesitekit-api.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-apifetch-data',
					),
				)
			),
			new Script(
				'googlesitekit-data',
				array(
					'src'          => $base_url . 'js/googlesitekit-data.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
					),
				)
			),
			new Script(
				'googlesitekit-datastore-user',
				array(
					'src'          => $base_url . 'js/googlesitekit-datastore-user.js',
					'dependencies' => array(
						'googlesitekit-data',
						'googlesitekit-api',
						'googlesitekit-user-data',
					),
				)
			),
			new Script(
				'googlesitekit-datastore-location',
				array(
					'src'          => $base_url . 'js/googlesitekit-datastore-location.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-data',
					),
				)
			),
			new Script(
				'googlesitekit-datastore-site',
				array(
					'src'          => $base_url . 'js/googlesitekit-datastore-site.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-base-data',
						'googlesitekit-entity-data',
					),
				)
			),
			new Script(
				'googlesitekit-datastore-forms',
				array(
					'src'          => $base_url . 'js/googlesitekit-datastore-forms.js',
					'dependencies' => array(
						'googlesitekit-data',
					),
				)
			),
			new Script(
				'googlesitekit-datastore-ui',
				array(
					'src'          => $base_url . 'js/googlesitekit-datastore-ui.js',
					'dependencies' => array(
						'googlesitekit-data',
					),
				)
			),
			new Script(
				'googlesitekit-modules',
				array(
					'src'          => $base_url . 'js/googlesitekit-modules.js',
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-user',
					),
				)
			),
			new Script(
				'googlesitekit-widgets',
				array(
					'src'          => $base_url . 'js/googlesitekit-widgets.js',
					'dependencies' => array(
						'googlesitekit-data',
						'googlesitekit-i18n',
						'googlesitekit-components',
					),
				)
			),
			new Script(
				'googlesitekit-user-input',
				array(
					'src'          => $base_url . 'js/googlesitekit-user-input.js',
					'dependencies' => $this->get_asset_dependencies( 'dashboard' ),
				)
			),
			// End JSR Assets.
			new Script(
				'googlesitekit-splash',
				array(
					'src'          => $base_url . 'js/googlesitekit-splash.js',
					'dependencies' => $this->get_asset_dependencies( 'dashboard' ),
				)
			),
			new Script(
				'googlesitekit-entity-dashboard',
				array(
					'src'          => $base_url . 'js/googlesitekit-entity-dashboard.js',
					'dependencies' => $this->get_asset_dependencies( 'dashboard-sharing' ),
				)
			),
			new Script(
				'googlesitekit-main-dashboard',
				array(
					'src'          => $base_url . 'js/googlesitekit-main-dashboard.js',
					'dependencies' => $this->get_asset_dependencies( 'dashboard-sharing' ),
				)
			),
			new Script(
				'googlesitekit-settings',
				array(
					'src'          => $base_url . 'js/googlesitekit-settings.js',
					'dependencies' => $this->get_asset_dependencies( 'dashboard-sharing' ),
				)
			),
			new Script(
				'googlesitekit-ad-blocking-recovery',
				array(
					'src'          => $base_url . 'js/googlesitekit-ad-blocking-recovery.js',
					'dependencies' => $this->get_asset_dependencies( 'dashboard' ),
				)
			),
			new Stylesheet(
				'googlesitekit-admin-css',
				array(
					'src'          => $base_url . 'css/googlesitekit-admin-css.css',
					'dependencies' => array(
						'googlesitekit-fonts',
					),
				)
			),
			// WP Dashboard assets.
			new Script(
				'googlesitekit-wp-dashboard',
				array(
					'src'          => $base_url . 'js/googlesitekit-wp-dashboard.js',
					'dependencies' => $dependencies,
					'execution'    => 'defer',
				)
			),
			new Stylesheet(
				'googlesitekit-wp-dashboard-css',
				array(
					'src'          => $base_url . 'css/googlesitekit-wp-dashboard-css.css',
					'dependencies' => array(
						'googlesitekit-fonts',
					),
				)
			),
			// Admin bar assets.
			new Script(
				'googlesitekit-adminbar',
				array(
					'src'          => $base_url . 'js/googlesitekit-adminbar.js',
					'dependencies' => $dependencies,
					'execution'    => 'defer',
				)
			),
			new Stylesheet(
				'googlesitekit-adminbar-css',
				array(
					'src'          => $base_url . 'css/googlesitekit-adminbar-css.css',
					'dependencies' => array(
						'googlesitekit-fonts',
					),
				)
			),
			new Stylesheet(
				'googlesitekit-fonts',
				array(
					'src'     => $this->get_fonts_src(),
					'version' => null,
				)
			),
		);

		/**
		 * Filters the list of assets that Site Kit should register.
		 *
		 * This filter covers both scripts and stylesheets.
		 *
		 * @since 1.7.0
		 *
		 * @param Asset[] $assets List of Asset objects.
		 */
		$assets = apply_filters( 'googlesitekit_assets', $assets );

		$this->assets = array();
		foreach ( $assets as $asset ) {
			$this->assets[ $asset->get_handle() ] = $asset;
		}

		return $this->assets;
	}

	/**
	 * Gets the most basic inline data needed for JS files.
	 *
	 * This should not include anything remotely expensive to compute.
	 *
	 * @since 1.2.0
	 *
	 * @return array The base inline data to be output.
	 */
	private function get_inline_base_data() {
		global $wpdb;
		$site_url = $this->context->get_reference_site_url();

		$inline_data = array(
			'homeURL'          => trailingslashit( $this->context->get_canonical_home_url() ),
			'referenceSiteURL' => esc_url_raw( trailingslashit( $site_url ) ),
			'adminURL'         => esc_url_raw( trailingslashit( admin_url() ) ),
			'assetsURL'        => esc_url_raw( $this->context->url( 'dist/assets/' ) ),
			'widgetsAdminURL'  => esc_url_raw( $this->get_widgets_admin_url() ),
			'blogPrefix'       => $wpdb->get_blog_prefix(),
			'ampMode'          => $this->context->get_amp_mode(),
			'isNetworkMode'    => $this->context->is_network_mode(),
			'timezone'         => get_option( 'timezone_string' ),
			'siteName'         => wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ),
			'enabledFeatures'  => Feature_Flags::get_enabled_features(),
			'webStoriesActive' => defined( 'WEBSTORIES_VERSION' ),
			'postTypes'        => $this->get_post_types(),
			'storagePrefix'    => $this->get_storage_prefix(),
			'referenceDate'    => apply_filters( 'googlesitekit_reference_date', null ),
			'productBasePaths' => $this->get_product_base_paths(),
		);

		/**
		 * Filters the most basic inline data to pass to JS.
		 *
		 * This should not include anything remotely expensive to compute.
		 *
		 * @since 1.2.0
		 *
		 * @param array $data Base data.
		 */
		return apply_filters( 'googlesitekit_inline_base_data', $inline_data );
	}

	/**
	 * Gets the available public post type slugs and their labels.
	 *
	 * @since 1.81.0
	 *
	 * @return array Available post types array with their respective slugs and labels.
	 */
	private function get_post_types() {
		$post_types     = array();
		$all_post_types = get_post_types( array( 'public' => true ), 'objects' );
		foreach ( $all_post_types as $post_type_slug => $post_type_obj ) {
			$post_types[] = array(
				'slug'  => $post_type_slug,
				'label' => $post_type_obj->label,
			);
		}
		return $post_types;
	}

	/**
	 * Gets the widgets admin edit page or block editor URL depending
	 * on the current theme.
	 *
	 * Themes which have FSE support do not have the old widgets admin screen. Such
	 * themes only have the option to edit widgets directly in the block editor.
	 *
	 * @since 1.81.0
	 *
	 * @return string The admin widgets page or block editor URL.
	 */
	private function get_widgets_admin_url() {
		$current_theme = wp_get_theme();

		if ( method_exists( $current_theme, 'is_block_theme' ) && $current_theme->is_block_theme() ) {
			return admin_url( 'site-editor.php' );
		}

		if ( count( $GLOBALS['wp_registered_sidebars'] ) > 0 ) {
			return admin_url( 'widgets.php' );
		}

		return null;
	}

	/**
	 * Gets the inline data specific to the current entity.
	 *
	 * @since 1.7.0
	 *
	 * @return array The site inline data to be output.
	 */
	private function get_inline_entity_data() {
		$current_entity = $this->context->get_reference_entity();

		return array(
			'currentEntityURL'   => $current_entity ? $current_entity->get_url() : null,
			'currentEntityType'  => $current_entity ? $current_entity->get_type() : null,
			'currentEntityTitle' => $current_entity ? $current_entity->get_title() : null,
			'currentEntityID'    => $current_entity ? $current_entity->get_id() : null,
		);
	}

	/**
	 * Gets the inline data specific to the current user
	 *
	 * @since 1.9.0
	 *
	 * @return array The user inline data to be output.
	 */
	private function get_inline_user_data() {
		$current_user = wp_get_current_user();

		$inline_data = array(
			'user' => array(
				'id'      => $current_user->ID,
				'email'   => $current_user->user_email,
				'name'    => $current_user->display_name,
				'picture' => get_avatar_url( $current_user->user_email ),
			),
		);

		/**
		 * Filters the user inline data to pass to JS.
		 *
		 * This should not include anything remotely expensive to compute.
		 *
		 * @since 1.9.0
		 *
		 * @param array $data User data.
		 */
		return apply_filters( 'googlesitekit_user_data', $inline_data );
	}

	/**
	 * Gets the inline dashboard sharing data
	 *
	 * @since 1.49.0
	 *
	 * @return array The dashboard sharing inline data to be output.
	 */
	private function get_inline_dashboard_sharing_data() {
		$all_roles   = wp_roles()->roles;
		$inline_data = array( 'roles' => array() );

		foreach ( $all_roles as $role_slug => $role_details ) {
			$role = get_role( $role_slug );

			// Filter the role that has `edit_posts` capability.
			if ( $role->has_cap( 'edit_posts' ) ) {
				$inline_data['roles'][] = array(
					'id'          => $role_slug,
					'displayName' => translate_user_role( $role_details['name'] ),
				);
			}
		}

		$settings                = new Module_Sharing_Settings( new Options( $this->context ) );
		$inline_data['settings'] = $settings->get();

		/**
		 * Filters the dashboard sharing inline data to pass to JS.
		 *
		 * @since 1.49.0
		 *
		 * @param array $data dashboard sharing data.
		 */
		return apply_filters( 'googlesitekit_dashboard_sharing_data', $inline_data );
	}

	/**
	 * Gets data relevant for `trackEvent` calls.
	 *
	 * @since 1.78.0
	 *
	 * @return array The tracking inline data to be output.
	 */
	private function get_inline_tracking_data() {
		$site_url     = $this->context->get_reference_site_url();
		$current_user = wp_get_current_user();

		$inline_data = array(
			'referenceSiteURL' => esc_url_raw( trailingslashit( $site_url ) ),
			'userIDHash'       => md5( $site_url . $current_user->ID ),
		);

		/**
		 * Filters the data relevant to trackEvent calls to pass to JS.
		 *
		 * @since 1.78.0
		 *
		 * @param array $inline_data Tracking data.
		 */
		return apply_filters( 'googlesitekit_inline_tracking_data', $inline_data );
	}

	/**
	 * Gets the inline data needed for core plugin scripts.
	 *
	 * @since 1.0.0
	 *
	 * @return array The inline data to be output.
	 */
	private function get_inline_data() {
		$site_url = $this->context->get_reference_site_url();
		$input    = $this->context->input();

		$admin_data = array(
			'siteURL'      => esc_url_raw( $site_url ),
			'resetSession' => $input->filter( INPUT_GET, 'googlesitekit_reset_session', FILTER_VALIDATE_BOOLEAN ),
		);

		return array(

			/**
			 * Filters the admin data to pass to JS.
			 *
			 * @since 1.0.0
			 *
			 * @param array $data Admin data.
			 */
			'admin'  => apply_filters( 'googlesitekit_admin_data', $admin_data ),

			'locale' => $this->context->get_locale( 'user' ),

			/**
			 * Filters the setup data to pass to JS, needed during the dashboard page load.
			 *
			 * Get the setup data from the options table.
			 *
			 * @since 1.0.0
			 *
			 * @param array $data Authentication Data.
			 */
			'setup'  => apply_filters( 'googlesitekit_setup_data', array() ),
		);
	}

	/**
	 * Gets inline modules data.
	 *
	 * @since 1.96.0
	 *
	 * @return array The inline modules data to be output.
	 */
	private function get_inline_modules_data() {

		/**
		 * Filters the inline modules data to pass to JS.
		 *
		 * @since 1.96.0
		 *
		 * @param array $data Modules data.
		 */
		return apply_filters( 'googlesitekit_inline_modules_data', array() );
	}

	/**
	 * Adds support for async and defer attributes to enqueued scripts.
	 *
	 * @since 1.0.0
	 *
	 * @param string $tag    The script tag.
	 * @param string $handle The script handle.
	 * @return string Modified script tag.
	 */
	private function add_async_defer_attribute( $tag, $handle ) {
		$script_execution = wp_scripts()->get_data( $handle, 'script_execution' );
		if ( ! $script_execution ) {
			return $tag;
		}

		if ( 'async' !== $script_execution && 'defer' !== $script_execution ) {
			return $tag;
		}

		// Abort adding async/defer for scripts that have this script as a dependency.
		foreach ( wp_scripts()->registered as $script ) {
			if ( in_array( $handle, $script->deps, true ) ) {
				return $tag;
			}
		}

		// Add the attribute if it hasn't already been added.
		if ( ! preg_match( ":\s$script_execution(=|>|\s):", $tag ) ) {
			$tag = preg_replace( ':(?=></script>):', " $script_execution", $tag, 1 );
		}

		return $tag;
	}

	/**
	 * Executes all extra callbacks before printing a list of dependencies.
	 *
	 * This method ensures that such callbacks that run e.g. `wp_add_inline_script()` are executed just-in-time,
	 * only when the asset is actually loaded in the current request.
	 *
	 * This method works recursively, also looking at dependencies, and supports both scripts and stylesheets.
	 *
	 * @since 1.2.0
	 *
	 * @param WP_Dependencies $dependencies WordPress dependencies class instance.
	 * @param array           $handles      List of handles to run before print callbacks for.
	 */
	private function run_before_print_callbacks( WP_Dependencies $dependencies, array $handles ) {
		$is_amp = $this->context->is_amp();

		foreach ( $handles as $handle ) {
			if ( isset( $this->print_callbacks_done[ $handle ] ) ) {
				continue;
			}

			$this->print_callbacks_done[ $handle ] = true;

			if ( isset( $this->assets[ $handle ] ) ) {
				$this->assets[ $handle ]->before_print();

				// TODO: This can be removed at some point, see https://github.com/ampproject/amp-wp/pull/4001.
				if ( $is_amp && $this->assets[ $handle ] instanceof Script ) {
					$this->add_extra_script_amp_dev_mode( $handle );
				}
			}

			if ( isset( $dependencies->registered[ $handle ] ) && is_array( $dependencies->registered[ $handle ]->deps ) ) {
				$this->run_before_print_callbacks( $dependencies, $dependencies->registered[ $handle ]->deps );
			}
		}
	}

	/**
	 * Adds a comment to all extra scripts so that they are considered compatible with AMP dev mode.
	 *
	 * {@see Assets::add_amp_dev_mode_attributes()} makes all registered scripts and stylesheets compatible, including
	 * their potential inline additions. This method does the same for extra scripts, which are registered under the
	 * 'data' key.
	 *
	 * @since 1.4.0
	 *
	 * @param string $handle The handle of a registered script.
	 */
	private function add_extra_script_amp_dev_mode( $handle ) {
		$data = wp_scripts()->get_data( $handle, 'data' ) ?: '';
		if ( ! empty( $data ) && is_string( $data ) ) {
			wp_scripts()->add_data( $handle, 'data', '/*googlesitekit*/ ' . $data );
		}
	}

	/**
	 * Gets the prefix for the client side cache key.
	 *
	 * Cache key is scoped to user session and blog_id to isolate the
	 * cache between users and sites (in multisite).
	 *
	 * @since 1.92.0
	 *
	 * @return string
	 */
	private function get_storage_prefix() {
		$current_user  = wp_get_current_user();
		$auth_cookie   = wp_parse_auth_cookie();
		$blog_id       = get_current_blog_id();
		$session_token = isset( $auth_cookie['token'] ) ? $auth_cookie['token'] : '';

		return wp_hash( $current_user->user_login . '|' . $session_token . '|' . $blog_id );
	}

	/**
	 * Returns an array of product base paths.
	 *
	 * @since 1.106.0
	 *
	 * @return array The array of product base paths.
	 */
	private function get_product_base_paths() {
		if ( ! Feature_Flags::enabled( 'userInput' ) ) {
			return array();
		}

		// Return early if permalinks are not used.
		if ( ! get_option( 'permalink_structure' ) ) {
			return array();
		}

		$product_base_paths = array();
		$product_type       = get_post_type_object( 'product' );

		// Check whether the product post type is available and public.
		if ( $product_type instanceof WP_Post_Type && $product_type->public ) {
			global $wp_rewrite;
			$permastruct               = $wp_rewrite->get_extra_permastruct( 'product' );
			$permalink_template        = home_url( $permastruct );
			$product_url_path          = URL::parse( $permalink_template, PHP_URL_PATH );
			list( $product_base_path ) = explode( '%product%', $product_url_path, 2 );
			$product_base_path         = str_replace( $wp_rewrite->rewritecode, $wp_rewrite->rewritereplace, $product_base_path );
			if ( strpos( $product_base_path, '^' ) !== 0 ) {
				$product_base_path = '^' . $product_base_path;
			}
			$product_base_paths[] = $product_base_path;
		}

		/**
		 * Filters product base paths found in WordPress. By default the array contains
		 * the base path for the "product" post type if it is available in WordPress
		 * and public.
		 *
		 * @since 1.106.0
		 *
		 * @param array $product_base_paths Array of existing product base paths.
		 */
		$product_base_paths = apply_filters( 'googlesitekit_product_base_paths', $product_base_paths );

		return $product_base_paths;
	}

}
