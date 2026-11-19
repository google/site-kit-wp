<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Report_Options
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Benchmarking;

use DateTimeImmutable;
use DateTimeZone;
use Google\Site_Kit\Modules\Analytics_4;

/**
 * Builds the options of the Analytics reports for the benchmarking response.
 *
 * @since 1.190.0
 * @access private
 * @ignore
 */
class Report_Options {

	/**
	 * The maximum number of days in the selected period, the longest preset of
	 * `DateRangeSelector`.
	 *
	 * The `core/user` store accepts a longer `custom` date range, which only
	 * `DateRangePicker` can set, and `Get_Benchmarking_Data` refuses it.
	 *
	 * @since 1.192.0
	 */
	const MAXIMUM_PERIOD_DAYS = 90;

	/**
	 * The most rows a dimension report asks for.
	 *
	 * A row that the report cuts off in one period counts as a row without
	 * visits in that period, and so as a row that changed by all of its
	 * visits. The limit is far above the number of rows the response and the
	 * insight request keep, so that the rows they keep are not cut off in
	 * either period.
	 *
	 * @since 1.190.0
	 * @since n.e.x.t Raised from 50 to 500.
	 */
	const REPORT_ROW_LIMIT = 500;

	/**
	 * How far back, in days, last year's periods sit: 52 whole weeks, so each
	 * starts on the same weekday as the period it mirrors.
	 *
	 * @since n.e.x.t
	 */
	const LAST_YEAR_OFFSET_DAYS = 364;

	/**
	 * First day of the selected period, as `YYYY-MM-DD`.
	 *
	 * @since 1.190.0
	 * @var string
	 */
	private $start_date;

	/**
	 * Last day of the selected period, as `YYYY-MM-DD`.
	 *
	 * @since 1.190.0
	 * @var string
	 */
	private $end_date;

	/**
	 * Constructor.
	 *
	 * @since 1.190.0
	 *
	 * @param string $start_date The first day of the selected period, as `YYYY-MM-DD`.
	 * @param string $end_date   The last day of the selected period, as `YYYY-MM-DD`.
	 */
	public function __construct( $start_date, $end_date ) {
		$this->start_date = $start_date;
		$this->end_date   = $end_date;
	}

	/**
	 * Gets the number of days in the selected period, both ends included.
	 *
	 * @since n.e.x.t
	 *
	 * @return int The number of days.
	 */
	public function get_period_days() {
		return $this->create_date( $this->start_date )->diff( $this->create_date( $this->end_date ) )->days + 1;
	}

	/**
	 * Gets the compare period, which has as many days as the selected period
	 * and ends the day before the selected period starts.
	 *
	 * @since 1.190.0
	 *
	 * @return array Compare period, with `startDate` and `endDate` as `YYYY-MM-DD`.
	 */
	public function get_compare_range() {
		$start_date = $this->create_date( $this->start_date );
		$days       = $this->get_period_days();

		return array(
			'startDate' => $start_date->modify( "-{$days} days" )->format( 'Y-m-d' ),
			'endDate'   => $start_date->modify( '-1 day' )->format( 'Y-m-d' ),
		);
	}

	/**
	 * Gets the options of the report that counts visits by day, from the first
	 * day the band or last year's periods read to the selected period's last
	 * day.
	 *
	 * A visit is a session. The traffic line, the period totals and the
	 * expected range all come from this report, so they all count visits.
	 *
	 * The report covers the selected period, the compare period, and the same
	 * two periods 52 weeks earlier, which the insight request sends as last
	 * year's visits, from `LAST_YEAR_OFFSET_DAYS` days before the compare
	 * period's first day. It also covers the reference of the band's first day,
	 * which `Period_Baseline` fits on the up to 365 days that end 28 days
	 * before that day, from `Period_Baseline::BAND_LOOKBACK_DAYS` days before
	 * the selected period's first day. That makes `max( d + 392, 364 + 2d )`
	 * days for a `d`-day period: 420 for 28 days, the first reach for a period
	 * of up to 28 days and the second for a longer one.
	 * `Response_Builder::build()` adds up the visits of each period from this
	 * report, and returns the days of the selected period alone as
	 * `dailyTraffic`.
	 *
	 * @since 1.190.0
	 * @since 1.192.0 The report starts on the first day of the compare period, in place of the first of the 395 days that end on the last day of the selected period.
	 * @since n.e.x.t The report counts `sessions` in place of `totalUsers`, and starts on the first day of last year's compare period or of the band's reference, whichever is earlier.
	 *
	 * @return array Report request options array.
	 */
	public function get_daily_series_options() {
		$compare_range   = $this->get_compare_range();
		$offset_days     = self::LAST_YEAR_OFFSET_DAYS;
		$lookback_days   = Period_Baseline::BAND_LOOKBACK_DAYS;
		$last_year_start = $this->create_date( $compare_range['startDate'] )->modify( "-{$offset_days} days" );
		$band_start      = $this->create_date( $this->start_date )->modify( "-{$lookback_days} days" );

		return array(
			'startDate'  => min( $last_year_start, $band_start )->format( 'Y-m-d' ),
			'endDate'    => $this->end_date,
			'metrics'    => array(
				array( 'name' => 'sessions' ),
			),
			'dimensions' => array(
				array( 'name' => 'date' ),
			),
			'orderby'    => array(
				array(
					'dimension' => array( 'dimensionName' => 'date' ),
				),
			),
		);
	}

	/**
	 * Gets the options of the report that counts visits by channel, device and
	 * visitor type.
	 *
	 * The key factor cards take the channel candidates, the site's totals, and
	 * the device and visitor type attributes of a channel card from it.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Report request options array.
	 */
	public function get_channel_breakdowns_options() {
		return $this->get_dimension_options( array( 'sessionDefaultChannelGrouping', 'deviceCategory', 'newVsReturning' ) );
	}

	/**
	 * Gets the options of the report that counts visits by channel and source.
	 *
	 * The key factor cards take the referring site candidates, and the
	 * referring site and platform attributes of a channel card from it.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Report request options array.
	 */
	public function get_channel_sources_options() {
		return $this->get_dimension_options( array( 'sessionDefaultChannelGrouping', 'sessionSource' ) );
	}

	/**
	 * Gets the options of the report that counts visits by channel and landing
	 * page.
	 *
	 * The key factor cards take the landing page candidates, the landing page
	 * attribute of a channel card, and the traffic channel attribute of a
	 * landing page card from it.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Report request options array.
	 */
	public function get_channel_pages_options() {
		return $this->get_dimension_options( array( 'sessionDefaultChannelGrouping', 'landingPage' ) );
	}

	/**
	 * Gets the options of the report that counts visits by channel and
	 * campaign.
	 *
	 * The key factor cards take the campaign candidates, the campaign attribute
	 * of a channel card, and the traffic channel attribute of a campaign card
	 * from it.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Report request options array.
	 */
	public function get_channel_campaigns_options() {
		return $this->get_dimension_options( array( 'sessionDefaultChannelGrouping', 'sessionCampaignName' ) );
	}

	/**
	 * Gets the options of the report that counts the visits of one key factor
	 * card's driver by device and visitor type.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $driver_filters The dimension filters that keep only the driver's visits, keyed by dimension name, as `Key_Factors::get_driver_filters()` returns them.
	 * @return array Report request options array.
	 */
	public function get_driver_audience_options( array $driver_filters ) {
		return $this->get_dimension_options( array( 'deviceCategory', 'newVsReturning' ), $driver_filters );
	}

	/**
	 * Gets the options of the report that counts the visits of one key factor
	 * card's driver by channel and source.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $driver_filters The dimension filters that keep only the driver's visits, keyed by dimension name, as `Key_Factors::get_driver_filters()` returns them.
	 * @return array Report request options array.
	 */
	public function get_driver_sources_options( array $driver_filters ) {
		return $this->get_dimension_options( array( 'sessionDefaultChannelGrouping', 'sessionSource' ), $driver_filters );
	}

	/**
	 * Gets the options of the report that counts the visits of one key factor
	 * card's driver by landing page.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $driver_filters The dimension filters that keep only the driver's visits, keyed by dimension name, as `Key_Factors::get_driver_filters()` returns them.
	 * @return array Report request options array.
	 */
	public function get_driver_pages_options( array $driver_filters ) {
		return $this->get_dimension_options( array( 'landingPage' ), $driver_filters );
	}

	/**
	 * Gets the options of the report that counts visits by post, with each
	 * post's title and publication date.
	 *
	 * @since 1.190.0
	 * @since n.e.x.t Counts visits in place of visitors.
	 *
	 * @return array Report request options array.
	 */
	public function get_content_options() {
		$post_date_dimension = Analytics_4::CUSTOM_EVENT_PREFIX . Analytics_4::CUSTOM_DIMENSION_POST_DATE;

		return $this->get_dimension_options(
			array( 'pagePath', 'pageTitle', $post_date_dimension ),
			array(
				// Analytics reports `(not set)` for a page that isn't a post.
				$post_date_dimension => array(
					'filterType'    => 'emptyFilter',
					'notExpression' => true,
				),
			)
		);
	}

	/**
	 * Gets the options of a report that counts visits by one or more
	 * dimensions, for the selected period and the compare period in one request.
	 *
	 * A visit is a session, as in the daily series. A session has exactly one
	 * channel, device, visitor type, source, landing page and campaign, so the
	 * rows of a report add up to the period totals, and the rows of a breakdown
	 * add up to the channel, page, source or campaign they break down.
	 *
	 * @since 1.190.0
	 * @since n.e.x.t The report counts `sessions` in place of `totalUsers`.
	 *
	 * @param array $dimension_names   The dimensions to count visits by, such as `array( 'deviceCategory' )`.
	 * @param array $dimension_filters Optional. The dimension filters, keyed by dimension name. A list of values keeps the visits with any of them. Default empty array.
	 * @return array Report request options array.
	 */
	private function get_dimension_options( array $dimension_names, array $dimension_filters = array() ) {
		$compare_range = $this->get_compare_range();

		$options = array(
			'startDate'        => $this->start_date,
			'endDate'          => $this->end_date,
			'compareStartDate' => $compare_range['startDate'],
			'compareEndDate'   => $compare_range['endDate'],
			'metrics'          => array(
				array( 'name' => 'sessions' ),
			),
			'dimensions'       => array_map(
				fn( $dimension_name ) => array( 'name' => $dimension_name ),
				$dimension_names
			),
			'orderby'          => array(
				array(
					'metric' => array( 'metricName' => 'sessions' ),
					'desc'   => true,
				),
			),
			'limit'            => self::REPORT_ROW_LIMIT,
		);

		if ( ! empty( $dimension_filters ) ) {
			$options['dimensionFilters'] = $dimension_filters;
		}

		return $options;
	}

	/**
	 * Creates a date at midnight UTC, where every day is 24 hours long.
	 *
	 * @since 1.190.0
	 *
	 * @param string $date The date, as `YYYY-MM-DD`.
	 * @return DateTimeImmutable The date.
	 */
	private function create_date( $date ) {
		return new DateTimeImmutable( $date, new DateTimeZone( 'UTC' ) );
	}
}
