<?php
/**
 * Class Google\Site_Kit\Core\Site_Health\REST_Tag_Placement_Controller
 *
 * @package   Google\Site_Kit\Core\Site_Health
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Site_Health;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use WP_REST_Server;

/**
 * Class for handling dismissed items rest routes.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class REST_Tag_Placement_Controller {

	/**
	 * Tag_Placement instance.
	 *
	 * @since n.e.x.t
	 * @var Tag_Placement
	 */
	protected $tag_placement;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Tag_Placement $tag_placement Tags Placement instance.
	 */
	public function __construct( Tag_Placement $tag_placement ) {
		$this->tag_placement = $tag_placement;
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
				'core/site/data/tag-placement-test',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => array( $this->tag_placement, 'tag_placement_test' ),
						'permission_callback' => function () {
							return current_user_can( Permissions::MANAGE_OPTIONS );
						},
					),
				)
			),
		);
	}

}
