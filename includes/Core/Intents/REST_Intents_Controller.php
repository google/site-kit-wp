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
 * Class for the REST routes the intent screen uses to get and complete an intent.
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
		// The dashboard preloads neither route, because an intent is rare and each route sends a request to the Service.
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
	 * @param string $slug         Intent ID.
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
			return $this->create_error( $this->get_plugin_error_code( $response ) );
		}

		return new WP_REST_Response( $response );
	}

	/**
	 * Gets the plugin's error code for an error from the Site Kit Service.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_Error $service_error Error from the Site Kit Service.
	 * @return string Plugin error code: `intent_not_found`, `intent_expired`, `intent_wrong_user`, or `intent_request_failed` for any other error.
	 */
	private function get_plugin_error_code( WP_Error $service_error ) {
		// Keys are the Service's `error_code` values. Values are the plugin's own codes.
		//
		// TODO: Replace the keys once we know the `error_code` values the Service sends.
		// See: https://github.com/google/site-kit-wp/issues/13467.
		$plugin_error_codes = array(
			'intent_not_found'  => 'intent_not_found',
			'intent_expired'    => 'intent_expired',
			'intent_wrong_user' => 'intent_wrong_user',
		);

		return $plugin_error_codes[ $service_error->get_error_code() ] ?? 'intent_request_failed';
	}

	/**
	 * Creates one of the plugin's intent errors.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $code Plugin error code.
	 * @return WP_Error Error with a translated message and an HTTP status.
	 */
	private function create_error( $code ) {
		$errors = array(
			'intent_not_found'          => array(
				__( 'This link can’t be found. It might have been used already. If not, go back to where you started and try again.', 'google-site-kit' ),
				404,
			),
			'intent_expired'            => array(
				__( 'This link has expired. Go back to where you started and try again.', 'google-site-kit' ),
				410,
			),
			'intent_wrong_user'         => array(
				__( 'This link was created for a different Google account. Connect Site Kit with that account, then try again.', 'google-site-kit' ),
				403,
			),
			'intent_user_not_connected' => array(
				__( 'Your Google account isn’t connected to Site Kit. Connect Site Kit with your Google account, then try again.', 'google-site-kit' ),
				403,
			),
			'intent_request_failed'     => array(
				__( 'Site Kit couldn’t complete this request. Try again.', 'google-site-kit' ),
				500,
			),
		);

		list( $message, $status ) = $errors[ $code ];

		return new WP_Error( $code, $message, array( 'status' => $status ) );
	}
}
