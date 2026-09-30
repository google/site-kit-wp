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
 * Builds the options of the Analytics reports the benchmarking response is assembled from.
 *
 * Every period and every dimension the reports ask Analytics for is set here,
 * so a reader finds all of them in one place.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Report_Options {

	/**
	 * Days the daily series covers, up to the end date. The 13 months let the
	 * Typical Traffic chart show the year around the selected period.
	 */
	const DAILY_SERIES_DAYS = 395;

	/**
	 * Rows a dimension report asks Analytics for, across both of its periods.
	 */
	const REPORT_ROW_LIMIT = 50;

	/**
	 * First day of the selected period, as `YYYY-MM-DD`, such as `2026-08-19`, not
	 * `20260819`.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $start_date;

	/**
	 * Last day of the selected period, as `YYYY-MM-DD`, such as `2026-09-15`, not
	 * `20260915`.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $end_date;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $start_date The first day of the selected period, as `YYYY-MM-DD`, such as `2026-08-19`, not `20260819`.
	 * @param string $end_date   The last day of the selected period, as `YYYY-MM-DD`, such as `2026-09-15`, not `20260915`.
	 */
	public function __construct( $start_date, $end_date ) {
		$this->start_date = $start_date;
		$this->end_date   = $end_date;
	}

	/**
	 * Gets the compare period, which has as many days as the selected period
	 * and ends the day before the selected period starts.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Compare period, with `startDate` and `endDate` as `YYYY-MM-DD`, not `YYYYMMDD`. For `2026-08-19` to `2026-09-15`, it's `2026-07-22` to `2026-08-18`.
	 */
	public function get_compare_range() {
		$start_date = $this->create_date( $this->start_date );
		$days       = $start_date->diff( $this->create_date( $this->end_date ) )->days + 1;

		return array(
			'startDate' => $start_date->modify( "-{$days} days" )->format( 'Y-m-d' ),
			'endDate'   => $start_date->modify( '-1 day' )->format( 'Y-m-d' ),
		);
	}

	/**
	 * Gets the options of the report that counts visitors by day, over the
	 * `DAILY_SERIES_DAYS` days that end on the end date.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Report request options array.
	 */
	public function get_daily_series_options() {
		$first_date = $this->create_date( $this->end_date )->modify( sprintf( '-%d days', self::DAILY_SERIES_DAYS - 1 ) );

		return array(
			'startDate'  => $first_date->format( 'Y-m-d' ),
			'endDate'    => $this->end_date,
			'metrics'    => array(
				array( 'name' => 'totalUsers' ),
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
	 * Gets the options of the report that counts visitors by channel.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Report request options array.
	 */
	public function get_channels_options() {
		return $this->get_dimension_options( array( 'sessionDefaultChannelGrouping' ) );
	}

	/**
	 * Gets the options of the report that counts visitors by device category.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Report request options array.
	 */
	public function get_devices_options() {
		return $this->get_dimension_options( array( 'deviceCategory' ) );
	}

	/**
	 * Gets the options of the report that counts new and returning visitors.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Report request options array.
	 */
	public function get_visitor_mix_options() {
		return $this->get_dimension_options( array( 'newVsReturning' ) );
	}

	/**
	 * Gets the options of the report that counts visitors by referring source.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Report request options array.
	 */
	public function get_referrers_options() {
		return $this->get_dimension_options( array( 'sessionSource' ) );
	}

	/**
	 * Gets the options of the report that counts visitors by post, with each
	 * post's title and publication date.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Report request options array.
	 */
	public function get_content_options() {
		$post_date_dimension = Analytics_4::CUSTOM_EVENT_PREFIX . Analytics_4::CUSTOM_DIMENSION_POST_DATE;

		return $this->get_dimension_options(
			array( 'pagePath', 'pageTitle', $post_date_dimension ),
			array(
				// Analytics reports `(not set)` for a page that isn't a post, and
				// that page has no publication date to count from.
				$post_date_dimension => array(
					'filterType'    => 'emptyFilter',
					'notExpression' => true,
				),
			)
		);
	}

	/**
	 * Gets the options of the report that counts visitors by post category.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Report request options array.
	 */
	public function get_categories_options() {
		$categories_dimension = Analytics_4::CUSTOM_EVENT_PREFIX . Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES;

		return $this->get_dimension_options(
			array( $categories_dimension ),
			array(
				// Analytics reports `(not set)` for a page with no category, such
				// as the home page.
				$categories_dimension => array(
					'filterType'    => 'emptyFilter',
					'notExpression' => true,
				),
			)
		);
	}

	/**
	 * Builds the options of a report that counts visitors by one or more
	 * dimensions, in the selected period and in the compare period.
	 *
	 * Both periods go in one request, so Analytics returns a row for each value in
	 * each period and names the period in a `dateRange` value.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $dimension_names   The dimensions to count visitors by, such as `array( 'deviceCategory' )`.
	 * @param array $dimension_filters Optional. The dimension filters, keyed by dimension name. Default none.
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
				array( 'name' => 'totalUsers' ),
			),
			'dimensions'       => array_map(
				fn( $dimension_name ) => array( 'name' => $dimension_name ),
				$dimension_names
			),
			// The rows are sorted by visitors, so the row limit keeps the values with
			// the most visitors.
			'orderby'          => array(
				array(
					'metric' => array( 'metricName' => 'totalUsers' ),
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
	 * @since n.e.x.t
	 *
	 * @param string $date The date, as `YYYY-MM-DD`, such as `2026-09-15`, not `20260915`.
	 * @return DateTimeImmutable The date.
	 */
	private function create_date( $date ) {
		return new DateTimeImmutable( $date, new DateTimeZone( 'UTC' ) );
	}
}
