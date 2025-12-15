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
	 * Schedules the next initiator for a frequency if none exists.
	 *
	 * @since 1.167.0
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
	 * @since 1.167.0
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
