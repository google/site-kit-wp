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
			'totalUsers'  => __( 'Total Visitors', 'google-site-kit' ),
			'newUsers'    => __( 'New Visitors', 'google-site-kit' ),
			// Search Console.
			'impressions' => __( 'Total impressions in Search', 'google-site-kit' ),
			'clicks'      => __( 'Total clicks from Search', 'google-site-kit' ),
		);
	}

	/**
	 * Build one or more section parts from raw payloads for a module.
	 *
	 * @since 1.167.0
	 *
	 * @param string   $module_slug Module slug (e.g. analytics-4) for the dashboard link only.
	 * @param array    $raw_payloads Raw reports payloads.
	 * @param string   $user_locale  User locale (e.g. en_US).
	 * @param \WP_Post $email_log   Optional. Email log post instance containing date metadata.
	 * @return Email_Report_Data_Section_Part[] Section parts for the provided module.
	 * @throws \Exception If an error occurs while building sections.
	 */
	public function build_sections( $module_slug, $raw_payloads, $user_locale, $email_log = null ) {
		$sections        = array();
		$switched_locale = switch_to_locale( $user_locale );
		$log_date_range  = Email_Log::get_date_range_from_log( $email_log );

		try {
			foreach ( $this->extract_sections_from_payloads( $raw_payloads ) as $section_payload ) {
				list( $labels, $values, $trends ) = $this->normalize_section_payload_components( $section_payload );

				$date_range = $log_date_range ? $log_date_range : $this->report_processor->compute_date_range( $section_payload['date_range'] ?? null );

				$section = new Email_Report_Data_Section_Part(
					$section_payload['section_key'] ?? 'section',
					array(
						'title'          => $section_payload['title'] ?? '',
						'labels'         => $labels,
						'values'         => $values,
						'trends'         => $trends,
						'date_range'     => $date_range,
						'dashboard_link' => $this->format_dashboard_link( $module_slug ),
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

		return array( $labels, $values, $trends );
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
	 * @param array $raw_payloads Raw payloads.
	 * @return array[] Structured section payloads.
	 */
	protected function extract_sections_from_payloads( $raw_payloads ) {
		$sections = array();

		foreach ( $raw_payloads as $payload_group ) {
			if ( ! is_array( $payload_group ) ) {
				continue;
			}

			$group_title_value = $payload_group['title'] ?? null;
			$group_title       = null !== $group_title_value ? $group_title_value : null;

			foreach ( $payload_group as $module_key => $module_payload ) {
				if ( 'title' === $module_key ) {
					continue;
				}

				if ( ! is_array( $module_payload ) ) {
					continue;
				}

				foreach ( $this->build_module_section_payloads( $module_key, $module_payload ) as $section ) {
					if ( $group_title ) {
						$section['title'] = $group_title;
					} elseif ( empty( $section['title'] ) && isset( $section['section_key'] ) ) {
						$section['title'] = $section['section_key'];
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
				$this->report_processor->process_batch_reports( $reports, $report_configs )
			);

			foreach ( $processed as $payload ) {
				$payload_section_key = $payload['section_key'] ?? '';
				if ( '' === $payload_section_key || 0 === strpos( $payload_section_key, 'report_' ) ) {
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
	 * @since 1.167.0
	 *
	 * @param mixed $section_data Section payload.
	 * @return array Normalized Search Console rows.
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
	 * Builds section payloads from processed GA4 reports.
	 *
	 * @since 1.167.0
	 *
	 * @param array $processed_reports Processed report data keyed by ID.
	 * @return array Section payloads.
	 */
	protected function build_section_payloads_from_processed_reports( $processed_reports ) {
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
				$metric_name    = $metric_meta['name'];
				$metric_names[] = $metric_name;
				$labels[]       = $metric_meta['name'];
				$value_types[]  = $metric_meta['type'] ?? 'TYPE_STANDARD';
			}

			list( $values, $trends ) = $this->report_processor->compute_metric_values_and_trends( $report, $metric_names );

			$sections[] = array(
				'section_key' => $report_id,
				'title'       => $report['metadata']['title'] ?? '',
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

		$labels        = array();
		$values_by_key = array();
		$value_types   = array();
		$title         = '';

		foreach ( $search_console_data as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}

			if ( '' === $title && isset( $row['title'] ) && is_string( $row['title'] ) ) {
				$title = trim( $row['title'] );
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
			$values[] = (string) $values_by_key[ $key ];
		}

		return array(
			'section_key' => $section_key,
			'title'       => $title,
			'labels'      => $labels,
			'values'      => $values,
			'value_types' => $value_types,
			'trends'      => null,
			'date_range'  => null,
		);
	}
}
