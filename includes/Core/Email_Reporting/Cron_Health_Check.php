<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Cron_Health_Check
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;
use WP_Query;

/**
 * Handles cron health checks for email reporting.
 *
 * @since 1.176.0
 * @access private
 * @ignore
 */
class Cron_Health_Check {

	/**
	 * Consecutive zero-send threshold before marking cron scheduler errors.
	 *
	 * @since 1.176.0
	 */
	const ZERO_SEND_THRESHOLD = 3;

	/**
	 * Batch query helper.
	 *
	 * @since 1.176.0
	 *
	 * @var Email_Log_Batch_Query
	 */
	private $batch_query;

	/**
	 * Scheduler instance.
	 *
	 * @since 1.176.0
	 *
	 * @var Email_Reporting_Scheduler
	 */
	private $scheduler;

	/**
	 * Constructor.
	 *
	 * @since 1.176.0
	 *
	 * @param Email_Log_Batch_Query     $batch_query Batch query helper.
	 * @param Email_Reporting_Scheduler $scheduler  Scheduler instance.
	 */
	public function __construct( Email_Log_Batch_Query $batch_query, Email_Reporting_Scheduler $scheduler ) {
		$this->batch_query = $batch_query;
		$this->scheduler   = $scheduler;
	}

	/**
	 * Checks for stale cron-related work and marks logs with cron errors when found.
	 *
	 * @since 1.176.0
	 */
	public function check_stale_tasks() {
		$now                    = time();
		$has_overdue_cron_tasks = false;
		$frequencies            = array(
			User_Email_Reporting_Settings::FREQUENCY_WEEKLY,
			User_Email_Reporting_Settings::FREQUENCY_MONTHLY,
			User_Email_Reporting_Settings::FREQUENCY_QUARTERLY,
		);

		foreach ( $frequencies as $frequency ) {
			$scheduled = $this->scheduler->get_initiator_timestamp( $frequency );

			if ( false === $scheduled ) {
				continue;
			}

			if ( ( (int) $scheduled + DAY_IN_SECONDS ) < $now ) {
				$has_overdue_cron_tasks = true;
				break;
			}
		}

		if ( $has_overdue_cron_tasks ) {
			$this->set_cron_scheduler_error();
		}

		if ( $this->batch_query->has_stale_pending_logs() ) {
			$this->mark_stale_logs_cron_error();
		}
	}

	/**
	 * Tracks worker progress by frequency and marks cron errors when retries stall.
	 *
	 * @since 1.176.0
	 *
	 * @param string $frequency        Frequency slug.
	 * @param int    $emails_processed Number of emails sent in the worker run.
	 * @param string $batch_id         Batch ID for the current run.
	 */
	public function track_worker_progress( string $frequency, int $emails_processed, string $batch_id ) {
		if ( '' === $frequency || '' === $batch_id ) {
			return;
		}

		$transient_key = $this->get_zero_send_transient_key( $frequency );

		if ( $emails_processed > 0 ) {
			delete_transient( $transient_key );
			return;
		}

		$count = ( (int) get_transient( $transient_key ) ) + 1;

		set_transient( $transient_key, $count, HOUR_IN_SECONDS );

		if ( $count >= self::ZERO_SEND_THRESHOLD ) {
			$this->mark_batch_cron_error( $batch_id );
		}
	}

	/**
	 * Marks all pending logs in the given batch as failed due to cron scheduler issues.
	 *
	 * @since 1.176.0
	 *
	 * @param string $batch_id Batch identifier.
	 */
	public function mark_batch_cron_error( $batch_id ) {
		$batch_id = (string) $batch_id;
		if ( '' === $batch_id ) {
			return;
		}

		$pending_ids = $this->batch_query->get_pending_ids( $batch_id );

		if ( empty( $pending_ids ) ) {
			return;
		}

		$error_details = $this->get_cron_scheduler_error_json();

		foreach ( $pending_ids as $post_id ) {
			$this->mark_post_with_cron_error( $post_id, $error_details );
		}
	}

	/**
	 * Marks stale scheduled logs as failed with cron scheduler errors.
	 *
	 * @since 1.176.0
	 */
	public function mark_stale_logs_cron_error() {
		$stale_ids = $this->get_stale_pending_log_ids();
		if ( empty( $stale_ids ) ) {
			return;
		}

		$error_details = $this->get_cron_scheduler_error_json();

		foreach ( $stale_ids as $post_id ) {
			$this->mark_post_with_cron_error( $post_id, $error_details );
		}
	}

	/**
	 * Marks latest batch pending logs with cron scheduler errors.
	 *
	 * @since 1.176.0
	 */
	private function set_cron_scheduler_error() {
		$latest_batch_post_ids = $this->batch_query->get_latest_batch_post_ids();
		if ( empty( $latest_batch_post_ids ) ) {
			return;
		}

		$first_post_id = (int) reset( $latest_batch_post_ids );
		$batch_id      = get_post_meta( $first_post_id, Email_Log::META_BATCH_ID, true );

		if ( empty( $batch_id ) ) {
			return;
		}

		$this->mark_batch_cron_error( (string) $batch_id );
	}

	/**
	 * Builds the transient key for zero-send tracking.
	 *
	 * @since 1.176.0
	 *
	 * @param string $frequency Frequency slug.
	 * @return string
	 */
	private function get_zero_send_transient_key( $frequency ) {
		return sprintf( 'googlesitekit_email_cron_zero_sends_%s', sanitize_key( $frequency ) );
	}

	/**
	 * Gets stale pending log IDs older than one day.
	 *
	 * @since 1.176.0
	 *
	 * @return array<int>
	 */
	private function get_stale_pending_log_ids() {
		$query = new WP_Query(
			array(
				'post_type'              => Email_Log::POST_TYPE,
				'post_status'            => Email_Log::STATUS_SCHEDULED,
				// phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page
				'posts_per_page'         => 10000,
				'fields'                 => 'ids',
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
				'date_query'             => array(
					array(
						'column' => 'post_date',
						'before' => gmdate( 'Y-m-d H:i:s', time() - DAY_IN_SECONDS ),
					),
				),
			)
		);

		return array_map( 'intval', $query->posts );
	}

	/**
	 * Gets error details payload for cron scheduler errors.
	 *
	 * @since 1.176.0
	 *
	 * @return string
	 */
	private function get_cron_scheduler_error_json() {
		$error = new \WP_Error(
			'cron_scheduler_error',
			__( 'Email report generation could not be completed due to a cron scheduling issue.', 'google-site-kit' ),
			array(
				'category_id' => 'cron_scheduler_error',
			)
		);

		$payload = array(
			'errors'     => $error->errors,
			'error_data' => $error->error_data,
		);

		$encoded = wp_json_encode( $payload, JSON_UNESCAPED_UNICODE );

		return is_string( $encoded ) ? $encoded : '';
	}

	/**
	 * Marks a single log post as failed due to cron scheduler error.
	 *
	 * @since 1.176.0
	 *
	 * @param int    $post_id       Email log post ID.
	 * @param string $error_details Encoded cron scheduler error payload.
	 */
	private function mark_post_with_cron_error( $post_id, $error_details ) {
		$this->batch_query->update_status( $post_id, Email_Log::STATUS_FAILED );
		update_post_meta( $post_id, Email_Log::META_SEND_ATTEMPTS, Email_Log_Batch_Query::MAX_ATTEMPTS );
		update_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, $error_details );
	}
}
