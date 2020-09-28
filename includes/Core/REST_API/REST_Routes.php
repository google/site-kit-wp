<?php
/**
 * Class Google\Site_Kit\Core\REST_API\REST_Routes
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\REST_API;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Util\Developer_Plugin_Installer;
use Google\Site_Kit\Core\Util\Reset;
use WP_Post;
use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;
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
		$can_view_insights = function() {
			// This accounts for routes that need to be called before user has completed setup flow.
			if ( current_user_can( Permissions::SETUP ) ) {
				return true;
			}

			return current_user_can( Permissions::VIEW_POSTS_INSIGHTS );
		};

		$can_authenticate = function() {
			return current_user_can( Permissions::AUTHENTICATE );
		};

		$routes = array(
			// TODO: This route is super-complex to use and needs to be simplified.
			new REST_Route(
				'data',
				array(
					array(
						'methods'             => WP_REST_Server::CREATABLE,
						'callback'            => function( WP_REST_Request $request ) {
							if ( ! $request['request'] ) {
								return new WP_Error( 'no_data_requested', __( 'Missing request data.', 'google-site-kit' ), array( 'status' => 400 ) );
							}

							// Datasets are expected to be objects but the REST API parses the JSON into an array.
							$datasets = array_map(
								function ( $dataset_array ) {
									return (object) $dataset_array;
								},
								$request['request']
							);

							$modules = $this->modules->get_active_modules();

							$responses = array();
							foreach ( $modules as $module ) {
								$filtered_datasets = array_filter(
									$datasets,
									function( $dataset ) use ( $module ) {
										return 'modules' === $dataset->type && $module->slug === $dataset->identifier; // phpcs:ignore WordPress.NamingConventions.ValidVariableName
									}
								);
								if ( empty( $filtered_datasets ) ) {
									continue;
								}
								$additional_responses = $module->get_batch_data( $filtered_datasets );
								if ( is_array( $additional_responses ) ) {
									$responses = array_merge( $responses, $additional_responses );
								}
							}
							$responses = array_map(
								function ( $response ) {
									if ( is_wp_error( $response ) ) {
										return $this->error_to_response( $response );
									}
									return $response;
								},
								$responses
							);

							return new WP_REST_Response( $responses );
						},
						'permission_callback' => $can_view_insights,
						'args'                => array(
							'request' => array(
								'type'        => 'array',
								'description' => __( 'List of request objects.', 'google-site-kit' ),
								'required'    => true,
								'items'       => array(
									'type' => 'object',
								),
							),
						),
					),
				)
			),
			// TODO: Remove this and replace usage with calls to wp/v1/posts.
			new REST_Route(
				'core/search/data/post-search',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$query = rawurldecode( $request['query'] );

							if ( filter_var( $query, FILTER_VALIDATE_URL ) ) {
								// Get entity via URL, but only return it if it is a post.
								$entity = $this->context->get_reference_entity_from_url( $query );
								if ( $entity && $entity->get_id() && in_array( $entity->get_type(), array( 'post', 'blog' ), true ) ) {
									$posts = array_filter( array( WP_Post::get_instance( $entity->get_id() ) ) );
								} else {
									$posts = array();
								}
							} else {
								$args = array(
									'posts_per_page'  => 10,
									'google-site-kit' => 1,
									's'               => $query,
									'no_found_rows'   => true,
									'update_post_meta_cache' => false,
									'update_post_term_cache' => false,
									'post_status'     => array( 'publish' ),
								);
								$posts = ( new \WP_Query( $args ) )->posts;
							}

							if ( empty( $posts ) ) {
								return array();
							}

							foreach ( $posts as $post ) {
								$post->permalink = $this->context->get_reference_permalink( $post->ID );
							}

							return new WP_REST_Response( $posts );
						},
						'permission_callback' => $can_authenticate,
					),
				),
				array(
					'args' => array(
						'query' => array(
							'type'        => 'string',
							'description' => __( 'Text content to search for.', 'google-site-kit' ),
							'required'    => true,
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

	/**
	 * Converts a WP_Error to its response representation.
	 *
	 * Adapted from \WP_REST_Server::error_to_response
	 *
	 * @since 1.2.0
	 *
	 * @param WP_Error $error Error to transform.
	 *
	 * @return array
	 */
	protected function error_to_response( WP_Error $error ) {
		$errors = array();

		foreach ( (array) $error->errors as $code => $messages ) {
			foreach ( (array) $messages as $message ) {
				$errors[] = array(
					'code'    => $code,
					'message' => $message,
					'data'    => $error->get_error_data( $code ),
				);
			}
		}

		$data = $errors[0];
		if ( count( $errors ) > 1 ) {
			// Remove the primary error.
			array_shift( $errors );
			$data['additional_errors'] = $errors;
		}

		return $data;
	}
}
