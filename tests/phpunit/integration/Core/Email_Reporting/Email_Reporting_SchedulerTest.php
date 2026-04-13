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
			$scheduled = $this->scheduler->get_initiator_timestamp_for_frequency( $frequency );
			$this->assertNotFalse( $scheduled, 'Expected initiator event to be scheduled for frequency "' . $frequency . '".' );
			$this->assertLessThanOrEqual( $before + $offset + 2, $scheduled, 'Initiator for frequency "' . $frequency . '" should not exceed expected offset.' );
			$this->assertGreaterThanOrEqual( $before + $offset, $scheduled, 'Initiator for frequency "' . $frequency . '" should meet minimum offset.' );

			$this->assertNotFalse(
				wp_get_scheduled_event( Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency, $scheduled ), $scheduled ),
				'Expected initiator event args to include frequency and scheduled timestamp.'
			);
		}
	}

	public function test_schedule_initiator_once_is_idempotent() {
		$frequency = Email_Reporting_Settings::FREQUENCY_WEEKLY;

		$this->scheduler->schedule_initiator_once( $frequency );
		$first = $this->scheduler->get_initiator_timestamp_for_frequency( $frequency );

		$this->scheduler->schedule_initiator_once( $frequency );
		$second = $this->scheduler->get_initiator_timestamp_for_frequency( $frequency );

		$this->assertSame( $first, $second, 'Scheduling initiator twice should not change the event timestamp for frequency "' . $frequency . '".' );
		$this->assertCount( 1, $this->get_initiator_events_for_frequency( $frequency ), 'Scheduling initiator twice should not create duplicate events.' );
	}

	public function test_schedule_initiator_once_reconciles_mismatched_timestamp() {
		$frequency             = Email_Reporting_Settings::FREQUENCY_WEEKLY;
		$existing_timestamp    = time() + 5_000;
		$expected_minimum_next = time() + $this->offsets[ $frequency ];

		wp_schedule_single_event( $existing_timestamp, Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency, $existing_timestamp ) );

		$this->scheduler->schedule_initiator_once( $frequency );

		$scheduled_timestamp = $this->scheduler->get_initiator_timestamp_for_frequency( $frequency );
		$events              = $this->get_initiator_events_for_frequency( $frequency );

		$this->assertCount( 1, $events, 'Mismatched frequency initiator should be replaced with one canonical event.' );
		$this->assertNotSame( $existing_timestamp, $scheduled_timestamp, 'Existing mismatched frequency initiator should be replaced.' );
		$this->assertGreaterThanOrEqual( $expected_minimum_next, $scheduled_timestamp, 'Reconciled initiator should use current planner timestamp.' );
		$this->assertSame( array( $frequency, $scheduled_timestamp ), $events[0]['args'], 'Reconciled initiator should use canonical args.' );
	}

	public function test_schedule_initiator_once_dedupes_multiple_events_for_frequency() {
		$frequency = Email_Reporting_Settings::FREQUENCY_MONTHLY;
		$first     = time() + 1_000;
		$second    = time() + 2_000;

		wp_schedule_single_event( $first, Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency, $first ) );
		wp_schedule_single_event( $second, Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency, $second ) );

		$this->scheduler->schedule_initiator_once( $frequency );

		$events = $this->get_initiator_events_for_frequency( $frequency );

		$this->assertCount( 1, $events, 'Multiple frequency initiators should be deduplicated into one canonical event.' );
		$this->assertSame(
			array( $frequency, $events[0]['timestamp'] ),
			$events[0]['args'],
			'Deduplicated frequency initiator should keep canonical args.'
		);
	}

	public function test_get_initiator_timestamp_matches_frequency_with_noncanonical_args() {
		$frequency          = Email_Reporting_Settings::FREQUENCY_QUARTERLY;
		$noncanonical_first = time() + 1_000;
		$noncanonical_next  = $noncanonical_first + 100;

		wp_schedule_single_event( $noncanonical_next, Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency, $noncanonical_next, 'extra' ) );
		wp_schedule_single_event( $noncanonical_first, Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency ) );

		$this->assertSame(
			$noncanonical_first,
			$this->scheduler->get_initiator_timestamp_for_frequency( $frequency ),
			'Frequency initiator lookup should match by first argument and return earliest timestamp regardless of args shape.'
		);
	}

	public function test_schedule_initiator_once_keeps_due_event_for_execution() {
		$frequency     = Email_Reporting_Settings::FREQUENCY_WEEKLY;
		$due_timestamp = time() - 60;

		wp_schedule_single_event( $due_timestamp, Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency, $due_timestamp ) );

		$this->scheduler->schedule_initiator_once( $frequency );

		$events = $this->get_initiator_events_for_frequency( $frequency );

		$this->assertCount( 1, $events, 'Due initiator should not be replaced before it gets a chance to run.' );
		$this->assertSame( $due_timestamp, $events[0]['timestamp'], 'Due initiator timestamp should remain unchanged.' );
		$this->assertSame( array( $frequency, $due_timestamp ), $events[0]['args'], 'Due initiator args should remain unchanged.' );
	}

	public function test_schedule_next_initiator_always_schedules_new_event() {
		$frequency = Email_Reporting_Settings::FREQUENCY_MONTHLY;
		$base      = 1_700_000_000;
		$expected  = $base + $this->offsets[ $frequency ];

		$this->scheduler->schedule_next_initiator( $frequency, $base );

		$this->assertNotFalse(
			wp_get_scheduled_event( Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency, $expected ), $expected ),
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
		$batch_id  = 'batch-fallback';
		$frequency = Email_Reporting_Settings::FREQUENCY_QUARTERLY;
		$timestamp = 1_700_001_000;

		$this->scheduler->schedule_fallback( $batch_id, $frequency, $timestamp );
		$first = wp_next_scheduled( Email_Reporting_Scheduler::ACTION_FALLBACK, array( $batch_id, $frequency, $timestamp ) );

		$this->scheduler->schedule_fallback( $batch_id, $frequency, $timestamp );
		$second = wp_next_scheduled( Email_Reporting_Scheduler::ACTION_FALLBACK, array( $batch_id, $frequency, $timestamp ) );

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
		$this->scheduler->schedule_fallback( 'batch', Email_Reporting_Settings::FREQUENCY_WEEKLY, $fallback_timestamp );
		$this->scheduler->schedule_monitor();

		$this->scheduler->unschedule_all();

		$this->assertFalse( $this->scheduler->get_initiator_timestamp_for_frequency( Email_Reporting_Settings::FREQUENCY_WEEKLY ), 'Initiator hook should be unscheduled for weekly frequency.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_WORKER, array( 'batch', Email_Reporting_Settings::FREQUENCY_WEEKLY, $worker_timestamp ) ), 'Worker hook should be unscheduled for batch "batch".' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_FALLBACK, array( 'batch', Email_Reporting_Settings::FREQUENCY_WEEKLY, $fallback_timestamp ) ), 'Fallback hook should be unscheduled for weekly frequency.' );
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

	/**
	 * Gets all initiator events for a frequency from the cron array.
	 *
	 * @param string $frequency Frequency slug.
	 * @return array
	 */
	private function get_initiator_events_for_frequency( $frequency ) {
		$cron = _get_cron_array();

		if ( ! is_array( $cron ) ) {
			return array();
		}

		$events = array();

		foreach ( $cron as $timestamp => $hooks ) {
			if ( empty( $hooks[ Email_Reporting_Scheduler::ACTION_INITIATOR ] ) || ! is_array( $hooks[ Email_Reporting_Scheduler::ACTION_INITIATOR ] ) ) {
				continue;
			}

			foreach ( $hooks[ Email_Reporting_Scheduler::ACTION_INITIATOR ] as $event ) {
				if ( empty( $event['args'][0] ) || $frequency !== $event['args'][0] ) {
					continue;
				}

				$events[] = array(
					'timestamp' => (int) $timestamp,
					'args'      => $event['args'],
				);
			}
		}

		return $events;
	}
}
