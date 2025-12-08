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

/**
 * Builds Search Console email section payloads.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Report_Data_Builder {

	/**
	 * Data processor instance.
	 *
	 * @since n.e.x.t
	 * @var Report_Data_Processor
	 */
	protected $processor;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Report_Data_Processor|null $processor Optional. Data processor instance.
	 */
	public function __construct( ?Report_Data_Processor $processor = null ) {
		$this->processor = $processor ?? new Report_Data_Processor();
	}

	/**
	 * Builds section payloads from Search Console module data.
	 *
	 * @since n.e.x.t
	 *
	 * @param array    $module_payload        Module payload keyed by section slug.
	 * @param int|null $current_period_length Optional. Current period length in days.
	 * @return array Section payloads.
	 */
	public function build_sections_from_module_payload( $module_payload, $current_period_length = null ) {
		$sections = array();

		foreach ( $module_payload as $section_key => $section_data ) {
			$rows = $this->processor->normalize_rows( $section_data );
			$rows = $this->processor->sort_rows_by_date( $rows );
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
	 * Builds a section payload from Search Console report data.
	 *
	 * @since n.e.x.t
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

		$search_console_data = $this->processor->sort_rows_by_date( $search_console_data );

		$preferred_key = $this->processor->get_preferred_key( $section_key );
		$row_data      = $this->processor->collect_row_data( $search_console_data, $preferred_key );

		if ( null !== $preferred_key ) {
			return $this->build_totals_section_payload( $search_console_data, $section_key, $preferred_key, $row_data['title'], $current_period );
		}

		return $this->build_list_section_payload( $section_key, $row_data );
	}

	/**
	 * Builds a totals-style section payload (impressions/clicks).
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
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

		if ( $abs >= 1000000 ) {
			return round( $number / 1000000, 1 ) . 'M';
		}

		if ( $abs >= 1000 ) {
			return round( $number / 1000, 1 ) . 'K';
		}

		return (string) round( $number );
	}

	/**
	 * Builds a list-style section payload (keywords/pages).
	 *
	 * @since n.e.x.t
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
			$values      = $row_metric_values;
			$trends      = array_fill( 0, count( $values ), null );
			$labels      = array( 'clicks' );
			$value_types = array( 'TYPE_STANDARD' );
		} elseif ( empty( $labels ) ) {
			return null;
		} else {
			$values = array_values( $values_by_key );
		}

		return array(
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
	}
}
