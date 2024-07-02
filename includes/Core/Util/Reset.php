<?php
/**
 * Class Google\Site_Kit\Core\Util\Reset
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
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
class Reset {

	/**
	 * MySQL key pattern for all Site Kit keys.
	 */
	const KEY_PATTERN = 'googlesitekit\_%';

	/**
	 * REST API endpoint.
	 */
	const REST_ROUTE = 'core/site/data/reset';

	/**
	 * Action for triggering a reset.
	 */
	const ACTION = 'googlesitekit_reset';

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Gets the URL to handle a reset action.
	 *
	 * @since 1.30.0
	 *
	 * @return string
	 */
	public static function url() {
		return add_query_arg(
			array(
				'action' => static::ACTION,
				'nonce'  => wp_create_nonce( static::ACTION ),
			),
			admin_url( 'index.php' )
		);
	}

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
			function ( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);

		add_action(
			'admin_action_' . static::ACTION,
			function () {
				$this->handle_reset_action(
					$this->context->input()->filter( INPUT_GET, 'nonce' )
				);
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
		$this->delete_post_meta( 'site' );

		if ( $this->context->is_network_mode() ) {
			$this->delete_options( 'network' );
			$this->delete_user_options( 'network' );
			$this->delete_post_meta( 'network' );
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
				DELETE FROM {$table_name}
				 WHERE {$column_name} LIKE %s
				    OR {$column_name} LIKE %s
				    OR {$column_name} LIKE %s
				    OR {$column_name} = %s
				", /* phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared */
				static::KEY_PATTERN,
				$transient_prefix . static::KEY_PATTERN,
				$transient_prefix . 'timeout_' . static::KEY_PATTERN,
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
			$wpdb->prepare(
				"DELETE FROM {$wpdb->usermeta} WHERE meta_key LIKE %s",
				$meta_prefix . static::KEY_PATTERN
			)
		);
	}

	/**
	 * Deletes all Site Kit post meta settings.
	 *
	 * @since 1.33.0
	 *
	 * @param string $scope Scope of the deletion ('site' or 'network').
	 */
	private function delete_post_meta( $scope ) {
		global $wpdb;

		$sites = array();
		if ( 'network' === $scope ) {
			$sites = get_sites(
				array(
					'fields' => 'ids',
					'number' => 9999999,
				)
			);
		} else {
			$sites[] = get_current_blog_id();
		}

		foreach ( $sites as $site_id ) {
			$prefix = $wpdb->get_blog_prefix( $site_id );

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->query(
				$wpdb->prepare(
					"DELETE FROM {$prefix}postmeta WHERE `meta_key` LIKE %s", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
					static::KEY_PATTERN
				)
			);
		}
	}

	/**
	 * Gets related REST routes.
	 *
	 * @since 1.3.0
	 *
	 * @return array List of REST_Route objects.
	 */
	private function get_rest_routes() {
		$can_setup = function () {
			return current_user_can( Permissions::SETUP );
		};

		return array(
			new REST_Route(
				static::REST_ROUTE,
				array(
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function () {
							$this->all();
							$this->maybe_hard_reset();

							// Call hooks on plugin reset. This is used to reset the ad blocking recovery notification.
							do_action( 'googlesitekit_reset' );

							return new WP_REST_Response( true );
						},
						'permission_callback' => $can_setup,
					),
				)
			),
		);
	}

	/**
	 * Handles the reset admin action.
	 *
	 * @since 1.30.0
	 *
	 * @param string $nonce WP nonce for action.
	 */
	private function handle_reset_action( $nonce ) {
		if ( ! wp_verify_nonce( $nonce, static::ACTION ) ) {
			$authentication = new Authentication( $this->context );
			$authentication->invalid_nonce_error( static::ACTION );
		}
		if ( ! current_user_can( Permissions::SETUP ) ) {
			wp_die( esc_html__( 'You don’t have permissions to set up Site Kit.', 'google-site-kit' ), 403 );
		}

		// Call hooks on plugin reset. This is used to reset the ad blocking recovery notification.
		do_action( 'googlesitekit_reset' );

		$this->all();
		$this->maybe_hard_reset();

		wp_safe_redirect(
			$this->context->admin_url(
				'splash',
				array(
					// Trigger client-side storage reset.
					'googlesitekit_reset_session' => 1,
					// Show reset-success notification.
					'notification'                => 'reset_success',
				)
			)
		);
		exit;
	}

	/**
	 * Performs hard reset if it is enabled programmatically.
	 *
	 * @since 1.46.0
	 */
	public function maybe_hard_reset() {
		/**
		 * Filters the hard reset option, which is `false` by default.
		 *
		 * By default, when Site Kit is reset it does not delete "persistent" data
		 * (options prefixed with `googlesitekitpersistent_`). If this filter returns `true`,
		 * all options belonging to Site Kit, including those with the above "persistent"
		 * prefix, will be deleted.
		 *
		 * @since 1.46.0
		 *
		 * @param bool $hard_reset_enabled If a hard reset is enabled. `false` by default.
		 */
		$hard_reset_enabled = apply_filters( 'googlesitekit_hard_reset_enabled', false );
		if ( ! $hard_reset_enabled ) {
			return;
		}

		$reset_persistent = new Reset_Persistent( $this->context );
		$reset_persistent->all();
	}
}
