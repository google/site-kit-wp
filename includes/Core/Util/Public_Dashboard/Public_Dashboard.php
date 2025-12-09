<?php
/**
 * Class Google\Site_Kit\Core\Util\Public_Dashboard
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;

/**
 * Class to handle Public Dashboard functionality.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Public_Dashboard {

	use Method_Proxy_Trait;

	/**
	 * Assets instance.
	 *
	 * @since n.e.x.t
	 * @var Assets
	 */
	protected $assets;

	/**
	 * Modules instance.
	 *
	 * @since n.e.x.t
	 * @var Modules
	 */
	protected $modules;

	// Capabilities required to view the public dashboard.
	const PUBLIC_DASHBOARD_CAPABILITIES = array(
		Permissions::VIEW_DASHBOARD,
		Permissions::VIEW_POSTS_INSIGHTS,
		Permissions::READ_SHARED_MODULE_DATA,
	);

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Assets  $assets  Assets instance.
	 * @param Modules $modules Modules instance.
	 */
	public function __construct( Assets $assets, Modules $modules ) {
		$this->assets  = $assets;
		$this->modules = $modules;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'init', $this->get_method_proxy( 'register_public_dashboard' ) );
		add_filter( 'query_vars', $this->get_method_proxy( 'add_query_vars' ) );
		add_filter( 'template_include', $this->get_method_proxy( 'load_template' ) );

		add_filter(
			'map_meta_cap',
			$this->get_method_proxy( 'map_meta_capabilities' ),
			20,
			2
		);

		add_filter(
			'user_has_cap',
			$this->get_method_proxy( 'grant_capabilities' ),
			20,
			1
		);

		add_action( 'wp_enqueue_scripts', $this->get_method_proxy( 'enqueue_assets' ) );
	}

	/**
	 * Registers the public dashboard rewrite rule.
	 *
	 * @since n.e.x.t
	 */
	protected function register_public_dashboard() {
		add_rewrite_rule(
			'^google-site-kit/?',
			'index.php?custom_page=google-site-kit',
			'top'
		);
	}

	/**
	 * Adds custom query variables.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $vars Existing query variables.
	 * @return array Modified query variables.
	 */
	protected function add_query_vars( $vars ) {
		$vars[] = 'custom_page';

		return $vars;
	}

	/**
	 * Loads the public dashboard template.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $template The path to the template to load.
	 * @return string The path to the template to load.
	 */
	protected function load_template( $template ) {
		if ( get_query_var( 'custom_page' ) === 'google-site-kit' ) {
			$template_path = GOOGLESITEKIT_PLUGIN_DIR_PATH . 'includes/Core/Util/Public_Dashboard/page-templates/page-public-dashboard.php';

			if ( file_exists( $template_path ) ) {
				return $template_path;
			}
		}

		return $template;
	}

	/**
	 * Maps meta capabilities for the public dashboard.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $caps Capabilities.
	 * @param string $cap  Capability to map.
	 * @return array Mapped capabilities.
	 */
	protected function map_meta_capabilities( $caps, $cap ) {
		if ( is_user_logged_in() ) {
			return $caps;
		}

		if ( in_array( $cap, self::PUBLIC_DASHBOARD_CAPABILITIES, true ) ) {
			return array( $cap );
		}

		return $caps;
	}

	/**
	 * Grants capabilities for the public dashboard to non-logged-in users.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $allcaps All capabilities.
	 * @return array Modified capabilities.
	 */
	protected function grant_capabilities( $allcaps ) {
		if ( is_user_logged_in() ) {
			return $allcaps;
		}

		foreach ( self::PUBLIC_DASHBOARD_CAPABILITIES as $capability ) {
			$allcaps[ $capability ] = true;
		}

		return $allcaps;
	}

	/**
	 * Enqueues assets for the public dashboard.
	 *
	 * @since n.e.x.t
	 */
	protected function enqueue_assets() {
		if ( get_query_var( 'custom_page' ) === 'google-site-kit' ) {
			$this->assets->enqueue_asset( 'googlesitekit-public-dashboard' );
			$this->assets->enqueue_asset( 'googlesitekit-admin-css' );
			$this->modules->enqueue_assets();
		}
	}
}
