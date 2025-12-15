<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Fallback_Task
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

/**
 * Handles fallback cron callbacks for email reporting.
 *
 * @since 1.168.0
 * @access private
 * @ignore
 */
class Fallback_Task {

	/**
	 * Email log batch query helper.
	 *
	 * @since 1.168.0
	 *
	 * @var Email_Log_Batch_Query
	 */
	private $batch_query;

	/**
	 * Scheduler instance.
	 *
	 * @since 1.168.0
	 *
	 * @var Email_Reporting_Scheduler
	 */
	private $scheduler;

	/**
	 * Worker task instance.
	 *
	 * @since 1.168.0
	 *
	 * @var Worker_Task
	 */
	private $worker_task;

	/**
	 * Constructor.
	 *
	 * @since 1.168.0
	 *
	 * @param Email_Log_Batch_Query     $batch_query Batch query helper.
	 * @param Email_Reporting_Scheduler $scheduler   Scheduler instance.
	 * @param Worker_Task               $worker_task Worker task instance.
	 */
	public function __construct(
		Email_Log_Batch_Query $batch_query,
		Email_Reporting_Scheduler $scheduler,
		Worker_Task $worker_task
	) {
		$this->batch_query = $batch_query;
		$this->scheduler   = $scheduler;
		$this->worker_task = $worker_task;
	}

	/**
	 * Handles the fallback cron callback.
	 *
	 * @since 1.168.0
	 *
	 * @param string $batch_id            Batch identifier.
	 * @param string $frequency           Frequency slug.
	 * @param int    $initiator_timestamp Initiator timestamp.
	 */
	public function handle_fallback_action( $batch_id, $frequency, $initiator_timestamp ) {
		if ( $this->is_worker_locked( $frequency ) ) {
			$this->schedule_next_fallback( $batch_id, $frequency, $initiator_timestamp, 20 * MINUTE_IN_SECONDS );
			return;
		}

		if ( $this->batch_query->is_complete( $batch_id ) ) {
			return;
		}

		$this->schedule_next_fallback( $batch_id, $frequency, $initiator_timestamp );

		$this->worker_task->handle_callback_action( $batch_id, $frequency, $initiator_timestamp );
	}

	/**
	 * Checks if a worker lock exists for the given frequency.
	 *
	 * @since 1.168.0
	 *
	 * @param string $frequency Frequency slug.
	 * @return bool True if a lock is present.
	 */
	private function is_worker_locked( $frequency ) {
		$transient_name = sprintf( 'googlesitekit_email_reporting_worker_lock_%s', $frequency );

		return (bool) get_transient( $transient_name );
	}

	/**
	 * Schedules the next fallback event.
	 *
	 * @since 1.168.0
	 *
	 * @param string $batch_id            Batch identifier.
	 * @param string $frequency           Frequency slug.
	 * @param int    $initiator_timestamp Initiator timestamp.
	 * @param int    $delay               Optional. Delay in seconds. Default one hour.
	 */
	private function schedule_next_fallback( $batch_id, $frequency, $initiator_timestamp, $delay = HOUR_IN_SECONDS ) {
		$target_time = time() + $delay;
		$event_delay = max( 0, $target_time - (int) $initiator_timestamp );

		$this->scheduler->schedule_fallback( $batch_id, $frequency, $initiator_timestamp, $event_delay );
	}
}
