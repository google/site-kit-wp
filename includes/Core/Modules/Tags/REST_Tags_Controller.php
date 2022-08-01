<?php
/**
 * Class Google\Site_Kit\Core\Modules\REST_Tags_Controller
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules\Tags;

use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Modules\Analytics;
use Google\Site_Kit\Modules\Adsense;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Class for handling Module tags rest routes.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class REST_Tags_Controller {

	/**
	 * Modules instance.
	 *
	 * @since n.e.x.t
	 * @var Modules
	 */
	protected $modules;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Modules $modules Modules instance.
	 */
	public function __construct( Modules $modules ) {
		$this->modules = $modules;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
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
	 * Gets REST route instances.
	 *
	 * @since n.e.x.t
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		return array(
			new REST_Route(
				'core/modules/data/tags',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$analytics = $this->modules->get_module( Analytics::MODULE_SLUG );
							$tags['head']['analytics'] = $analytics->get_rest_tags();
							$adsense = $this->modules->get_module( Adsense::MODULE_SLUG );
							$tags['head']['adsense'] = $adsense->get_tag();
							return rest_ensure_response( $tags );
						},
						'permission_callback' => function () {
							return true;
						},
					),
				)
			),
		);
	}

}
