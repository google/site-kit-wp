<?php
/**
 * Class Google\Site_Kit\Modules\Search_Console\Email_Reporting\Report_Data_Builder
 *
 * @package   Google\Site_Kit\Modules\Search_Console\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Search_Console\Email_Reporting;

use Google\Site_Kit\Modules\Search_Console\Email_Reporting\Report_Data_Processor;
use WP_Error;

/**
 * Builds Search Console email section payloads.
 *
 * @since 1.170.0
 * @access private
 * @ignore
 */
class Report_Data_Builder {

	/**
	 * Data processor instance.
	 *
	 * @since 1.170.0
	 * @var Report_Data_Processor
	 */
	protected $processor;

	/**
	 * Constructor.
	 *
	 * @since 1.170.0
	 *
	 * @param Report_Data_Processor|null $processor Optional. Data processor instance.
	 */
	public function __construct( ?Report_Data_Processor $processor = null ) {
		$this->processor = $processor ?? new Report_Data_Processor();
	}

	/**
	 * Builds section payloads from Search Console module data.
	 *
	 * @since 1.170.0
	 *
	 * @param array    $module_payload        Module payload keyed by section slug.
	 * @param int|null $current_period_length Optional. Current period length in days.
	 * @return array|WP_Error Section payloads or WP_Error.
	 */
	public function build_sections_from_module_payload( $module_payload, $current_period_length = null ) {
		$sections = array();

		foreach ( $module_payload as $section_key => $section_data ) {
			$error = $this->get_section_error( $section_data );
			if ( $error instanceof WP_Error ) {
				return $error;
			}

			// If compare/current are provided (for list sections), pass through unchanged.
			if ( is_array( $section_data ) && isset( $section_data['current'] ) ) {
				$rows = $section_data;
			} else {
				$rows = $this->processor->normalize_rows( $section_data );
			}
			if ( empty( $rows ) ) {
				continue;
			}

			$section = $this->build_section_payload_from_search_console( $rows, $section_key, $current_period_length );
			if ( $section ) {
				$sections[] = $section;
			}
		}

		return $sections;
	}

	/**
	 * Extracts any WP_Error from the section data.
	 *
	 * @since 1.170.0
	 *
	 * @param mixed $section_data Section payload.
	 * @return WP_Error|null WP_Error instance when present, otherwise null.
	 */
	private function get_section_error( $section_data ) {
		if ( is_wp_error( $section_data ) ) {
			return $section_data;
		}

		if ( is_array( $section_data ) ) {
			foreach ( $section_data as $value ) {
				if ( is_wp_error( $value ) ) {
					return $value;
				}
			}
		}

		return null;
	}

	/**
	 * Builds a section payload from Search Console report data.
	 *
	 * @since 1.170.0
	 *
	 * @param array    $search_console_data Search Console report rows.
	 * @param string   $section_key         Section key identifier.
	 * @param int|null $current_period      Optional. Current period length in days.
	 * @return array|null Section payload array, or null if data is invalid.
	 */
	public function build_section_payload_from_search_console( $search_console_data, $section_key, $current_period = null ) {
		if ( empty( $search_console_data ) ) {
			return null;
		}

		// When we have compare/current bundled, merge to compute per-key trends.
		if ( isset( $search_console_data['current'] ) ) {
			if ( in_array( $section_key, array( 'keywords_ctr_increase', 'pages_clicks_increase' ), true ) ) {
				$metric_field = 'keywords_ctr_increase' === $section_key ? 'ctr' : 'clicks';
				$is_ctr       = 'keywords_ctr_increase' === $section_key;

				return $this->build_growth_list_with_compare(
					$section_key,
					$search_console_data['current'],
					$search_console_data['compare'] ?? array(),
					$metric_field,
					$is_ctr
				);
			}

			return $this->build_list_with_compare(
				$section_key,
				$search_console_data['current'],
				$search_console_data['compare'] ?? array()
			);
		}

		$preferred_key = $this->processor->get_preferred_key( $section_key );
		$row_metric    = ( 'top_ctr_keywords' === $section_key ) ? 'ctr' : 'clicks';

		if ( null === $preferred_key ) {
			// Sort list sections by the primary metric before limiting/formatting.
			$search_console_data = $this->processor->sort_rows_by_field( $search_console_data, $row_metric, 'desc' );
		}

		$row_data = $this->processor->collect_row_data( $search_console_data, $preferred_key, $row_metric );

		if ( null !== $preferred_key ) {
			return $this->build_totals_section_payload( $search_console_data, $section_key, $preferred_key, $row_data['title'], $current_period );
		}

		return $this->build_list_section_payload( $section_key, $row_data );
	}

	/**
	 * Builds a totals-style section payload (impressions/clicks).
	 *
	 * @since 1.170.0
	 *
	 * @param array    $search_console_data Search Console rows.
	 * @param string   $section_key         Section key.
	 * @param string   $preferred_key       Preferred metric key.
	 * @param string   $title               Section title.
	 * @param int|null $current_period      Optional. Current period length in days.
	 * @return array Section payload.
	 */
	protected function build_totals_section_payload( $search_console_data, $section_key, $preferred_key, $title, $current_period = null ) {
		$trends        = null;
		$period_length = $current_period ?? $this->processor->infer_period_length_from_rows( $search_console_data );
		$period_length = max( 1, $period_length ?? 1 );

		// Prevent using a window larger than half of the available rows (combined compare+current),
		// matching the JS dashboard behaviour for two-period Search Console reports.
		$max_window    = max( 1, (int) ceil( count( $search_console_data ) / 2 ) );
		$period_length = min( $period_length, $max_window );

		$totals = $this->processor->sum_field_by_period( $search_console_data, $preferred_key, $period_length );

		$current_total = $totals['current'];
		$compare_total = $totals['compare'];

		$values = array( $this->format_value( $current_total ) );
		if ( 0.0 === $compare_total ) {
			$trends = array( null );
		} else {
			$trends = array( ( $current_total - $compare_total ) / $compare_total * 100 );
		}

		return array(
			'section_key'      => $section_key,
			'title'            => $title,
			'labels'           => array( $preferred_key ),
			'event_names'      => array( $preferred_key ),
			'values'           => $values,
			'value_types'      => array( 'TYPE_STANDARD' ),
			'trends'           => $trends,
			'trend_types'      => array( 'TYPE_STANDARD' ),
			'dimensions'       => array(),
			'dimension_values' => array(),
			'date_range'       => null,
		);
	}

	/**
	 * Formats numeric values with K/M suffixes for readability.
	 *
	 * @since 1.170.0
	 *
	 * @param mixed $value Numeric value.
	 * @return string|mixed Formatted value or original when non-numeric.
	 */
	protected function format_value( $value ) {
		if ( ! is_numeric( $value ) ) {
			return $value;
		}

		$number = (float) $value;
		$abs    = abs( $number );

		if ( $abs >= 1000000000 ) {
			return sprintf(
				'%s%s',
				number_format_i18n( $number / 1000000000, 1 ),
				_x( 'B', 'billions abbreviation', 'google-site-kit' )
			);
		}

		if ( $abs >= 1000000 ) {
			return sprintf(
				'%s%s',
				number_format_i18n( $number / 1000000, 1 ),
				_x( 'M', 'millions abbreviation', 'google-site-kit' )
			);
		}

		if ( $abs >= 1000 ) {
			return sprintf(
				'%s%s',
				number_format_i18n( $number / 1000, 1 ),
				_x( 'K', 'thousands abbreviation', 'google-site-kit' )
			);
		}

		return number_format_i18n( $number );
	}

	/**
	 * Builds a list-style section payload (keywords/pages).
	 *
	 * @since 1.170.0
	 *
	 * @param string $section_key Section key.
	 * @param array  $row_data    Collected row data.
	 * @return array|null Section payload or null on empty data.
	 */
	protected function build_list_section_payload( $section_key, $row_data ) {
		$labels            = $row_data['labels'];
		$value_types       = $row_data['value_types'];
		$dimension_values  = $row_data['dimension_values'];
		$row_metric_values = $row_data['row_metric_values'];
		$values_by_key     = $row_data['values_by_key'];
		$title             = $row_data['title'];
		$trends            = null;

		$is_list_section = in_array( $section_key, array( 'top_ctr_keywords', 'top_pages_by_clicks' ), true );
		if ( $is_list_section && ! empty( $row_metric_values ) && ! empty( $dimension_values ) ) {
			list( $row_metric_values, $dimension_values ) = $this->processor->limit_list_results( $row_metric_values, $dimension_values, 3 );
		}

		if ( ! empty( $row_metric_values ) && ! empty( $dimension_values ) ) {
			$values = $row_metric_values;
			// No compare-period data is available for list sections; treat them as new (100% increase).
			$trends      = array_fill( 0, count( $values ), 100 );
			$labels      = array( 'clicks' );
			$value_types = array( 'TYPE_STANDARD' );
		} elseif ( empty( $labels ) ) {
			return null;
		} else {
			$values = array_values( $values_by_key );
		}

		if ( null === $trends && ! empty( $values ) ) {
			$trends = array_fill( 0, count( $values ), 100 );
		}

		$payload = array(
			'section_key'      => $section_key,
			'title'            => $title,
			'labels'           => $labels,
			'event_names'      => $labels,
			'values'           => $values,
			'value_types'      => $value_types,
			'trends'           => $trends,
			'trend_types'      => $value_types,
			'dimensions'       => array(),
			'dimension_values' => $dimension_values,
			'date_range'       => null,
		);

		if ( 'top_ctr_keywords' === $section_key && ! empty( $payload['values'] ) ) {
			$payload['values'] = array_map(
				function ( $value ) {
					if ( null === $value || '' === $value ) {
						return $value;
					}

					return round( (float) $value * 100, 1 ) . '%';
				},
				$payload['values']
			);
		}

		return $payload;
	}

	/**
	 * Builds list payload using current/compare Search Console rows.
	 *
	 * @since 1.170.0
	 *
	 * @param string $section_key   Section key.
	 * @param array  $current_rows  Current period rows.
	 * @param array  $compare_rows  Compare period rows.
	 * @return array|null Section payload.
	 */
	protected function build_list_with_compare( $section_key, $current_rows, $compare_rows ) {
		$current_rows = $this->processor->normalize_rows( $current_rows );
		$compare_rows = $this->processor->normalize_rows( $compare_rows );

		$metric_field     = ( 'top_ctr_keywords' === $section_key ) ? 'ctr' : 'clicks';
		$is_ctr_section   = 'top_ctr_keywords' === $section_key;
		$current_rows     = $this->processor->sort_rows_by_field( $current_rows, $metric_field, 'desc' );
		$current_rows     = array_slice( $current_rows, 0, 3 );
		$compare_by_key   = array();
		$labels           = array();
		$values           = array();
		$trends           = array();
		$dimension_values = array();

		foreach ( $compare_rows as $row ) {
			$key = isset( $row['keys'][0] ) ? $row['keys'][0] : '';
			if ( '' === $key ) {
				continue;
			}
			$compare_by_key[ $key ] = $row[ $metric_field ] ?? 0;
		}

		foreach ( $current_rows as $row ) {
			$key = isset( $row['keys'][0] ) ? $row['keys'][0] : '';
			if ( '' === $key ) {
				continue;
			}

			$current_value = isset( $row[ $metric_field ] ) ? (float) $row[ $metric_field ] : 0.0;
			$compare_value = isset( $compare_by_key[ $key ] ) ? (float) $compare_by_key[ $key ] : null;

			$labels[] = $key;

			if ( $is_ctr_section ) {
				$values[] = round( $current_value * 100, 1 ) . '%';
			} else {
				$values[] = $current_value;
			}

			// If compare value is null or zero, treat as new (100% increase).
			if ( null === $compare_value || 0.0 === $compare_value ) {
				$trends[] = 100;
			} else {
				$trends[] = ( ( $current_value - $compare_value ) / $compare_value ) * 100;
			}

			$dimension_values[] = $this->processor->format_dimension_value( $key );
		}

		if ( empty( $labels ) ) {
			return null;
		}

		return array(
			'section_key'      => $section_key,
			'title'            => '',
			'labels'           => $labels,
			'event_names'      => $labels,
			'values'           => $values,
			'value_types'      => array_fill( 0, count( $values ), 'TYPE_STANDARD' ),
			'trends'           => $trends,
			'trend_types'      => array_fill( 0, count( $trends ), 'TYPE_STANDARD' ),
			'dimensions'       => array(),
			'dimension_values' => $dimension_values,
			'date_range'       => null,
		);
	}

	/**
	 * Builds list payload for biggest increases (CTR or clicks) using current/compare rows.
	 *
	 * @since 1.170.0
	 *
	 * @param string $section_key  Section key.
	 * @param array  $current_rows Current period rows.
	 * @param array  $compare_rows Compare period rows.
	 * @param string $metric_field Metric field name (ctr or clicks).
	 * @param bool   $is_ctr       Whether the metric is CTR.
	 * @return array|null Section payload.
	 */
	protected function build_growth_list_with_compare( $section_key, $current_rows, $compare_rows, $metric_field, $is_ctr ) {
		$current_rows = $this->processor->normalize_rows( $current_rows );
		$compare_rows = $this->processor->normalize_rows( $compare_rows );

		$compare_by_key = array();
		foreach ( $compare_rows as $row ) {
			$key = isset( $row['keys'][0] ) ? $row['keys'][0] : '';
			if ( '' === $key ) {
				continue;
			}
			$compare_by_key[ $key ] = isset( $row[ $metric_field ] ) ? (float) $row[ $metric_field ] : 0.0;
		}

		$entries = array();

		foreach ( $current_rows as $row ) {
			$key = isset( $row['keys'][0] ) ? $row['keys'][0] : '';
			if ( '' === $key ) {
				continue;
			}

			$current_value = isset( $row[ $metric_field ] ) ? (float) $row[ $metric_field ] : 0.0;
			$compare_value = $compare_by_key[ $key ] ?? null;
			$delta         = ( null === $compare_value ) ? $current_value : $current_value - (float) $compare_value;

			// Only keep increases.
			if ( $delta <= 0 ) {
				continue;
			}

			$entries[] = array(
				'label'           => $key,
				'value'           => $current_value,
				'delta'           => $delta,
				'dimension_value' => $this->processor->format_dimension_value( $key ),
			);
		}

		if ( empty( $entries ) ) {
			return null;
		}

		usort(
			$entries,
			static function ( $a, $b ) {
				return $a['delta'] < $b['delta'] ? 1 : -1;
			}
		);

		$entries = array_slice( $entries, 0, 3 );

		$labels           = array();
		$values           = array();
		$trends           = array();
		$dimension_values = array();

		foreach ( $entries as $entry ) {
			$labels[] = $entry['label'];
			if ( $is_ctr ) {
				$values[] = round( $entry['value'] * 100, 1 ) . '%';
				$trends[] = round( $entry['delta'] * 100, 1 );
			} else {
				$values[] = $entry['value'];
				$trends[] = $entry['delta'];
			}
			$dimension_values[] = $entry['dimension_value'];
		}

		if ( empty( $labels ) ) {
			return null;
		}

		return array(
			'section_key'      => $section_key,
			'title'            => '',
			'labels'           => $labels,
			'event_names'      => $labels,
			'values'           => $values,
			'value_types'      => array_fill( 0, count( $values ), 'TYPE_STANDARD' ),
			'trends'           => $trends,
			'trend_types'      => array_fill( 0, count( $trends ), 'TYPE_STANDARD' ),
			'dimensions'       => array(),
			'dimension_values' => $dimension_values,
			'date_range'       => null,
		);
	}
}
