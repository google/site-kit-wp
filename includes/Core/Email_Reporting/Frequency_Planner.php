<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Frequency_Planner
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use DateInterval;
use DateTimeImmutable;
use DateTimeZone;
use InvalidArgumentException;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;

/**
 * Calculates the next occurrence for email reporting schedules.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Frequency_Planner {

	/**
	 * Calculates the next run timestamp for a given frequency.
	 *
	 * @since 1.167.0
	 *
	 * @param string       $frequency Frequency to calculate for.
	 * @param int          $timestamp Base UNIX timestamp.
	 * @param DateTimeZone $time_zone Site timezone.
	 * @return int UNIX timestamp for the next run.
	 * @throws InvalidArgumentException When an unsupported frequency is provided.
	 */
	public function next_occurrence( $frequency, $timestamp, DateTimeZone $time_zone ) {
		switch ( $frequency ) {
			case Email_Reporting_Settings::FREQUENCY_WEEKLY:
				return $this->get_next_weekly_occurrence( $timestamp, $time_zone );

			case Email_Reporting_Settings::FREQUENCY_MONTHLY:
				return $this->get_next_monthly_occurrence( $timestamp, $time_zone );

			case Email_Reporting_Settings::FREQUENCY_QUARTERLY:
				return $this->get_next_quarterly_occurrence( $timestamp, $time_zone );
		}

		throw new InvalidArgumentException( sprintf( 'Unsupported frequency "%s".', $frequency ) );
	}

	/**
	 * Gets the next weekly occurrence honouring the site "week starts on" setting.
	 *
	 * @param int          $timestamp Current timestamp.
	 * @param DateTimeZone $time_zone Site timezone.
	 * @return int Next weekly occurrence timestamp.
	 */
	private function get_next_weekly_occurrence( $timestamp, DateTimeZone $time_zone ) {
		$start_of_week = (int) get_option( 'start_of_week', 0 );
		$current       = $this->immutable_from_timestamp( $timestamp, $time_zone );
		// Anchor scheduling to the very start of the calendar day.
		$day_start = $current->setTime( 0, 0, 0 );
		// ISO weekday index where Sunday=0 and Saturday=6, matching WordPress' start_of_week option.
		$current_wday = (int) $current->format( 'w' );

		// Figure out how many days to move forward to land on the configured week start.
		$days_until_target = ( $start_of_week - $current_wday + 7 ) % 7;
		// If today is already the target weekday but the time has passed, shift to the following week.
		if ( 0 === $days_until_target && $current >= $day_start ) {
			$days_until_target = 7;
		}

		$next = $day_start->add( new DateInterval( 'P' . $days_until_target . 'D' ) );

		return $next->getTimestamp();
	}

	/**
	 * Gets the next monthly occurrence (first day of next month at 00:00:00).
	 *
	 * @param int          $timestamp Current timestamp.
	 * @param DateTimeZone $time_zone Site timezone.
	 * @return int Next monthly occurrence timestamp.
	 */
	private function get_next_monthly_occurrence( $timestamp, DateTimeZone $time_zone ) {
		$current = $this->immutable_from_timestamp( $timestamp, $time_zone );

		$next_month = $current
			->setTime( 0, 0, 0 )
			->modify( 'first day of next month' );

		return $next_month->getTimestamp();
	}

	/**
	 * Gets the next quarterly occurrence (first day of the next quarter at 00:00:00).
	 *
	 * @param int          $timestamp Current timestamp.
	 * @param DateTimeZone $time_zone Site timezone.
	 * @return int Next quarterly occurrence timestamp.
	 */
	private function get_next_quarterly_occurrence( $timestamp, DateTimeZone $time_zone ) {
		$current = $this->immutable_from_timestamp( $timestamp, $time_zone )->setTime( 0, 0, 0 );
		// Calendar month number in the local timezone (January=1 … December=12).
		$current_month = (int) $current->format( 'n' );
		// Translate month into its offset within the quarter (0 => first month, 1 => second, 2 => third).
		$position      = ( ( $current_month - 1 ) % 3 );
		$months_to_add = 3 - $position;

		$next_quarter = $current->add( new DateInterval( 'P' . $months_to_add . 'M' ) );
		// After jumping to the quarter’s first month, land on day 1 at midnight.
		$next_quarter = $next_quarter->modify( 'first day of this month' );

		return $next_quarter->getTimestamp();
	}

	/**
	 * Creates a timezone-adjusted immutable date.
	 *
	 * @param int          $timestamp Base timestamp.
	 * @param DateTimeZone $time_zone Site timezone.
	 * @return DateTimeImmutable DateTimeImmutable instance.
	 */
	private function immutable_from_timestamp( $timestamp, DateTimeZone $time_zone ) {
		return ( new DateTimeImmutable( '@' . $timestamp ) )->setTimezone( $time_zone );
	}
}
