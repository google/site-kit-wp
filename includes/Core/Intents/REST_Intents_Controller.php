<?php
/**
 * Class Google\Site_Kit\Core\Intents\REST_Intents_Controller
 *
 * @package   Google\Site_Kit\Core\Intents
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Intents;

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for the REST routes the dashboard uses to get and complete an intent.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class REST_Intents_Controller {

	/**
	 * Intents instance.
	 *
	 * @since n.e.x.t
	 * @var Intents
	 */
	private $intents;

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
	 * @param Intents        $intents        Intents instance.
	 * @param Authentication $authentication Authentication instance.
	 */
	public function __construct( Intents $intents, Authentication $authentication ) {
		$this->intents        = $intents;
		$this->authentication = $authentication;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		// Neither intent route is preloaded, because each one calls the Site Kit Service and most dashboard loads have no intent.
		add_filter(
			'googlesitekit_rest_routes',
			fn ( $routes ) => array_merge( $routes, $this->get_rest_routes() )
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
		$can_setup = fn () => current_user_can( Permissions::SETUP );

		return array(
			new REST_Route(
				'core/intents/data/intent',
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => fn ( WP_REST_Request $request ) => $this->send_to_service(
						'get_intent',
						$request['slug'],
						$request['intent_code']
					),
					'permission_callback' => $can_setup,
					'args'                => array(
						'slug'        => array(
							'type'     => 'string',
							'required' => true,
						),
						'intent_code' => array(
							'type'     => 'string',
							'required' => true,
						),
					),
				)
			),
			new REST_Route(
				'core/intents/data/complete-intent',
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => function ( WP_REST_Request $request ) {
						$data = $request['data'];

						// WordPress before 5.5 doesn't check the required properties inside `data`.
						return $this->send_to_service(
							'complete_intent',
							$data['slug'] ?? '',
							$data['intent_code'] ?? ''
						);
					},
					'permission_callback' => $can_setup,
					'args'                => array(
						'data' => array(
							'type'       => 'object',
							'required'   => true,
							'properties' => array(
								'slug'        => array(
									'type'     => 'string',
									'required' => true,
								),
								'intent_code' => array(
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
	 * Sends an intent request to the Site Kit Service for the current user.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $proxy_method `Google_Proxy` method to call, either `get_intent` or `complete_intent`.
	 * @param string $slug         Intent slug.
	 * @param string $intent_code  One-time code for the intent.
	 * @return WP_REST_Response|WP_Error Response with the data the Service returned, or the plugin's own error.
	 */
	private function send_to_service( $proxy_method, $slug, $intent_code ) {
		if ( ! $this->intents->get_intent( $slug ) ) {
			return $this->create_error( 'intent_not_found' );
		}

		$access_token = (string) $this->authentication->get_oauth_client()->get_access_token();

		if ( '' === $access_token ) {
			return $this->create_error( 'intent_user_not_connected' );
		}

		$response = $this->authentication->get_google_proxy()->$proxy_method(
			$this->authentication->credentials(),
			$slug,
			$intent_code,
			$access_token
		);

		if ( is_wp_error( $response ) ) {
			return $this->create_error( 'intent_not_found' );
		}

		return new WP_REST_Response( $response );
	}

	/**
	 * Creates one of the plugin's intent errors.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $error_code Plugin error code, either `intent_not_found` or `intent_user_not_connected`.
	 * @return WP_Error Error with a translated message and an HTTP status.
	 */
	private function create_error( $error_code ) {
		$errors = array(
			'intent_not_found'          => array(
				__( 'This link can’t be used. Go back to where you started and try again.', 'google-site-kit' ),
				404,
			),
			'intent_user_not_connected' => array(
				__( 'Your Google account isn’t connected to Site Kit. Connect Site Kit with your Google account, then try again.', 'google-site-kit' ),
				403,
			),
		);

		list( $message, $status ) = $errors[ $error_code ];

		return new WP_Error( $error_code, $message, array( 'status' => $status ) );
	}
}
