<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Worker_Task
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

/**
 * Handles worker cron callbacks for email reporting.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Worker_Task {

	/**
	 * Email log batch query helper.
	 *
	 * @since 1.167.0
	 *
	 * @var Email_Log_Batch_Query
	 */
	private $batch_query;

	/**
	 * Scheduler instance.
	 *
	 * @since 1.167.0
	 *
	 * @var Email_Reporting_Scheduler
	 */
	private $scheduler;

	/**
	 * Max execution limiter.
	 *
	 * @since 1.167.0
	 *
	 * @var Max_Execution_Limiter
	 */
	private $max_execution_limiter;

	/**
	 * Constructor.
	 *
	 * @since 1.167.0
	 *
	 * @param Max_Execution_Limiter     $max_execution_limiter Execution limiter instance.
	 * @param Email_Log_Batch_Query     $batch_query           Batch query helper.
	 * @param Email_Reporting_Scheduler $scheduler             Scheduler instance.
	 */
	public function __construct(
		Max_Execution_Limiter $max_execution_limiter,
		Email_Log_Batch_Query $batch_query,
		Email_Reporting_Scheduler $scheduler
	) {
		$this->max_execution_limiter = $max_execution_limiter;
		$this->batch_query           = $batch_query;
		$this->scheduler             = $scheduler;
	}

	/**
	 * Handles worker cron executions for email reporting.
	 *
	 * @since 1.167.0
	 *
	 * @param string $batch_id            Batch identifier.
	 * @param string $frequency           Frequency slug.
	 * @param int    $initiator_timestamp Initiator timestamp.
	 */
	public function handle_callback_action( $batch_id, $frequency, $initiator_timestamp ) {
		$lock_handle = $this->acquire_lock( $frequency );
		if ( ! $lock_handle ) {
			return;
		}

		try {
			if ( $this->should_abort( $initiator_timestamp ) ) {
				return;
			}

			if ( $this->batch_query->is_complete( $batch_id ) ) {
				return;
			}

			$pending_ids = $this->batch_query->get_pending_ids( $batch_id );

			if ( empty( $pending_ids ) ) {
				return;
			}

			$this->schedule_follow_up( $batch_id, $frequency, $initiator_timestamp );

			if ( $this->should_abort( $initiator_timestamp ) ) {
				return;
			}

			foreach ( $pending_ids as $post_id ) {
				if ( $this->should_abort( $initiator_timestamp ) ) {
					return;
				}

				$this->batch_query->increment_attempt( $post_id );
			}

			if ( $this->should_abort( $initiator_timestamp ) ) {
				return;
			}
		} finally {
			delete_transient( $lock_handle );
		}
	}

	/**
	 * Attempts to acquire a frequency-scoped worker lock.
	 *
	 * @since 1.167.0
	 *
	 * @param string $frequency Frequency slug.
	 * @return string|false Transient name on success, false if lock already held.
	 */
	private function acquire_lock( $frequency ) {
		$transient_name = sprintf( 'googlesitekit_email_reporting_worker_lock_%s', $frequency );

		if ( get_transient( $transient_name ) ) {
			return false;
		}

		set_transient( $transient_name, time(), MINUTE_IN_SECONDS );

		return $transient_name;
	}

	/**
	 * Determines if the current worker run should abort.
	 *
	 * @since 1.167.0
	 *
	 * @param int $initiator_timestamp Initiator timestamp.
	 * @return bool True if processing should stop immediately.
	 */
	private function should_abort( $initiator_timestamp ) {
		return $this->max_execution_limiter->should_abort( $initiator_timestamp );
	}

	/**
	 * Schedules the follow-up worker event.
	 *
	 * @since 1.167.0
	 *
	 * @param string $batch_id            Batch identifier.
	 * @param string $frequency           Frequency slug.
	 * @param int    $initiator_timestamp Initiator timestamp.
	 */
	private function schedule_follow_up( $batch_id, $frequency, $initiator_timestamp ) {
		$target_time = time() + ( 11 * MINUTE_IN_SECONDS );
		$delay       = max( 0, $target_time - (int) $initiator_timestamp );

		$this->scheduler->schedule_worker( $batch_id, $frequency, $initiator_timestamp, $delay );
	}
}
