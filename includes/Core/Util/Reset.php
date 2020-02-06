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
	 * @since n.e.x.t
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
		global $wpdb;

		$sitekit_key_pattern = 'googlesitekit\_%';

		if ( $this->context->is_network_mode() ) {
			$options_table    = $wpdb->sitemeta;
			$options_column   = 'meta_key';
			$meta_key_pattern = $sitekit_key_pattern;
			$transient_prefix = '_site_transient_';
		} else {
			$options_table    = $wpdb->options;
			$options_column   = 'option_name';
			$meta_key_pattern = $wpdb->get_blog_prefix() . $sitekit_key_pattern;
			$transient_prefix = '_transient_';
		}

		// Delete options and transients.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$wpdb->query(
			$wpdb->prepare(
				/* phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared */
				"
				DELETE FROM $options_table
				WHERE  $options_column LIKE %s
					OR $options_column LIKE %s
					OR $options_column LIKE %s
					OR $options_column = %s
				", /* phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared */
				$sitekit_key_pattern,
				$transient_prefix . $sitekit_key_pattern,
				$transient_prefix . 'timeout_' . $sitekit_key_pattern,
				'googlesitekit-active-modules'
			)
		);

		// Delete user meta.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$wpdb->query(
			$wpdb->prepare( "DELETE FROM $wpdb->usermeta WHERE meta_key LIKE %s", $meta_key_pattern )
		);

		wp_cache_flush();
	}

	/**
	 * Gets related REST routes.
	 *
	 * @since n.e.x.t
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
