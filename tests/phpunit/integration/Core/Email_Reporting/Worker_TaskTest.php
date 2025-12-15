<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Worker_TaskTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Email_Log;
use Google\Site_Kit\Core\Email_Reporting\Email_Log_Batch_Query;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Scheduler;
use Google\Site_Kit\Core\Email_Reporting\Max_Execution_Limiter;
use Google\Site_Kit\Core\Email_Reporting\Worker_Task;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;

class Worker_TaskTest extends TestCase {

	/**
	 * @var Email_Reporting_Scheduler|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $scheduler;

	/**
	 * @var Email_Log_Batch_Query|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $batch_query;

	/**
	 * @var Max_Execution_Limiter|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $limiter;

	/**
	 * @var array
	 */
	private $created_post_ids = array();

	public function set_up() {
		parent::set_up();

		$this->scheduler        = $this->createMock( Email_Reporting_Scheduler::class );
		$this->batch_query      = $this->createMock( Email_Log_Batch_Query::class );
		$this->limiter          = $this->createMock( Max_Execution_Limiter::class );
		$this->created_post_ids = array();
	}

	public function tear_down() {
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

		foreach (
			array(
				Email_Log::META_REPORT_FREQUENCY,
				Email_Log::META_BATCH_ID,
				Email_Log::META_SEND_ATTEMPTS,
				Email_Log::META_ERROR_DETAILS,
				Email_Log::META_REPORT_REFERENCE_DATES,
			) as $meta_key
		) {
			if ( function_exists( 'unregister_meta_key' ) ) {
				unregister_meta_key( 'post', Email_Log::POST_TYPE, $meta_key );
			}
		}

		parent::tear_down();
	}

	public function test_acquires_and_clears_lock() {
		$task            = new Worker_Task( $this->limiter, $this->batch_query, $this->scheduler );
		$transient_name  = 'googlesitekit_email_reporting_worker_lock_weekly';
		$initiator_stamp = time();

		$this->limiter->expects( $this->once() )
			->method( 'should_abort' )
			->with( $initiator_stamp )
			->willReturn( false );

		$this->batch_query->expects( $this->once() )
			->method( 'is_complete' )
			->with( 'batch-lock' )
			->willReturn( true );

		$this->batch_query->expects( $this->never() )
			->method( 'get_pending_ids' );

		$task->handle_callback_action( 'batch-lock', Email_Reporting_Settings::FREQUENCY_WEEKLY, $initiator_stamp );

		$this->assertFalse( get_transient( $transient_name ), 'Transient lock should be cleared after execution.' );
	}

	public function test_existing_lock_short_circuits_worker() {
		$task           = new Worker_Task( $this->limiter, $this->batch_query, $this->scheduler );
		$transient_name = 'googlesitekit_email_reporting_worker_lock_monthly';
		set_transient( $transient_name, time(), MINUTE_IN_SECONDS );

		$this->limiter->expects( $this->never() )->method( 'should_abort' );
		$this->batch_query->expects( $this->never() )->method( 'is_complete' );

		$task->handle_callback_action( 'batch-lock', Email_Reporting_Settings::FREQUENCY_MONTHLY, time() );

		$this->assertNotFalse( get_transient( $transient_name ), 'Existing lock should remain untouched when worker skips execution.' );
	}

	public function test_exits_without_rescheduling_when_complete() {
		$task = new Worker_Task( $this->limiter, $this->batch_query, $this->scheduler );

		$this->limiter->method( 'should_abort' )->willReturn( false );

		$this->batch_query->expects( $this->once() )
			->method( 'is_complete' )
			->willReturn( true );

		$this->scheduler->expects( $this->never() )
			->method( 'schedule_worker' );

		$task->handle_callback_action( 'batch-complete', Email_Reporting_Settings::FREQUENCY_WEEKLY, time() );
	}

	public function test_schedules_follow_up_for_pending_ids() {
		$task            = new Worker_Task( $this->limiter, $this->batch_query, $this->scheduler );
		$initiator_stamp = time();
		$pending_ids     = array( 11, 22 );
		$expected_delay  = 11 * MINUTE_IN_SECONDS;
		$captured_delay  = null;

		$this->limiter->expects( $this->exactly( 5 ) )
			->method( 'should_abort' )
			->with( $initiator_stamp )
			->willReturnOnConsecutiveCalls( false, false, false, false, false );

		$this->batch_query->expects( $this->once() )
			->method( 'is_complete' )
			->willReturn( false );

		$this->batch_query->expects( $this->once() )
			->method( 'get_pending_ids' )
			->willReturn( $pending_ids );

		$this->batch_query->expects( $this->exactly( count( $pending_ids ) ) )
			->method( 'increment_attempt' )
			->withConsecutive( array( $pending_ids[0] ), array( $pending_ids[1] ) );

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_worker' )
			->with(
				'batch-follow-up',
				Email_Reporting_Settings::FREQUENCY_WEEKLY,
				$initiator_stamp,
				$this->callback(
					function ( $delay ) use ( $initiator_stamp, &$captured_delay, $expected_delay ) {
						$captured_delay = $delay;
						return $delay >= $expected_delay;
					}
				)
			);

		$task->handle_callback_action( 'batch-follow-up', Email_Reporting_Settings::FREQUENCY_WEEKLY, $initiator_stamp );

		$this->assertNotNull( $captured_delay, 'Follow-up delay should be captured for assertion.' );
	}

	public function test_increments_attempts_for_pending_posts() {
		$this->register_email_log_dependencies();

		$real_query = new Email_Log_Batch_Query();
		$limiter    = $this->createMock( Max_Execution_Limiter::class );
		$limiter->method( 'should_abort' )->willReturn( false );

		$task = new Worker_Task( $limiter, $real_query, $this->scheduler );

		$batch_id       = 'batch-real';
		$scheduled_id   = $this->create_log_post( $batch_id, Email_Log::STATUS_SCHEDULED, 0 );
		$retry_failed   = $this->create_log_post( $batch_id, Email_Log::STATUS_FAILED, 2 );
		$max_failed     = $this->create_log_post( $batch_id, Email_Log::STATUS_FAILED, Email_Log_Batch_Query::MAX_ATTEMPTS );
		$completed_sent = $this->create_log_post( $batch_id, Email_Log::STATUS_SENT, 1 );

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_worker' )
			->with(
				$batch_id,
				Email_Reporting_Settings::FREQUENCY_WEEKLY,
				$this->isType( 'int' ),
				$this->greaterThanOrEqual( 11 * MINUTE_IN_SECONDS )
			);

		$task->handle_callback_action( $batch_id, Email_Reporting_Settings::FREQUENCY_WEEKLY, time() );

		$this->assertSame( 1, (int) get_post_meta( $scheduled_id, Email_Log::META_SEND_ATTEMPTS, true ), 'Scheduled post attempts should increment.' );
		$this->assertSame( 3, (int) get_post_meta( $retry_failed, Email_Log::META_SEND_ATTEMPTS, true ), 'Retriable failed post attempts should increment.' );
		$this->assertSame( Email_Log_Batch_Query::MAX_ATTEMPTS, (int) get_post_meta( $max_failed, Email_Log::META_SEND_ATTEMPTS, true ), 'Posts at max attempts should not change.' );
		$this->assertSame( 1, (int) get_post_meta( $completed_sent, Email_Log::META_SEND_ATTEMPTS, true ), 'Completed posts should remain untouched.' );
	}

	private function create_log_post( $batch_id, $status, $attempts ) {
		$post_id = wp_insert_post(
			array(
				'post_type'   => Email_Log::POST_TYPE,
				'post_status' => $status,
				'post_title'  => 'Worker Log ' . uniqid(),
				'meta_input'  => array(
					Email_Log::META_BATCH_ID         => $batch_id,
					Email_Log::META_REPORT_FREQUENCY => Email_Reporting_Settings::FREQUENCY_WEEKLY,
					Email_Log::META_SEND_ATTEMPTS    => $attempts,
				),
			)
		);

		$this->created_post_ids[] = $post_id;

		return $post_id;
	}

	private function register_email_log_dependencies() {
		if ( post_type_exists( Email_Log::POST_TYPE ) ) {
			return;
		}

		$email_log       = new Email_Log( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$register_method = new \ReflectionMethod( Email_Log::class, 'register_email_log' );
		$register_method->setAccessible( true );
		$register_method->invoke( $email_log );
	}
}
