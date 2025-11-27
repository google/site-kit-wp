<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Fallback_TaskTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Core\Email_Reporting\Email_Log_Batch_Query;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Scheduler;
use Google\Site_Kit\Core\Email_Reporting\Fallback_Task;
use Google\Site_Kit\Core\Email_Reporting\Worker_Task;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;

class Fallback_TaskTest extends TestCase {

	/**
	 * @var Email_Log_Batch_Query|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $batch_query;

	/**
	 * @var Email_Reporting_Scheduler|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $scheduler;

	/**
	 * @var Worker_Task|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $worker;

	public function set_up() {
		parent::set_up();

		$this->batch_query = $this->createMock( Email_Log_Batch_Query::class );
		$this->scheduler   = $this->createMock( Email_Reporting_Scheduler::class );
		$this->worker      = $this->createMock( Worker_Task::class );
	}

	public function tear_down() {
		delete_transient( 'googlesitekit_email_reporting_worker_lock_weekly' );
		delete_transient( 'googlesitekit_email_reporting_worker_lock_monthly' );
		delete_transient( 'googlesitekit_email_reporting_worker_lock_quarterly' );

		parent::tear_down();
	}

	public function test_reschedules_when_worker_is_locked() {
		$task                = new Fallback_Task( $this->batch_query, $this->scheduler, $this->worker );
		$frequency           = Email_Reporting_Settings::FREQUENCY_WEEKLY;
		$transient_name      = sprintf( 'googlesitekit_email_reporting_worker_lock_%s', $frequency );
		$batch_id            = 'batch-locked';
		$initiator_timestamp = time();

		set_transient( $transient_name, time(), MINUTE_IN_SECONDS );

		$this->batch_query->expects( $this->never() )->method( 'is_complete' );
		$this->worker->expects( $this->never() )->method( 'handle_callback_action' );

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_fallback' )
			->with(
				$this->equalTo( $batch_id ),
				$this->equalTo( $frequency ),
				$this->equalTo( $initiator_timestamp ),
				$this->callback(
					function ( $delay ) {
						return $delay >= 20 * MINUTE_IN_SECONDS;
					}
				)
			);

		$task->handle_fallback_action( $batch_id, $frequency, $initiator_timestamp );
	}

	public function test_bails_when_batch_is_complete() {
		$task                = new Fallback_Task( $this->batch_query, $this->scheduler, $this->worker );
		$batch_id            = 'batch-complete';
		$frequency           = Email_Reporting_Settings::FREQUENCY_MONTHLY;
		$initiator_timestamp = time();

		$this->batch_query->expects( $this->once() )
			->method( 'is_complete' )
			->with( $batch_id )
			->willReturn( true );

		$this->scheduler->expects( $this->never() )->method( 'schedule_fallback' );
		$this->worker->expects( $this->never() )->method( 'handle_callback_action' );

		$task->handle_fallback_action( $batch_id, $frequency, $initiator_timestamp );
	}

	public function test_reschedules_and_triggers_worker_when_incomplete() {
		$task                = new Fallback_Task( $this->batch_query, $this->scheduler, $this->worker );
		$batch_id            = 'batch-pending';
		$frequency           = Email_Reporting_Settings::FREQUENCY_QUARTERLY;
		$initiator_timestamp = time();
		$captured_delay      = null;

		$this->batch_query->expects( $this->once() )
			->method( 'is_complete' )
			->with( $batch_id )
			->willReturn( false );

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_fallback' )
			->with(
				$this->equalTo( $batch_id ),
				$this->equalTo( $frequency ),
				$this->equalTo( $initiator_timestamp ),
				$this->callback(
					function ( $delay ) use ( &$captured_delay ) {
						$captured_delay = $delay;
						return $delay >= HOUR_IN_SECONDS;
					}
				)
			);

		$this->worker->expects( $this->once() )
			->method( 'handle_callback_action' )
			->with( $batch_id, $frequency, $initiator_timestamp );

		$task->handle_fallback_action( $batch_id, $frequency, $initiator_timestamp );

		$this->assertNotNull( $captured_delay, 'Fallback delay should be captured for assertion.' );
	}
}
