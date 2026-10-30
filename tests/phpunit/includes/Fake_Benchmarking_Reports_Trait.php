<?php
/**
 * Trait Google\Site_Kit\Tests\Fake_Benchmarking_Reports_Trait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * Trait for answering the benchmarking reports with a fake Analytics API.
 *
 * @since 1.191.0
 * @access private
 * @ignore
 */
trait Fake_Benchmarking_Reports_Trait {

	/**
	 * Rows the fake Analytics API returns, keyed by the first dimension a report
	 * asks for.
	 *
	 * Each row lists its dimension values, then its visitors.
	 *
	 * @var array
	 */
	protected $report_rows = array();

	/**
	 * Builds the response the fake Analytics API returns for a `batchRunReports`
	 * request, with one report for each report request in it.
	 *
	 * @since 1.191.0
	 *
	 * @param array $batch_request The body of the batch request.
	 * @return Response The response, in the shape Analytics returns it.
	 */
	protected function create_analytics_batch_response( array $batch_request ) {
		return new Response(
			200,
			array(),
			wp_json_encode(
				array(
					'kind'    => 'analyticsData#batchRunReports',
					'reports' => array_map(
						fn( $report_request ) => $this->build_report( $report_request ),
						$batch_request['requests']
					),
				)
			)
		);
	}

	/**
	 * Builds the report the fake Analytics API returns for one report request,
	 * from the rows in `$report_rows` for the report's first dimension.
	 *
	 * @since 1.191.0
	 *
	 * @param array $report_request The report request, as the batch call sent it.
	 * @return array The report, in the shape Analytics returns it.
	 */
	private function build_report( array $report_request ) {
		$dimension_names = array_column( $report_request['dimensions'], 'name' );

		// Analytics adds a `dateRange` dimension to a report with two periods.
		if ( count( $report_request['dateRanges'] ) > 1 ) {
			$dimension_names[] = 'dateRange';
		}

		$report = array(
			'dimensionHeaders' => array_map(
				fn( $dimension_name ) => array( 'name' => $dimension_name ),
				$dimension_names
			),
			'metricHeaders'    => array(
				array(
					'name' => 'totalUsers',
					'type' => 'TYPE_INTEGER',
				),
			),
		);

		$rows = array_map(
			fn( $row ) => array(
				'dimensionValues' => array_map(
					fn( $dimension_value ) => array( 'value' => $dimension_value ),
					array_slice( $row, 0, -1 )
				),
				'metricValues'    => array(
					array( 'value' => (string) $row[ count( $row ) - 1 ] ),
				),
			),
			$this->report_rows[ $dimension_names[0] ] ?? array()
		);

		// Analytics omits the `rows` key from a report with no rows.
		if ( ! empty( $rows ) ) {
			$report['rows'] = $rows;
		}

		return $report;
	}
}
