<?php
/**
 * Class Google\Site_Kit\Core\Notifications\Notifications.php
 *
 * @package   Google\Site_Kit\Core\Notifications
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Notifications;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for managing core notifications.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Notifications {
	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Google_Proxy instance.
	 *
	 * @since n.e.x.t
	 * @var Google_Proxy
	 */
	private $google_proxy;

	/**
	 * Credentials instance.
	 *
	 * @since n.e.x.t
	 * @var Credentials
	 */
	private $credentials;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Context instance.
	 */
	public function __construct( Context $context ) {
		$this->context      = $context;
		$this->google_proxy = new Google_Proxy( $this->context );
		$this->credentials  = new Credentials( new Encrypted_Options( new Options( $context ) ) );
	}

	/**
	 * Registers core notifications.
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
	 * Gets related REST routes.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of REST_Route objects.
	 */
	private function get_rest_routes() {
		$can_setup = function () {
			return current_user_can( Permissions::SETUP );
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
								$this->google_proxy->url( '/notifications' )
							);
							$response = wp_remote_get( $endpoint ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_remote_get_wp_remote_get

							if ( is_wp_error( $response ) ) {
								return $response;
							}

							$data = array_map(
								function ( Notification $notification ) {
									return $notification->prepare_for_js();
								},
								$this->map_response_to_notifications( $response )
							);

							return new WP_REST_Response( $data );
						},
						'permission_callback' => $can_setup,
					),
				)
			),
			new REST_Route(
				'core/site/data/mark-notification',
				array(
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							return new WP_REST_Response( /* TODO */ );
						},
						'permission_callback' => $can_setup,
					),
				)
			),
		);
	}

	/**
	 * Maps the response objects into Notification objects.
	 *
	 * @since n.e.x.t
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
						'image'            => $notification['image'],
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
}
