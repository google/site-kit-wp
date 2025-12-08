<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Report_Data_Builder
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Email_Reporting;

use Google\Site_Kit\Core\Email_Reporting\Email_Report_Payload_Processor;

/**
 * Builds Analytics 4 email section payloads.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Report_Data_Builder {

	/**
	 * Report processor instance.
	 *
	 * @since n.e.x.t
	 * @var Email_Report_Payload_Processor
	 */
	protected $report_processor;

	/**
	 * Analytics data processor instance.
	 *
	 * @since n.e.x.t
	 * @var Report_Data_Processor
	 */
	protected $data_processor;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Email_Report_Payload_Processor|null $report_processor Optional. Report processor instance.
	 * @param Report_Data_Processor|null          $data_processor    Optional. Analytics data processor.
	 */
	public function __construct( ?Email_Report_Payload_Processor $report_processor = null, ?Report_Data_Processor $data_processor = null ) {
		$this->report_processor = $report_processor ?? new Email_Report_Payload_Processor();
		$this->data_processor   = $data_processor ?? new Report_Data_Processor();
	}

	/**
	 * Builds section payloads from Analytics module data.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $module_payload Module payload keyed by section slug.
	 * @return array Section payloads.
	 */
	public function build_sections_from_module_payload( $module_payload ) {
		$sections = array();

		foreach ( $module_payload as $section_key => $section_data ) {
			list( $reports ) = $this->normalize_section_input( $section_data );

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
	 * Normalizes analytics section input into reports and report configs.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $section_data Section payload.
	 * @return array Normalized analytics section input.
	 */
	protected function normalize_section_input( $section_data ) {
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
	 * Builds a section payload from a processed GA4 report.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $processed_report Processed report data.
	 * @param string $section_key      Section key.
	 * @return array Section payload.
	 */
	public function build_section_payload_from_processed_report( $processed_report, $section_key ) {
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
		$dimensions                                  = $this->data_processor->get_analytics_dimensions( $processed_report );
		list( $labels, $value_types, $metric_names ) = $this->data_processor->get_metric_metadata( $processed_report['metadata']['metrics'] );

		list( $dimension_values, $dimension_metrics ) = $this->data_processor->aggregate_dimension_metrics(
			$dimensions,
			$processed_report['rows'] ?? array(),
			$metric_names
		);

		list( $values, $trends ) = $this->report_processor->compute_metric_values_and_trends( $processed_report, $metric_names );
		list( $values, $trends ) = $this->data_processor->apply_dimension_aggregates( $values, $trends, $dimension_values, $dimension_metrics, $metric_names );

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
	 * Determines whether an array uses sequential integer keys starting at zero.
	 *
	 * @since n.e.x.t
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
}
