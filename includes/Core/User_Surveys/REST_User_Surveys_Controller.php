<?php
/**
 * Class Google\Site_Kit\Core\User_Surveys\REST_User_Surveys_Controller
 *
 * @package   Google\Site_Kit\Core\User_Surveys
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Surveys;

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\REST_Route;

/**
 * Class for handling user survey rest routes.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class REST_User_Surveys_Controller {

	/**
	 * Authentication instance.
	 *
	 * @since n.e.x.t
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Authentication $authentication Authentication instance.
	 */
	public function __construct( Authentication $authentication ) {
		$this->authentication = $authentication;
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
		return array();
	}

}
