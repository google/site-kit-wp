<?php

namespace Google\Site_Kit\Core\Entity;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\REST_Route;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

class REST_Entity_Controller {

	/**
	 * @var Context
	 */
	protected $context;

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
		return array(
			new REST_Route(
				'core/site/data/find-entity',
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => function ( WP_REST_Request $request ) {
						$data = $request->get_param( 'data' );

						if ( empty( $data['permalink'] ) ) {
							return new WP_Error(
								'missing_required_param',
								/* translators: %s: Missing parameter name */
								sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'permalink' ),
								array( 'status' => 400 )
							);
						}

						$entity = $this->context->get_reference_entity_from_url( $data['permalink'] );

						if ( ! $entity ) {
							return new WP_Error(
								'entity_not_found',
								"No entity was found on this site with the given permalink.",
								array( 'status' => '404' )
							);
						}

						return new WP_REST_Response( array(
							'id'    => $entity->get_id(),
							'title' => $entity->get_title(),
							'type'  => $entity->get_type(),
							'url'   => $entity->get_url(),
						) );
					},
					'permission_callback' => '__return_true', // TODO
				)
			),
		);
	}
}
