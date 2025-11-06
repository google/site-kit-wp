<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Report_Section_Builder
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Context;

/**
 * Builder and helpers to construct Email_Report_Data_Section_Part instances for a single report section.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Email_Report_Section_Builder {

	/**
	 * Plugin context instance.
	 *
	 * @var Context
	 */
	protected $context;

	/**
	 * Label translations indexed by label key.
	 *
	 * @var array
	 */
	protected $label_translations;

	/**
	 * Constructor.
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context            = $context;
		$this->label_translations = array(
			// Analytics 4.
			'totalUsers'     => __( 'Total Visitors', 'google-site-kit' ),
			'newUsers'       => __( 'New Visitors', 'google-site-kit' ),
			'returningUsers' => __( 'Returning Visitors', 'google-site-kit' ),
			'subscribers'    => __( 'Subscribers', 'google-site-kit' ),
			// Search Console.
			'impressions'    => __( 'Total impressions in Search', 'google-site-kit' ),
			'clicks'         => __( 'Total clicks from Search', 'google-site-kit' ),
		);
	}

	/**
	 * Build one or more section parts from raw payloads for a module.
	 *
	 * @param string   $module_slug Module slug (e.g. analytics-4) for the dashboard link only.
	 * @param array    $raw_payloads Raw reports payloads.
	 * @param string   $frequency    Email frequency (e.g. weekly, monthly).
	 * @param string   $user_locale  User locale (e.g. en_US).
	 * @param \WP_Post $email_log   Optional. Email log post instance containing date metadata.
	 * @return Email_Report_Data_Section_Part[] Section parts for the provided module.
	 */
	public function build_sections( $module_slug, array $raw_payloads, $frequency, $user_locale, $email_log = null ) {
		$sections        = array();
		$switched_locale = switch_to_locale( $user_locale );
		$log_date_range  = Email_Log::get_date_range_from_log( $email_log );

		try {
			foreach ( $this->extract_sections_from_payloads( $raw_payloads ) as $section_payload ) {
				list( $labels, $values, $trends ) = $this->normalize_section_payload_components( $section_payload );

				$date_range = $log_date_range ? $log_date_range : $this->compute_date_range( isset( $section_payload['date_range'] ) ? $section_payload['date_range'] : null );

				$section = new Email_Report_Data_Section_Part(
					isset( $section_payload['section_key'] ) ? (string) $section_payload['section_key'] : 'section',
					isset( $section_payload['title'] ) ? (string) $section_payload['title'] : '',
					$labels,
					$values,
					$trends,
					$date_range,
					$this->format_dashboard_link( $module_slug )
				);

				if ( $section->is_empty() ) {
					continue;
				}

				$sections[] = $section;
			}
		} finally {
			if ( $switched_locale ) {
				restore_previous_locale();
			}
		}

		return $sections;
	}

	/**
	 * Normalize labels with translations.
	 *
	 * @param array $labels Labels.
	 * @return array
	 */
	protected function normalize_labels( array $labels ) {
		$out = array();
		foreach ( $labels as $label ) {
			$out[] = isset( $this->label_translations[ $label ] ) ? $this->label_translations[ $label ] : (string) $label;
		}
		return $out;
	}

	/**
	 * Normalize trend values to localized percentage strings.
	 *
	 * @param array $trends Trend values.
	 * @return array|null
	 */
	protected function normalize_trends( $trends ) {
		if ( ! is_array( $trends ) ) {
			return null;
		}

		$out = array();

		foreach ( $trends as $trend ) {
			if ( null === $trend || '' === $trend ) {
				$out[] = null;
				continue;
			}

			if ( is_string( $trend ) ) {
				$trend = str_replace( '%', '', $trend );
			}

			if ( ! is_numeric( $trend ) ) {
				$trend = (float) preg_replace( '/[^0-9+\-.]/', '', (string) $trend );
			}

			$number = (float) $trend;

			$formatted = number_format_i18n( $number, 2 );

			$out[] = sprintf( '%s%%', $formatted );
		}

		return $out;
	}

	/**
	 * Normalize a section payload into discrete components.
	 *
	 * @param array $section_payload Section payload data.
	 * @return array
	 */
	protected function normalize_section_payload_components( array $section_payload ) {
		$labels      = $this->normalize_labels( isset( $section_payload['labels'] ) ? $section_payload['labels'] : array() );
		$value_types = isset( $section_payload['value_types'] ) && is_array( $section_payload['value_types'] ) ? $section_payload['value_types'] : array();
		$values      = $this->normalize_values( isset( $section_payload['values'] ) ? $section_payload['values'] : array(), $value_types );
		$trends      = isset( $section_payload['trends'] ) ? $this->normalize_trends( $section_payload['trends'] ) : null;

		return array( $labels, $values, $trends );
	}


	/**
	 * Normalize values using metric formatter and localization.
	 *
	 * @param array $values      Values.
	 * @param array $value_types Optional. Metric types corresponding to each value.
	 * @return array
	 */
	protected function normalize_values( array $values, array $value_types = array() ) {
		$out = array();
		foreach ( $values as $index => $value ) {
			$type = isset( $value_types[ $index ] ) ? $value_types[ $index ] : 'TYPE_STANDARD';
			if ( null === $value ) {
				$out[] = null;
				continue;
			}
			$out[] = $this->format_metric_value( $value, $type );
		}
		return $out;
	}

	/**
	 * Formats a metric value according to type heuristics.
	 *
	 * @param mixed  $value Raw value.
	 * @param string $type  Metric type identifier.
	 * @return string
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
	 * Formats a duration in seconds to HH:MM:SS string.
	 *
	 * @param int|float $seconds Duration in seconds.
	 * @return string
	 */
	protected function format_duration( $seconds ) {
		$seconds = absint( round( (float) $seconds ) );
		$hours   = (int) floor( $seconds / 3600 );
		$minutes = (int) floor( ( $seconds % 3600 ) / 60 );
		$remain  = (int) ( $seconds % 60 );

		return sprintf( '%02d:%02d:%02d', $hours, $minutes, $remain );
	}

	/**
	 * Creates dashboard link for a module.
	 *
	 * @param string $module_slug Module slug.
	 * @return string
	 */
	protected function format_dashboard_link( $module_slug ) {
		$dashboard_url = $this->context->admin_url( 'dashboard' );
		return sprintf( '%s#/module/%s', $dashboard_url, rawurlencode( (string) $module_slug ) );
	}

	/**
	 * Compute date range array from meta.
	 *
	 * @param array|null $date_range Date meta, must contain startDate/endDate if provided.
	 * @return array|null
	 */
	protected function compute_date_range( $date_range ) {
		if ( ! is_array( $date_range ) ) {
			return null;
		}

		$start = isset( $date_range['startDate'] ) ? (string) $date_range['startDate'] : null;
		$end   = isset( $date_range['endDate'] ) ? (string) $date_range['endDate'] : null;
		if ( ! $start || ! $end ) {
			return null;
		}

		$compare_start = null;
		$compare_end   = null;
		if ( array_key_exists( 'compareStartDate', $date_range ) && array_key_exists( 'compareEndDate', $date_range ) ) {
			$compare_start = (string) $date_range['compareStartDate'];
			$compare_end   = (string) $date_range['compareEndDate'];
		}

		// Ensure dates are localized strings (Y-m-d) using site timezone.
		$timezone = function_exists( 'wp_timezone' ) ? wp_timezone() : null;
		if ( function_exists( 'wp_date' ) && $timezone ) {
			$start_ts = strtotime( $start );
			$end_ts   = strtotime( $end );
			if ( false !== $start_ts && false !== $end_ts ) {
				$start = wp_date( 'Y-m-d', $start_ts, $timezone );
				$end   = wp_date( 'Y-m-d', $end_ts, $timezone );
			}
			if ( null !== $compare_start && null !== $compare_end ) {
				$compare_start_ts = strtotime( $compare_start );
				$compare_end_ts   = strtotime( $compare_end );
				if ( false !== $compare_start_ts && false !== $compare_end_ts ) {
					$compare_start = wp_date( 'Y-m-d', $compare_start_ts, $timezone );
					$compare_end   = wp_date( 'Y-m-d', $compare_end_ts, $timezone );
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
	 * Extracts section-level payloads from raw payloads.
	 *
	 * Receiving raw report response array, return an array of structured section payloads.
	 *
	 * @param array $raw_payloads Raw payloads.
	 * @return array[] Structured section payloads.
	 */
	protected function extract_sections_from_payloads( array $raw_payloads ) {
		$sections = array();

		foreach ( $raw_payloads as $payload_group ) {
			if ( ! is_array( $payload_group ) ) {
				continue;
			}

			$group_title = isset( $payload_group['title'] ) ? (string) $payload_group['title'] : null;

			foreach ( $payload_group as $module_key => $module_payload ) {
				if ( 'title' === $module_key ) {
					continue;
				}

				if ( ! is_array( $module_payload ) ) {
					continue;
				}

				foreach ( $this->build_module_section_payloads( (string) $module_key, $module_payload ) as $section ) {
					if ( $group_title ) {
						$section['title'] = $group_title;
					} elseif ( empty( $section['title'] ) && isset( $section['section_key'] ) ) {
						$section['title'] = (string) $section['section_key'];
					}
					$sections[] = $section;
				}
			}
		}

		return $sections;
	}

	/**
	 * Builds section payloads for a specific module payload.
	 *
	 * @param string $module_key     Module identifier.
	 * @param array  $module_payload Module payload.
	 * @return array
	 */
	protected function build_module_section_payloads( $module_key, array $module_payload ) {
		switch ( $module_key ) {
			case 'analytics-4':
				return $this->build_sections_from_analytics_module( $module_payload );
			case 'search-console':
				return $this->build_sections_from_search_console_module( $module_payload );
			default:
				return array();
		}
	}

	/**
	 * Builds section payloads from Analytics module data.
	 *
	 * @param array $module_payload Module payload keyed by section slug.
	 * @return array
	 */
	protected function build_sections_from_analytics_module( array $module_payload ) {
		$sections                = array();
		$module_report_configs   = isset( $module_payload['report_configs'] ) && is_array( $module_payload['report_configs'] ) ? $module_payload['report_configs'] : array();
		$module_payload_filtered = $module_payload;

		unset( $module_payload_filtered['report_configs'] );

		foreach ( $module_payload_filtered as $section_key => $section_data ) {
			list( $reports, $section_report_configs ) = $this->normalize_analytics_section_input( $section_data );
			if ( empty( $reports ) ) {
				continue;
			}

			$report_configs = ! empty( $section_report_configs ) ? $section_report_configs : $module_report_configs;
			$processed      = $this->build_section_payloads_from_processed_reports(
				$this->process_batch_reports( $reports, $report_configs )
			);

			foreach ( $processed as $payload ) {
				$payload_section_key = isset( $payload['section_key'] ) ? (string) $payload['section_key'] : '';
				if ( '' === $payload_section_key || 0 === strpos( $payload_section_key, 'report_' ) ) {
					$payload['section_key'] = (string) $section_key;
				}
				if ( empty( $payload['title'] ) ) {
					$payload['title'] = '';
				}
				$sections[] = $payload;
			}
		}

		return $sections;
	}

	/**
	 * Builds section payloads from Search Console module data.
	 *
	 * @param array $module_payload Module payload keyed by section slug.
	 * @return array
	 */
	protected function build_sections_from_search_console_module( array $module_payload ) {
		$sections = array();

		foreach ( $module_payload as $section_key => $section_data ) {
			$rows = $this->normalize_search_console_rows( $section_data );
			if ( empty( $rows ) ) {
				continue;
			}

			$section = $this->build_section_payload_from_search_console( $rows, (string) $section_key );
			if ( $section ) {
				$sections[] = $section;
			}
		}

		return $sections;
	}

	/**
	 * Normalizes analytics section input into reports and report configs.
	 *
	 * @param mixed $section_data Section payload.
	 * @return array
	 */
	protected function normalize_analytics_section_input( $section_data ) {
		$reports        = array();
		$report_configs = array();

		if ( ! is_array( $section_data ) ) {
			return array( $reports, $report_configs );
		}

		if ( isset( $section_data['report_configs'] ) ) {
			$report_configs = is_array( $section_data['report_configs'] ) ? $section_data['report_configs'] : array();
			unset( $section_data['report_configs'] );
		}

		if ( $this->is_sequential_array( $section_data ) ) {
			foreach ( $section_data as $item ) {
				if ( is_array( $item ) ) {
					$reports[] = $item;
				}
			}
		} else {
			foreach ( $section_data as $value ) {
				if ( is_array( $value ) ) {
					$reports[] = $value;
				}
			}
		}

		return array( $reports, $report_configs );
	}

	/**
	 * Normalizes Search Console rows to an indexed array of row arrays.
	 *
	 * @param mixed $section_data Section payload.
	 * @return array
	 */
	protected function normalize_search_console_rows( $section_data ) {
		if ( ! is_array( $section_data ) ) {
			return array();
		}

		if ( $this->is_sequential_array( $section_data ) ) {
			$rows = array();
			foreach ( $section_data as $row ) {
				if ( is_array( $row ) ) {
					$rows[] = $row;
				}
			}
			return $rows;
		}

		return array( $section_data );
	}

	/**
	 * Determines whether an array uses sequential integer keys starting at zero.
	 *
	 * @param array $data Array to test.
	 * @return bool
	 */
	protected function is_sequential_array( array $data ) {
		if ( empty( $data ) ) {
			return true;
		}

		return array_keys( $data ) === range( 0, count( $data ) - 1 );
	}

	/**
	 * Processes GA4 batch reports using helper structure.
	 *
	 * @param array $batch_results  Raw batch report results.
	 * @param array $report_configs Optional. Additional report config metadata keyed by index.
	 * @return array Processed reports keyed by report identifier.
	 */
	protected function process_batch_reports( array $batch_results, array $report_configs = array() ) {
		$reports = array();

		if ( isset( $batch_results['reports'] ) && is_array( $batch_results['reports'] ) ) {
			$reports = $batch_results['reports'];
		} elseif ( $this->is_sequential_array( $batch_results ) ) {
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

			$report_id = isset( $report_configs[ $index ]['report_id'] )
				? (string) $report_configs[ $index ]['report_id']
				: ( isset( $report['reportId'] ) ? (string) $report['reportId'] : sprintf( 'report_%d', $index ) );

			$processed_reports[ $report_id ] = $this->process_single_report( $report );
		}

		return $processed_reports;
	}

	/**
	 * Processes a single GA4 report into a normalized structure.
	 *
	 * @param array $report Single report data.
	 * @return array Normalized report data.
	 */
	protected function process_single_report( array $report ) {
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
	 * @param array $report Report payload.
	 * @return array Report metadata.
	 */
	protected function extract_report_metadata( array $report ) {
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
			$metadata['title'] = (string) $report['title'];
		}

		$metadata['row_count'] = isset( $report['rowCount'] ) ? (int) $report['rowCount'] : 0;

		return $metadata;
	}

	/**
	 * Extracts totals from a GA4 report.
	 *
	 * @param array $report Report payload.
	 * @return array Array of totals keyed by metric name.
	 */
	protected function extract_report_totals( array $report ) {
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
	 * Extracts rows from a GA4 report into a normalized structure.
	 *
	 * @param array $report Report payload.
	 * @return array Processed rows including dimensions and metrics.
	 */
	protected function extract_report_rows( array $report ) {
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
	 * @param array  $rows             Processed rows.
	 * @param string $dimension_name   Dimension name to match.
	 * @param string $dimension_value  Expected dimension value.
	 * @param array  $metric_names     Metrics to extract in order.
	 * @return array
	 */
	protected function extract_metric_values_for_dimension( array $rows, $dimension_name, $dimension_value, array $metric_names ) {
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
	 * @param array $report       Processed report data.
	 * @param array $metric_names Ordered list of metric names.
	 * @return array
	 */
	protected function compute_metric_values_and_trends( array $report, array $metric_names ) {
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

				if ( is_numeric( $current ) && is_numeric( $comparison ) && 0.0 !== (float) $comparison ) {
					$trends[] = ( (float) $current - (float) $comparison ) / (float) $comparison * 100;
				} else {
					$trends[] = null;
				}
			}
		} elseif ( count( $totals ) > 1 ) {
			$comparison_totals = $totals[1];
			$trends            = array();
			foreach ( $metric_names as $metric_name ) {
				if ( isset( $totals[0][ $metric_name ], $comparison_totals[ $metric_name ] ) && is_numeric( $totals[0][ $metric_name ] ) && is_numeric( $comparison_totals[ $metric_name ] ) && 0.0 !== (float) $comparison_totals[ $metric_name ] ) {
					$trends[] = ( (float) $totals[0][ $metric_name ] - (float) $comparison_totals[ $metric_name ] ) / (float) $comparison_totals[ $metric_name ] * 100;
				} else {
					$trends[] = null;
				}
			}
		}

		return array( $values, $trends );
	}

	/**
	 * Builds section payloads from processed GA4 reports.
	 *
	 * @param array $processed_reports Processed report data keyed by ID.
	 * @return array Section payloads.
	 */
	protected function build_section_payloads_from_processed_reports( array $processed_reports ) {
		$sections = array();

		foreach ( $processed_reports as $report_id => $report ) {
			if ( empty( $report ) || empty( $report['metadata']['metrics'] ) ) {
				continue;
			}

			$metrics      = $report['metadata']['metrics'];
			$labels       = array();
			$value_types  = array();
			$metric_names = array();

			foreach ( $metrics as $metric_meta ) {
				$metric_name    = (string) $metric_meta['name'];
				$metric_names[] = $metric_name;
				$labels[]       = (string) $metric_meta['name'];
				$value_types[]  = isset( $metric_meta['type'] ) ? (string) $metric_meta['type'] : 'TYPE_STANDARD';
			}

			list( $values, $trends ) = $this->compute_metric_values_and_trends( $report, $metric_names );

			$sections[] = array(
				'section_key' => (string) $report_id,
				'title'       => isset( $report['metadata']['title'] ) ? (string) $report['metadata']['title'] : '',
				'labels'      => $labels,
				'values'      => $values,
				'value_types' => $value_types,
				'trends'      => $trends,
				'trend_types' => $value_types,
				'date_range'  => null,
			);
		}

		return $sections;
	}

	/**
	 * Builds a section payload from Search Console report data.
	 *
	 * @param array  $search_console_data Search Console report rows.
	 * @param string $section_key         Section key identifier.
	 * @return array|null Section payload array, or null if data is invalid.
	 */
	protected function build_section_payload_from_search_console( array $search_console_data, $section_key ) {
		if ( empty( $search_console_data ) ) {
			return null;
		}

		$labels        = array();
		$values_by_key = array();
		$value_types   = array();
		$title         = '';

		foreach ( $search_console_data as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}

			if ( '' === $title && isset( $row['title'] ) && is_string( $row['title'] ) ) {
				$title = trim( (string) $row['title'] );
			}

			foreach ( $row as $key => $value ) {
				if ( ! is_string( $key ) || '' === $key ) {
					continue;
				}
				if ( 'title' === $key ) {
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
				if ( array_key_exists( $key, $values_by_key ) ) {
					continue;
				}

				$labels[]              = $key;
				$values_by_key[ $key ] = $raw_value;
				$value_types[]         = 'TYPE_STANDARD';
			}
		}

		if ( empty( $labels ) ) {
			return null;
		}

		$values = array();
		foreach ( $labels as $key ) {
			$values[] = $values_by_key[ $key ];
		}

		return array(
			'section_key' => (string) $section_key,
			'title'       => $title,
			'labels'      => $labels,
			'values'      => $values,
			'value_types' => $value_types,
			'trends'      => null,
			'date_range'  => null,
		);
	}
}
