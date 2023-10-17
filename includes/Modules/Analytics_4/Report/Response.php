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
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DateRange as Google_Service_AnalyticsData_DateRange;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Row as Google_Service_AnalyticsData_Row;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportResponse as Google_Service_AnalyticsData_RunReportResponse;

/**
 * Class for Analytics 4 report responses.
 *
 * @since 1.99.0
 * @access private
 * @ignore
 */
class Response extends Report {

	use Row_Trait;

	/**
	 * Parses the report response, and pads the report data with zero-data rows where rows are missing. This only applies for reports which request a single `date` dimension.
	 *
	 * @since 1.99.0
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

		$custom_dimension_query = new Custom_Dimensions_Response_Parser();
		$custom_dimension_query->swap_custom_dimension_ids_with_names( $response );

		// Get report dimensions and return early if there is either more than one dimension or
		// the only dimension is not "date".
		$dimensions = $this->parse_dimensions( $data );
		if ( count( $dimensions ) !== 1 || $dimensions[0]->getName() !== 'date' ) {
			return $response;
		}

		// Get date ranges and return early if there are no date ranges for this report.
		$date_ranges = $this->get_sorted_dateranges( $data );
		if ( empty( $date_ranges ) ) {
			return $response;
		}

		// Get all available dates in the report.
		$existing_rows = array();
		foreach ( $response->getRows() as $row ) {
			$dimension_values = $row->getDimensionValues();

			$range = 'date_range_0';
			if ( count( $dimension_values ) > 1 ) {
				// Considering this code will only be run when we are requesting a single dimension, `date`,
				// the implication is that the row will _only_ have an additional dimension when multiple
				// date ranges are requested.
				//
				// In this scenario, the dimension at index 1 will have a value of `date_range_{i}`, where
				// `i` is the zero-based index of the date range.
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

		// Add rows for the current date for each date range.
		self::iterate_date_ranges(
			$date_ranges,
			function( $date ) use ( &$rows, $existing_rows, $ranges_count, $metric_headers, $multiple_ranges ) {
				for ( $i = 0; $i < $ranges_count; $i++ ) {
					// Copy the existing row if it is available, otherwise create a new zero-value row.
					$key          = self::get_response_row_key( $date, $i );
					$rows[ $key ] = isset( $existing_rows[ $key ] )
						? $existing_rows[ $key ]
						: $this->create_report_row( $metric_headers, $date, $multiple_ranges ? $i : false );
				}
			}
		);

		// If we have the same number of rows as in the response at the moment, then
		// we can return the response without setting the new rows back into the response.
		$new_rows_count = count( $rows );
		if ( $new_rows_count <= $response->getRowCount() ) {
			return $response;
		}

		// If we have multiple date ranges, we need to sort rows to have them in
		// the correct order.
		if ( $multiple_ranges ) {
			$rows = self::sort_response_rows( $rows, $date_ranges );
		}

		// Set updated rows back to the response object.
		$response->setRows( array_values( $rows ) );
		$response->setRowCount( $new_rows_count );

		return $response;
	}

	/**
	 * Gets the response row key composed from the date and the date range index values.
	 *
	 * @since 1.99.0
	 *
	 * @param string   $date             The date of the row to return key for.
	 * @param int|bool $date_range_index The date range index, or FALSE if no index is available.
	 * @return string The row key.
	 */
	protected static function get_response_row_key( $date, $date_range_index ) {
		return "{$date}_{$date_range_index}";
	}

	/**
	 * Returns sorted and filtered date ranges received in the request params. All corrupted date ranges
	 * are ignored and not included in the returning list.
	 *
	 * @since 1.99.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return Google_Service_AnalyticsData_DateRange[] An array of AnalyticsData DateRange objects.
	 */
	protected function get_sorted_dateranges( Data_Request $data ) {
		$date_ranges = $this->parse_dateranges( $data );
		if ( empty( $date_ranges ) ) {
			return $date_ranges;
		}

		// Filter out all corrupted date ranges.
		$date_ranges = array_filter(
			$date_ranges,
			function( $range ) {
				$start = strtotime( $range->getStartDate() );
				$end   = strtotime( $range->getEndDate() );
				return ! empty( $start ) && ! empty( $end );
			}
		);

		// Sort date ranges preserving keys to have the oldest date range at the beginning and
		// the latest date range at the end.
		uasort(
			$date_ranges,
			function( $a, $b ) {
				$a_start = strtotime( $a->getStartDate() );
				$b_start = strtotime( $b->getStartDate() );
				return $a_start - $b_start;
			}
		);

		return $date_ranges;
	}

	/**
	 * Sorts response rows using the algorithm similar to the one that Analytics 4 uses internally
	 * and returns sorted rows.
	 *
	 * @since 1.99.0
	 *
	 * @param Google_Service_AnalyticsData_Row[]       $rows        The current report rows.
	 * @param Google_Service_AnalyticsData_DateRange[] $date_ranges The report date ranges.
	 * @return Google_Service_AnalyticsData_Row[] Sorted rows.
	 */
	protected static function sort_response_rows( $rows, $date_ranges ) {
		$sorted_rows  = array();
		$ranges_count = count( $date_ranges );

		self::iterate_date_ranges(
			$date_ranges,
			function( $date, $range_index ) use ( &$sorted_rows, $ranges_count, $rows ) {
				// First take the main date range row.
				$key                 = self::get_response_row_key( $date, $range_index );
				$sorted_rows[ $key ] = $rows[ $key ];

				// Then take all remaining rows.
				for ( $i = 0; $i < $ranges_count; $i++ ) {
					if ( $i !== $range_index ) {
						$key                 = self::get_response_row_key( $date, $i );
						$sorted_rows[ $key ] = $rows[ $key ];
					}
				}
			}
		);

		return $sorted_rows;
	}

	/**
	 * Iterates over the date ranges and calls callback for each date in each range.
	 *
	 * @since 1.99.0
	 *
	 * @param Google_Service_AnalyticsData_DateRange[] $date_ranges The report date ranges.
	 * @param callable                                 $callback    The callback to execute for each date.
	 */
	protected static function iterate_date_ranges( $date_ranges, $callback ) {
		foreach ( $date_ranges as $date_range_index => $date_range ) {
			$now = strtotime( $date_range->getStartDate() );
			$end = strtotime( $date_range->getEndDate() );

			do {
				call_user_func(
					$callback,
					gmdate( 'Ymd', $now ),
					$date_range_index
				);

				$now += DAY_IN_SECONDS;
			} while ( $now <= $end );
		}
	}

}
