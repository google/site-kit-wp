<?php
/**
 * Class Google\Site_Kit\Core\Authentication\REST_Authentication_Controller
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;

/**
 * REST Authentication Controller Class.
 *
 * @since 1.131.0
 * @access private
 * @ignore
 */
final class REST_Authentication_Controller {
	/**
	 * Authentication instance.
	 *
	 * @since 1.131.0
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * Constructor.
	 *
	 * @since 1.131.0
	 *
	 * @param Authentication $authentication Authentication instance.
	 */
	public function __construct( Authentication $authentication ) {
		$this->authentication = $authentication;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.131.0
	 */
	public function register() {
		add_filter(
			'googlesitekit_rest_routes',
			function ( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);

		add_filter(
			'googlesitekit_apifetch_preload_paths',
			function ( $routes ) {
				$authentication_routes = array(
					'/' . REST_Routes::REST_ROOT . '/core/site/data/connection',
					'/' . REST_Routes::REST_ROOT . '/core/user/data/authentication',
				);
				return array_merge( $routes, $authentication_routes );
			}
		);
	}


	/**
	 * Gets related REST routes.
	 *
	 * @since 1.3.0
	 * @since 1.131.0 Moved to REST_Authentication_Controller class.
	 *
	 * @return array List of REST_Route objects.
	 */
	private function get_rest_routes() {
		$can_setup = function () {
			return current_user_can( Permissions::SETUP );
		};

		$can_access_authentication = function () {
			return current_user_can( Permissions::VIEW_SPLASH ) || current_user_can( Permissions::VIEW_DASHBOARD );
		};

		$can_disconnect = function () {
			return current_user_can( Permissions::AUTHENTICATE );
		};

		$can_view_authenticated_dashboard = function () {
			return current_user_can( Permissions::VIEW_AUTHENTICATED_DASHBOARD );
		};

		return array(
			new REST_Route(
				'core/site/data/connection',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							$data = array(
								'connected'          => $this->authentication->credentials()->has(),
								'resettable'         => $this->authentication->get_options_instance()->has( Credentials::OPTION ),
								'setupCompleted'     => $this->authentication->is_setup_completed(),
								'hasConnectedAdmins' => $this->authentication->get_has_connected_admins_instance()->get(),
								'hasMultipleAdmins'  => $this->authentication->get_has_multiple_admins_instance()->get(),
								'ownerID'            => $this->authentication->get_owner_id_instance()->get(),
							);

							return new WP_REST_Response( $data );
						},
						'permission_callback' => $can_setup,
					),
				)
			),
			new REST_Route(
				'core/user/data/authentication',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {

							$oauth_client     = $this->authentication->get_oauth_client();
							$is_authenticated = $this->authentication->is_authenticated();

							$data = array(
								'authenticated'         => $is_authenticated,
								'requiredScopes'        => $oauth_client->get_required_scopes(),
								'grantedScopes'         => $is_authenticated ? $oauth_client->get_granted_scopes() : array(),
								'unsatisfiedScopes'     => $is_authenticated ? $oauth_client->get_unsatisfied_scopes() : array(),
								'needsReauthentication' => $oauth_client->needs_reauthentication(),
								'disconnectedReason'    => $this->authentication->get_disconnected_reason_instance()->get(),
								'connectedProxyURL'     => $this->authentication->get_connected_proxy_url_instance()->get(),
							);

							return new WP_REST_Response( $data );
						},
						'permission_callback' => $can_access_authentication,
					),
				)
			),
			new REST_Route(
				'core/user/data/disconnect',
				array(
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function () {
							$this->authentication->disconnect();
							return new WP_REST_Response( true );
						},
						'permission_callback' => $can_disconnect,
					),
				)
			),
			new REST_Route(
				'core/user/data/get-token',
				array(
					array(
						'methods'             => WP_REST_Server::CREATABLE,
						'callback'            => function () {
							$this->authentication->do_refresh_user_token();
							return new WP_REST_Response(
								array(
									'token' => $this->authentication->get_oauth_client()->get_access_token(),
								)
							);
						},
						'permission_callback' => $can_view_authenticated_dashboard,
					),
				)
			),
		);
	}
}
