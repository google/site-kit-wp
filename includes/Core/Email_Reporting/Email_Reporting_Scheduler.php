<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Scheduler
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;

/**
 * Schedules cron events related to email reporting.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Email_Reporting_Scheduler {

	const ACTION_INITIATOR = 'googlesitekit_email_reporting_initiator';
	const ACTION_WORKER    = 'googlesitekit_email_reporting_worker';
	const ACTION_FALLBACK  = 'googlesitekit_email_reporting_fallback';
	const ACTION_MONITOR   = 'googlesitekit_email_reporting_monitor';
	const ACTION_CLEANUP   = 'googlesitekit_email_reporting_cleanup';

	/**
	 * Frequency planner instance.
	 *
	 * @var Frequency_Planner
	 */
	private $frequency_planner;

	/**
	 * Constructor.
	 *
	 * @since 1.167.0
	 *
	 * @param Frequency_Planner $frequency_planner Frequency planner instance.
	 */
	public function __construct( Frequency_Planner $frequency_planner ) {
		$this->frequency_planner = $frequency_planner;
	}

	/**
	 * Registers WordPress hooks.
	 *
	 * @since 1.167.0
	 */
	public function register() {
		add_filter( 'cron_schedules', array( __CLASS__, 'register_monthly_schedule' ) );
	}

	/**
	 * Ensures an initiator event exists for each frequency.
	 *
	 * @since 1.167.0
	 */
	public function schedule_initiator_events() {
		foreach ( array( Email_Reporting_Settings::FREQUENCY_WEEKLY, Email_Reporting_Settings::FREQUENCY_MONTHLY, Email_Reporting_Settings::FREQUENCY_QUARTERLY ) as $frequency ) {
			$this->schedule_initiator_once( $frequency );
		}
	}

	/**
	 * Reconciles and schedules a canonical initiator for a frequency.
	 *
	 * @since 1.167.0
	 *
	 * @param string $frequency Frequency slug.
	 */
	public function schedule_initiator_once( $frequency ) {
		$now    = time();
		$next   = $this->frequency_planner->next_occurrence( $frequency, $now, BC_Functions::wp_timezone() );
		$events = $this->get_initiator_events_for_frequency( $frequency );

		if ( $this->has_initiator_event_that_is_due_or_overdue( $events, $now ) ) {
			return;
		}

		if ( $this->has_single_expected_initiator_event( $events, $frequency, $next ) ) {
			return;
		}

		$this->unschedule_initiator_events_for_frequency( $frequency );

		wp_schedule_single_event( $next, self::ACTION_INITIATOR, array( $frequency, $next ) );
	}

	/**
	 * Explicitly schedules the next initiator event for a frequency.
	 *
	 * @since 1.167.0
	 *
	 * @param string $frequency Frequency slug.
	 * @param int    $timestamp Base timestamp used to calculate the next run.
	 */
	public function schedule_next_initiator( $frequency, $timestamp ) {
		$next = $this->frequency_planner->next_occurrence( $frequency, $timestamp, BC_Functions::wp_timezone() );

		wp_schedule_single_event( $next, self::ACTION_INITIATOR, array( $frequency, $next ) );
	}

	/**
	 * Checks whether an initiator event exists for the provided frequency.
	 *
	 * @since 1.176.0
	 *
	 * @param string $frequency Frequency slug.
	 * @return bool Whether an initiator event is already scheduled for this frequency.
	 */
	public function is_initiator_scheduled( $frequency ) {
		return false !== $this->get_initiator_timestamp_for_frequency( $frequency );
	}

	/**
	 * Gets the timestamp of the next initiator event for a frequency.
	 *
	 * @since 1.177.0
	 *
	 * @param string $frequency Frequency slug.
	 * @return int|false Timestamp if found, otherwise false.
	 */
	public function get_initiator_timestamp_for_frequency( $frequency ) {
		$events = $this->get_initiator_events_for_frequency( $frequency );

		if ( empty( $events ) ) {
			return false;
		}

		$timestamps = array_map(
			function ( $event ) {
				return $event['timestamp'];
			},
			$events
		);

		// If duplicate initiators exist, treat the nearest one as "next run".
		return min( $timestamps );
	}

	/**
	 * Gets all initiator events for the provided frequency.
	 *
	 * We intentionally scan cron entries instead of using `wp_next_scheduled()`
	 * because initiators are scheduled with dynamic args:
	 * `[ $frequency, $scheduled_timestamp ]`. `wp_next_scheduled()` requires an
	 * exact args match, but here we need to discover all initiators for a
	 * frequency regardless of argument length/shape.
	 *
	 * @since 1.177.0
	 *
	 * @param string $frequency Frequency slug.
	 * @return array<array{timestamp:int,args:array}> Matched initiator events.
	 */
	private function get_initiator_events_for_frequency( $frequency ) {
		// Private function is used here but there are tests covering this
		// method in case it changes.
		//
		// See: https://developer.wordpress.org/reference/functions/_get_cron_array/ and https://github.com/google/site-kit-wp/pull/12303#discussion_r2949495702.
		$cron = _get_cron_array();

		if ( ! is_array( $cron ) ) {
			return array();
		}

		$events = array();

		foreach ( $cron as $timestamp => $hooks ) {
			if ( empty( $hooks[ self::ACTION_INITIATOR ] ) || ! is_array( $hooks[ self::ACTION_INITIATOR ] ) ) {
				continue;
			}

			foreach ( $hooks[ self::ACTION_INITIATOR ] as $event ) {
				$args = isset( $event['args'] ) && is_array( $event['args'] )
					? $event['args']
					: array();

				if ( isset( $args[0] ) && $frequency === $args[0] ) {
					$events[] = array(
						'timestamp' => (int) $timestamp,
						'args'      => $args,
					);
				}
			}
		}

		return $events;
	}

	/**
	 * Unschedules all initiator events for the provided frequency.
	 *
	 * @since 1.177.0
	 *
	 * @param string $frequency Frequency slug.
	 */
	private function unschedule_initiator_events_for_frequency( $frequency ) {
		foreach ( $this->get_initiator_events_for_frequency( $frequency ) as $event ) {
			wp_unschedule_event( $event['timestamp'], self::ACTION_INITIATOR, $event['args'] );
		}
	}

	/**
	 * Checks for due/overdue events that are not yet reconciled; if this is
	 * `true` then cron can execute these events.
	 *
	 * @since 1.177.0
	 *
	 * @param array $events Matched initiator events.
	 * @param int   $now Current unix timestamp.
	 * @return bool True if any event is due/overdue.
	 */
	private function has_initiator_event_that_is_due_or_overdue( $events, $now ) {
		foreach ( $events as $event ) {
			if ( $event['timestamp'] <= $now ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Checks whether the event list already contains exactly one canonical event.
	 *
	 * Canonical means expected timestamp and canonical args shape.
	 *
	 * @since 1.177.0
	 *
	 * @param array  $events    Matched initiator events.
	 * @param string $frequency Frequency slug.
	 * @param int    $next      Expected next run timestamp.
	 * @return bool True if a canonical event already exists.
	 */
	private function has_single_expected_initiator_event( $events, $frequency, $next ) {
		if ( 1 !== count( $events ) ) {
			return false;
		}

		return $next === $events[0]['timestamp'] && array( $frequency, $next ) === $events[0]['args'];
	}

	/**
	 * Schedules a worker event if one with the same arguments is not already queued.
	 *
	 * @since 1.167.0
	 *
	 * @param string $batch_id  Batch identifier.
	 * @param string $frequency Frequency slug.
	 * @param int    $timestamp Base timestamp for the batch.
	 * @param int    $delay     Delay in seconds before the worker runs.
	 */
	public function schedule_worker( $batch_id, $frequency, $timestamp, $delay = MINUTE_IN_SECONDS ) {
		$args = array( $batch_id, $frequency, $timestamp );

		if ( wp_next_scheduled( self::ACTION_WORKER, $args ) ) {
			return;
		}

		wp_schedule_single_event( $timestamp + $delay, self::ACTION_WORKER, $args );
	}

	/**
	 * Schedules a fallback event for the given batch if one is not already queued.
	 *
	 * @since 1.167.0
	 *
	 * @param string $batch_id  Batch identifier.
	 * @param string $frequency Frequency slug.
	 * @param int    $timestamp Base timestamp for the batch.
	 * @param int    $delay     Delay in seconds before fallback runs.
	 */
	public function schedule_fallback( $batch_id, $frequency, $timestamp, $delay = HOUR_IN_SECONDS ) {
		$args = array( $batch_id, $frequency, $timestamp );

		if ( wp_next_scheduled( self::ACTION_FALLBACK, $args ) ) {
			return;
		}

		wp_schedule_single_event( $timestamp + $delay, self::ACTION_FALLBACK, $args );
	}

	/**
	 * Ensures the monitor event is scheduled daily.
	 *
	 * @since 1.167.0
	 */
	public function schedule_monitor() {
		if ( wp_next_scheduled( self::ACTION_MONITOR ) ) {
			return;
		}

		wp_schedule_event( time(), 'daily', self::ACTION_MONITOR );
	}

	/**
	 * Ensures a recurring cleanup event exists.
	 *
	 * @since 1.167.0
	 */
	public function schedule_cleanup() {
		if ( wp_next_scheduled( self::ACTION_CLEANUP ) ) {
			return;
		}

		wp_schedule_event( time(), 'monthly', self::ACTION_CLEANUP );
	}

	/**
	 * Schedules subscription confirmation delivery via existing worker and fallback pipeline.
	 *
	 * @since 1.174.0
	 *
	 * @param int   $user_id           User ID.
	 * @param array $previous_settings Previous settings.
	 * @param array $updated_settings  Updated settings.
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public function schedule_email_confirmation( $user_id, array $previous_settings, array $updated_settings ) {
		$task  = new Subscription_Confirmation_Task( $this->frequency_planner );
		$batch = $task->maybe_schedule(
			$user_id,
			$previous_settings,
			$updated_settings
		);

		if ( false === $batch ) {
			return true;
		}

		if ( is_wp_error( $batch ) ) {
			return $batch;
		}

		if ( empty( $batch['batch_id'] ) || empty( $batch['frequency'] ) || ! isset( $batch['timestamp'] ) ) {
			return new \WP_Error(
				'email_reporting_invalid_confirmation_batch',
				__( 'Subscription confirmation batch payload is invalid.', 'google-site-kit' ),
				array( 'status' => 500 )
			);
		}

		$batch_id  = (string) $batch['batch_id'];
		$frequency = (string) $batch['frequency'];
		$timestamp = (int) $batch['timestamp'];

		$this->schedule_worker( $batch_id, $frequency, $timestamp, 0 );
		$this->schedule_fallback( $batch_id, $frequency, $timestamp, 0 );

		return true;
	}

	/**
	 * Unschedules all email reporting related events.
	 *
	 * @since 1.167.0
	 */
	public function unschedule_all() {
		foreach ( array( self::ACTION_INITIATOR, self::ACTION_WORKER, self::ACTION_FALLBACK, self::ACTION_MONITOR, self::ACTION_CLEANUP ) as $hook ) {
			wp_unschedule_hook( $hook );
		}
	}

	/**
	 * Registers a monthly cron schedule if one does not exist.
	 *
	 * @since 1.167.0
	 *
	 * @param array $schedules Existing schedules.
	 * @return array Modified schedules including a monthly interval.
	 */
	public static function register_monthly_schedule( $schedules ) {
		if ( isset( $schedules['monthly'] ) ) {
			return $schedules;
		}

		$schedules['monthly'] = array(
			'interval' => MONTH_IN_SECONDS,
			'display'  => __( 'Once Monthly', 'google-site-kit' ),
		);

		return $schedules;
	}
}
