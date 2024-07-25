<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report\Row_Trait
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Report
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Report;

use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DimensionValue as Google_Service_AnalyticsData_DimensionValue;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\MetricHeader as Google_Service_AnalyticsData_MetricHeader;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\MetricValue as Google_Service_AnalyticsData_MetricValue;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Row as Google_Service_AnalyticsData_Row;

/**
 * A trait that adds a helper method to create report rows.
 *
 * @since 1.99.0
 * @access private
 * @ignore
 */
trait Row_Trait {

	/**
	 * Creates and returns a new zero-value row for provided date and metrics.
	 *
	 * @since 1.99.0
	 *
	 * @param Google_Service_AnalyticsData_MetricHeader[] $metric_headers   Metric headers from the report response.
	 * @param string                                      $current_date     The current date to create a zero-value row for.
	 * @param int|bool                                    $date_range_index The date range index for the current date.
	 * @param string                                      $default_value    The default value to use for metric values in the row.
	 * @return Google_Service_AnalyticsData_Row A new zero-value row instance.
	 */
	protected function create_report_row( $metric_headers, $current_date, $date_range_index, $default_value = '0' ) {
		$dimension_values = array();

		$current_date_dimension_value = new Google_Service_AnalyticsData_DimensionValue();
		$current_date_dimension_value->setValue( $current_date );
		$dimension_values[] = $current_date_dimension_value;

		// If we have multiple date ranges, we need to add "date_range_{i}" index to dimension values.
		if ( false !== $date_range_index ) {
			$date_range_dimension_value = new Google_Service_AnalyticsData_DimensionValue();
			$date_range_dimension_value->setValue( "date_range_{$date_range_index}" );
			$dimension_values[] = $date_range_dimension_value;
		}

		$metric_values = array();
		foreach ( $metric_headers as $metric_header ) {
			$metric_value = new Google_Service_AnalyticsData_MetricValue();
			$metric_value->setValue( $default_value );

			$metric_values[] = $metric_value;
		}

		$row = new Google_Service_AnalyticsData_Row();
		$row->setDimensionValues( $dimension_values );
		$row->setMetricValues( $metric_values );

		return $row;
	}
}
