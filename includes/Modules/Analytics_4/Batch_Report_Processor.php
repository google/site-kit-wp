<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Batch_Report_Processor
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

/**
 * Class for processing batch Analytics 4 report results into human-readable format.
 */
class Batch_Report_Processor {

	/**
	 * Processes batch report results into human-readable format.
	 *
	 * @param array|WP_Error $batch_results Raw batch report results.
	 * @param array          $report_configs Optional. Array of report configurations with report_id.
	 * @return array|WP_Error Processed results or error.
	 */
	public function process_batch_results( $batch_results, $report_configs = array() ) {
		if ( is_wp_error( $batch_results ) ) {
			return $batch_results;
		}

		if ( empty( $batch_results['reports'] ) ) {
			return array();
		}

		$processed_reports = array();

		foreach ( $batch_results['reports'] as $index => $report ) {
			// Use report_id from config if available, otherwise fall back to index.
			$report_id                       = isset( $report_configs[ $index ]['report_id'] ) ? $report_configs[ $index ]['report_id'] : "report_$index";
			$processed_reports[ $report_id ] = $this->process_single_report( $report );
		}

		return $processed_reports;
	}

	/**
	 * Processes a single report into human-readable format.
	 *
	 * @param array $report Single report data.
	 * @return array Processed report data.
	 */
	protected function process_single_report( $report ) {
		if ( empty( $report ) ) {
			return array();
		}

		$processed = array(
			'metadata' => $this->extract_metadata( $report ),
			'totals'   => $this->extract_totals( $report ),
			'rows'     => $this->process_rows( $report ),
		);

		return $processed;
	}

	/**
	 * Extracts metadata from report.
	 *
	 * @param array $report Report data.
	 * @return array Metadata.
	 */
	protected function extract_metadata( $report ) {
		$metadata = array();

		if ( ! empty( $report['dimensionHeaders'] ) ) {
			$metadata['dimensions'] = array();
			foreach ( $report['dimensionHeaders'] as $dimension ) {
				$metadata['dimensions'][] = $dimension['name'];
			}
		}

		if ( ! empty( $report['metricHeaders'] ) ) {
			$metadata['metrics'] = array();
			foreach ( $report['metricHeaders'] as $metric ) {
				$metadata['metrics'][] = array(
					'name' => $metric['name'],
					'type' => $metric['type'] ?? 'TYPE_INTEGER',
				);
			}
		}

		$metadata['row_count'] = $report['rowCount'] ?? 0;

		return $metadata;
	}

	/**
	 * Extracts totals from report.
	 *
	 * @param array $report Report data.
	 * @return array Totals data.
	 */
	protected function extract_totals( $report ) {
		if ( empty( $report['totals'] ) ) {
			return array();
		}

		$totals = array();
		foreach ( $report['totals'] as $total_row ) {
			if ( ! empty( $total_row['metricValues'] ) ) {
				$total_values = array();
				foreach ( $total_row['metricValues'] as $index => $metric_value ) {
					$metric_name                  = $report['metricHeaders'][ $index ]['name'] ?? "metric_$index";
					$total_values[ $metric_name ] = $this->format_metric_value( $metric_value['value'], $report['metricHeaders'][ $index ]['type'] ?? 'TYPE_INTEGER' );
				}
				$totals[] = $total_values;
			}
		}

		return $totals;
	}

	/**
	 * Processes report rows into readable format.
	 *
	 * @param array $report Report data.
	 * @return array Processed rows.
	 */
	protected function process_rows( $report ) {
		if ( empty( $report['rows'] ) ) {
			return array();
		}

		$processed_rows = array();

		foreach ( $report['rows'] as $row ) {
			$processed_row = array();

			// Process dimensions.
			if ( ! empty( $row['dimensionValues'] ) && ! empty( $report['dimensionHeaders'] ) ) {
				foreach ( $row['dimensionValues'] as $index => $dimension_value ) {
					$dimension_name                                 = $report['dimensionHeaders'][ $index ]['name'];
					$processed_row['dimensions'][ $dimension_name ] = $dimension_value['value'];
				}
			}

			// Process metrics.
			if ( ! empty( $row['metricValues'] ) && ! empty( $report['metricHeaders'] ) ) {
				foreach ( $row['metricValues'] as $index => $metric_value ) {
					$metric_header = $report['metricHeaders'][ $index ];
					$metric_name   = $metric_header['name'];
					$metric_type   = $metric_header['type'] ?? 'TYPE_INTEGER';

					$processed_row['metrics'][ $metric_name ] = $this->format_metric_value( $metric_value['value'], $metric_type );
				}
			}

			$processed_rows[] = $processed_row;
		}

		return $processed_rows;
	}

	/**
	 * Formats metric value based on its type.
	 *
	 * @param string $value Raw metric value.
	 * @param string $type  Metric type.
	 * @return mixed Formatted value.
	 */
	protected function format_metric_value( $value, $type ) {
		switch ( $type ) {
			case 'TYPE_INTEGER':
				return (int) $value;
			case 'TYPE_FLOAT':
				return (float) $value;
			case 'TYPE_SECONDS':
				return $this->format_duration( (int) $value );
			case 'TYPE_MILLISECONDS':
				return $this->format_duration( (int) $value / 1000 );
			case 'TYPE_MINUTES':
				return $this->format_duration( (int) $value * 60 );
			case 'TYPE_HOURS':
				return $this->format_duration( (int) $value * 3600 );
			case 'TYPE_STANDARD':
			case 'TYPE_PERCENT':
			case 'TYPE_TIME':
			case 'TYPE_CURRENCY':
			default:
				return $value;
		}
	}

	/**
	 * Formats duration in seconds to human-readable format.
	 *
	 * @param int $seconds Duration in seconds.
	 * @return string Formatted duration.
	 */
	protected function format_duration( $seconds ) {
		if ( $seconds < 60 ) {
			return sprintf( '%d seconds', $seconds );
		}

		$minutes           = floor( $seconds / 60 );
		$remaining_seconds = $seconds % 60;

		if ( $minutes < 60 ) {
			return sprintf( '%d minutes %d seconds', $minutes, $remaining_seconds );
		}

		$hours             = floor( $minutes / 60 );
		$remaining_minutes = $minutes % 60;

		return sprintf( '%d hours %d minutes %d seconds', $hours, $remaining_minutes, $remaining_seconds );
	}

	/**
	 * Gets a summary of key metrics from processed results.
	 *
	 * @param array $processed_results Processed batch results.
	 * @return array Summary data.
	 */
	public function get_summary( $processed_results ) {
		if ( empty( $processed_results ) ) {
			return array();
		}

		$summary = array();

		foreach ( $processed_results as $report_id => $report ) {
			if ( empty( $report['totals'] ) ) {
				continue;
			}

			$report_summary = array();
			foreach ( $report['totals'] as $total ) {
				$report_summary = array_merge( $report_summary, $total );
			}

			$summary[ $report_id ] = $report_summary;
		}

		return $summary;
	}

	/**
	 * Formats processed results for display.
	 *
	 * @param array $processed_results Processed batch results.
	 * @return string Formatted output.
	 */
	public function format_for_display( $processed_results ) {
		if ( empty( $processed_results ) ) {
			return 'No data available.';
		}

		$output = '';

		foreach ( $processed_results as $report_id => $report ) {
			$output .= '=== ' . ucwords( str_replace( '_', ' ', $report_id ) ) . " ===\n";

			// Display metadata.
			if ( ! empty( $report['metadata'] ) ) {
				$output .= 'Dimensions: ' . implode( ', ', $report['metadata']['dimensions'] ?? array() ) . "\n";
				$metrics = array_column( $report['metadata']['metrics'] ?? array(), 'name' );
				$output .= 'Metrics: ' . implode( ', ', $metrics ) . "\n";
				$output .= 'Row Count: ' . ( $report['metadata']['row_count'] ?? 0 ) . "\n\n";
			}

			// Display totals.
			if ( ! empty( $report['totals'] ) ) {
				$output .= "Totals:\n";
				foreach ( $report['totals'] as $total ) {
					foreach ( $total as $metric => $value ) {
						$output .= "  $metric: $value\n";
					}
				}
				$output .= "\n";
			}

			// Display sample rows (limit to 5).
			if ( ! empty( $report['rows'] ) ) {
				$sample_rows = array_slice( $report['rows'], 0, 5 );
				$output     .= "Sample Data:\n";

				foreach ( $sample_rows as $row_index => $row ) {
					$output .= '  Row ' . ( $row_index + 1 ) . ":\n";

					if ( ! empty( $row['dimensions'] ) ) {
						foreach ( $row['dimensions'] as $dim => $value ) {
							$output .= "    $dim: $value\n";
						}
					}

					if ( ! empty( $row['metrics'] ) ) {
						foreach ( $row['metrics'] as $metric => $value ) {
							$output .= "    $metric: $value\n";
						}
					}
					$output .= "\n";
				}
			}

			$output .= "\n";
		}

		return $output;
	}
}
