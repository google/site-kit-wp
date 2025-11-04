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

/**
 * Schedules cron events related to email reporting.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Email_Reporting_Scheduler {

	const FREQUENCY_WEEKLY    = 'weekly';
	const FREQUENCY_MONTHLY   = 'monthly';
	const FREQUENCY_QUARTERLY = 'quarterly';

	const ACTION_INITIATOR = 'googlesitekit_email_reporting_initiator';
	const ACTION_WORKER    = 'googlesitekit_email_reporting_worker';
	const ACTION_FALLBACK  = 'googlesitekit_email_reporting_fallback';

	/**
	 * Frequency planner instance.
	 *
	 * @var Frequency_Planner
	 */
	private $frequency_planner;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Frequency_Planner $frequency_planner Frequency planner instance.
	 */
	public function __construct( Frequency_Planner $frequency_planner ) {
		$this->frequency_planner = $frequency_planner;
	}

	/**
	 * Ensures an initiator event exists for each frequency.
	 *
	 * @since n.e.x.t
	 */
	public function schedule_initiator_events() {
		foreach ( array( self::FREQUENCY_WEEKLY, self::FREQUENCY_MONTHLY, self::FREQUENCY_QUARTERLY ) as $frequency ) {
			$this->schedule_initiator_once( $frequency );
		}
	}

	/**
	 * Schedules the next initiator for a frequency if none exists.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $frequency Frequency slug.
	 */
	public function schedule_initiator_once( $frequency ) {
		if ( wp_next_scheduled( self::ACTION_INITIATOR, array( $frequency ) ) ) {
			return;
		}

		$next = $this->frequency_planner->next_occurrence( $frequency, time(), wp_timezone() );

		wp_schedule_single_event( $next, self::ACTION_INITIATOR, array( $frequency ) );
	}

	/**
	 * Explicitly schedules the next initiator event for a frequency.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $frequency Frequency slug.
	 * @param int    $timestamp Base timestamp used to calculate the next run.
	 */
	public function schedule_next_initiator( $frequency, $timestamp ) {
		$next = $this->frequency_planner->next_occurrence( $frequency, $timestamp, wp_timezone() );

		wp_schedule_single_event( $next, self::ACTION_INITIATOR, array( $frequency ) );
	}

	/**
	 * Schedules a worker event if one with the same arguments is not already queued.
	 *
	 * @since n.e.x.t
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
	 * Schedules a fallback event for the given frequency if one is not already queued.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $frequency Frequency slug.
	 * @param int    $timestamp Base timestamp for the batch.
	 * @param int    $delay     Delay in seconds before fallback runs.
	 */
	public function schedule_fallback( $frequency, $timestamp, $delay = HOUR_IN_SECONDS ) {
		if ( wp_next_scheduled( self::ACTION_FALLBACK, array( $frequency ) ) ) {
			return;
		}

		wp_schedule_single_event( $timestamp + $delay, self::ACTION_FALLBACK, array( $frequency ) );
	}

	/**
	 * Unschedules all email reporting related events.
	 *
	 * @since n.e.x.t
	 */
	public function unschedule_all() {
		foreach ( array( self::ACTION_INITIATOR, self::ACTION_WORKER, self::ACTION_FALLBACK ) as $hook ) {
			wp_unschedule_hook( $hook );
		}
	}
}
