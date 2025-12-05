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
use Google\Site_Kit\Modules\Search_Console\Email_Reporting\Report_Data_Processor;

/**
 * Builder and helpers to construct Email_Report_Data_Section_Part instances for a single report section.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Email_Report_Section_Builder {

	/**
	 * Plugin context instance.
	 *
	 * @since 1.167.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Label translations indexed by label key.
	 *
	 * @since 1.167.0
	 * @var array
	 */
	protected $label_translations;

	/**
	 * Report processor instance.
	 *
	 * @since 1.167.0
	 * @var Email_Report_Payload_Processor
	 */
	protected $report_processor;

	/**
	 * Current period length in days (for SC trend calculations).
	 *
	 * @since n.e.x.t
	 * @var int|null
	 */
	protected $current_period_length = null;

	/**
	 * Constructor.
	 *
	 * @since 1.167.0
	 *
	 * @param Context                             $context          Plugin context.
	 * @param Email_Report_Payload_Processor|null $report_processor Optional. Report processor instance.
	 */
	public function __construct( Context $context, ?Email_Report_Payload_Processor $report_processor = null ) {
		$this->context            = $context;
		$this->report_processor   = $report_processor ?? new Email_Report_Payload_Processor();
		$this->label_translations = array(
			// Analytics 4.
			'totalUsers'         => __( 'Total Visitors', 'google-site-kit' ),
			'newUsers'           => __( 'New Visitors', 'google-site-kit' ),
			'eventCount'         => __( 'Total conversion events', 'google-site-kit' ),
			'addToCarts'         => __( 'Products added to cart', 'google-site-kit' ),
			'ecommercePurchases' => __( 'Purchases', 'google-site-kit' ),
			// Search Console.
			'impressions'        => __( 'Total impressions in Search', 'google-site-kit' ),
			'clicks'             => __( 'Total clicks from Search', 'google-site-kit' ),
		);
	}

	/**
	 * Build one or more section parts from raw payloads for a module.
	 *
	 * @since 1.167.0
	 *
	 * @param string   $module_slug Module slug (e.g. analytics-4).
	 * @param array    $raw_sections_payloads Raw reports payloads.
	 * @param string   $user_locale  User locale (e.g. en_US).
	 * @param \WP_Post $email_log   Optional. Email log post instance containing date metadata.
	 * @return Email_Report_Data_Section_Part[] Section parts for the provided module.
	 * @throws \Exception If an error occurs while building sections.
	 */
	public function build_sections( $module_slug, $raw_sections_payloads, $user_locale, $email_log = null ) {
		if ( is_object( $raw_sections_payloads ) ) {
			$raw_sections_payloads = (array) $raw_sections_payloads;
		}

		$sections                    = array();
		$switched_locale             = switch_to_locale( $user_locale );
		$log_date_range              = Email_Log::get_date_range_from_log( $email_log );
		$this->current_period_length = $this->calculate_period_length_from_date_range( $log_date_range );

		try {
			foreach ( $this->extract_sections_from_payloads( $module_slug, $raw_sections_payloads ) as $section_payload ) {
				list( $labels, $values, $trends, $event_names ) = $this->normalize_section_payload_components( $section_payload );

				$date_range = $log_date_range ? $log_date_range : $this->report_processor->compute_date_range( $section_payload['date_range'] ?? null );

				$section = new Email_Report_Data_Section_Part(
					$section_payload['section_key'] ?? 'section',
					array(
						'title'            => $section_payload['title'] ?? '',
						'labels'           => $labels,
						'event_names'      => $event_names,
						'values'           => $values,
						'trends'           => $trends,
						'dimensions'       => $section_payload['dimensions'] ?? array(),
						'dimension_values' => $section_payload['dimension_values'] ?? array(),
						'date_range'       => $date_range,
						'dashboard_link'   => $this->format_dashboard_link( $module_slug ),
					)
				);

				if ( $section->is_empty() ) {
					continue;
				}

				$sections[] = $section;
			}
		} catch ( \Exception $exception ) {
			if ( $switched_locale ) {
				restore_previous_locale();
			}

			// Re-throw exception to the caller to prevent this email from being sent.
			throw $exception;
		}

		$this->current_period_length = null;

		return $sections;
	}

	/**
	 * Normalize labels with translations.
	 *
	 * @since 1.167.0
	 *
	 * @param array $labels Labels.
	 * @return array Normalized labels.
	 */
	protected function normalize_labels( $labels ) {
		return array_map(
			fn( $label ) => $this->label_translations[ $label ] ?? $label,
			$labels
		);
	}

	/**
	 * Normalize trend values to localized percentage strings.
	 *
	 * @since 1.167.0
	 *
	 * @param array $trends Trend values.
	 * @return array|null Normalized trend values.
	 */
	protected function normalize_trends( $trends ) {
		if ( ! is_array( $trends ) ) {
			return null;
		}

		$output = array();

		foreach ( $trends as $trend ) {
			if ( null === $trend || '' === $trend ) {
				$output[] = null;
				continue;
			}

			if ( is_string( $trend ) ) {
				$trend = str_replace( '%', '', $trend );
			}

			if ( ! is_numeric( $trend ) ) {
				$trend = floatval( preg_replace( '/[^0-9+\-.]/', '', $trend ) );
			}

			$number = floatval( $trend );

			$formatted = number_format_i18n( $number, 2 );

			$output[] = sprintf( '%s%%', $formatted );
		}

		return $output;
	}

	/**
	 * Normalize a section payload into discrete components.
	 *
	 * @since 1.167.0
	 *
	 * @param array $section_payload Section payload data.
	 * @return array Normalized section payload components.
	 */
	protected function normalize_section_payload_components( $section_payload ) {
		$labels      = $this->normalize_labels( $section_payload['labels'] ?? array() );
		$value_types = isset( $section_payload['value_types'] ) && is_array( $section_payload['value_types'] ) ? $section_payload['value_types'] : array();
		$values      = $this->normalize_values( $section_payload['values'] ?? array(), $value_types );
		$trends_data = $section_payload['trends'] ?? null;
		$trends      = null !== $trends_data ? $this->normalize_trends( $trends_data ) : null;
		$event_names = $section_payload['event_names'] ?? array();

		return array( $labels, $values, $trends, $event_names );
	}

	/**
	 * Normalize values using metric formatter and localization.
	 *
	 * @since 1.167.0
	 *
	 * @param array $values      Values.
	 * @param array $value_types Optional. Metric types corresponding to each value.
	 * @return array Normalized values.
	 */
	protected function normalize_values( $values, $value_types = array() ) {
		$output = array();
		foreach ( $values as $index => $value ) {
			if ( null === $value ) {
				$output[] = null;
				continue;
			}

			$type     = $value_types[ $index ] ?? 'TYPE_STANDARD';
			$output[] = $this->format_metric_value( $value, $type );
		}
		return $output;
	}

	/**
	 * Formats a metric value according to type heuristics.
	 *
	 * @since 1.167.0
	 *
	 * @param mixed  $value Raw value.
	 * @param string $type  Metric type identifier.
	 * @return string Formatted metric value.
	 */
	protected function format_metric_value( $value, $type ) {
		switch ( $type ) {
			case 'TYPE_INTEGER':
				return (string) intval( $value );
			case 'TYPE_FLOAT':
				return (string) floatval( $value );
			case 'TYPE_SECONDS':
				return (string) $this->format_duration( intval( $value ) );
			case 'TYPE_MILLISECONDS':
				return (string) $this->format_duration( intval( $value ) / 1000 );
			case 'TYPE_MINUTES':
				return (string) $this->format_duration( intval( $value ) * 60 );
			case 'TYPE_HOURS':
				return (string) $this->format_duration( intval( $value ) * 3600 );
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
	 * @since 1.167.0
	 *
	 * @param int|float $seconds Duration in seconds.
	 * @return string Formatted duration.
	 */
	protected function format_duration( $seconds ) {
		$seconds = absint( round( floatval( $seconds ) ) );
		$hours   = intval( floor( $seconds / 3600 ) );
		$minutes = intval( floor( ( $seconds % 3600 ) / 60 ) );
		$remain  = intval( $seconds % 60 );

		return sprintf( '%02d:%02d:%02d', $hours, $minutes, $remain );
	}

	/**
	 * Creates dashboard link for a module.
	 *
	 * @since 1.167.0
	 *
	 * @param string $module_slug Module slug.
	 * @return string Dashboard link.
	 */
	protected function format_dashboard_link( $module_slug ) {
		$dashboard_url = $this->context->admin_url( 'dashboard' );
		return sprintf( '%s#/module/%s', $dashboard_url, rawurlencode( $module_slug ) );
	}

	/**
	 * Extracts section-level payloads from raw payloads.
	 *
	 * Receiving raw report response array, return an array of structured section payloads.
	 *
	 * @since 1.167.0
	 *
	 * @param string $module_slug Module slug.
	 * @param array  $raw_sections_payloads Raw section payloads.
	 * @return array[] Structured section payloads.
	 */
	protected function extract_sections_from_payloads( $module_slug, $raw_sections_payloads ) {
		$sections = array();

		foreach ( $raw_sections_payloads as $payload_group ) {
			if ( is_object( $payload_group ) ) {
				$payload_group = (array) $payload_group;
			}

			if ( ! is_array( $payload_group ) ) {
				continue;
			}

			$group_title_value = $payload_group['title'] ?? null;
			$group_title       = null !== $group_title_value ? $group_title_value : null;

			if ( isset( $payload_group['title'] ) ) {
				unset( $payload_group['title'] );
			}

			$module_sections = $this->build_module_section_payloads( $module_slug, $payload_group );

			foreach ( $module_sections as $section ) {
				if ( $group_title ) {
					$section['title'] = $group_title;
				} elseif ( empty( $section['title'] ) && isset( $section['section_key'] ) ) {
					$section['title'] = $section['section_key'];
				}
				$sections[] = $section;
			}
		}

		return $sections;
	}

	/**
	 * Builds section payloads for a specific module payload.
	 *
	 * @since 1.167.0
	 *
	 * @param string $module_key     Module identifier.
	 * @param array  $module_payload Module payload.
	 * @return array Section payloads.
	 */
	protected function build_module_section_payloads( $module_key, $module_payload ) {
		switch ( $module_key ) {
			case 'analytics-4':
			case 'adsense':
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
	 * @since 1.167.0
	 *
	 * @param array $module_payload Module payload keyed by section slug.
	 * @return array Section payloads.
	 */
	protected function build_sections_from_analytics_module( $module_payload ) {
		$sections = array();

		foreach ( $module_payload as $section_key => $section_data ) {
			// Allow a section payload to be a single report or an array of reports.
			list( $reports ) = $this->normalize_analytics_section_input( $section_data );

			foreach ( $reports as $report ) {
				$processed_report = $this->report_processor->process_single_report( $report );

				if ( empty( $processed_report ) ) {
					continue;
				}

				$payload = $this->build_section_payload_from_processed_report( $processed_report, $section_key );

				if ( empty( $payload ) ) {
					continue;
				}

				if ( empty( $payload['section_key'] ) || 0 === strpos( $payload['section_key'], 'report_' ) ) {
					$payload['section_key'] = $section_key;
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
	 * @since 1.167.0
	 *
	 * @param array $module_payload Module payload keyed by section slug.
	 * @return array Section payloads.
	 */
	protected function build_sections_from_search_console_module( $module_payload ) {
		$sections = array();

		foreach ( $module_payload as $section_key => $section_data ) {
			$rows = $this->normalize_search_console_rows( $section_data );
			if ( empty( $rows ) ) {
				continue;
			}

			$section = $this->build_section_payload_from_search_console( $rows, $section_key );
			if ( $section ) {
				$sections[] = $section;
			}
		}

		return $sections;
	}

	/**
	 * Normalizes analytics section input into reports and report configs.
	 *
	 * @since 1.167.0
	 *
	 * @param mixed $section_data Section payload.
	 * @return array Normalized analytics section input.
	 */
	protected function normalize_analytics_section_input( $section_data ) {
		$reports        = array();
		$report_configs = array();

		if ( is_object( $section_data ) ) {
			$section_data = (array) $section_data;
		}

		if ( ! is_array( $section_data ) ) {
			return array( $reports, $report_configs );
		}

		if ( $this->is_sequential_array( $section_data ) ) {
			foreach ( $section_data as $item ) {
				if ( is_array( $item ) ) {
					$reports[] = $item;
				}
			}
		} else {
			$reports[] = $section_data;
		}

		return array( $reports, $report_configs );
	}

	/**
	 * Normalizes Search Console rows to an indexed array of row arrays.
	 *
	 * @since 1.167.0
	 *
	 * @param mixed $section_data Section payload.
	 * @return array Normalized Search Console rows.
	 */
	protected function normalize_search_console_rows( $section_data ) {
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
	 * Determines whether an array uses sequential integer keys starting at zero.
	 *
	 * @since 1.167.0
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

	/**
	 * Builds a section payload from a processed GA4 report.
	 *
	 * @since 1.167.0
	 *
	 * @param array  $processed_report Processed report data.
	 * @param string $section_key      Section key.
	 * @return array Section payload.
	 */
	protected function build_section_payload_from_processed_report( $processed_report, $section_key ) {
		if ( empty( $processed_report ) || empty( $processed_report['metadata']['metrics'] ) ) {
			return array();
		}

		return $this->build_analytics_section_payload( $processed_report, $section_key );
	}

	/**
	 * Builds analytics section payload, extracting dimensions, metrics, and trends.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $processed_report Processed report data.
	 * @param string $section_key      Section key.
	 * @return array Section payload.
	 */
	protected function build_analytics_section_payload( $processed_report, $section_key ) {
		$dimensions                                  = $this->get_analytics_dimensions( $processed_report );
		list( $labels, $value_types, $metric_names ) = $this->get_metric_metadata( $processed_report['metadata']['metrics'] );

		list( $dimension_values, $dimension_metrics ) = $this->aggregate_dimension_metrics(
			$dimensions,
			$processed_report['rows'] ?? array(),
			$metric_names
		);

		list( $values, $trends ) = $this->report_processor->compute_metric_values_and_trends( $processed_report, $metric_names );
		list( $values, $trends ) = $this->apply_dimension_aggregates( $values, $trends, $dimension_values, $dimension_metrics, $metric_names );

		return array(
			'section_key'      => $section_key,
			'title'            => $processed_report['metadata']['title'] ?? '',
			'labels'           => $labels,
			'event_names'      => $metric_names,
			'values'           => $values,
			'value_types'      => $value_types,
			'trends'           => $trends,
			'trend_types'      => $value_types,
			'dimensions'       => $dimensions,
			'dimension_values' => $dimension_values,
			'date_range'       => null,
		);
	}

	/**
	 * Returns analytics dimensions excluding helper values.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $processed_report Processed report data.
	 * @return array Dimensions.
	 */
	protected function get_analytics_dimensions( $processed_report ) {
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
	 * @since n.e.x.t
	 *
	 * @param array $metrics Metric metadata.
	 * @return array Array with labels, value types, and metric names.
	 */
	protected function get_metric_metadata( $metrics ) {
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
	 * @since n.e.x.t
	 *
	 * @param array $dimensions      Dimensions list.
	 * @param array $rows            Report rows.
	 * @param array $metric_names    Metric names.
	 * @return array Tuple of dimension values and aggregated metrics.
	 */
	protected function aggregate_dimension_metrics( $dimensions, $rows, $metric_names ) {
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
	 * @since n.e.x.t
	 *
	 * @param array $values            Base values.
	 * @param array $trends            Base trends.
	 * @param array $dimension_values  Dimension values.
	 * @param array $dimension_metrics Aggregated dimension metrics.
	 * @param array $metric_names      Metric names.
	 * @return array Tuple of values and trends.
	 */
	protected function apply_dimension_aggregates( $values, $trends, $dimension_values, $dimension_metrics, $metric_names ) {
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

	/**
	 * Builds a section payload from Search Console report data.
	 *
	 * @since 1.167.0
	 *
	 * @param array  $search_console_data Search Console report rows.
	 * @param string $section_key         Section key identifier.
	 * @return array|null Section payload array, or null if data is invalid.
	 */
	protected function build_section_payload_from_search_console( $search_console_data, $section_key ) {
		if ( empty( $search_console_data ) ) {
			return null;
		}

		$preferred_key = $this->get_search_console_preferred_key( $section_key );
		$row_data      = $this->collect_search_console_row_data( $search_console_data, $preferred_key );

		if ( null !== $preferred_key ) {
			return $this->build_totals_section_payload( $search_console_data, $section_key, $preferred_key, $row_data['title'] );
		}

		return $this->build_list_section_payload( $section_key, $row_data );
	}

	/**
	 * Calculates current period length in days from a date range array.
	 *
	 * @since n.e.x.t
	 *
	 * @param array|null $date_range Date range containing startDate and endDate.
	 * @return int|null Period length in days (inclusive) or null when unavailable.
	 */
	protected function calculate_period_length_from_date_range( $date_range ) {
		if ( empty( $date_range['startDate'] ) || empty( $date_range['endDate'] ) ) {
			return null;
		}

		try {
			$start = new \DateTime( $date_range['startDate'] );
			$end   = new \DateTime( $date_range['endDate'] );
		} catch ( \Exception $e ) {
			return null;
		}

		$diff = $start->diff( $end );
		if ( false === $diff ) {
			return null;
		}

		return (int) $diff->days + 1;
	}

	/**
	 * Calculates current period length from Search Console rows (half of combined range).
	 *
	 * @since n.e.x.t
	 *
	 * @param array $rows Search Console rows.
	 * @return int|null Period length in days or null on failure.
	 */
	protected function calculate_period_length_from_rows( array $rows ) {
		if ( empty( $rows ) ) {
			return null;
		}

		$dates = array();
		foreach ( $rows as $row ) {
			if ( ! is_array( $row ) || empty( $row['keys'][0] ) ) {
				continue;
			}
			$dates[] = $row['keys'][0];
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
	 * Formats a Search Console dimension value for output.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $value Dimension value.
	 * @return string|array
	 */
	protected function format_search_console_dimension_value( $value ) {
		if ( filter_var( $value, FILTER_VALIDATE_URL ) ) {
			return array(
				'label' => $value,
				'url'   => $value,
			);
		}

		return $value;
	}

	/**
	 * Returns the preferred metric key for Search Console sections.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $section_key Section key.
	 * @return string|null Preferred metric key or null for list sections.
	 */
	protected function get_search_console_preferred_key( $section_key ) {
		if ( 'total_impressions' === $section_key ) {
			return 'impressions';
		}

		if ( 'total_clicks' === $section_key ) {
			return 'clicks';
		}

		return null;
	}

	/**
	 * Collects normalized Search Console row data for a section.
	 *
	 * @since n.e.x.t
	 *
	 * @param array       $search_console_data Search Console report rows.
	 * @param string|null $preferred_key       Preferred metric key or null.
	 * @return array Collected data including title, labels, value types, values, and dimensions.
	 */
	protected function collect_search_console_row_data( $search_console_data, $preferred_key ) {
		$labels            = array();
		$values_by_key     = array();
		$value_types       = array();
		$title             = '';
		$dimension_values  = array();
		$row_metric_values = array();
		$row_metric_field  = 'clicks';

		foreach ( $search_console_data as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}

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
					$dimension_values[]  = $this->format_search_console_dimension_value( $primary_key );
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
	 * Builds a totals-style section payload (impressions/clicks).
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $search_console_data Search Console rows.
	 * @param string $section_key         Section key.
	 * @param string $preferred_key       Preferred metric key.
	 * @param string $title               Section title.
	 * @return array Section payload.
	 */
	protected function build_totals_section_payload( $search_console_data, $section_key, $preferred_key, $title ) {
		$trends        = null;
		$period_length = $this->current_period_length ?? $this->calculate_period_length_from_rows( $search_console_data );
		$period_length = max( 1, $period_length ?? (int) ( count( $search_console_data ) / 2 ) );

		$processor = new Report_Data_Processor();
		$totals    = $processor->sum_field_by_period( $search_console_data, $preferred_key, $period_length );

		$current_total = $totals['current'];
		$compare_total = $totals['compare'];

		$values = array( $current_total );
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
			list( $row_metric_values, $dimension_values ) = $this->limit_list_results( $row_metric_values, $dimension_values, 3 );
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

	/**
	 * Limits list-style results to a specific number of rows.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $values           Metric values.
	 * @param array $dimension_values Dimension values.
	 * @param int   $limit            Maximum number of rows.
	 * @return array Array with limited values and dimension values.
	 */
	protected function limit_list_results( array $values, array $dimension_values, $limit ) {
		if ( $limit <= 0 ) {
			return array( $values, $dimension_values );
		}

		return array(
			array_slice( $values, 0, $limit ),
			array_slice( $dimension_values, 0, $limit ),
		);
	}
}
