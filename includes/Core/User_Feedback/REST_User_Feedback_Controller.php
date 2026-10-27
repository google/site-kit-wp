<?php
/**
 * Class Google\Site_Kit\Core\User_Feedback\REST_User_Feedback_Controller
 *
 * @package   Google\Site_Kit\Core\User_Feedback
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Feedback;

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\REST_Route;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for handling the user feedback REST route.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class REST_User_Feedback_Controller {

	/**
	 * Authentication instance.
	 *
	 * @since n.e.x.t
	 * @var Authentication
	 */
	private $authentication;

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
		$can_authenticate = function () {
			return $this->authentication->is_authenticated()
				&& $this->authentication->credentials()->using_proxy();
		};

		return array(
			new REST_Route(
				'core/user/data/feedback',
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => function ( WP_REST_Request $request ) {
						$proxy        = $this->authentication->get_google_proxy();
						$creds        = $this->authentication->credentials();
						$access_token = (string) $this->authentication->get_oauth_client()->get_access_token();
						$data         = $request->get_param( 'data' );

						$response = $proxy->send_feedback( $creds, $access_token, $data );

						if ( is_wp_error( $response ) ) {
							return $response;
						}

						return new WP_REST_Response( $response );
					},
					'permission_callback' => $can_authenticate,
					'args'                => array(
						'data' => array(
							'type'              => 'object',
							'required'          => true,
							// WordPress before 5.5 doesn't check the required properties inside `data`,
							// so they're validated explicitly for a consistent 400 response.
							'validate_callback' => array( $this, 'validate_feedback_data' ),
							'properties'        => array(
								'namespace' => array(
									'type'     => 'string',
									'required' => true,
								),
								'group'     => array(
									'type'     => 'string',
									'required' => true,
								),
								'key'       => array(
									'type'     => 'string',
									'required' => true,
								),
								'value'     => array(
									'type'     => 'string',
									'required' => true,
								),
							),
						),
					),
				)
			),
		);
	}

	/**
	 * Validates the `data` parameter of the feedback route.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value The `data` parameter value.
	 * @return true|WP_Error True if valid, otherwise a WP_Error with a 400 status.
	 */
	public function validate_feedback_data( $value ) {
		if ( ! is_array( $value ) ) {
			return new WP_Error(
				'rest_invalid_param',
				__( 'data must be an object.', 'google-site-kit' ),
				array( 'status' => 400 )
			);
		}

		foreach ( array( 'namespace', 'group', 'key', 'value' ) as $field ) {
			if ( empty( $value[ $field ] ) || ! is_string( $value[ $field ] ) ) {
				return new WP_Error(
					'rest_missing_callback_param',
					sprintf(
						/* translators: %s: field name */
						__( '%s is required and must be a string.', 'google-site-kit' ),
						$field
					),
					array( 'status' => 400 )
				);
			}
		}

		return true;
	}
}
