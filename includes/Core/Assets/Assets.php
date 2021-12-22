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
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\Util\Feature_Flags;
use WP_Dependencies;

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
		// current user can actually use Site Kit (which only is so if they can
		// authenticate).
		if ( ! current_user_can( Permissions::AUTHENTICATE ) ) {
			return;
		}

		$this->add_amp_dev_mode_attributes( $this->get_assets() );

		add_action(
			'admin_enqueue_scripts',
			function() {
				$this->enqueue_minimal_admin_script();
			}
		);

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
			'Google+Sans:300,300i,400,400i,500,500i,700,700i',
			'Roboto:300,300i,400,400i,500,500i,700,700i',
		);

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
	 * Enqueues the minimal admin script for the entire admin.
	 *
	 * @since 1.0.0
	 */
	private function enqueue_minimal_admin_script() {
		$this->enqueue_asset( 'googlesitekit-base' );
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

		$base_url = $this->context->url( 'dist/assets/' );

		$dependencies = array(
			'googlesitekit-runtime',
			'googlesitekit-i18n',
			'googlesitekit-vendor',
			'googlesitekit-commons',
			'googlesitekit-base',
			'googlesitekit-data',
			'googlesitekit-datastore-forms',
			'googlesitekit-datastore-location',
			'googlesitekit-datastore-site',
			'googlesitekit-datastore-user',
			'googlesitekit-datastore-ui',
			'googlesitekit-widgets',
		);

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
							array( BC_Functions::class, 'rest_preload_api_request' ),
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
				'googlesitekit-activation',
				array(
					'src'          => $base_url . 'js/googlesitekit-activation.js',
					'dependencies' => $dependencies,
				)
			),
			new Script(
				'googlesitekit-base',
				array(
					'src'          => $base_url . 'js/googlesitekit-base.js',
					'dependencies' => array(
						'googlesitekit-base-data',
						'googlesitekit-i18n',
					),
					'execution'    => 'defer',
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
					),
				)
			),
			new Script(
				'googlesitekit-user-input',
				array(
					'src'          => $base_url . 'js/googlesitekit-user-input.js',
					'dependencies' => $dependencies,
				)
			),
			// End JSR Assets.
			new Script(
				'googlesitekit-dashboard-splash',
				array(
					'src'          => $base_url . 'js/googlesitekit-dashboard-splash.js',
					'dependencies' => $dependencies,
				)
			),
			new Script(
				'googlesitekit-dashboard-details',
				array(
					'src'          => $base_url . 'js/googlesitekit-dashboard-details.js',
					'dependencies' => $dependencies,
				)
			),
			new Script(
				'googlesitekit-dashboard',
				array(
					'src'          => $base_url . 'js/googlesitekit-dashboard.js',
					'dependencies' => $dependencies,
				)
			),
			new Script(
				'googlesitekit-module',
				array(
					'src'          => $base_url . 'js/googlesitekit-module.js',
					'dependencies' => $dependencies,
				)
			),
			new Script(
				'googlesitekit-settings',
				array(
					'src'          => $base_url . 'js/googlesitekit-settings.js',
					'dependencies' => $dependencies,
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
		$site_url     = $this->context->get_reference_site_url();
		$current_user = wp_get_current_user();

		$inline_data = array(
			'homeURL'          => trailingslashit( $this->context->get_canonical_home_url() ),
			'referenceSiteURL' => esc_url_raw( trailingslashit( $site_url ) ),
			'userIDHash'       => md5( $site_url . $current_user->ID ),
			'adminURL'         => esc_url_raw( trailingslashit( admin_url() ) ),
			'assetsURL'        => esc_url_raw( $this->context->url( 'dist/assets/' ) ),
			'blogPrefix'       => $wpdb->get_blog_prefix(),
			'ampMode'          => $this->context->get_amp_mode(),
			'isNetworkMode'    => $this->context->is_network_mode(),
			'timezone'         => get_option( 'timezone_string' ),
			'siteName'         => get_bloginfo( 'name' ),
			'enabledFeatures'  => Feature_Flags::get_enabled_features(),
			'webStoriesActive' => defined( 'WEBSTORIES_VERSION' ),
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
				'roles'   => $current_user->roles,
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
	 * Gets the inline data needed for core plugin scripts.
	 *
	 * @since 1.0.0
	 *
	 * @return array The inline data to be output.
	 */
	private function get_inline_data() {
		$current_user = wp_get_current_user();
		$site_url     = $this->context->get_reference_site_url();
		$input        = $this->context->input();
		$page         = $input->filter( INPUT_GET, 'page', FILTER_SANITIZE_STRING );

		$admin_data = array(
			'siteURL'      => esc_url_raw( $site_url ),
			'resetSession' => $input->filter( INPUT_GET, 'googlesitekit_reset_session', FILTER_VALIDATE_BOOLEAN ),
		);

		$current_entity = $this->context->get_reference_entity();

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
}
