<?php
/**
 * Class Google\Site_Kit\Core\Util\REST_Entity_Search_Controller
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Class for handling entity search REST routes.
 *
 * @since 1.68.0
 * @access private
 * @ignore
 */
class REST_Entity_Search_Controller {

	/**
	 * Plugin context.
	 *
	 * @since 1.68.0
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since 1.68.0
	 *
	 * @param Context $context        Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.68.0
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
	 * @since 1.68.0
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_search = function() {
			return current_user_can( Permissions::AUTHENTICATE ) || current_user_can( Permissions::VIEW_SHARED_DASHBOARD );
		};

		return array(
			new REST_Route(
				'core/search/data/entity-search',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$query = rawurldecode( $request['query'] );
							$entities = array();
							if ( filter_var( $query, FILTER_VALIDATE_URL ) ) {
								$entity = $this->context->get_reference_entity_from_url( $query );
								if ( $entity && $entity->get_id() ) {
									$entities = array(
										array(
											'id'    => $entity->get_id(),
											'title' => $entity->get_title(),
											'url'   => $entity->get_url(),
											'type'  => $entity->get_type(),
										),
									);
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

								if ( ! empty( $posts ) ) {
									$entities = array_map(
										function( $post ) {
											$entity = Entity_Factory::create_entity_for_post( $post, 1 );
											return array(
												'id'    => $entity->get_id(),
												'title' => $entity->get_title(),
												'url'   => $entity->get_url(),
												'type'  => $entity->get_type(),
											);
										},
										$posts
									);
								}
							}

							return new WP_REST_Response( $entities );
						},
						'permission_callback' => $can_search,
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
	}
}
