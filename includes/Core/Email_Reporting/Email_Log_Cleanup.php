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
	 * Settings instance.
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
		if ( ! $this->settings->is_email_reporting_enabled() ) {
			return;
		}

		$cutoff = gmdate( 'Y-m-d', time() - 6 * MONTH_IN_SECONDS );

		$statuses = array(
			Email_Log::STATUS_SENT,
			Email_Log::STATUS_FAILED,
			Email_Log::STATUS_SCHEDULED,
		);

		$query = new WP_Query(
			array(
				'post_type'              => Email_Log::POST_TYPE,
				'post_status'            => $statuses,
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

		if ( empty( $query->posts ) ) {
			return;
		}

		foreach ( array_chunk( $query->posts, 100 ) as $post_chunk ) {
			foreach ( $post_chunk as $post_id ) {
				wp_delete_post( $post_id, true );
			}
		}
	}
}
