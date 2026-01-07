<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Report_Data_Processor
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Email_Reporting;

/**
 * Processes Analytics 4 report data for email reporting.
 *
 * @since 1.170.0
 * @access private
 * @ignore
 */
class Report_Data_Processor {

	/**
	 * Returns analytics dimensions excluding helper values.
	 *
	 * @since 1.170.0
	 *
	 * @param array $processed_report Processed report data.
	 * @return array Dimensions.
	 */
	public function get_analytics_dimensions( $processed_report ) {
		$dimensions = isset( $processed_report['metadata']['dimensions'] ) && is_array( $processed_report['metadata']['dimensions'] ) ? $processed_report['metadata']['dimensions'] : array();

		return array_values(
			array_filter(
				$dimensions,
				static function ( $dimension ) {
					return 'dateRange' !== $dimension;
				}
			)
		);
	}

	/**
	 * Builds metric labels, types, and names from metric metadata.
	 *
	 * @since 1.170.0
	 *
	 * @param array $metrics Metric metadata.
	 * @return array Array with labels, value types, and metric names.
	 */
	public function get_metric_metadata( $metrics ) {
		$labels       = array();
		$value_types  = array();
		$metric_names = array();

		foreach ( $metrics as $metric_meta ) {
			$metric_name    = $metric_meta['name'];
			$metric_names[] = $metric_name;
			$labels[]       = $metric_meta['name'];
			$value_types[]  = $metric_meta['type'] ?? 'TYPE_STANDARD';
		}

		return array( $labels, $value_types, $metric_names );
	}

	/**
	 * Aggregates metric values per primary dimension and date range.
	 *
	 * @since 1.170.0
	 *
	 * @param array $dimensions      Dimensions list.
	 * @param array $rows            Report rows.
	 * @param array $metric_names    Metric names.
	 * @return array Tuple of dimension values and aggregated metrics.
	 */
	public function aggregate_dimension_metrics( $dimensions, $rows, $metric_names ) {
		$dimension_values  = array();
		$dimension_metrics = array();

		if ( empty( $dimensions ) || empty( $rows ) || empty( $metric_names ) || ! is_array( $rows ) ) {
			return array( $dimension_values, $dimension_metrics );
		}

		$primary_dimension = $dimensions[0];

		foreach ( $rows as $row ) {
			if ( ! isset( $row['dimensions'][ $primary_dimension ] ) ) {
				continue;
			}

			$dimension_value = $row['dimensions'][ $primary_dimension ];
			if ( '' === $dimension_value ) {
				continue;
			}

			$dimension_values[ $dimension_value ] = isset( $dimensions[1], $row['dimensions'][ $dimensions[1] ] )
				? array(
					'label' => $dimension_value,
					'url'   => $row['dimensions'][ $dimensions[1] ],
				)
				: $dimension_value;

			foreach ( $metric_names as $metric_name ) {
				if ( ! isset( $row['metrics'][ $metric_name ] ) ) {
					continue;
				}

				$metric_value = $row['metrics'][ $metric_name ];
				if ( ! is_numeric( $metric_value ) ) {
					continue;
				}

				$date_range_key = $row['dimensions']['dateRange'] ?? 'date_range_0';
				if ( ! isset( $dimension_metrics[ $dimension_value ][ $metric_name ][ $date_range_key ] ) ) {
					$dimension_metrics[ $dimension_value ][ $metric_name ][ $date_range_key ] = 0;
				}

				$dimension_metrics[ $dimension_value ][ $metric_name ][ $date_range_key ] += floatval( $metric_value );
			}
		}

		return array( array_values( $dimension_values ), $dimension_metrics );
	}

	/**
	 * Applies per-dimension aggregates to values and trends when available.
	 *
	 * @since 1.170.0
	 *
	 * @param array $values            Base values.
	 * @param array $trends            Base trends.
	 * @param array $dimension_values  Dimension values.
	 * @param array $dimension_metrics Aggregated dimension metrics.
	 * @param array $metric_names      Metric names.
	 * @return array Tuple of values and trends.
	 */
	public function apply_dimension_aggregates( $values, $trends, $dimension_values, $dimension_metrics, $metric_names ) {
		if ( empty( $dimension_metrics ) || empty( $metric_names ) ) {
			return array( $values, $trends );
		}

		$values      = array();
		$trends      = array();
		$metric_name = $metric_names[0];

		foreach ( $dimension_values as $dimension_value_entry ) {
			$dimension_value = is_array( $dimension_value_entry ) ? ( $dimension_value_entry['label'] ?? '' ) : $dimension_value_entry;

			$current    = $dimension_metrics[ $dimension_value ][ $metric_name ]['date_range_0'] ?? null;
			$comparison = $dimension_metrics[ $dimension_value ][ $metric_name ]['date_range_1'] ?? null;

			$values[] = null === $current ? null : $current;

			if ( null === $comparison || 0 === $comparison ) {
				$trends[] = null;
			} else {
				$trends[] = ( (float) $current - (float) $comparison ) / (float) $comparison * 100;
			}
		}

		return array( $values, $trends );
	}
}
