<?php
/**
 * Class Google\Site_Kit\Core\Notifications\Notifications.php
 *
 * @package   Google\Site_Kit\Core\Notifications
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Notifications;

use Exception;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for managing core notifications.
 *
 * @since 1.4.0
 * @access private
 * @ignore
 */
class Notifications {
	/**
	 * Context instance.
	 *
	 * @since 1.4.0
	 * @var Context
	 */
	private $context;

	/**
	 * Options instance.
	 *
	 * @since 1.4.0
	 * @var Options
	 */
	private $options;

	/**
	 * Authentication instance.
	 *
	 * @since 1.8.0
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Google_Proxy instance.
	 *
	 * @since 1.4.0
	 * @var Google_Proxy
	 */
	private $google_proxy;

	/**
	 * Credentials instance.
	 *
	 * @since 1.4.0
	 * @var Credentials
	 */
	private $credentials;

	/**
	 * Constructor.
	 *
	 * @since 1.4.0
	 *
	 * @param Context        $context Context instance.
	 * @param Options        $options Options instance.
	 * @param Authentication $authentication Authentication instance.
	 */
	public function __construct( Context $context, Options $options = null, Authentication $authentication = null ) {
		$this->context        = $context;
		$this->options        = $options ?: new Options( $context );
		$this->google_proxy   = new Google_Proxy( $this->context );
		$this->authentication = $authentication ?: new Authentication( $this->context );
		$this->credentials    = $this->authentication->credentials();
	}

	/**
	 * Registers core notifications.
	 *
	 * @since 1.4.0
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
	 * Gets related REST routes.
	 *
	 * @since 1.4.0
	 *
	 * @return array List of REST_Route objects.
	 */
	private function get_rest_routes() {
		$can_use_notifications = function () {
			return current_user_can( Permissions::SETUP ) && $this->credentials->has();
		};

		return array(
			new REST_Route(
				'core/site/data/notifications',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							$endpoint = add_query_arg(
								array(
									'site_id' => $this->credentials->get()['oauth2_client_id'],
								),
								$this->google_proxy->url( '/notifications/' )
							);

							// Return an empty array of notifications if the user isn't using the proxy.
							if ( ! $this->credentials->using_proxy() ) {
								return new WP_REST_Response( array() );
							}

							$response = wp_remote_get( $endpoint ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_remote_get_wp_remote_get

							if ( is_wp_error( $response ) ) {
								return $response;
							}

							try {
								$response = $this->parse_response( $response );
							} catch ( Exception $e ) {
								return new WP_Error( 'exception', $e->getMessage() );
							}

							$data = array_map(
								function ( Notification $notification ) {
									return $notification->prepare_for_js();
								},
								$this->map_response_to_notifications( $response )
							);

							return new WP_REST_Response( $data );
						},
						'permission_callback' => $can_use_notifications,
					),
				)
			),
			new REST_Route(
				'core/site/data/mark-notification',
				array(
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							$data = $request['data'];

							if ( empty( $data['notificationID'] ) ) {
								return $this->missing_required_param( 'data.notificationID' );
							}
							if ( empty( $data['notificationState'] ) ) {
								return $this->missing_required_param( 'data.notificationState' );
							}

							$credentials = $this->credentials->get();
							$response    = wp_remote_post(
								$this->google_proxy->url( '/notifications/mark/' ),
								array(
									'body' => array(
										'site_id'         => $credentials['oauth2_client_id'],
										'site_secret'     => $credentials['oauth2_client_secret'],
										'notification_id' => $data['notificationID'],
										'notification_state' => $data['notificationState'],
									),
								)
							);

							if ( is_wp_error( $response ) ) {
								return $response;
							}

							try {
								$response = $this->parse_response( $response );
							} catch ( Exception $e ) {
								return new WP_Error( 'exception', $e->getMessage() );
							}

							return new WP_REST_Response(
								array(
									'success' => isset( $response['success'] ) ? (bool) $response['success'] : false,
								)
							);
						},
						'args'                => array(
							'data' => array(
								'required' => true,
								'type'     => 'object',
							),
						),
						'permission_callback' => $can_use_notifications,
					),
				)
			),
		);
	}

	/**
	 * Validates and parses the given JSON response into an array.
	 *
	 * @since 1.4.0
	 *
	 * @param array $response HTTP response array.
	 * @return mixed JSON decoded response.
	 * @throws Exception Throws exception if response cannot be parsed or if an error is returned.
	 */
	private function parse_response( $response ) {
		$body    = wp_remote_retrieve_body( $response );
		$decoded = json_decode( $body, true );

		if ( json_last_error() ) {
			throw new Exception( 'Error while decoding response: ' . json_last_error() );
		}

		if ( ! empty( $decoded['error'] ) ) {
			throw new Exception( $decoded['error'] );
		}

		return $decoded;
	}

	/**
	 * Maps the response objects into Notification objects.
	 *
	 * @since 1.4.0
	 *
	 * @param array $response Array of notification objects from API.
	 * @return Notification[] Array of Notification objects.
	 */
	private function map_response_to_notifications( array $response ) {
		return array_map(
			function ( $notification ) {
				return new Notification(
					$notification['id'],
					array(
						'title'            => $notification['title'],
						'content'          => $notification['content'],
						'cta_url'          => $notification['ctaURL'],
						'cta_label'        => $notification['ctaLabel'],
						'cta_target'       => $notification['ctaTarget'],
						'learn_more_url'   => $notification['learnMoreURL'],
						'learn_more_label' => $notification['learnMoreLabel'],
						'dismissible'      => $notification['dismissible'],
						'dismiss_label'    => $notification['dismissLabel'],
					)
				);
			},
			$response
		);
	}

	/**
	 * Gets a WP_Error instance for the given missing required parameter.
	 *
	 * @since 1.4.0
	 *
	 * @param string $param Missing required parameter.
	 * @return WP_Error
	 */
	private function missing_required_param( $param ) {
		return new WP_Error(
			'missing_required_param',
			/* translators: %s: Missing parameter name */
			sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), $param ),
			array( 'status' => 400 )
		);
	}
}
