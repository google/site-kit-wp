<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report\Response
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Report
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Report;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4\Report;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DimensionValue as Google_Service_AnalyticsData_DimensionValue;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\MetricHeader as Google_Service_AnalyticsData_MetricHeader;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\MetricValue as Google_Service_AnalyticsData_MetricValue;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Row as Google_Service_AnalyticsData_Row;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportResponse as Google_Service_AnalyticsData_RunReportResponse;

/**
 * Class for Analytics 4 report responses.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Response extends Report {

	/**
	 * Parses the report response, and pads the report data with zero-data rows where rows are missing. This only applies for reports which request a single `date` dimension.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request                                   $data     Data request object.
	 * @param Google_Service_AnalyticsData_RunReportResponse $response Request response.
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	public function parse_response( Data_Request $data, $response ) {
		// Return early if the response is not of the expected type.
		if ( ! $response instanceof Google_Service_AnalyticsData_RunReportResponse ) {
			return $response;
		}

		// Get report dimensions and return early if there is either more than one dimension or
		// the only dimension is not "date".
		$dimensions = $this->parse_dimensions( $data );
		if ( count( $dimensions ) !== 1 || $dimensions[0]->getName() !== 'date' ) {
			return $response;
		}

		// Get date ranges and return early if there are no date ranges for this report.
		$date_ranges = $this->parse_dateranges( $data );
		if ( empty( $date_ranges ) ) {
			return $response;
		}

		// Get all available dates in the report.
		$existing_rows = array();
		foreach ( $response->getRows() as $row ) {
			$dimension_values       = $row->getDimensionValues();
			$date                   = $dimension_values[0]->getValue();
			$existing_rows[ $date ] = $row;
		}

		$metric_headers  = $response->getMetricHeaders();
		$multiple_ranges = count( $date_ranges ) > 1;
		$rows            = array();

		foreach ( $date_ranges as $date_range_index => $date_range ) {
			$start = strtotime( $date_range->getStartDate() );
			$end   = strtotime( $date_range->getEndDate() );

			// Skip this date range if either start date or end date is corrupted.
			if ( ! $start || ! $end ) {
				continue;
			}

			// Loop through all days in the date range and check if there is a metric value
			// for it. If the metric value is missing, we will need to add one with a zero value.
			$now = $start;
			do {
				// Format the current time to a date string and add a day in seconds to the current date
				// to shift to the next date.
				$current_date = gmdate( 'Ymd', $now );
				$now         += DAY_IN_SECONDS;

				// Copy the existing row if it is available, otherwise create a new zero-value row.
				$rows[ $current_date ] = isset( $existing_rows[ $current_date ] )
					? $existing_rows[ $current_date ]
					: self::create_report_row(
						$metric_headers,
						$current_date,
						$multiple_ranges ? $date_range_index : false
					);
			} while ( $now <= $end );
		}

		// If we have the same number of rows as in the response at the moment, then
		// we can return the response without setting the new rows back into the response.
		$new_rows_count = count( $rows );
		if ( $new_rows_count <= $response->getRowCount() ) {
			return $response;
		}

		// Set updated rows back to the response object.
		$response->setRows( array_values( $rows ) );
		$response->setRowCount( $new_rows_count );

		return $response;
	}

	/**
	 * Creates and returns a new zero-value row for provided date and metrics.
	 *
	 * @since n.e.x.t
	 *
	 * @param Google_Service_AnalyticsData_MetricHeader[] $metric_headers   Metric headers from the report response.
	 * @param string                                      $current_date     The current date to create a zero-value row for.
	 * @param int|bool                                    $date_range_index The date range index for the current date.
	 * @return Google_Service_AnalyticsData_Row A new zero-value row instance.
	 */
	public static function create_report_row( $metric_headers, $current_date, $date_range_index ) {
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

			switch ( $metric_header->getType() ) {
				case 'TYPE_INTEGER':
				case 'TYPE_FLOAT':
				case 'TYPE_CURRENCY':
					$metric_value->setValue( '0' );
					break;
				default:
					$metric_value->setValue( null );
					break;
			}

			$metric_values[] = $metric_value;
		}

		$row = new Google_Service_AnalyticsData_Row();
		$row->setDimensionValues( $dimension_values );
		$row->setMetricValues( $metric_values );

		return $row;
	}

}
