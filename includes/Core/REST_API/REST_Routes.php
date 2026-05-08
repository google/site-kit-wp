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
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		add_action(
			'rest_api_init',
			function () {
				$this->register_routes();
			}
		);

		add_filter(
			'do_parse_request',
			function ( $do_parse_request, $wp ) {
				add_filter(
					'query_vars',
					function ( $vars ) use ( $wp ) {
						// Unsets standard public query vars to escape conflicts between WordPress core
						// and Google Site Kit APIs which happen when WordPress incorrectly parses request
						// arguments.

						$unset_vars = ( $wp->request && stripos( $wp->request, trailingslashit( rest_get_url_prefix() ) . self::REST_ROOT ) !== false ) // Check regular permalinks.
							|| ( empty( $wp->request ) && stripos( $this->context->input()->filter( INPUT_GET, 'rest_route' ) || '', self::REST_ROOT ) !== false ); // Check plain permalinks.

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
		$routes = array();

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
