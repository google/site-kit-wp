<?php
/**
 * Class Google\Site_Kit\Core\Util\Health_Checks
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Exception;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole as Google_Service_SearchConsole;
use Google\Site_Kit_Dependencies\Google_Service_Exception;
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
	 * Google_Proxy instance.
	 *
	 * @var Google_Proxy
	 */
	protected $google_proxy;

	/**
	 * Constructor.
	 *
	 * @param Authentication $authentication Authentication instance.
	 */
	public function __construct( Authentication $authentication ) {
		$this->authentication = $authentication;
		$this->google_proxy   = $authentication->get_google_proxy();
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
	 * @return REST_Route[] List of REST_Route objects.
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
								'skService' => $this->check_service_connectivity(),
							);

							return compact( 'checks' );
						},
						'permission_callback' => function () {
							return current_user_can( Permissions::VIEW_SHARED_DASHBOARD ) || current_user_can( Permissions::SETUP );
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
		// This request is bound to fail but this is okay as long as the error response comes
		// from a Google API endpoint (Google_Service_exception). The test is only intended
		// to check that the server is capable of connecting to the Google API (at all)
		// regardless of valid authentication, which will likely be missing here.
		try {
			( new Google_Service_SearchConsole( $client ) )->sites->listSites();
			$pass = true;
		} catch ( Google_Service_Exception $e ) {
			if ( ! empty( $e->getErrors() ) ) {
				$pass = true;
			} else {
				$pass      = false;
				$error_msg = $e->getMessage();
			}
		} catch ( Exception $e ) {
			$pass      = false;
			$error_msg = $e->getMessage();
		}
		$restore_defer();

		return array(
			'pass'     => $pass,
			'errorMsg' => $error_msg,
		);
	}

	/**
	 * Checks connection to Site Kit service.
	 *
	 * @since 1.85.0
	 *
	 * @return array Results data.
	 */
	private function check_service_connectivity() {
		$service_url = $this->google_proxy->url();
		$response    = wp_remote_head( $service_url );

		if ( is_wp_error( $response ) ) {
			return array(
				'pass'     => false,
				'errorMsg' => $response->get_error_message(),
			);
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$pass        = is_int( $status_code ) && $status_code < 400;

		return array(
			'pass'     => $pass,
			'errorMsg' => $pass ? '' : 'connection_fail',
		);
	}
}
