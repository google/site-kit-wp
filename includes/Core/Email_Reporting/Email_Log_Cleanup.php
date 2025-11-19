<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Log_Cleanup
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use WP_Query;

/**
 * Handles scheduled cleanup for email reporting logs.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Email_Log_Cleanup {

	/**
	 * Maximum age for email logs before deletion (in seconds).
	 *
	 * @since n.e.x.t
	 */
	private const MAX_LOG_AGE = 6 * MONTH_IN_SECONDS;

	/**
	 * Number of posts to delete per batch.
	 *
	 * @since n.e.x.t
	 */
	private const DELETE_CHUNK_SIZE = 30;

	/**
	 * Settings instance.
	 *
	 * @since n.e.x.t
	 *
	 * @var Email_Reporting_Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Email_Reporting_Settings $settings Settings instance.
	 */
	public function __construct( Email_Reporting_Settings $settings ) {
		$this->settings = $settings;
	}

	/**
	 * Handles the cleanup cron action.
	 *
	 * Deletes email log posts older than six months when the feature is enabled.
	 *
	 * @since n.e.x.t
	 */
	public function handle_cleanup_action() {
		$lock_handle = $this->acquire_lock();

		if ( ! $this->settings->is_email_reporting_enabled() || ! $lock_handle ) {
			return;
		}

		try {
			$query = $this->build_cleanup_query();

			if ( empty( $query->posts ) ) {
				return;
			}

			foreach ( array_chunk( $query->posts, self::DELETE_CHUNK_SIZE ) as $post_chunk ) {
				foreach ( $post_chunk as $post_id ) {
					wp_delete_post( $post_id, true );
				}
			}
		} finally {
			delete_transient( $lock_handle );
		}
	}

	/**
	 * Builds the cleanup query for expired email logs.
	 *
	 * @since n.e.x.t
	 *
	 * @return WP_Query Query instance for expired email log posts.
	 */
	private function build_cleanup_query() {
		$cutoff = gmdate( 'Y-m-d', time() - self::MAX_LOG_AGE );

		return new WP_Query(
			array(
				'post_type'              => Email_Log::POST_TYPE,
				'post_status'            => $this->get_valid_statuses(),
				'fields'                 => 'ids',
				'posts_per_page'         => -1,
				'no_found_rows'          => true,
				'cache_results'          => false,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
				'date_query'             => array(
					array(
						'before' => $cutoff,
						'column' => 'post_date_gmt',
					),
				),
			)
		);
	}

	/**
	 * Gets the list of valid email log post statuses.
	 *
	 * @since n.e.x.t
	 *
	 * @return string[] Valid post statuses.
	 */
	private function get_valid_statuses() {
		return array(
			Email_Log::STATUS_SENT,
			Email_Log::STATUS_FAILED,
			Email_Log::STATUS_SCHEDULED,
		);
	}

	/**
	 * Attempts to acquire the cleanup lock.
	 *
	 * @since n.e.x.t
	 *
	 * @return string|false Transient name on success, false if lock already held.
	 */
	private function acquire_lock() {
		$transient_name = 'googlesitekit_email_reporting_cleanup_lock';

		if ( get_transient( $transient_name ) ) {
			return false;
		}

		set_transient( $transient_name, time(), 5 * MINUTE_IN_SECONDS );

		return $transient_name;
	}
}
