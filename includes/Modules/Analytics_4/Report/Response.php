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
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportResponse as Google_Service_AnalyticsData_RunReportResponse;

/**
 * Class for Analytics 4 report responses.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Response extends Report {

	use Row_Trait;

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
			$dimension_values = $row->getDimensionValues();

			$range = 'date_range_0';
			if ( count( $dimension_values ) > 1 ) {
				$range = $dimension_values[1]->getValue();
			}

			$range = str_replace( 'date_range_', '', $range );
			$date  = $dimension_values[0]->getValue();
			$key   = self::get_response_row_key( $date, is_numeric( $range ) ? $range : false );

			$existing_rows[ $key ] = $row;
		}

		$metric_headers  = $response->getMetricHeaders();
		$ranges_count    = count( $date_ranges );
		$multiple_ranges = $ranges_count > 1;
		$rows            = array();

		foreach ( $date_ranges as $date_range ) {
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

				// Add rows for the current date for each date range.
				for ( $i = 0; $i < $ranges_count; $i++ ) {
					// Copy the existing row if it is available, otherwise create a new zero-value row.
					$current_date_key          = self::get_response_row_key( $current_date, $i );
					$rows[ $current_date_key ] = isset( $existing_rows[ $current_date_key ] )
						? $existing_rows[ $current_date_key ]
						: $this->create_report_row(
							$metric_headers,
							$current_date,
							$multiple_ranges ? $i : false
						);
				}
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
	 * Gets the response row key composed from the date and the date range index values.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $date             The date of the row to return key for.
	 * @param int    $date_range_index The date range index.
	 * @return string The row key.
	 */
	protected static function get_response_row_key( $date, $date_range_index ) {
		return "{$date}_{$date_range_index}";
	}

}
