<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Email_Reporting_SchedulerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use DateTimeZone;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Scheduler;
use Google\Site_Kit\Core\Email_Reporting\Frequency_Planner;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;

class Email_Reporting_SchedulerTest extends TestCase {

	/**
	 * @var Email_Reporting_Scheduler
	 */
	private $scheduler;

	/**
	 * @var Frequency_Planner
	 */
	private $frequency_planner;

	private $offsets = array(
		Email_Reporting_Settings::FREQUENCY_WEEKLY    => 100,
		Email_Reporting_Settings::FREQUENCY_MONTHLY   => 200,
		Email_Reporting_Settings::FREQUENCY_QUARTERLY => 300,
	);

	public function set_up() {
		parent::set_up();

		$this->remove_monthly_schedule_filter();
		$this->frequency_planner = new class( $this->offsets ) extends Frequency_Planner {

			private $offsets;

			public function __construct( array $offsets ) {
				$this->offsets = $offsets;
			}

			public function next_occurrence( $frequency, $timestamp, DateTimeZone $time_zone ) {
				return $timestamp + $this->offsets[ $frequency ];
			}
		};
		$this->scheduler         = new Email_Reporting_Scheduler( $this->frequency_planner );

		$this->clear_scheduled_events();
	}

	public function tear_down() {
		$this->clear_scheduled_events();
		$this->remove_monthly_schedule_filter();
		parent::tear_down();
	}

	public function test_register_adds_monthly_schedule_filter() {
		$this->assertFalse( has_filter( 'cron_schedules', array( Email_Reporting_Scheduler::class, 'register_monthly_schedule' ) ), 'Monthly schedule filter should not be added.' );

		$this->scheduler->register();

		$this->assertNotFalse( has_filter( 'cron_schedules', array( Email_Reporting_Scheduler::class, 'register_monthly_schedule' ) ), 'Monthly schedule filter should be added.' );
	}

	public function test_schedule_initiator_events_schedules_each_frequency_once() {
		$before = time();
		$this->scheduler->schedule_initiator_events();

		foreach ( $this->offsets as $frequency => $offset ) {
			$scheduled = wp_next_scheduled( Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency ) );
			$this->assertNotFalse( $scheduled, 'Expected initiator event to be scheduled for frequency "' . $frequency . '".' );
			$this->assertLessThanOrEqual( $before + $offset + 2, $scheduled, 'Initiator for frequency "' . $frequency . '" should not exceed expected offset.' );
			$this->assertGreaterThanOrEqual( $before + $offset, $scheduled, 'Initiator for frequency "' . $frequency . '" should meet minimum offset.' );
		}
	}

	public function test_schedule_initiator_once_is_idempotent() {
		$frequency = Email_Reporting_Settings::FREQUENCY_WEEKLY;

		$this->scheduler->schedule_initiator_once( $frequency );
		$first = wp_next_scheduled( Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency ) );

		$this->scheduler->schedule_initiator_once( $frequency );
		$second = wp_next_scheduled( Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency ) );

		$this->assertSame( $first, $second, 'Scheduling initiator twice should not change the event timestamp for frequency "' . $frequency . '".' );
	}

	public function test_schedule_next_initiator_always_schedules_new_event() {
		$frequency = Email_Reporting_Settings::FREQUENCY_MONTHLY;
		$base      = 1_700_000_000;
		$expected  = $base + $this->offsets[ $frequency ];

		$this->scheduler->schedule_next_initiator( $frequency, $base );

		$this->assertNotFalse(
			wp_get_scheduled_event( Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency ), $expected ),
			'Expected initiator event for frequency "' . $frequency . '" to exist at the calculated timestamp.'
		);
	}

	public function test_schedule_worker_prevents_duplicates() {
		$batch_id  = 'batch-id';
		$frequency = Email_Reporting_Settings::FREQUENCY_WEEKLY;
		$timestamp = 1_700_000_500;

		$this->scheduler->schedule_worker( $batch_id, $frequency, $timestamp );
		$first = wp_next_scheduled( Email_Reporting_Scheduler::ACTION_WORKER, array( $batch_id, $frequency, $timestamp ) );

		$this->scheduler->schedule_worker( $batch_id, $frequency, $timestamp );
		$second = wp_next_scheduled( Email_Reporting_Scheduler::ACTION_WORKER, array( $batch_id, $frequency, $timestamp ) );

		$this->assertSame( $timestamp + MINUTE_IN_SECONDS, $first, 'Worker should schedule exactly one minute after timestamp for batch "' . $batch_id . '".' );
		$this->assertSame( $first, $second, 'Scheduling the same worker twice should reuse the original timestamp for batch "' . $batch_id . '".' );
	}

	public function test_schedule_fallback_prevents_duplicates() {
		$frequency = Email_Reporting_Settings::FREQUENCY_QUARTERLY;
		$timestamp = 1_700_001_000;

		$this->scheduler->schedule_fallback( $frequency, $timestamp );
		$first = wp_next_scheduled( Email_Reporting_Scheduler::ACTION_FALLBACK, array( $frequency ) );

		$this->scheduler->schedule_fallback( $frequency, $timestamp );
		$second = wp_next_scheduled( Email_Reporting_Scheduler::ACTION_FALLBACK, array( $frequency ) );

		$this->assertSame( $timestamp + HOUR_IN_SECONDS, $first, 'Fallback should schedule exactly one hour after timestamp for frequency "' . $frequency . '".' );
		$this->assertSame( $first, $second, 'Scheduling the same fallback twice should reuse the original timestamp for frequency "' . $frequency . '".' );
	}

	public function test_schedule_monitor_registers_daily_event_once() {
		$before = time();

		$this->scheduler->schedule_monitor();
		$event = wp_get_scheduled_event( Email_Reporting_Scheduler::ACTION_MONITOR );

		$this->assertNotFalse( $event, 'Monitor event should be created on first call.' );
		$this->assertSame( 'daily', $event->schedule, 'Monitor event should recur daily.' );
		$this->assertGreaterThanOrEqual( $before, $event->timestamp, 'Monitor event should run no earlier than the scheduling time.' );

		$this->scheduler->schedule_monitor();
		$this->assertSame(
			$event->timestamp,
			wp_next_scheduled( Email_Reporting_Scheduler::ACTION_MONITOR ),
			'Monitor scheduling should be idempotent.'
		);
	}

	public function test_schedule_cleanup_schedules_monthly_event() {
		$before = time();
		$this->scheduler->register();

		$this->scheduler->schedule_cleanup();

		$scheduled = wp_next_scheduled( Email_Reporting_Scheduler::ACTION_CLEANUP );

		$this->assertNotFalse( $scheduled, 'Cleanup event should be scheduled.' );
		$this->assertGreaterThanOrEqual( $before, $scheduled, 'Cleanup event should not be scheduled in the past.' );
		$this->assertLessThanOrEqual( $before + 2, $scheduled, 'Cleanup event should run immediately on first schedule.' );

		$this->scheduler->schedule_cleanup();

		$this->assertSame( $scheduled, wp_next_scheduled( Email_Reporting_Scheduler::ACTION_CLEANUP ), 'Cleanup scheduling should be idempotent.' );
	}

	public function test_unschedule_all_clears_events() {
		$this->scheduler->schedule_initiator_once( Email_Reporting_Settings::FREQUENCY_WEEKLY );
		$worker_timestamp   = time();
		$fallback_timestamp = time();

		$this->scheduler->schedule_worker( 'batch', Email_Reporting_Settings::FREQUENCY_WEEKLY, $worker_timestamp );
		$this->scheduler->schedule_fallback( Email_Reporting_Settings::FREQUENCY_WEEKLY, $fallback_timestamp );
		$this->scheduler->schedule_monitor();

		$this->scheduler->unschedule_all();

		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_INITIATOR, array( Email_Reporting_Settings::FREQUENCY_WEEKLY ) ), 'Initiator hook should be unscheduled for weekly frequency.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_WORKER, array( 'batch', Email_Reporting_Settings::FREQUENCY_WEEKLY, $worker_timestamp ) ), 'Worker hook should be unscheduled for batch "batch".' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_FALLBACK, array( Email_Reporting_Settings::FREQUENCY_WEEKLY ) ), 'Fallback hook should be unscheduled for weekly frequency.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_CLEANUP ), 'Cleanup hook should be unscheduled.' );
	}

	private function clear_scheduled_events() {
		foreach ( array( Email_Reporting_Scheduler::ACTION_INITIATOR, Email_Reporting_Scheduler::ACTION_WORKER, Email_Reporting_Scheduler::ACTION_FALLBACK, Email_Reporting_Scheduler::ACTION_MONITOR, Email_Reporting_Scheduler::ACTION_CLEANUP ) as $hook ) {
			wp_unschedule_hook( $hook );
		}
	}

	private function remove_monthly_schedule_filter() {
		remove_filter( 'cron_schedules', array( Email_Reporting_Scheduler::class, 'register_monthly_schedule' ) );
	}
}
