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
use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;

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
			$timestamp = time();
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
	 * @since 1.167.0
	 * @since 1.174.0 Made method static.
	 *
	 * @param string $frequency Frequency slug.
	 * @param int    $timestamp Base timestamp.
	 * @return array Reference date payload.
	 */
	public static function build_reference_dates( $frequency, $timestamp ) {
		$time_zone      = BC_Functions::wp_timezone();
		$scheduled_date = ( new DateTimeImmutable( '@' . $timestamp ) )
			->setTimezone( $time_zone )
			->setTime( 0, 0, 0 );
		// Initiators are scheduled at period-boundary midnight in site timezone.
		// The reporting window should end on "yesterday" (inclusive end date), so subtract one day.
		$send_date = $scheduled_date->sub( new DateInterval( 'P1D' ) );

		$period_days = 7;

		if ( Email_Reporting_Settings::FREQUENCY_MONTHLY === $frequency ) {
			$period_days = (int) $send_date->format( 't' );
		} elseif ( Email_Reporting_Settings::FREQUENCY_QUARTERLY === $frequency ) {
			$period_days = self::get_days_in_quarter( $send_date );
		}

		// endDate is inclusive, so startDate must be endDate - (period_days - 1) for an exact period-length window.
		$start_date         = $send_date->sub( new DateInterval( sprintf( 'P%dD', max( $period_days - 1, 0 ) ) ) );
		$compare_end_date   = $start_date->sub( new DateInterval( 'P1D' ) );
		$compare_start_date = $compare_end_date->sub(
			new DateInterval( sprintf( 'P%dD', max( $period_days - 1, 0 ) ) )
		);

		return array(
			'startDate'        => $start_date->format( 'Y-m-d' ),
			'endDate'          => $send_date->format( 'Y-m-d' ),
			'compareStartDate' => $compare_start_date->format( 'Y-m-d' ),
			'compareEndDate'   => $compare_end_date->format( 'Y-m-d' ),
		);
	}

	/**
	 * Gets the number of days in the quarter for a date.
	 *
	 * @since n.e.x.t
	 *
	 * @param DateTimeImmutable $date Date in the target quarter.
	 * @return int Days in the quarter.
	 */
	private static function get_days_in_quarter( DateTimeImmutable $date ) {
		$year                = (int) $date->format( 'Y' );
		$month               = (int) $date->format( 'n' );
		$quarter_start_month = floor( ( $month - 1 ) / 3 ) * 3 + 1;

		$quarter_start = $date->setDate( $year, $quarter_start_month, 1 );
		$quarter_end   = $quarter_start
			->add( new DateInterval( 'P3M' ) )
			->sub( new DateInterval( 'P1D' ) );

		return (int) $quarter_start->diff( $quarter_end )->days + 1;
	}
}
