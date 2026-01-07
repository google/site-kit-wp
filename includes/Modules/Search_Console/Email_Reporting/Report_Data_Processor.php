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

		// Match JS `partitionReport` behaviour: use the most recent `$period_length` rows for the
		// current range and the preceding `$period_length` (or fewer) rows for the compare range.
		$current_rows_start = max( 0, $total_rows - $period_length );
		$current_rows       = array_slice( $rows, $current_rows_start );

		$compare_end   = $current_rows_start;
		$compare_start = max( 0, $total_rows - ( 2 * $period_length ) );
		$compare_rows  = array_slice( $rows, $compare_start, $compare_end - $compare_start );

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

	/**
	 * Calculates current period length from Search Console rows (half of combined range).
	 *
	 * @since 1.170.0
	 *
	 * @param array $rows Search Console rows.
	 * @return int|null Period length in days or null on failure.
	 */
	public function calculate_period_length_from_rows( array $rows ) {
		if ( empty( $rows ) ) {
			return null;
		}

		$dates = array();
		foreach ( $rows as $row ) {
			if ( is_array( $row ) && ! empty( $row['keys'][0] ) ) {
				$dates[] = $row['keys'][0];
			} elseif ( is_object( $row ) && isset( $row->keys[0] ) ) {
				$dates[] = $row->keys[0];
			}
		}

		if ( empty( $dates ) ) {
			return null;
		}

		sort( $dates );

		try {
			$start = new \DateTime( reset( $dates ) );
			$end   = new \DateTime( end( $dates ) );
		} catch ( \Exception $e ) {
			return null;
		}

		$diff = $start->diff( $end );
		if ( false === $diff ) {
			return null;
		}

		return max( 1, (int) floor( ( $diff->days + 1 ) / 2 ) );
	}

	/**
	 * Infers period length from combined Search Console rows (half of unique dates, rounded up).
	 *
	 * @since 1.170.0
	 *
	 * @param array $rows Search Console rows.
	 * @return int|null Period length in days or null on failure.
	 */
	public function infer_period_length_from_rows( array $rows ) {
		if ( empty( $rows ) ) {
			return null;
		}

		$dates = array();
		foreach ( $rows as $row ) {
			if ( is_array( $row ) && ! empty( $row['keys'][0] ) ) {
				$dates[] = $row['keys'][0];
			} elseif ( is_object( $row ) && isset( $row->keys[0] ) ) {
				$dates[] = $row->keys[0];
			}
		}

		$dates = array_unique( $dates );
		$count = count( $dates );
		if ( 0 === $count ) {
			return null;
		}

		return max( 1, (int) ceil( $count / 2 ) );
	}

	/**
	 * Normalizes Search Console rows to an indexed array of row arrays.
	 *
	 * @since 1.170.0
	 *
	 * @param mixed $section_data Section payload.
	 * @return array Normalized Search Console rows.
	 */
	public function normalize_rows( $section_data ) {
		if ( is_object( $section_data ) ) {
			$section_data = (array) $section_data;
		}

		if ( ! is_array( $section_data ) ) {
			return array();
		}

		if ( $this->is_sequential_array( $section_data ) ) {
			$rows = array();
			foreach ( $section_data as $row ) {
				if ( is_object( $row ) ) {
					$row = (array) $row;
				}

				if ( is_array( $row ) ) {
					$rows[] = $row;
				}
			}
			return ! empty( $rows ) ? $rows : $section_data;
		}

		return array( $section_data );
	}

	/**
	 * Returns the preferred metric key for Search Console sections.
	 *
	 * @since 1.170.0
	 *
	 * @param string $section_key Section key.
	 * @return string|null Preferred metric key or null for list sections.
	 */
	public function get_preferred_key( $section_key ) {
		if ( 'total_impressions' === $section_key ) {
			return 'impressions';
		}

		if ( 'total_clicks' === $section_key ) {
			return 'clicks';
		}

		return null;
	}

	/**
	 * Collects normalized row data (metrics/dimensions) for Search Console list sections.
	 *
	 * @since 1.170.0
	 *
	 * @param array       $rows          Normalized Search Console rows.
	 * @param string|null $preferred_key Preferred metric key or null for list sections.
	 * @param string|null $row_metric_field Optional. Metric field to collect for row metrics. Default clicks.
	 * @return array Collected row data.
	 */
	public function collect_row_data( array $rows, $preferred_key, $row_metric_field = 'clicks' ) {
		$labels            = array();
		$values_by_key     = array();
		$value_types       = array();
		$title             = '';
		$dimension_values  = array();
		$row_metric_values = array();

		foreach ( $rows as $row ) {
			if ( '' === $title && isset( $row['title'] ) && is_string( $row['title'] ) ) {
				$title = trim( $row['title'] );
			}

			$primary_key = '';
			if ( ! empty( $row['keys'][0] ) && is_string( $row['keys'][0] ) ) {
				$primary_key = $row['keys'][0];
			}

			foreach ( $row as $key => $value ) {
				if ( ! is_string( $key ) || '' === $key ) {
					continue;
				}
				if ( 'title' === $key ) {
					continue;
				}

				if ( null !== $preferred_key && $preferred_key !== $key ) {
					continue;
				}

				if ( is_array( $value ) || is_object( $value ) ) {
					continue;
				}

				$raw_value = is_string( $value ) ? trim( $value ) : $value;
				if ( '' === $raw_value ) {
					continue;
				}
				if ( ! is_numeric( $raw_value ) ) {
					continue;
				}

				if ( null === $preferred_key && $primary_key && $row_metric_field === $key ) {
					$dimension_values[]  = $this->format_dimension_value( $primary_key );
					$row_metric_values[] = (float) $raw_value;
				}

				if ( array_key_exists( $key, $values_by_key ) ) {
					$values_by_key[ $key ] += (float) $raw_value;
					continue;
				}

				$labels[]              = $key;
				$values_by_key[ $key ] = (float) $raw_value;
				$value_types[]         = 'TYPE_STANDARD';
			}
		}

		return array(
			'title'             => $title,
			'labels'            => $labels,
			'values_by_key'     => $values_by_key,
			'value_types'       => $value_types,
			'dimension_values'  => $dimension_values,
			'row_metric_values' => $row_metric_values,
		);
	}

	/**
	 * Limits list-style results to a specific number of rows.
	 *
	 * @since 1.170.0
	 *
	 * @param array $values           Metric values.
	 * @param array $dimension_values Dimension values.
	 * @param int   $limit            Maximum number of rows.
	 * @return array Array with limited values and dimension values.
	 */
	public function limit_list_results( array $values, array $dimension_values, $limit ) {
		if ( $limit <= 0 ) {
			return array( $values, $dimension_values );
		}

		return array(
			array_slice( $values, 0, $limit ),
			array_slice( $dimension_values, 0, $limit ),
		);
	}

	/**
	 * Formats a dimension value (adds URL metadata when applicable).
	 *
	 * @since 1.170.0
	 *
	 * @param string $value Dimension value.
	 * @return string|array
	 */
	public function format_dimension_value( $value ) {
		if ( filter_var( $value, FILTER_VALIDATE_URL ) ) {
			return array(
				'label' => $value,
				'url'   => $value,
			);
		}

		return $value;
	}

	/**
	 * Determines whether an array uses sequential integer keys starting at zero.
	 *
	 * @since 1.170.0
	 *
	 * @param array $data Array to test.
	 * @return bool Whether the array uses sequential integer keys starting at zero.
	 */
	protected function is_sequential_array( $data ) {
		if ( empty( $data ) ) {
			return true;
		}

		return array_keys( $data ) === range( 0, count( $data ) - 1 );
	}
}
