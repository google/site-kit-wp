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

/**
 * Handles scheduled cleanup for email reporting logs.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Email_Log_Cleanup {

	/**
	 * Maximum age for email logs before deletion (in seconds).
	 *
	 * @since 1.167.0
	 */
	private const MAX_LOG_AGE = 6 * MONTH_IN_SECONDS;

	/**
	 * Number of posts to delete per batch.
	 *
	 * @since 1.167.0
	 */
	private const DELETE_CHUNK_SIZE = 30;

	/**
	 * Settings instance.
	 *
	 * @since 1.167.0
	 *
	 * @var Email_Reporting_Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since 1.167.0
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
	 * @since 1.167.0
	 */
	public function handle_cleanup_action() {
		$lock_handle = $this->acquire_lock();

		if ( ! $this->settings->is_email_reporting_enabled() || ! $lock_handle ) {
			return;
		}

		try {
			do {
				// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.get_posts_get_posts
				$post_ids = get_posts( $this->build_cleanup_query_args( self::DELETE_CHUNK_SIZE ) );

				foreach ( $post_ids as $post_id ) {
					wp_delete_post( $post_id, true );
				}
			} while ( ! empty( $post_ids ) );
		} finally {
			delete_transient( $lock_handle );
		}
	}

	/**
	 * Builds the cleanup query arguments for expired email logs.
	 *
	 * @since 1.167.0
	 *
	 * @param int $posts_per_page Number of posts to fetch per request.
	 * @return array Query arguments for expired email log posts.
	 */
	private function build_cleanup_query_args( $posts_per_page ) {
		$cutoff = gmdate( 'Y-m-d', time() - self::MAX_LOG_AGE );

		return array(
			'post_type'              => Email_Log::POST_TYPE,
			'post_status'            => $this->get_valid_statuses(),
			'fields'                 => 'ids',
			'posts_per_page'         => $posts_per_page,
			'orderby'                => 'ID',
			'order'                  => 'ASC',
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
		);
	}

	/**
	 * Gets the list of valid email log post statuses.
	 *
	 * @since 1.167.0
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
	 * @since 1.167.0
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
