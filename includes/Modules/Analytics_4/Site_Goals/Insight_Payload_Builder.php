<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Site_Goals\Insight_Payload_Builder
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Site_Goals
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Site_Goals;

use DateTimeImmutable;
use DateTimeZone;
use Exception;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;
use Google\Site_Kit\Core\Email_Reporting\Email_Report_Payload_Processor;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Report_Data_Processor;
use WP_Error;

/**
 * Builds the payload entry the Site Kit service writes a Site Goals insight from.
 *
 * The builder's reports use the options of the email report's Site Goals sections, so the
 * insight and the email count key actions the same way. The service caches each
 * insight by its payload, so the same data must always give the same entry.
 *
 * @since 1.192.0
 * @access private
 * @ignore
 */
class Insight_Payload_Builder {

	/**
	 * Days in each period the entry compares.
	 *
	 * @since 1.192.0
	 */
	const PERIOD_DAYS = 28;

	/**
	 * Days between a period and its year-ago period: 52 whole weeks, so each year-ago
	 * day falls on the same weekday.
	 *
	 * @since 1.192.0
	 */
	const YEAR_AGO_OFFSET_DAYS = 364;

	/**
	 * Analytics 4 module instance.
	 *
	 * @since 1.192.0
	 * @var Analytics_4
	 */
	private $analytics_4;

	/**
	 * Email_Report_Payload_Processor instance, which reads the rows of a report.
	 *
	 * @since 1.192.0
	 * @var Email_Report_Payload_Processor
	 */
	private $report_processor;

	/**
	 * Report_Data_Processor instance, which adds up a metric of the rows.
	 *
	 * @since 1.192.0
	 * @var Report_Data_Processor
	 */
	private $data_processor;

	/**
	 * Constructor.
	 *
	 * @since 1.192.0
	 *
	 * @param Analytics_4 $analytics_4 The Analytics 4 module instance, which runs the reports.
	 */
	public function __construct( Analytics_4 $analytics_4 ) {
		$this->analytics_4      = $analytics_4;
		$this->report_processor = new Email_Report_Payload_Processor();
		$this->data_processor   = new Report_Data_Processor();
	}

	/**
	 * Builds the payload entry of one Site Goals widget, or of one of its tabs.
	 *
	 * @since 1.192.0
	 *
	 * @param string $goal_type Goal type, `lead` or `ecommerce`.
	 * @param string $tab       Group the tab shows: a form ID for `lead`, an event provider
	 *                          for `ecommerce`, or an empty string for the whole widget.
	 * @param string $end_date  Last day of the current period, as `YYYY-MM-DD`.
	 * @return array|null|WP_Error {
	 *     The entry, or the error of the batch call. `null` when Analytics has found no event
	 *     of the goal type on the site, or when neither period has a conversion.
	 *
	 *     @type string $event_name               `generate_lead` for `lead`, and the primary store
	 *                                            event, `purchase` or `add_to_cart`, for `ecommerce`.
	 *     @type string $month_start_date         First day of the current period, as `YYYY-MM-DD`.
	 *     @type array  $current                  The `conversions`, `conversion_rate`, `sessions` and
	 *                                            `engagement_rate` of the 28 days that end on the end date.
	 *     @type array  $previous                 The same fields for the 28 days before them.
	 *     @type int    $yoy_current_conversions  Optional. Conversions of the current period, 364 days
	 *                                            earlier. Sent only for the whole widget, and only when the
	 *                                            property was created before 00:00 UTC on the first day of
	 *                                            the year-ago previous period.
	 *     @type int    $yoy_previous_conversions Optional. Conversions of the previous period, 364 days
	 *                                            earlier, sent with the other year-ago count.
	 * }
	 * @throws Exception When PHP cannot parse the end date, such as `not-a-date`. PHP reads
	 *                   `2026-02-30` as `2026-03-02`, and an empty string as today.
	 */
	public function build( $goal_type, $tab, $end_date ) {
		$settings        = $this->analytics_4->get_settings()->get();
		$detected_events = $settings['detectedEvents'] ?? array();
		$periods         = $this->get_periods( $end_date );
		$report_options  = new Report_Options( $periods['current'], $periods['previous'], $detected_events );

		if ( ! $report_options->has_detected_events( $goal_type ) ) {
			return null;
		}

		// A form ID can be `0`, so only an empty string names the whole widget.
		$tab              = (string) $tab;
		$custom_dimension = '' === $tab ? '' : $this->get_breakdown_dimension( $goal_type );
		$group_dimension  = '' === $custom_dimension ? '' : Analytics_4::CUSTOM_EVENT_PREFIX . $custom_dimension;

		$should_send_year_ago_counts = $this->should_send_year_ago_counts( $tab, $settings['propertyCreateTime'] ?? 0, $periods['year_ago_previous']['startDate'] );

		$requests = array(
			'engagement'  => $report_options->get_engagement_options(),
			'key_actions' => $report_options->get_key_action_options( $goal_type, $custom_dimension ),
		);

		if ( $should_send_year_ago_counts ) {
			$year_ago_report_options          = new Report_Options( $periods['year_ago_current'], $periods['year_ago_previous'], $detected_events );
			$requests['year_ago_key_actions'] = $year_ago_report_options->get_key_action_options( $goal_type, $custom_dimension );
		}

		$reports = $this->run_reports( $requests );

		if ( is_wp_error( $reports ) ) {
			return $reports;
		}

		$conversions = $this->get_period_totals( $reports['key_actions'], $group_dimension, $tab, 'eventCount' );

		if ( 0 === (int) $conversions['current'] && 0 === (int) $conversions['previous'] ) {
			return null;
		}

		// The engagement report has one row for each period, so each total is that period's rate.
		$engagement_rates = $this->get_period_totals( $reports['engagement'], '', '', 'engagementRate' );
		$sessions         = $this->get_period_totals( $reports['engagement'], '', '', 'sessions' );

		$entry = array(
			'event_name'       => Conversion_Events_Provider::CATEGORY_LEAD === $goal_type ? 'generate_lead' : $report_options->get_primary_store_event(),
			'month_start_date' => $periods['current']['startDate'],
			'current'          => $this->build_period( $conversions['current'], $sessions['current'], $engagement_rates['current'] ),
			'previous'         => $this->build_period( $conversions['previous'], $sessions['previous'], $engagement_rates['previous'] ),
		);

		if ( $should_send_year_ago_counts ) {
			$year_ago_conversions = $this->get_period_totals( $reports['year_ago_key_actions'], $group_dimension, $tab, 'eventCount' );

			$entry['yoy_current_conversions']  = (int) $year_ago_conversions['current'];
			$entry['yoy_previous_conversions'] = (int) $year_ago_conversions['previous'];
		}

		return $entry;
	}

	/**
	 * Gets the four periods of the entry, from the last day of the current period.
	 *
	 * The dates are midnight UTC, where every day is 24 hours long.
	 *
	 * @since 1.192.0
	 *
	 * @param string $end_date Last day of the current period, as `YYYY-MM-DD`.
	 * @return array Periods keyed `current`, `previous`, `year_ago_current` and `year_ago_previous`,
	 *               each with `startDate` and `endDate` as `YYYY-MM-DD`.
	 * @throws Exception When PHP cannot parse the end date, such as `not-a-date`.
	 */
	private function get_periods( $end_date ) {
		$current_end_date  = new DateTimeImmutable( $end_date, new DateTimeZone( 'UTC' ) );
		$year_ago_end_date = $current_end_date->modify( sprintf( '-%d days', self::YEAR_AGO_OFFSET_DAYS ) );

		return array(
			'current'           => $this->get_period( $current_end_date ),
			'previous'          => $this->get_period( $current_end_date->modify( sprintf( '-%d days', self::PERIOD_DAYS ) ) ),
			'year_ago_current'  => $this->get_period( $year_ago_end_date ),
			'year_ago_previous' => $this->get_period( $year_ago_end_date->modify( sprintf( '-%d days', self::PERIOD_DAYS ) ) ),
		);
	}

	/**
	 * Gets the period of `PERIOD_DAYS` days that ends on a day.
	 *
	 * @since 1.192.0
	 *
	 * @param DateTimeImmutable $end_date Last day of the period, at midnight UTC.
	 * @return array Period with `startDate` and `endDate` as `YYYY-MM-DD`.
	 */
	private function get_period( DateTimeImmutable $end_date ) {
		return array(
			'startDate' => $end_date->modify( sprintf( '-%d days', self::PERIOD_DAYS - 1 ) )->format( 'Y-m-d' ),
			'endDate'   => $end_date->format( 'Y-m-d' ),
		);
	}

	/**
	 * Checks whether the entry sends the year-ago counts.
	 *
	 * A form or provider tab counts by its breakdown dimension, which may have no data for the
	 * year-ago periods yet. So only the whole widget sends them.
	 *
	 * @since 1.192.0
	 *
	 * @param string $tab                  Group the tab shows, or an empty string for the whole widget.
	 * @param int    $property_create_time When the property was created, in milliseconds.
	 * @param string $year_ago_start_date  First day of the year-ago previous period, as `YYYY-MM-DD`.
	 * @return bool True for the whole widget of a property created before 00:00 UTC on that day, false otherwise.
	 */
	private function should_send_year_ago_counts( $tab, $property_create_time, $year_ago_start_date ) {
		if ( '' !== $tab ) {
			return false;
		}

		// The setting is `0` until Site Kit reads the creation time from Analytics, so the property's age is not known yet.
		if ( empty( $property_create_time ) ) {
			return false;
		}

		$year_ago_start = new DateTimeImmutable( $year_ago_start_date, new DateTimeZone( 'UTC' ) );

		return $property_create_time < $year_ago_start->getTimestamp() * 1000;
	}

	/**
	 * Gets the custom dimension that names the tabs of a widget.
	 *
	 * @since 1.192.0
	 *
	 * @param string $goal_type Goal type, `lead` or `ecommerce`.
	 * @return string Custom dimension slug: `googlesitekit_form_id` for `lead`, and `googlesitekit_event_provider` for `ecommerce`.
	 */
	private function get_breakdown_dimension( $goal_type ) {
		return Conversion_Events_Provider::CATEGORY_LEAD === $goal_type
			? Analytics_4::CUSTOM_DIMENSION_FORM_ID
			: Analytics_4::CUSTOM_DIMENSION_EVENT_PROVIDER;
	}

	/**
	 * Runs the reports in one batch call.
	 *
	 * @since 1.192.0
	 *
	 * @param array $requests Report request options, keyed by report.
	 * @return array|WP_Error Rows of each report, keyed like the requests, or the error of the batch call.
	 */
	private function run_reports( array $requests ) {
		$response = $this->analytics_4->get_data(
			'batch-report',
			array(
				'requests' => array_values( $requests ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		// The email report decodes the response the same way, into the arrays `extract_report_rows()` reads.
		$reports = json_decode( wp_json_encode( $response ), true )['reports'];
		$rows    = array();

		foreach ( array_keys( $requests ) as $index => $request_key ) {
			$rows[ $request_key ] = $this->report_processor->extract_report_rows( $reports[ $index ] );
		}

		return $rows;
	}

	/**
	 * Adds up a metric of one group of a report, in the current and in the previous period.
	 *
	 * @since 1.192.0
	 *
	 * @param array  $rows            Report rows, as `Email_Report_Payload_Processor::extract_report_rows()`
	 *                                returns them.
	 * @param string $group_dimension Dimension whose value names the group, such as
	 *                                `customEvent:googlesitekit_form_id`, or an empty string to put
	 *                                every row in one group.
	 * @param string $group_name      Group to add up, such as the form `123`, or an empty string for
	 *                                every row when `$group_dimension` is empty too.
	 * @param string $metric_name     Metric to add up, such as `eventCount`.
	 * @return array Totals keyed `current` and `previous`, each `0.0` for a period with no row.
	 */
	private function get_period_totals( array $rows, $group_dimension, $group_name, $metric_name ) {
		$totals = $this->data_processor->sum_metric_by_group( $rows, $group_dimension, $metric_name )[ $group_name ] ?? array();

		// A report with two periods names the rows of the first `date_range_0`, and those of the second `date_range_1`.
		return array(
			'current'  => $totals['date_range_0'] ?? 0.0,
			'previous' => $totals['date_range_1'] ?? 0.0,
		);
	}

	/**
	 * Builds the fields of one period.
	 *
	 * @since 1.192.0
	 *
	 * @param float $conversions     Key actions in the period.
	 * @param float $sessions        Sessions of the whole site in the period.
	 * @param float $engagement_rate Engagement rate of the whole site in the period.
	 * @return array The period's `conversions`, `conversion_rate`, `sessions` and `engagement_rate`.
	 */
	private function build_period( $conversions, $sessions, $engagement_rate ) {
		$conversions = (int) $conversions;
		$sessions    = (int) $sessions;

		return array(
			'conversions'     => $conversions,
			'conversion_rate' => $sessions > 0 ? round( $conversions / $sessions, 4 ) : 0.0,
			'sessions'        => $sessions,
			'engagement_rate' => round( $engagement_rate, 4 ),
		);
	}
}
