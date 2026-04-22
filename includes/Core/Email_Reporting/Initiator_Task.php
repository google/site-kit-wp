<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Initiator_Task
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use DateInterval;
use DateTimeImmutable;
use InvalidArgumentException;
use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use Google\Site_Kit\Core\Util\Date;

/**
 * Handles initiator cron callbacks for email reporting.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Initiator_Task {

	/**
	 * Scheduler instance.
	 *
	 * @var Email_Reporting_Scheduler
	 */
	private $scheduler;

	/**
	 * Query helper for subscribed users.
	 *
	 * @var Subscribed_Users_Query
	 */
	private $subscribed_users_query;

	/**
	 * Constructor.
	 *
	 * @since 1.167.0
	 *
	 * @param Email_Reporting_Scheduler $scheduler              Scheduler instance.
	 * @param Subscribed_Users_Query    $subscribed_users_query Subscribed users query helper.
	 */
	public function __construct( Email_Reporting_Scheduler $scheduler, Subscribed_Users_Query $subscribed_users_query ) {
		$this->scheduler              = $scheduler;
		$this->subscribed_users_query = $subscribed_users_query;
	}

	/**
	 * Handles the initiator cron callback.
	 *
	 * @since 1.167.0
	 *
	 * @param string   $frequency           Frequency slug.
	 * @param int|null $scheduled_timestamp Scheduled initiator timestamp.
	 */
	public function handle_callback_action( $frequency, $scheduled_timestamp = null ) {
		$timestamp = (int) $scheduled_timestamp;
		if ( $timestamp <= 0 ) {
			$timestamp = Date::now();
		}

		$this->scheduler->schedule_next_initiator( $frequency, $timestamp );

		$batch_id = wp_generate_uuid4();
		$user_ids = $this->subscribed_users_query->for_frequency( $frequency );

		$reference_dates = self::build_reference_dates( $frequency, $timestamp );

		foreach ( $user_ids as $user_id ) {
			wp_insert_post(
				array(
					'post_type'   => Email_Log::POST_TYPE,
					'post_author' => $user_id,
					'post_status' => Email_Log::STATUS_SCHEDULED,
					'post_title'  => $batch_id,
					'meta_input'  => array(
						Email_Log::META_BATCH_ID         => $batch_id,
						Email_Log::META_REPORT_FREQUENCY => $frequency,
						Email_Log::META_REPORT_REFERENCE_DATES => $reference_dates,
						Email_Log::META_SEND_ATTEMPTS    => 0,
						Email_Log::META_SITE_ID          => get_current_blog_id(),
						Email_Log::META_TEMPLATE_TYPE    => Email_Log::TEMPLATE_TYPE_EMAIL_REPORT,
					),
				)
			);
		}

		$this->scheduler->schedule_worker( $batch_id, $frequency, $timestamp );
		$this->scheduler->schedule_fallback( $batch_id, $frequency, $timestamp );
	}

	/**
	 * Builds the report reference dates for a batch.
	 *
	 * Resolves to the canonical previous period regardless of when the
	 * initiator fires. For example, a monthly trigger on the 7th still
	 * reports the full previous calendar month.
	 *
	 * @since 1.167.0
	 * @since 1.174.0 Made method static.
	 * @since 1.177.0 Switched to calendar-aware period resolution.
	 *
	 * @param string $frequency Frequency slug.
	 * @param int    $timestamp Base timestamp.
	 * @return array Reference date payload.
	 * @throws InvalidArgumentException When an unsupported frequency is provided.
	 */
	public static function build_reference_dates( $frequency, $timestamp ) {
		$time_zone = BC_Functions::wp_timezone();
		$date      = ( new DateTimeImmutable( '@' . $timestamp ) )
			->setTimezone( $time_zone )
			->setTime( 0, 0, 0 );

		switch ( $frequency ) {
			case Email_Reporting_Settings::FREQUENCY_MONTHLY:
				return self::build_monthly_reference_dates( $date );

			case Email_Reporting_Settings::FREQUENCY_QUARTERLY:
				return self::build_quarterly_reference_dates( $date );

			case Email_Reporting_Settings::FREQUENCY_WEEKLY:
				return self::build_weekly_reference_dates( $date );

			default:
				throw new InvalidArgumentException(
					sprintf( 'Unsupported frequency "%s".', $frequency )
				);
		}
	}

	/**
	 * Builds reference dates for a weekly reporting period.
	 *
	 * @since 1.177.0
	 *
	 * @param DateTimeImmutable $date Trigger date normalised to midnight.
	 * @return array Reference date payload.
	 */
	private static function build_weekly_reference_dates( DateTimeImmutable $date ) {
		$start_of_week = (int) get_option( 'start_of_week', 0 );
		$current_wday  = (int) $date->format( 'w' );

		// Days since the current week started.
		$days_into_week = ( $current_wday - $start_of_week + 7 ) % 7;

		// Start of the current week.
		$current_week_start = $date->sub( new DateInterval( sprintf( 'P%dD', $days_into_week ) ) );

		// Previous week: 7 days before current week start.
		$prev_week_start = $current_week_start->sub( new DateInterval( 'P7D' ) );
		$prev_week_end   = $current_week_start->sub( new DateInterval( 'P1D' ) );

		// Compare: the week before the previous week.
		$compare_start = $prev_week_start->sub( new DateInterval( 'P7D' ) );
		$compare_end   = $prev_week_start->sub( new DateInterval( 'P1D' ) );

		return array(
			'startDate'        => $prev_week_start->format( 'Y-m-d' ),
			'endDate'          => $prev_week_end->format( 'Y-m-d' ),
			'compareStartDate' => $compare_start->format( 'Y-m-d' ),
			'compareEndDate'   => $compare_end->format( 'Y-m-d' ),
		);
	}

	/**
	 * Builds reference dates for a monthly reporting period.
	 *
	 * @since 1.177.0
	 *
	 * @param DateTimeImmutable $date Trigger date normalised to midnight.
	 * @return array Reference date payload.
	 */
	private static function build_monthly_reference_dates( DateTimeImmutable $date ) {
		$first_of_current = $date->modify( 'first day of this month' );

		// Subtracting P1M from the 1st always lands on the 1st of the previous month.
		$prev_month_start = $first_of_current->sub( new DateInterval( 'P1M' ) );
		$prev_month_end   = $first_of_current->sub( new DateInterval( 'P1D' ) );

		// Compare: the month before the previous month (natural length).
		$compare_end   = $prev_month_start->sub( new DateInterval( 'P1D' ) );
		$compare_start = $compare_end->modify( 'first day of this month' );

		return array(
			'startDate'        => $prev_month_start->format( 'Y-m-d' ),
			'endDate'          => $prev_month_end->format( 'Y-m-d' ),
			'compareStartDate' => $compare_start->format( 'Y-m-d' ),
			'compareEndDate'   => $compare_end->format( 'Y-m-d' ),
		);
	}

	/**
	 * Builds reference dates for a quarterly reporting period.
	 *
	 * @since 1.177.0
	 *
	 * @param DateTimeImmutable $date Trigger date normalised to midnight.
	 * @return array Reference date payload.
	 */
	private static function build_quarterly_reference_dates( DateTimeImmutable $date ) {
		$month               = (int) $date->format( 'n' );
		$year                = (int) $date->format( 'Y' );
		$quarter_start_month = (int) ( floor( ( $month - 1 ) / 3 ) * 3 + 1 );

		// First day of the current quarter.
		$current_quarter_start = $date->setDate( $year, $quarter_start_month, 1 );

		// Previous quarter: go back 3 months from current quarter start.
		$prev_quarter_start = $current_quarter_start->sub( new DateInterval( 'P3M' ) );
		$prev_quarter_end   = $current_quarter_start->sub( new DateInterval( 'P1D' ) );

		// Compare: the quarter before the previous quarter (symmetric pattern).
		$compare_start = $prev_quarter_start->sub( new DateInterval( 'P3M' ) );
		$compare_end   = $prev_quarter_start->sub( new DateInterval( 'P1D' ) );

		return array(
			'startDate'        => $prev_quarter_start->format( 'Y-m-d' ),
			'endDate'          => $prev_quarter_end->format( 'Y-m-d' ),
			'compareStartDate' => $compare_start->format( 'Y-m-d' ),
			'compareEndDate'   => $compare_end->format( 'Y-m-d' ),
		);
	}
}
