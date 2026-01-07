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
use Google\Site_Kit\Modules\Search_Console\Email_Reporting\Report_Data_Builder as Search_Console_Report_Data_Builder;
use Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Report_Data_Builder as Analytics_Report_Data_Builder;
use Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Report_Data_Processor as Analytics_Report_Data_Processor;

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
	 * Analytics report data builder.
	 *
	 * @since 1.170.0
	 * @var Analytics_Report_Data_Builder
	 */
	protected $analytics_builder;

	/**
	 * Search Console report data builder.
	 *
	 * @since 1.170.0
	 * @var Search_Console_Report_Data_Builder
	 */
	protected $search_console_builder;

	/**
	 * Search Console data processor.
	 *
	 * @since 1.170.0
	 * @var Report_Data_Processor
	 */
	protected $search_console_processor;

	/**
	 * Current period length in days (for SC trend calculations).
	 *
	 * @since 1.170.0
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
		$this->context          = $context;
		$this->report_processor = $report_processor ?? new Email_Report_Payload_Processor();

		$this->analytics_builder        = new Analytics_Report_Data_Builder( $this->report_processor, new Analytics_Report_Data_Processor(), array(), $context );
		$this->search_console_processor = new Report_Data_Processor();
		$this->search_console_builder   = new Search_Console_Report_Data_Builder( $this->search_console_processor );
		$this->label_translations       = array(
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
				return $this->analytics_builder->build_sections_from_module_payload( $module_payload );
			case 'search-console':
				return $this->search_console_builder->build_sections_from_module_payload( $module_payload, $this->current_period_length );
			default:
				return array();
		}
	}
	/**
	 * Calculates current period length in days from a date range array.
	 *
	 * @since 1.170.0
	 *
	 * @param array|null $date_range Date range containing startDate and endDate.
	 * @return int|null Current-period length in days (inclusive) or null when unavailable.
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
}
