<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Report_Payload_Processor
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

/**
 * Helper class to normalize and process report payloads for email sections.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Email_Report_Payload_Processor {

	/**
	 * Processes batch reports into a normalized structure.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $batch_results  Raw batch report results.
	 * @param array $report_configs Optional. Additional report config metadata keyed by index.
	 * @return array Processed reports keyed by report identifier.
	 */
	public function process_batch_reports( $batch_results, $report_configs = array() ) {
		$reports = array();

		if ( isset( $batch_results['reports'] ) && is_array( $batch_results['reports'] ) ) {
			$reports = $batch_results['reports'];
		} elseif ( wp_is_numeric_array( $batch_results ) ) {
			$reports = $batch_results;
		} else {
			foreach ( $batch_results as $value ) {
				if ( is_array( $value ) ) {
					$reports[] = $value;
				}
			}
		}

		if ( empty( $reports ) ) {
			return array();
		}

		$processed_reports = array();

		foreach ( $reports as $index => $report ) {
			if ( empty( $report ) || ! is_array( $report ) ) {
				continue;
			}

			$report_id = 'report_' . $index;
			if ( isset( $report_configs[ $index ]['report_id'] ) ) {
				$report_id = $report_configs[ $index ]['report_id'];
			} else if ( isset( $report['reportId'] ) {
				$report_id =  $report['reportId'];
			}

			$processed_reports[ $report_id ] = $this->process_single_report( $report );
		}

		return $processed_reports;
	}

	/**
	 * Compute date range array from meta.
	 *
	 * @since n.e.x.t
	 *
	 * @param array|null $date_range Date meta, must contain startDate/endDate if provided.
	 * @return array|null
	 */
	public function compute_date_range( $date_range ) {
		if ( ! is_array( $date_range ) ) {
			return null;
		}

		if ( empty( $date_range['startDate'] ) || empty( $date_range['endDate'] ) ) {
			return null;
		}
		$start = $date_range['startDate'];
		$end   = $date_range['endDate'];

		$compare_start = null;
		$compare_end   = null;
		if ( array_key_exists( 'compareStartDate', $date_range ) && array_key_exists( 'compareEndDate', $date_range ) ) {
			$compare_start = $date_range['compareStartDate'];
			$compare_end   = $date_range['compareEndDate'];
		}

		// Ensure dates are localized strings (Y-m-d) using site timezone.
		$timezone = function_exists( 'wp_timezone' ) ? wp_timezone() : null;
		if ( function_exists( 'wp_date' ) && $timezone ) {
			$start_timestamp = strtotime( $start );
			$end_timestamp   = strtotime( $end );
			if ( false !== $start_timestamp && false !== $end_timestamp ) {
				$start = wp_date( 'Y-m-d', $start_timestamp, $timezone );
				$end   = wp_date( 'Y-m-d', $end_timestamp, $timezone );
			}
			if ( null !== $compare_start && null !== $compare_end ) {
				$compare_start_timestamp = strtotime( $compare_start );
				$compare_end_timestamp   = strtotime( $compare_end );
				if ( false !== $compare_start_timestamp && false !== $compare_end_timestamp ) {
					$compare_start = wp_date( 'Y-m-d', $compare_start_timestamp, $timezone );
					$compare_end   = wp_date( 'Y-m-d', $compare_end_timestamp, $timezone );
				}
			}
		}

		$date_range_normalized = array(
			'startDate' => $start,
			'endDate'   => $end,
		);
		if ( null !== $compare_start && null !== $compare_end ) {
			$date_range_normalized['compareStartDate'] = $compare_start;
			$date_range_normalized['compareEndDate']   = $compare_end;
		}

		return $date_range_normalized;
	}

	/**
	 * Processes a single report into a normalized structure.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $report Single report data.
	 * @return array Normalized report data.
	 */
	public function process_single_report( $report ) {
		if ( empty( $report ) ) {
			return array();
		}

		return array(
			'metadata' => $this->extract_report_metadata( $report ),
			'totals'   => $this->extract_report_totals( $report ),
			'rows'     => $this->extract_report_rows( $report ),
		);
	}

	/**
	 * Extracts report metadata (dimensions, metrics, row count).
	 *
	 * @since n.e.x.t
	 *
	 * @param array $report Report payload.
	 * @return array Report metadata.
	 */
	public function extract_report_metadata( $report ) {
		$metadata = array();

		if ( ! empty( $report['dimensionHeaders'] ) ) {
			$metadata['dimensions'] = array();
			foreach ( $report['dimensionHeaders'] as $dimension ) {
				if ( empty( $dimension['name'] ) ) {
					continue;
				}
				$metadata['dimensions'][] = (string) $dimension['name'];
			}
		}

		if ( ! empty( $report['metricHeaders'] ) ) {
			$metadata['metrics'] = array();
			foreach ( $report['metricHeaders'] as $metric ) {
				if ( empty( $metric['name'] ) ) {
					continue;
				}
				$metadata['metrics'][] = array(
					'name' => (string) $metric['name'],
					'type' => isset( $metric['type'] ) ? (string) $metric['type'] : 'TYPE_INTEGER',
				);
			}
		}

		if ( isset( $report['title'] ) ) {
			$metadata['title'] = $report['title'];
		}

		$metadata['row_count'] = isset( $report['rowCount'] ) ? $report['rowCount'] : 0;

		return $metadata;
	}

	/**
	 * Extracts totals from the report payload.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $report Report payload.
	 * @return array Array of totals keyed by metric name.
	 */
	public function extract_report_totals( $report ) {
		if ( empty( $report['totals'] ) || ! is_array( $report['totals'] ) ) {
			return array();
		}

		$totals         = array();
		$metric_headers = isset( $report['metricHeaders'] ) && is_array( $report['metricHeaders'] ) ? $report['metricHeaders'] : array();

		foreach ( $report['totals'] as $total_row ) {
			if ( empty( $total_row['metricValues'] ) || ! is_array( $total_row['metricValues'] ) ) {
				continue;
			}

			$total_values = array();
			foreach ( $total_row['metricValues'] as $index => $metric_value ) {
				$metric_header = isset( $metric_headers[ $index ] ) ? $metric_headers[ $index ] : array();
				$metric_name   = isset( $metric_header['name'] ) ? (string) $metric_header['name'] : sprintf( 'metric_%d', $index );
				$value         = isset( $metric_value['value'] ) ? $metric_value['value'] : null;

				$total_values[ $metric_name ] = $value;
			}

			$totals[] = $total_values;
		}

		return $totals;
	}

	/**
	 * Extracts rows from the report payload into a normalized structure.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $report Report payload.
	 * @return array Processed rows including dimensions and metrics.
	 */
	public function extract_report_rows( $report ) {
		if ( empty( $report['rows'] ) || ! is_array( $report['rows'] ) ) {
			return array();
		}

		$processed_rows    = array();
		$dimension_headers = isset( $report['dimensionHeaders'] ) ? $report['dimensionHeaders'] : array();
		$metric_headers    = isset( $report['metricHeaders'] ) ? $report['metricHeaders'] : array();

		foreach ( $report['rows'] as $row ) {
			$processed_row = array();

			if ( ! empty( $row['dimensionValues'] ) && is_array( $row['dimensionValues'] ) ) {
				foreach ( $row['dimensionValues'] as $index => $dimension_value ) {
					$dimension_header = isset( $dimension_headers[ $index ] ) ? $dimension_headers[ $index ] : array();
					if ( empty( $dimension_header['name'] ) ) {
						continue;
					}
					$processed_row['dimensions'][ $dimension_header['name'] ] = isset( $dimension_value['value'] ) ? $dimension_value['value'] : null;
				}
			}

			if ( ! empty( $row['metricValues'] ) && is_array( $row['metricValues'] ) ) {
				foreach ( $row['metricValues'] as $index => $metric_value ) {
					$metric_header = isset( $metric_headers[ $index ] ) ? $metric_headers[ $index ] : array();
					if ( empty( $metric_header['name'] ) ) {
						continue;
					}
					$processed_row['metrics'][ $metric_header['name'] ] = isset( $metric_value['value'] ) ? $metric_value['value'] : null;
				}
			}

			$processed_rows[] = $processed_row;
		}

		return $processed_rows;
	}

	/**
	 * Extracts metric values for a specific dimension value.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $rows             Processed rows.
	 * @param string $dimension_name   Dimension name to match.
	 * @param string $dimension_value  Expected dimension value.
	 * @param array  $metric_names     Metrics to extract in order.
	 * @return array
	 */
	public function extract_metric_values_for_dimension( $rows, $dimension_name, $dimension_value, $metric_names ) {
		foreach ( $rows as $row ) {
			if ( empty( $row['dimensions'][ $dimension_name ] ) ) {
				continue;
			}

			if ( (string) $row['dimensions'][ $dimension_name ] !== (string) $dimension_value ) {
				continue;
			}

			$metrics = isset( $row['metrics'] ) && is_array( $row['metrics'] ) ? $row['metrics'] : array();
			$values  = array();

			foreach ( $metric_names as $metric_name ) {
				$values[] = array_key_exists( $metric_name, $metrics ) ? $metrics[ $metric_name ] : null;
			}

			return $values;
		}

		return array();
	}

	/**
	 * Computes metric values and trends for a report.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $report       Processed report data.
	 * @param array $metric_names Ordered list of metric names.
	 * @return array
	 */
	public function compute_metric_values_and_trends( $report, $metric_names ) {
		$values = array();
		$trends = null;

		$totals = isset( $report['totals'] ) && is_array( $report['totals'] ) ? $report['totals'] : array();
		$rows   = isset( $report['rows'] ) && is_array( $report['rows'] ) ? $report['rows'] : array();

		$current_values    = $this->extract_metric_values_for_dimension( $rows, 'dateRange', 'date_range_0', $metric_names );
		$comparison_values = $this->extract_metric_values_for_dimension( $rows, 'dateRange', 'date_range_1', $metric_names );

		if ( ! empty( $current_values ) ) {
			$values = $current_values;
		} elseif ( ! empty( $totals ) ) {
			$primary_totals = reset( $totals );
			foreach ( $metric_names as $metric_name ) {
				$values[] = isset( $primary_totals[ $metric_name ] ) ? $primary_totals[ $metric_name ] : null;
			}
		}

		if ( empty( $values ) ) {
			foreach ( $metric_names as $unused ) {
				$values[] = null;
			}
		}

		if ( ! empty( $current_values ) && ! empty( $comparison_values ) ) {
			$trends = array();
			foreach ( $metric_names as $index => $metric_name ) {
				$current    = isset( $current_values[ $index ] ) ? $current_values[ $index ] : null;
				$comparison = isset( $comparison_values[ $index ] ) ? $comparison_values[ $index ] : null;

				$trends[] = $this->compute_trend( $current, $comparison );
			}
		} elseif ( count( $totals ) > 1 ) {
			$primary_totals    = $totals[0];
			$comparison_totals = $totals[1];
			$trends            = array();

			foreach ( $metric_names as $metric_name ) {
				$current    = isset( $primary_totals[ $metric_name ] ) ? $primary_totals[ $metric_name ] : null;
				$comparison = isset( $comparison_totals[ $metric_name ] ) ? $comparison_totals[ $metric_name ] : null;

				$trends[] = $this->compute_trend( $current, $comparison );
			}
		}

		return array( $values, $trends );
	}

	/**
	 * Computes the trend percentage between two numeric values.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $current    Current value.
	 * @param mixed $comparison Comparison value.
	 * @return float|null
	 */
	private function compute_trend( $current, $comparison ) {
		if ( is_numeric( $current ) && is_numeric( $comparison ) && 0.0 !== (float) $comparison ) {
			return ( (float) $current - (float) $comparison ) / (float) $comparison * 100;
		}

		return null;
	}
}
