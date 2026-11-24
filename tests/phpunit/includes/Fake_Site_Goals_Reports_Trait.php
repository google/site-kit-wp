<?php
/**
 * Trait Google\Site_Kit\Tests\Fake_Site_Goals_Reports_Trait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

/**
 * Trait for answering the reports of the Site Goals insight payload with a fake Analytics API.
 *
 * `create_analytics_batch_response()` builds the batch response, and each
 * report in it has the rows of `$report_rows` for that report. The rows are
 * keyed for the reports of an end date of `2026-09-15`.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Fake_Site_Goals_Reports_Trait {

	use Fake_Benchmarking_Reports_Trait;

	/**
	 * Rows the fake Analytics API returns, keyed by report: `engagement`,
	 * `key_actions`, `key_action_sessions` or `year_ago_key_actions`.
	 *
	 * Each row lists its dimension values in the order the report asks for them,
	 * then its `dateRange`, then its metric values.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	protected $report_rows = array();

	/**
	 * Builds the report the fake Analytics API returns for one report request,
	 * from the rows in `$report_rows` for that report.
	 *
	 * It runs in place of the `build_report()` of `Fake_Benchmarking_Reports_Trait`,
	 * which answers `totalUsers` alone.
	 *
	 * @since 1.192.0
	 * @since n.e.x.t Moved from `Insight_Payload_BuilderTest`.
	 *
	 * @param array $report_request The report request, as the batch call sent it.
	 * @return array The report, in the shape Analytics returns it.
	 */
	private function build_report( array $report_request ) {
		$metric_names    = array_column( $report_request['metrics'], 'name' );
		$dimension_names = array_column( $report_request['dimensions'] ?? array(), 'name' );

		// Analytics adds a `dateRange` dimension to a report with two periods.
		$dimension_names[] = 'dateRange';

		$report = array(
			'dimensionHeaders' => array_map(
				fn( $dimension_name ) => array( 'name' => $dimension_name ),
				$dimension_names
			),
			'metricHeaders'    => array_map(
				fn( $metric_name ) => array( 'name' => $metric_name ),
				$metric_names
			),
		);

		$rows = array_map(
			fn( $row ) => array(
				'dimensionValues' => array_map(
					fn( $dimension_value ) => array( 'value' => $dimension_value ),
					array_slice( $row, 0, count( $dimension_names ) )
				),
				'metricValues'    => array_map(
					fn( $metric_value ) => array( 'value' => $metric_value ),
					array_slice( $row, count( $dimension_names ) )
				),
			),
			$this->report_rows[ $this->get_report_key( $report_request ) ] ?? array()
		);

		// Analytics leaves the `rows` key out of a report with no rows.
		if ( ! empty( $rows ) ) {
			$report['rows'] = $rows;
		}

		return $report;
	}

	/**
	 * Gets the key of `$report_rows` that a report request asks for.
	 *
	 * @since 1.192.0
	 * @since n.e.x.t Moved from `Insight_Payload_BuilderTest`.
	 *
	 * @param array $report_request The report request, as the batch call sent it.
	 * @return string `engagement`, `key_actions`, `key_action_sessions` or `year_ago_key_actions`.
	 */
	private function get_report_key( array $report_request ) {
		if ( 'engagementRate' === $report_request['metrics'][0]['name'] ) {
			return 'engagement';
		}

		if ( 'sessions' === $report_request['metrics'][0]['name'] ) {
			return 'key_action_sessions';
		}

		return '2026-08-19' === $report_request['dateRanges'][0]['startDate'] ? 'key_actions' : 'year_ago_key_actions';
	}
}
