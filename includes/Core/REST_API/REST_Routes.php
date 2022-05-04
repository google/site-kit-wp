<?php
/**
 * Class Google\Site_Kit\Core\REST_API\REST_Routes
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\REST_API;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Util\User_Input_Settings;
use WP_REST_Server;
use WP_REST_Request;
use WP_Error;

/**
 * Class managing REST API routes.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class REST_Routes {

	const REST_ROOT = 'google-site-kit/v1';

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Authentication instance.
	 *
	 * @since 1.0.0
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * Modules instance.
	 *
	 * @since 1.0.0
	 * @var Modules
	 */
	protected $modules;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context        $context        Plugin context.
	 * @param Authentication $authentication Optional. Authentication instance. Default is a new instance.
	 * @param Modules        $modules        Optional. Modules instance. Default is a new instance.
	 */
	public function __construct( Context $context, Authentication $authentication = null, Modules $modules = null ) {
		$this->context = $context;

		if ( ! $authentication ) {
			$authentication = new Authentication( $this->context );
		}
		$this->authentication = $authentication;

		if ( ! $modules ) {
			$modules = new Modules( $this->context, null, null, $this->authentication );
		}
		$this->modules = $modules;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		add_action(
			'rest_api_init',
			function() {
				$this->register_routes();
			}
		);

		add_filter(
			'do_parse_request',
			function( $do_parse_request, $wp ) {
				add_filter(
					'query_vars',
					function( $vars ) use ( $wp ) {
						// Unsets standard public query vars to escape conflicts between WordPress core
						// and Google Site Kit APIs which happen when WordPress incorrectly parses request
						// arguments.

						$unset_vars = ( $wp->request && stripos( $wp->request, trailingslashit( rest_get_url_prefix() ) . self::REST_ROOT ) !== false ) // Check regular permalinks.
							|| ( empty( $wp->request ) && stripos( $this->context->input()->filter( INPUT_GET, 'rest_route' ), self::REST_ROOT ) !== false ); // Check plain permalinks.

						if ( $unset_vars ) {
							// List of variable names to remove from public query variables list.
							return array_values(
								array_diff(
									$vars,
									array(
										'orderby',
									)
								)
							);
						}

						return $vars;
					}
				);
				return $do_parse_request;
			},
			10,
			2
		);
	}

	/**
	 * Registers all REST routes.
	 *
	 * @since 1.0.0
	 * @since 1.16.0 Reworked to use REST_Route::register method to register a route.
	 */
	private function register_routes() {
		$routes = $this->get_routes();
		foreach ( $routes as $route ) {
			$route->register();
		}
	}

	/**
	 * Gets available REST routes.
	 *
	 * @since 1.0.0
	 * @since 1.3.0 Moved most routes into individual classes and introduced {@see 'googlesitekit_rest_routes'} filter.
	 *
	 * @return array List of REST_Route instances.
	 */
	private function get_routes() {

		$can_authenticate = function() {
			return current_user_can( Permissions::AUTHENTICATE );
		};

		$routes = array(
			new REST_Route(
				'core/user/data/user-input-settings',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$user_input_settings = new User_Input_Settings( $this->context, $this->authentication );
							return rest_ensure_response( $user_input_settings->get_settings() );
						},
						'permission_callback' => $can_authenticate,
					),
					array(
						'methods'             => WP_REST_Server::CREATABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$user_input_settings = new User_Input_Settings( $this->context, $this->authentication );
							$data                = $request->get_param( 'data' );

							if ( ! isset( $data['settings'] ) || ! is_array( $data['settings'] ) ) {
								return new WP_Error(
									'rest_missing_callback_param',
									__( 'Missing settings data.', 'google-site-kit' ),
									array( 'status' => 400 )
								);
							}

							return rest_ensure_response(
								$user_input_settings->set_settings(
									$data['settings']
								)
							);
						},
						'permission_callback' => $can_authenticate,
						'args'                => array(
							'data' => array(
								'type'       => 'object',
								'required'   => true,
								'properties' => array(
									'settings' => array(
										'type'       => 'object',
										'required'   => true,
										'properties' => array(
											'role'        => array(
												'type'  => 'array',
												'items' => array( 'type' => 'string' ),
											),
											'postFrequency' => array(
												'type'  => 'array',
												'items' => array( 'type' => 'string' ),
											),
											'goals'       => array(
												'type'  => 'array',
												'items' => array( 'type' => 'string' ),
											),
											'helpNeeded'  => array(
												'type'  => 'array',
												'items' => array( 'type' => 'string' ),
											),
											'searchTerms' => array(
												'type'  => 'array',
												'items' => array( 'type' => 'string' ),
											),
										),
									),
								),
							),
						),
					),
				)
			),
		);

		/**
		 * Filters the list of available REST routes.
		 *
		 * @since 1.3.0
		 *
		 * @param array $routes List of REST_Route objects.
		 */
		return apply_filters( 'googlesitekit_rest_routes', $routes );
	}
}
