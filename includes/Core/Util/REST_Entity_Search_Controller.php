<?php
/**
 * Class Google\Site_Kit\Core\Util\REST_Entity_Search_Controller
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2021 Google LLC
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
 * Class for handling entity search rest routes.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class REST_Entity_Search_Controller {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context        Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
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
		$can_authenticate = function() {
			return current_user_can( Permissions::AUTHENTICATE );
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
											$entity = new Entity(
												get_permalink( $post ),
												array(
													'type' => 'post',
													'title' => $post->post_title,
													'id'   => $post->ID,
												)
											);
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
	}
}
