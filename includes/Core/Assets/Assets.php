<?php
/**
 * Class Google\Site_Kit\Core\Assets\Assets
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Assets;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Cache;

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
	 */
	public function register() {
		$register_callback = function() {
			if ( ! is_admin() ) {
				return;
			}

			$this->register_assets();
		};
		add_action( 'admin_enqueue_scripts', $register_callback );
		add_action( 'wp_enqueue_scripts', $register_callback );

		add_action(
			'admin_enqueue_scripts',
			function() {
				$this->enqueue_minimal_admin_script();
			}
		);

		add_filter(
			'script_loader_tag',
			function( $tag, $handle ) {
				return $this->add_async_defer_attribute( $tag, $handle );
			},
			10,
			2
		);
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
		static $assets_registered = false;
		if ( ! $assets_registered ) {
			$assets_registered = true;
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
	 */
	public function enqueue_fonts() {
		static $enqueued = false;

		if ( $enqueued ) {
			return;
		}

		$font_families = array(
			'Google+Sans:300,300i,400,400i,500,500i,700,700i',
			'Roboto:300,300i,400,400i,500,500i,700,700i',
		);

		if ( $this->context->is_amp() ) {
			$fonts_url = add_query_arg(
				array(
					'family'  => implode( '|', $font_families ),
					'subset'  => 'latin-ext',
					'display' => 'fallback',
				),
				'https://fonts.googleapis.com/css'
			);
			wp_enqueue_style( // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
				'googlesitekit-fonts',
				$fonts_url,
				array(),
				null
			);
			return;
		}

		$action = current_action();
		if ( strpos( $action, '_enqueue_scripts' ) ) {
			// Make sure we hook into the right `..._head` action if known.
			$action = str_replace( '_enqueue_scripts', '_head', $action );
		} else {
			// Or fall back to `wp_head`.
			$action = 'wp_head';
		}

		add_action(
			$action,
			function() use ( $font_families ) {
				?>
				<script>

					WebFontConfig = {
						google: { families: [<?php echo "'" . implode( "','", $font_families ) . "'"; /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped */ ?>] }
					};

					( function() {
						var wf = document.createElement( 'script' );
						wf.src = ( 'https:' === document.location.protocol ? 'https' : 'http' ) + '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
						wf.type = 'text/javascript';
						wf.async = 'true';
						var s = document.getElementsByTagName( 'script' )[0];
						s.parentNode.insertBefore( wf, s );
					} )();

				</script>
				<?php
			}
		);
	}

	/**
	 * Renders an SVG sprite.
	 *
	 * @since 1.0.0
	 *
	 * @param string $name Name of SVG icon.
	 * @param array  $args {
	 *     Additional arguments.
	 *
	 *     @type string $role   Role attribute to use. Default 'img'.
	 *     @type string $label  Icon label, for accessibility. Default empty string.
	 *     @type string $height Height attribute to use. Default '25'.
	 *     @type string $width  Width attribute to use. Default '25'.
	 * }
	 * @return string SVG markup.
	 */
	public function svg_sprite( $name = '', $args = array() ) {
		$args = wp_parse_args(
			$args,
			array(
				'label'  => '',
				'role'   => 'img',
				'height' => '25',
				'width'  => '25',
			)
		);

		$href  = $this->context->url( 'dist/assets/svg/svg.svg' ) . '#' . $name;
		$label = 'aria-label="' . ( empty( $args['label'] ) ? esc_attr( $name ) : esc_attr( $args['label'] ) ) . '"';
		$label = 'presentation' === $args['role'] ? '' : $label;

		return sprintf(
			'<svg role="%s" class="%s" %s height="%s" width="%s"><use xlink:href="%s"/></svg>',
			esc_attr( $args['role'] ),
			esc_attr( 'svg googlesitekit-svg-' . $name ),
			$label,
			esc_attr( $args['height'] ),
			esc_attr( $args['width'] ),
			esc_url( $href )
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
			$asset->register();
		}

		$this->add_amp_dev_mode_attributes( $assets );
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
				if ( $this->context->is_amp() && isset( $assets[ $handle ] ) && $assets[ $handle ] instanceof Script ) {
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
		$this->enqueue_asset( 'googlesitekit_admin' );
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

		$dependencies    = array();
		$external_assets = $this->get_external_assets();
		foreach ( $external_assets as $asset ) {
			$dependencies[] = $asset->get_handle();
		}
		$dependencies[] = 'sitekit-vendor';
		$dependencies[] = 'sitekit-commons';

		// Register plugin scripts.
		$assets = array(
			new Script(
				'sitekit-vendor',
				array(
					'src' => $base_url . 'js/vendor.js',
				)
			),
			new Script(
				'sitekit-commons',
				array(
					'src'           => $base_url . 'js/commons.js',
					'dependencies'  => array( 'sitekit-vendor' ),
					'post_register' => function( $handle ) use ( $base_url ) {
						$url_polyfill = (
							'/*googlesitekit*/ ( typeof URL === \'function\') || ' .
							'document.write( \'<script src="' . // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
							$base_url . 'js/externals/wp-polyfill-url.js' .
							'"></scr\' + \'ipt>\' );'
						);
						wp_add_inline_script(
							'sitekit-commons',
							$url_polyfill,
							'before'
						);
					},
				)
			),
			new Script(
				'googlesitekit_modules',
				array(
					'src'          => $base_url . 'js/allmodules.js',
					'dependencies' => $dependencies,
				)
			),
			// Admin assets.
			new Script(
				'googlesitekit_admin',
				array(
					'src'          => $base_url . 'js/googlesitekit-admin.js',
					'dependencies' => $dependencies,
					'execution'    => 'defer',
					'post_enqueue' => function( $handle ) use ( $base_url ) {
						$inline_data = $this->get_inline_data();
						wp_add_inline_script(
							$handle,
							'window.googlesitekit = ' . wp_json_encode( $inline_data ),
							'before'
						);
					},
				)
			),
			new Script(
				'googlesitekit_ads_detect',
				array(
					'src' => $base_url . 'js/ads.js',
				)
			),
			new Script(
				'googlesitekit_dashboard_splash',
				array(
					'src'          => $base_url . 'js/googlesitekit-dashboard-splash.js',
					'dependencies' => $dependencies,
				)
			),
			new Script(
				'googlesitekit_dashboard_details',
				array(
					'src'          => $base_url . 'js/googlesitekit-dashboard-details.js',
					'dependencies' => $dependencies,
				)
			),
			new Script(
				'googlesitekit_dashboard',
				array(
					'src'          => $base_url . 'js/googlesitekit-dashboard.js',
					'dependencies' => $dependencies,
				)
			),
			new Script(
				'googlesitekit_module_page',
				array(
					'src'          => $base_url . 'js/googlesitekit-module.js',
					'dependencies' => array( 'googlesitekit_admin' ),
				)
			),
			new Script(
				'googlesitekit_settings',
				array(
					'src'          => $base_url . 'js/googlesitekit-settings.js',
					'dependencies' => $dependencies,
				)
			),
			new Stylesheet(
				'googlesitekit_admin_css',
				array(
					'src' => $base_url . 'css/admin.css',
				)
			),
			// WP Dashboard assets.
			new Script(
				'googlesitekit_wp_dashboard',
				array(
					'src'          => $base_url . 'js/googlesitekit-wp-dashboard.js',
					'dependencies' => $dependencies,
					'execution'    => 'defer',
				)
			),
			new Stylesheet(
				'googlesitekit_wp_dashboard_css',
				array(
					'src' => $base_url . 'css/wpdashboard.css',
				)
			),
			// Admin bar assets.
			new Script(
				'googlesitekit_adminbar_loader',
				array(
					'src'          => $base_url . 'js/googlesitekit-adminbar-loader.js',
					'dependencies' => $dependencies,
					'execution'    => 'defer',
					'post_enqueue' => function( $handle ) use ( $base_url ) {
						$inline_data = array(
							'publicPath' => $base_url . 'js/',
							'properties' => array(
								'isAdmin' => (bool) is_admin(),
							),
							/** This filter is documented in includes/classes/assets.php */
							'modules'    => apply_filters( 'googlesitekit_modules_data', array() ),
						);
						wp_add_inline_script(
							$handle,
							'window.googlesitekitAdminbar = ' . wp_json_encode( $inline_data ),
							'after'
						);
						if ( ! is_admin() && is_admin_bar_showing() ) {
							$inline_data = $this->get_inline_data();
							wp_add_inline_script(
								$handle,
								'window.googlesitekit = ' . wp_json_encode( $inline_data ),
								'after'
							);
						}
					},
				)
			),
			new Stylesheet(
				'googlesitekit_adminbar_css',
				array(
					'src' => $base_url . 'css/adminbar.css',
				)
			),
		);

		$this->assets = array();
		foreach ( $external_assets as $asset ) {
			$this->assets[ $asset->get_handle() ] = $asset;
		}
		foreach ( $assets as $asset ) {
			$this->assets[ $asset->get_handle() ] = $asset;
		}

		return $this->assets;
	}

	/**
	 * Gets the inline data needed for core plugin scripts.
	 *
	 * @since 1.0.0
	 *
	 * @return array The inline data to be output.
	 */
	private function get_inline_data() {
		$locale       = $this->get_jed_locale_data( 'google-site-kit' );
		$cache        = new Cache();
		$current_user = wp_get_current_user();
		$site_url     = $this->context->get_reference_site_url();
		$input        = $this->context->input();
		$page         = $input->filter( INPUT_GET, 'page', FILTER_SANITIZE_STRING );
		$permalink    = $input->filter( INPUT_GET, 'permaLink', FILTER_SANITIZE_STRING );
		$permalink    = $permalink ?: $this->context->get_reference_canonical();
		$page_title   = $input->filter( INPUT_GET, 'pageTitle', FILTER_SANITIZE_STRING );

		if ( ! $page_title ) {
			$page_title = is_home() ? get_bloginfo( 'blogname' ) : get_the_title();
		}

		$admin_data = array(
			'siteURL'          => esc_url_raw( $site_url ),
			'siteName'         => get_bloginfo( 'name' ),
			'siteUserID'       => md5( $site_url . $current_user->ID ),
			'adminRoot'        => esc_url_raw( get_admin_url() . 'admin.php' ),
			'pluginURI'        => esc_url_raw( $this->context->url( '/' ) ),
			'assetsRoot'       => esc_url_raw( $this->context->url( 'dist/assets/' ) ),
			'nojscache'        => current_user_can( 'manage_options' ) && null !== $input->filter( INPUT_GET, 'nojscache' ),
			'datacache'        => ( current_user_can( 'manage_options' ) && null !== $input->filter( INPUT_GET, 'datacache' ) )
				? json_encode( $cache->get_current_cache_data() ) // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
				: false,
			'timestamp'        => time(),
			'currentScreen'    => is_admin() ? get_current_screen() : null,
			'currentAdminPage' => ( is_admin() && $page ) ? sanitize_key( $page ) : null,
			'resetSession'     => $input->filter( INPUT_GET, 'googlesitekit_reset_session', FILTER_VALIDATE_BOOLEAN ),
			'reAuth'           => $input->filter( INPUT_GET, 'reAuth', FILTER_VALIDATE_BOOLEAN ),
			'userData'         => array(
				'id'      => $current_user->ID,
				'email'   => $current_user->user_email,
				'name'    => $current_user->display_name,
				'picture' => get_avatar_url( $current_user->user_email ),
			),
			'ampEnabled'       => (bool) $this->context->get_amp_mode(),
			'ampMode'          => $this->context->get_amp_mode(),
			'homeURL'          => home_url(),
		);

		return array(

			/**
			 * Filters the admin data to pass to JS.
			 *
			 * @since 1.0.0
			 *
			 * @param array $data Admin data.
			 */
			'admin'              => apply_filters( 'googlesitekit_admin_data', $admin_data ),

			/**
			 * Filters the modules data to pass to JS.
			 *
			 * @since 1.0.0
			 *
			 * @param array $data Data about each module.
			 */
			'modules'            => apply_filters( 'googlesitekit_modules_data', array() ),
			'locale'             => $locale,
			'permissions'        => array(
				'canAuthenticate'      => current_user_can( Permissions::AUTHENTICATE ),
				'canSetup'             => current_user_can( Permissions::SETUP ),
				'canViewPostsInsights' => current_user_can( Permissions::VIEW_POSTS_INSIGHTS ),
				'canViewDashboard'     => current_user_can( Permissions::VIEW_DASHBOARD ),
				'canViewModuleDetails' => current_user_can( Permissions::VIEW_MODULE_DETAILS ),
				'canManageOptions'     => current_user_can( Permissions::MANAGE_OPTIONS ),
				'canPublishPosts'      => current_user_can( Permissions::PUBLISH_POSTS ),
			),

			/**
			 * Filters the setup data to pass to JS, needed during the dashboard page load.
			 *
			 * Get the setup data from the options table.
			 *
			 * @since 1.0.0
			 *
			 * @param array $data Authentication Data.
			 */
			'setup'              => apply_filters( 'googlesitekit_setup_data', array() ),

			/**
			 * Filters the notification message to print to plugin dashboard.
			 *
			 * @since 1.0.0
			 *
			 * @param array $data Notification Data.
			 */
			'notifications'      => apply_filters( 'googlesitekit_notification_data', array() ),
			'permaLink'          => esc_url_raw( $permalink ),
			'pageTitle'          => $page_title,
			'postID'             => get_the_ID(),
			'postType'           => get_post_type(),
			'dashboardPermalink' => $this->context->admin_url( 'dashboard' ),
			'publicPath'         => $this->context->url( 'dist/assets/js/' ),
			'editmodule'         => $input->filter( INPUT_GET, 'editmodule', FILTER_SANITIZE_STRING ),
		);
	}

	/**
	 * Gets Jed-formatted localization data. From gutenberg.
	 *
	 * @since 1.0.0
	 *
	 * @param string $domain Text domain.
	 * @return array Jed localization data.
	 */
	private function get_jed_locale_data( $domain ) {
		$translations = get_translations_for_domain( $domain );

		$locale = array(
			'' => array(
				'domain' => $domain,
				'lang'   => is_admin() ? get_user_locale() : get_locale(),
			),
		);

		if ( ! empty( $translations->headers['Plural-Forms'] ) ) {
			$locale['']['plural_forms'] = $translations->headers['Plural-Forms'];
		}

		foreach ( $translations->entries as $msgid => $entry ) {
			$locale[ $msgid ] = $entry->translations;
		}

		return $locale;
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
	 * Gets all external assets.
	 *
	 * This method should only be called once as it will create a new instance for each asset.
	 *
	 * @since 1.0.0
	 *
	 * @return array List of Asset instances.
	 */
	private function get_external_assets() {
		$base_url     = $this->context->url( 'dist/assets/' );
		$script_debug = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG;
		$suffix       = $script_debug ? '' : '.min';
		$react_suffix = ( $script_debug ? '.development' : '.production' ) . $suffix;

		return array(
			new Script(
				'lodash',
				array(
					'src'           => $base_url . 'vendor/lodash' . $suffix . '.js',
					'version'       => '4.17.15',
					'fallback'      => true,
					'post_register' => function( $handle ) {
						wp_add_inline_script( $handle, '/*googlesitekit*/ window.lodash = window.lodash || _.noConflict(); window.lodash_load = true;' );
					},
				)
			),
			new Script(
				'moment',
				array(
					'src'      => $base_url . 'vendor/moment' . $suffix . '.js',
					'version'  => '2.22.2',
					'fallback' => true,
				)
			),
			new Script(
				'react',
				array(
					'src'      => $base_url . 'vendor/react' . $react_suffix . '.js',
					'version'  => '16.11.0',
					'fallback' => true,
				)
			),
			new Script(
				'react-dom',
				array(
					'src'      => $base_url . 'vendor/react-dom' . $react_suffix . '.js',
					'version'  => '16.11.0',
					'fallback' => true,
				)
			),
			new Script(
				'wp-polyfill',
				array(
					'src'           => $base_url . 'js/externals/wp-polyfill.js',
					'version'       => '7.4.0',
					'fallback'      => true,
					// Note: For whatever reason, PHPCS reports weird errors here although everything is right.
					'post_register' => function( $handle ) use ( $base_url ) {
						$inline_polyfill_tests = array(
							'\'fetch\' in window'                                    => $base_url . 'js/externals/wp-polyfill-fetch.js', // phpcs:ignore WordPress.Arrays.MultipleStatementAlignment
							'document.contains'                                      => $base_url . 'js/externals/wp-polyfill-node-contains.js', // phpcs:ignore WordPress.Arrays.MultipleStatementAlignment
							'window.FormData && window.FormData.prototype.keys'      => $base_url . 'js/externals/wp-polyfill-formdata.js', // phpcs:ignore WordPress.Arrays.MultipleStatementAlignment
							'Element.prototype.matches && Element.prototype.closest' => $base_url . 'js/externals/wp-polyfill-element-closest.js', // phpcs:ignore WordPress.Arrays.MultipleStatementAlignment
						);
						$polyfill_scripts = '/*googlesitekit*/';
						foreach ( $inline_polyfill_tests as $test => $script ) { // phpcs:ignore Generic.WhiteSpace.ScopeIndent.IncorrectExact
							$polyfill_scripts .= (
								'( ' . $test . ' ) || ' .
								'document.write( \'<script src="' . // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
								$script .
								'"></scr\' + \'ipt>\' );'
							);
						} // phpcs:ignore Generic.WhiteSpace.ScopeIndent.IncorrectExact
						wp_add_inline_script( $handle, $polyfill_scripts, 'after' );
					},
				)
			),
			new Script(
				'wp-escape-html',
				array(
					'src'      => $base_url . 'js/externals/escapeHtml.js',
					'version'  => '1.5.1',
					'fallback' => true,
				)
			),
			new Script(
				'wp-is-shallow-equal',
				array(
					'src'      => $base_url . 'js/externals/isShallowEqual.js',
					'version'  => '1.6.1',
					'fallback' => true,
				)
			),
			new Script(
				'wp-hooks',
				array(
					'src'      => $base_url . 'js/externals/hooks.js',
					'version'  => '2.6.0',
					'fallback' => true,
				)
			),
			new Script(
				'wp-element',
				array(
					'src'      => $base_url . 'js/externals/element.js',
					'version'  => '2.8.2',
					'fallback' => true,
				)
			),
			new Script(
				'wp-dom-ready',
				array(
					'src'      => $base_url . 'js/externals/domReady.js',
					'version'  => '2.5.1',
					'fallback' => true,
				)
			),
			new Script(
				'wp-i18n',
				array(
					'src'      => $base_url . 'js/externals/i18n.js',
					'version'  => '3.6.1',
					'fallback' => true,
				)
			),
			new Script(
				'wp-url',
				array(
					'src'      => $base_url . 'js/externals/url.js',
					'version'  => '2.8.2',
					'fallback' => true,
				)
			),
			new Script(
				'wp-api-fetch',
				array(
					'src'           => $base_url . 'js/externals/apiFetch.js',
					'version'       => '3.6.4',
					'fallback'      => true,
					'post_register' => function( $handle ) {
						wp_add_inline_script(
							$handle,
							sprintf(
								'/*googlesitekit*/ wp.apiFetch.use( wp.apiFetch.createNonceMiddleware( "%s" ) );',
								( wp_installing() && ! is_multisite() ) ? '' : wp_create_nonce( 'wp_rest' )
							),
							'after'
						);
						wp_add_inline_script(
							$handle,
							sprintf(
								'/*googlesitekit*/ wp.apiFetch.use( wp.apiFetch.createRootURLMiddleware( "%s" ) );',
								esc_url_raw( get_rest_url() )
							),
							'after'
						);
					},
				)
			),
			new Script(
				'wp-compose',
				array(
					'src'      => $base_url . 'js/externals/compose.js',
					'version'  => '3.7.2',
					'fallback' => true,
				)
			),
			new Script(
				'svgxuse',
				array(
					'src'       => $base_url . 'js/externals/svgxuse.js',
					'version'   => '1.2.6',
					'fallback'  => true,
					'execution' => 'defer',
				)
			),
		);
	}
}
