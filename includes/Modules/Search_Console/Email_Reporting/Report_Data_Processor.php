<?php
/**
 * Class Google\Site_Kit\Modules\Search_Console\Email_Reporting\Report_Data_Processor
 *
 * @package   Google\Site_Kit\Modules\Search_Console\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Search_Console\Email_Reporting;

/**
 * Processes Search Console data for email reporting (sorting, partitioning, summarizing).
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Report_Data_Processor {

	/**
	 * Sorts Search Console rows by a given field.
	 *
	 * @since 1.167.0
	 *
	 * @param array  $rows  Search Console rows (arrays or objects).
	 * @param string $field Field name such as 'ctr', 'clicks', etc.
	 * @param string $order Optional. 'asc' or 'desc'. Default 'desc'.
	 * @return array Sorted rows.
	 */
	public function sort_rows_by_field( array $rows, $field, $order = 'desc' ) {
		$direction = ( 'asc' === strtolower( $order ) ) ? 'asc' : 'desc';

		usort(
			$rows,
			function ( $a, $b ) use ( $field, $direction ) {
				$value_a = $this->extract_row_value( $a, $field );
				$value_b = $this->extract_row_value( $b, $field );

				if ( $value_a === $value_b ) {
					return 0;
				}

				if ( 'asc' === $direction ) {
					return ( $value_a < $value_b ) ? -1 : 1;
				}

				return ( $value_a > $value_b ) ? -1 : 1;
			}
		);

		return $rows;
	}

	/**
	 * Partitions rows into compare and current periods.
	 *
	 * @since 1.167.0
	 *
	 * @param array $rows          Combined-period rows returned from the API.
	 * @param int   $period_length Number of days within a period.
	 * @return array Partitioned rows, holding rows for earlier and current periods.
	 */
	public function partition_rows_by_period( array $rows, $period_length ) {
		if ( $period_length <= 0 || empty( $rows ) ) {
			return array(
				'compare' => array(),
				'current' => $rows,
			);
		}

		$total_rows = count( $rows );
		$window     = min( $period_length, $total_rows );

		$compare_rows = array_slice( $rows, 0, $window );
		$current_rows = array_slice( $rows, - $window, $window );

		return array(
			'compare' => $compare_rows,
			'current' => $current_rows,
		);
	}

	/**
	 * Calculates field totals for compare/current periods.
	 *
	 * @since 1.167.0
	 *
	 * @param array  $rows          Combined-period rows returned from the API.
	 * @param string $field         Field name to sum (e.g. impressions, clicks, ctr).
	 * @param int    $period_length Number of days within a period.
	 * @return array Period totals, holding summed field values for compare and current periods.
	 */
	public function sum_field_by_period( array $rows, $field, $period_length ) {
		$partitioned = $this->partition_rows_by_period( $rows, $period_length );

		return array(
			'compare' => $this->sum_rows_field( $partitioned['compare'], $field ),
			'current' => $this->sum_rows_field( $partitioned['current'], $field ),
		);
	}

	/**
	 * Sums a numeric field across the provided rows.
	 *
	 * @since 1.167.0
	 *
	 * @param array  $rows  Row list.
	 * @param string $field Field name.
	 * @return float Aggregated numeric total for the requested field.
	 */
	private function sum_rows_field( array $rows, $field ) {
		$total = 0.0;

		foreach ( $rows as $row ) {
			$total += $this->extract_row_value( $row, $field );
		}

		return $total;
	}

	/**
	 * Safely extracts a scalar value from a Search Console row.
	 *
	 * @since 1.167.0
	 *
	 * @param array|object $row   Row data.
	 * @param string       $field Field to extract.
	 * @return float Numeric value (defaults to 0).
	 */
	private function extract_row_value( $row, $field ) {
		if ( is_array( $row ) ) {
			return (float) ( $row[ $field ] ?? 0 );
		}

		if ( is_object( $row ) && isset( $row->{$field} ) ) {
			return (float) $row->{$field};
		}

		return 0.0;
	}
}
