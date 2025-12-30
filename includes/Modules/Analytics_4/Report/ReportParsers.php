<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report\ReportParsers
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Report
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Report;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Util\Date;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DateRange as Google_Service_AnalyticsData_DateRange;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Dimension as Google_Service_AnalyticsData_Dimension;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DimensionOrderBy as Google_Service_AnalyticsData_DimensionOrderBy;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\MetricOrderBy as Google_Service_AnalyticsData_MetricOrderBy;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\OrderBy as Google_Service_AnalyticsData_OrderBy;

/**
 * A class with helper methods to parse report properties
 *
 * @since 1.130.0
 * @access private
 * @ignore
 */
class ReportParsers {

	/**
	 * Parses report dimensions received in the request params.
	 *
	 * @since 1.99.0
	 * @since 1.130.0 Moved into `ReportParsers` for shared used (originally between `Report` and `PivotReport`). `PivotReport` has since been removed.
	 *
	 * @param Data_Request $data Data request object.
	 * @return Google_Service_AnalyticsData_Dimension[] An array of AnalyticsData Dimension objects.
	 */
	protected function parse_dimensions( Data_Request $data ) {
		$dimensions = $data['dimensions'];
		if ( empty( $dimensions ) || ( ! is_string( $dimensions ) && ! is_array( $dimensions ) ) ) {
			return array();
		}

		if ( is_string( $dimensions ) ) {
			$dimensions = explode( ',', $dimensions );
		} elseif ( is_array( $dimensions ) && ! wp_is_numeric_array( $dimensions ) ) { // If single object is passed.
			$dimensions = array( $dimensions );
		}

		$dimensions = array_filter(
			array_map(
				function ( $dimension_def ) {
					$dimension = new Google_Service_AnalyticsData_Dimension();

					if ( is_string( $dimension_def ) ) {
						$dimension->setName( $dimension_def );
					} elseif ( is_array( $dimension_def ) && ! empty( $dimension_def['name'] ) ) {
						$dimension->setName( $dimension_def['name'] );
					} else {
						return null;
					}

					return $dimension;
				},
				array_filter( $dimensions )
			)
		);

		return $dimensions;
	}

	/**
	 * Parses report date ranges received in the request params.
	 *
	 * @since 1.99.0
	 * @since 1.130.0 Moved into `ReportParsers` for shared used (originally between `Report` and `PivotReport`). `PivotReport` has since been removed.
	 * @since 1.157.0 Added support for dateRangeName and compareDateRangeName parameters.
	 *
	 * @param Data_Request $data Data request object.
	 * @return Google_Service_AnalyticsData_DateRange[] An array of AnalyticsData DateRange objects.
	 */
	public function parse_dateranges( Data_Request $data ) {
		$date_ranges = array();
		$start_date  = $data['startDate'] ?? '';
		$end_date    = $data['endDate'] ?? '';
		if ( strtotime( $start_date ) && strtotime( $end_date ) ) {
			$compare_start_date = $data['compareStartDate'] ?? '';
			$compare_end_date   = $data['compareEndDate'] ?? '';
			$date_ranges[]      = array( $start_date, $end_date );

			// When using multiple date ranges, it changes the structure of the response:
			// Aggregate properties (minimum, maximum, totals) will have an entry per date range.
			// The rows property will have additional row entries for each date range.
			if ( strtotime( $compare_start_date ) && strtotime( $compare_end_date ) ) {
				$date_ranges[] = array( $compare_start_date, $compare_end_date );
			}
		} else {
			// Default the date range to the last 28 days.
			$date_ranges[] = Date::parse_date_range( 'last-28-days', 1 );
		}

		// Get date range names if provided.
		$date_range_name         = $data['dateRangeName'] ?? '';
		$compare_date_range_name = $data['compareDateRangeName'] ?? '';

		$date_ranges = array_map(
			function ( $date_range, $index ) use ( $date_range_name, $compare_date_range_name ) {
				list ( $start_date, $end_date ) = $date_range;

				$date_range_obj = new Google_Service_AnalyticsData_DateRange();
				$date_range_obj->setStartDate( $start_date );
				$date_range_obj->setEndDate( $end_date );

				// Set date range names if provided.
				if ( 0 === $index && ! empty( $date_range_name ) ) {
					$date_range_obj->setName( $date_range_name );
				} elseif ( 1 === $index && ! empty( $compare_date_range_name ) ) {
					$date_range_obj->setName( $compare_date_range_name );
				}

				return $date_range_obj;
			},
			$date_ranges,
			array_keys( $date_ranges )
		);

		return $date_ranges;
	}

	/**
	 * Parses the orderby value of the data request into an array of AnalyticsData OrderBy object instances.
	 *
	 * @since 1.99.0
	 * @since 1.130.0 Moved into `ReportParsers` for shared used (originally between `Report` and `PivotReport`). `PivotReport` has since been removed.
	 *
	 * @param Data_Request $data Data request object.
	 * @return Google_Service_AnalyticsData_OrderBy[] An array of AnalyticsData OrderBy objects.
	 */
	protected function parse_orderby( Data_Request $data ) {
		$orderby = $data['orderby'];
		if ( empty( $orderby ) || ! is_array( $orderby ) || ! wp_is_numeric_array( $orderby ) ) {
			return array();
		}

		$results = array_map(
			function ( $order_def ) {
				$order_by = new Google_Service_AnalyticsData_OrderBy();
				$order_by->setDesc( ! empty( $order_def['desc'] ) );

				if ( isset( $order_def['metric'] ) && isset( $order_def['metric']['metricName'] ) ) {
					$metric_order_by = new Google_Service_AnalyticsData_MetricOrderBy();
					$metric_order_by->setMetricName( $order_def['metric']['metricName'] );
					$order_by->setMetric( $metric_order_by );
				} elseif ( isset( $order_def['dimension'] ) && isset( $order_def['dimension']['dimensionName'] ) ) {
					$dimension_order_by = new Google_Service_AnalyticsData_DimensionOrderBy();
					$dimension_order_by->setDimensionName( $order_def['dimension']['dimensionName'] );
					$order_by->setDimension( $dimension_order_by );
				} else {
					return null;
				}

				return $order_by;
			},
			$orderby
		);

		$results = array_filter( $results );
		$results = array_values( $results );

		return $results;
	}
}
