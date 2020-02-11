<?php
/**
 * Class Google\Site_Kit\Core\Util\Reset
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
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
 * Class providing functions to reset the plugin.
 *
 * @since 1.0.0
 * @since 1.1.1 Removed delete_all_plugin_options(), delete_all_user_metas() and delete_all_transients() methods.
 * @access private
 * @ignore
 */
final class Reset {

	/**
	 * MySQL key pattern for all Site Kit keys.
	 */
	const KEY_PATTERN = 'googlesitekit\_%';

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
	 * @since 1.1.1 Removed $options and $transients params.
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.3.0
	 */
	public function register() {
		add_filter(
			'googlesitekit_rest_routes',
			function( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);
	}

	/**
	 * Deletes options, user stored options, transients and clears object cache for stored options.
	 *
	 * @since 1.0.0
	 */
	public function all() {
		$this->delete_options( 'site' );
		$this->delete_user_options( 'site' );

		if ( $this->context->is_network_mode() ) {
			$this->delete_options( 'network' );
			$this->delete_user_options( 'network' );
		}

		wp_cache_flush();
	}

	/**
	 * Deletes all Site Kit options and transients.
	 *
	 * @since 1.3.0
	 *
	 * @param string $scope Scope of the deletion ('site' or 'network').
	 */
	private function delete_options( $scope ) {
		global $wpdb;

		if ( 'site' === $scope ) {
			list ( $table_name, $column_name, $transient_prefix ) = array( $wpdb->options, 'option_name', '_transient_' );
		} elseif ( 'network' === $scope ) {
			list ( $table_name, $column_name, $transient_prefix ) = array( $wpdb->sitemeta, 'meta_key', '_site_transient_' );
		} else {
			return;
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$wpdb->query(
			$wpdb->prepare(
				/* phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared */
				"
				DELETE FROM $table_name
				WHERE  $column_name LIKE %s
					OR $column_name LIKE %s
					OR $column_name LIKE %s
					OR $column_name = %s
				", /* phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared */
				self::KEY_PATTERN,
				$transient_prefix . self::KEY_PATTERN,
				$transient_prefix . 'timeout_' . self::KEY_PATTERN,
				'googlesitekit-active-modules'
			)
		);
	}

	/**
	 * Deletes all Site Kit user options.
	 *
	 * @param string $scope Scope of the deletion ('site' or 'network').
	 */
	private function delete_user_options( $scope ) {
		global $wpdb;

		if ( 'site' === $scope ) {
			$meta_prefix = $wpdb->get_blog_prefix();
		} elseif ( 'network' === $scope ) {
			$meta_prefix = '';
		} else {
			return;
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$wpdb->query(
			$wpdb->prepare( "DELETE FROM $wpdb->usermeta WHERE meta_key LIKE %s", $meta_prefix . self::KEY_PATTERN )
		);
	}

	/**
	 * Gets related REST routes.
	 *
	 * @since 1.3.0
	 *
	 * @return array List of REST_Route objects.
	 */
	private function get_rest_routes() {
		$can_setup = function() {
			return current_user_can( Permissions::SETUP );
		};

		return array(
			new REST_Route(
				'core/site/data/reset',
				array(
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$this->all();
							return new WP_REST_Response( true );
						},
						'permission_callback' => $can_setup,
					),
				)
			),
		);
	}
}
