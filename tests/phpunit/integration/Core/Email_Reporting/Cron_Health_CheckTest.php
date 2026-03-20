<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Cron_Health_CheckTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Cron_Health_Check;
use Google\Site_Kit\Core\Email_Reporting\Email_Log;
use Google\Site_Kit\Core\Email_Reporting\Email_Log_Batch_Query;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Scheduler;
use Google\Site_Kit\Core\Email_Reporting\Frequency_Planner;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;

class Cron_Health_CheckTest extends TestCase {

	private $query;
	private $health_check;
	private $created_post_ids = array();

	public function set_up() {
		parent::set_up();

		$this->register_email_log_dependencies();

		$this->query            = new Email_Log_Batch_Query();
		$scheduler              = new Email_Reporting_Scheduler( new Frequency_Planner() );
		$this->health_check     = new Cron_Health_Check( $this->query, $scheduler );
		$this->created_post_ids = array();

		$this->clear_state();
	}

	public function tear_down() {
		$this->clear_state();

		foreach ( $this->created_post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}

		if ( post_type_exists( Email_Log::POST_TYPE ) && function_exists( 'unregister_post_type' ) ) {
			unregister_post_type( Email_Log::POST_TYPE );
		}

		foreach ( array( Email_Log::STATUS_SENT, Email_Log::STATUS_FAILED, Email_Log::STATUS_SCHEDULED ) as $status ) {
			if ( isset( $GLOBALS['wp_post_statuses'][ $status ] ) ) {
				unset( $GLOBALS['wp_post_statuses'][ $status ] );
			}
		}

		parent::tear_down();
	}

	public function test_check_stale_tasks_marks_latest_pending_batch_when_initiator_is_overdue() {
		$batch_id = 'batch-overdue';
		$post_id  = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0 );

		wp_schedule_single_event(
			time() - DAY_IN_SECONDS - HOUR_IN_SECONDS,
			Email_Reporting_Scheduler::ACTION_INITIATOR,
			array( Email_Reporting_Settings::FREQUENCY_WEEKLY, time() - DAY_IN_SECONDS - HOUR_IN_SECONDS )
		);
		wp_schedule_single_event(
			time() + DAY_IN_SECONDS,
			Email_Reporting_Scheduler::ACTION_INITIATOR,
			array( Email_Reporting_Settings::FREQUENCY_MONTHLY, time() + DAY_IN_SECONDS )
		);
		wp_schedule_single_event(
			time() + DAY_IN_SECONDS,
			Email_Reporting_Scheduler::ACTION_INITIATOR,
			array( Email_Reporting_Settings::FREQUENCY_QUARTERLY, time() + DAY_IN_SECONDS )
		);

		$this->health_check->check_stale_tasks();

		$this->assertSame( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Overdue initiator should mark latest pending logs as failed.' );
		$this->assertSame( Email_Log_Batch_Query::MAX_ATTEMPTS, (int) get_post_meta( $post_id, Email_Log::META_SEND_ATTEMPTS, true ), 'Overdue initiator should set max attempts on failed logs.' );
		$this->assertStringContainsString( 'cron_scheduler_error', (string) get_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, true ), 'Overdue initiator should store cron scheduler error details.' );
	}

	public function test_check_stale_tasks_does_not_mark_logs_when_all_frequencies_are_healthy() {
		$batch_id = 'batch-healthy';
		$post_id  = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0 );

		wp_schedule_single_event(
			time() + DAY_IN_SECONDS,
			Email_Reporting_Scheduler::ACTION_INITIATOR,
			array( Email_Reporting_Settings::FREQUENCY_WEEKLY, time() + DAY_IN_SECONDS )
		);
		wp_schedule_single_event(
			time() + DAY_IN_SECONDS,
			Email_Reporting_Scheduler::ACTION_INITIATOR,
			array( Email_Reporting_Settings::FREQUENCY_MONTHLY, time() + DAY_IN_SECONDS )
		);
		wp_schedule_single_event(
			time() + DAY_IN_SECONDS,
			Email_Reporting_Scheduler::ACTION_INITIATOR,
			array( Email_Reporting_Settings::FREQUENCY_QUARTERLY, time() + DAY_IN_SECONDS )
		);

		$this->health_check->check_stale_tasks();

		$this->assertSame( Email_Log::STATUS_SCHEDULED, get_post_status( $post_id ), 'Healthy schedules should not mark logs as failed.' );
	}

	public function test_check_stale_tasks_marks_stale_pending_logs() {
		$batch_id = 'batch-stale';
		$post_id  = $this->create_log_post(
			$batch_id,
			Email_Log::STATUS_SCHEDULED,
			0,
			array(
				'post_date'     => gmdate( 'Y-m-d H:i:s', time() - ( 2 * DAY_IN_SECONDS ) ),
				'post_date_gmt' => gmdate( 'Y-m-d H:i:s', time() - ( 2 * DAY_IN_SECONDS ) ),
			)
		);

		$this->health_check->check_stale_tasks();

		$this->assertSame( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Stale scheduled logs should be marked as failed.' );
		$this->assertSame( Email_Log_Batch_Query::MAX_ATTEMPTS, (int) get_post_meta( $post_id, Email_Log::META_SEND_ATTEMPTS, true ), 'Stale scheduled logs should set attempts to max.' );
		$this->assertStringContainsString( 'cron_scheduler_error', (string) get_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, true ), 'Stale scheduled logs should store cron scheduler error details.' );
	}

	public function test_track_worker_progress_marks_batch_after_three_consecutive_zero_sends() {
		$batch_id = 'batch-zero-send';
		$post_id  = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0 );

		$this->health_check->track_worker_progress( Email_Reporting_Settings::FREQUENCY_WEEKLY, 0, $batch_id );
		$this->health_check->track_worker_progress( Email_Reporting_Settings::FREQUENCY_WEEKLY, 0, $batch_id );
		$this->health_check->track_worker_progress( Email_Reporting_Settings::FREQUENCY_WEEKLY, 0, $batch_id );

		$this->assertSame( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Three zero-send runs should mark the batch as failed.' );
		$this->assertSame( Email_Log_Batch_Query::MAX_ATTEMPTS, (int) get_post_meta( $post_id, Email_Log::META_SEND_ATTEMPTS, true ), 'Three zero-send runs should set attempts to max.' );
	}

	public function test_track_worker_progress_keeps_frequency_counters_isolated() {
		$weekly_key  = 'googlesitekit_email_cron_zero_sends_' . Email_Reporting_Settings::FREQUENCY_WEEKLY;
		$monthly_key = 'googlesitekit_email_cron_zero_sends_' . Email_Reporting_Settings::FREQUENCY_MONTHLY;

		$this->health_check->track_worker_progress( Email_Reporting_Settings::FREQUENCY_WEEKLY, 0, 'batch-weekly' );
		$this->health_check->track_worker_progress( Email_Reporting_Settings::FREQUENCY_WEEKLY, 0, 'batch-weekly' );
		$this->health_check->track_worker_progress( Email_Reporting_Settings::FREQUENCY_MONTHLY, 0, 'batch-monthly' );

		$this->assertSame( 2, (int) get_transient( $weekly_key ), 'Weekly counter should track only weekly runs.' );
		$this->assertSame( 1, (int) get_transient( $monthly_key ), 'Monthly counter should track only monthly runs.' );
	}

	public function test_track_worker_progress_resets_counter_on_successful_send() {
		$batch_id = 'batch-reset';
		$post_id  = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0 );

		$this->health_check->track_worker_progress( Email_Reporting_Settings::FREQUENCY_WEEKLY, 0, $batch_id );
		$this->health_check->track_worker_progress( Email_Reporting_Settings::FREQUENCY_WEEKLY, 0, $batch_id );
		$this->health_check->track_worker_progress( Email_Reporting_Settings::FREQUENCY_WEEKLY, 1, $batch_id );
		$this->health_check->track_worker_progress( Email_Reporting_Settings::FREQUENCY_WEEKLY, 0, $batch_id );

		$this->assertSame( Email_Log::STATUS_SCHEDULED, get_post_status( $post_id ), 'Counter reset should prevent premature batch failure.' );
		$this->assertSame(
			1,
			(int) get_transient( 'googlesitekit_email_cron_zero_sends_' . Email_Reporting_Settings::FREQUENCY_WEEKLY ),
			'Counter should restart from 1 after a successful send.'
		);
	}

	public function test_mark_batch_cron_error_updates_logs_and_latest_batch_error_pipeline() {
		$batch_id = 'batch-mark';
		$post_id  = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0 );

		$this->health_check->mark_batch_cron_error( $batch_id );

		$this->assertSame( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'mark_batch_cron_error should set failed status.' );
		$this->assertSame( Email_Log_Batch_Query::MAX_ATTEMPTS, (int) get_post_meta( $post_id, Email_Log::META_SEND_ATTEMPTS, true ), 'mark_batch_cron_error should set max attempts.' );

		$latest_error = $this->query->get_latest_batch_error();
		$this->assertIsString( $latest_error, 'Latest batch error should be persisted as JSON string.' );
		$this->assertStringContainsString( 'cron_scheduler_error', $latest_error, 'Latest batch error should include cron scheduler category.' );
	}

	private function create_log_post( $batch_id, $status, $attempts, array $overrides = array() ) {
		$post_id = $this->factory()->post->create(
			array_merge(
				array(
					'post_type'     => Email_Log::POST_TYPE,
					'post_status'   => $status,
					'post_title'    => 'Cron log ' . uniqid(),
					'post_date'     => current_time( 'mysql' ),
					'post_date_gmt' => current_time( 'mysql', 1 ),
				),
				$overrides
			)
		);

		update_post_meta( $post_id, Email_Log::META_BATCH_ID, $batch_id );
		update_post_meta( $post_id, Email_Log::META_REPORT_FREQUENCY, Email_Reporting_Settings::FREQUENCY_WEEKLY );
		update_post_meta( $post_id, Email_Log::META_SEND_ATTEMPTS, $attempts );
		update_post_meta(
			$post_id,
			Email_Log::META_REPORT_REFERENCE_DATES,
			array(
				'startDate' => time() - DAY_IN_SECONDS,
				'sendDate'  => time(),
			)
		);

		$this->created_post_ids[] = $post_id;

		return $post_id;
	}

	private function register_email_log_dependencies() {
		$email_log       = new Email_Log( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$register_method = new \ReflectionMethod( Email_Log::class, 'register_email_log' );
		$register_method->setAccessible( true );
		$register_method->invoke( $email_log );
	}

	private function clear_state() {
		wp_unschedule_hook( Email_Reporting_Scheduler::ACTION_INITIATOR );

		delete_transient( 'googlesitekit_email_cron_zero_sends_' . Email_Reporting_Settings::FREQUENCY_WEEKLY );
		delete_transient( 'googlesitekit_email_cron_zero_sends_' . Email_Reporting_Settings::FREQUENCY_MONTHLY );
		delete_transient( 'googlesitekit_email_cron_zero_sends_' . Email_Reporting_Settings::FREQUENCY_QUARTERLY );
	}
}
