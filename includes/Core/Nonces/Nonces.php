<?php
/**
 * Class Google\Site_Kit\Core\Nonces\Nonces
 *
 * @package   Google\Site_Kit\Core\Nonces
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Nonces;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Util\Feature_Flags;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class managing nonces used by Site Kit.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Nonces {
	/*
	 * Nonce actions.
	 *
	 * @since n.e.x.t
	 */
	const NONCE_UPDATES = 'updates';

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Array of nonce actions.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $nonce_actions;

	/**
	 * Constructor.
	 *
	 * Sets up the capability mappings.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;

		$this->nonce_actions = array(
			self::NONCE_UPDATES,
		);
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_filter(
			'googlesitekit_rest_routes',
			function( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);

		add_filter(
			'googlesitekit_apifetch_preload_paths',
			function ( $paths ) {
				return array_merge(
					$paths,
					array(
						'/' . REST_Routes::REST_ROOT . '/core/user/data/nonces',
					)
				);
			}
		);
	}

	/**
	 * Generate nonces for the current user.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of nonces.
	 */
	public function get_nonces() {
		$nonces = array();

		foreach ( $this->nonce_actions as $nonce_action ) {
			$nonces[ $nonce_action ] = wp_create_nonce( $nonce_action );
		}

		return $nonces;
	}

	/**
	 * Gets related REST routes.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of REST_Route objects.
	 */
	private function get_rest_routes() {
		return array(
			new REST_Route(
				'core/user/data/nonces',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function() {
							return new WP_REST_Response( $this->get_nonces() );
						},
						'permission_callback' => '__return_true',
					),
				)
			),
		);
	}
}
