<?php
/**
 * Class Google\Site_Kit\Core\Util\Health_Checks
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Exception;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit_Dependencies\Google_Service_Webmasters;
use WP_REST_Server;

/**
 * Class for performing health checks.
 *
 * @since 1.14.0
 * @access private
 * @ignore
 */
class Health_Checks {

	/**
	 * Authentication instance.
	 *
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * Constructor.
	 *
	 * @param Authentication $authentication Authentication instance.
	 */
	public function __construct( Authentication $authentication ) {
		$this->authentication = $authentication;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.14.0
	 */
	public function register() {
		add_filter(
			'googlesitekit_rest_routes',
			function ( $rest_routes ) {
				$health_check_routes = $this->get_rest_routes();

				return array_merge( $rest_routes, $health_check_routes );
			}
		);
	}

	/**
	 * Gets all health check REST routes.
	 *
	 * @since 1.14.0
	 *
	 * @return REST_Route[]
	 */
	private function get_rest_routes() {
		return array(
			new REST_Route(
				'core/site/data/health-checks',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function() {
							$checks = array(
								'googleAPI' => $this->check_google_api(),
							);

							return compact( 'checks' );
						},
						'permission_callback' => function () {
							return current_user_can( Permissions::SETUP );
						},
					),
				)
			),
		);
	}

	/**
	 * Checks connection to Google APIs.
	 *
	 * @since 1.14.0
	 *
	 * @return array Results data.
	 */
	private function check_google_api() {
		$client        = $this->authentication->get_oauth_client()->get_client();
		$restore_defer = $client->withDefer( false );
		$error_msg     = '';

		// Make a request to the Search API.
		// This request is bound to fail with a 401 "Login Required" error
		// but this is okay - the test is only intended to check that
		// the server is capable of connecting to the Google API (at all)
		// regardless of valid authentication, which will likely be missing here.
		try {
			( new Google_Service_Webmasters( $client ) )->sites->listSites();
			$pass = true;
		} catch ( Exception $e ) {
			if ( $e->getCode() === 401 ) {
				$pass = true;
			} else {
				$pass      = false;
				$error_msg = $e->getMessage();
			}
		}
		$restore_defer();

		return array(
			'pass'     => $pass,
			'errorMsg' => $error_msg,
		);
	}
}
