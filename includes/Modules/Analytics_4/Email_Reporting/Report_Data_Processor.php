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
	 * Sums one metric for each group and each date range.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $rows            Report rows, as `Email_Report_Payload_Processor::extract_report_rows()`
	 *                                returns them.
	 * @param string $group_dimension Dimension whose value names the group, such as
	 *                                `customEvent:googlesitekit_event_provider`. An empty string
	 *                                puts every row in one group. That group's name is an
	 *                                empty string.
	 * @param string $metric_name     Metric to sum, such as `eventCount`.
	 * @return array Summed metric, by group name and date range key, such as
	 *               `array( 'woocommerce' => array( 'date_range_0' => 116.0, 'date_range_1' => 121.0 ) )`.
	 */
	public function sum_metric_by_group( $rows, $group_dimension, $metric_name ) {
		$totals = array();

		if ( ! is_array( $rows ) ) {
			return $totals;
		}

		foreach ( $rows as $row ) {
			$metric_value = $row['metrics'][ $metric_name ] ?? null;
			if ( ! is_numeric( $metric_value ) ) {
				continue;
			}

			$group_name = '' === $group_dimension
				? ''
				: ( $row['dimensions'][ $group_dimension ] ?? '' );

			$date_range_key = $row['dimensions']['dateRange'] ?? 'date_range_0';

			$totals[ $group_name ][ $date_range_key ] = ( $totals[ $group_name ][ $date_range_key ] ?? 0.0 ) + (float) $metric_value;
		}

		return $totals;
	}

	/**
	 * Computes the percentage change from the previous value to the current one.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $current  Current period value.
	 * @param mixed $previous Previous period value.
	 * @return float|null Percentage change, such as `7.2` for a rise from `100` to `107.2`. Null when
	 *                    either value is not a number. Null too when the previous value is zero,
	 *                    because a change from zero has no percentage.
	 */
	public function compute_trend( $current, $previous ) {
		if ( ! is_numeric( $current ) || ! is_numeric( $previous ) ) {
			return null;
		}

		$previous_value = (float) $previous;

		if ( 0.0 === $previous_value ) {
			return null;
		}

		return ( (float) $current - $previous_value ) / $previous_value * 100;
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

			if ( null === $comparison || 0.0 === (float) $comparison ) {
				$trends[] = null;
			} else {
				$trends[] = ( (float) $current - (float) $comparison ) / (float) $comparison * 100;
			}
		}

		return array( $values, $trends );
	}
}
