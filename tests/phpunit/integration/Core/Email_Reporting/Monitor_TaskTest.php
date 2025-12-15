<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Monitor_TaskTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Scheduler;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Settings;
use Google\Site_Kit\Core\Email_Reporting\Monitor_Task;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;

class Monitor_TaskTest extends TestCase {

	/**
	 * @var \PHPUnit_Framework_MockObject_MockObject|Email_Reporting_Scheduler
	 */
	private $scheduler;

	/**
	 * @var \PHPUnit_Framework_MockObject_MockObject|Email_Reporting_Settings
	 */
	private $settings;

	/**
	 * @var Monitor_Task
	 */
	private $task;

	public function set_up() {
		parent::set_up();

		$this->scheduler = $this->getMockBuilder( Email_Reporting_Scheduler::class )
			->disableOriginalConstructor()
			->setMethods( array( 'schedule_initiator_once' ) )
			->getMock();

		$this->settings = $this->getMockBuilder( Email_Reporting_Settings::class )
			->disableOriginalConstructor()
			->setMethods( array( 'is_email_reporting_enabled' ) )
			->getMock();

		$this->task = new Monitor_Task( $this->scheduler, $this->settings );

		$this->clear_scheduled_initiators();
	}

	public function tear_down() {
		$this->clear_scheduled_initiators();
		parent::tear_down();
	}

	public function test_handle_monitor_action_bails_when_disabled() {
		$this->settings->expects( $this->once() )
			->method( 'is_email_reporting_enabled' )
			->willReturn( false );

		$this->scheduler->expects( $this->never() )
			->method( 'schedule_initiator_once' );

		$this->task->handle_monitor_action();
	}

	public function test_handle_monitor_action_restores_missing_frequencies() {
		$this->settings->expects( $this->once() )
			->method( 'is_email_reporting_enabled' )
			->willReturn( true );

		wp_schedule_single_event( time() + HOUR_IN_SECONDS, Email_Reporting_Scheduler::ACTION_INITIATOR, array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY ) );
		wp_schedule_single_event( time() + HOUR_IN_SECONDS, Email_Reporting_Scheduler::ACTION_INITIATOR, array( User_Email_Reporting_Settings::FREQUENCY_MONTHLY ) );

		$this->scheduler->expects( $this->once() )
			->method( 'schedule_initiator_once' )
			->with( User_Email_Reporting_Settings::FREQUENCY_QUARTERLY );

		$this->task->handle_monitor_action();
	}

	private function clear_scheduled_initiators() {
		wp_unschedule_hook( Email_Reporting_Scheduler::ACTION_INITIATOR );
	}
}
