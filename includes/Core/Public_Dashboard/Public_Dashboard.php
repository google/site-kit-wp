<?php
/**
 * Class Google\Site_Kit\Core\Public_Dashboard\Public_Dashboard
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Public_Dashboard;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class to handle all Public Dashboard related functionality.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Public_Dashboard {

	use Method_Proxy_Trait;

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Assets instance.
	 *
	 * @since n.e.x.t
	 * @var Assets
	 */
	private $assets;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 * @param Assets  $assets  Optional. Assets API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Assets $assets = null
	) {
		$this->context = $context;
		$this->assets  = $assets ?: new Assets( $this->context );
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
		add_action( 'wp_enqueue_scripts', $this->get_method_proxy( 'enqueue_assets' ) );
	}

    /**
     * Registers the public dashboard rewrite rule.
     * 
     * @since n.e.x.t
     */
    private function register_public_dashboard() {
		add_rewrite_rule(
			'^google-site-kit/?',
			'index.php?custom_page=google-site-kit',
			'top'
		);
	}

    /**
     * Adds custom query vars.
     *
     * @since n.e.x.t
     *
     * @param array $vars Query vars.
     * @return array
     */
	private function add_query_vars( $vars ) {
		$vars[] = 'custom_page';

		return $vars;
	}

    /**
     * Loads the public dashboard template.
     *
     * @since n.e.x.t
     *
     * @param string $template Template path.
     * @return string
     */
	private function load_template( $template ) {
		if ( get_query_var( 'custom_page' ) === 'google-site-kit' ) {
			$template_path = GOOGLESITEKIT_PLUGIN_DIR_PATH . 'includes/Core/Public_Dashboard/page-templates/page-public-dashboard.php';

			if ( file_exists( $template_path ) ) {
				return $template_path;
			}
		}

		return $template;
	}

    /**
     * Enqueues assets for the public dashboard.
     *
     * @since n.e.x.t
     */
	private function enqueue_assets() {
		if ( get_query_var( 'custom_page' ) === 'google-site-kit' ) {
            $this->assets->enqueue_asset( 'googlesitekit-public-dashboard' );
            $this->assets->enqueue_asset( 'googlesitekit-admin-css' );
		}
	}
}
