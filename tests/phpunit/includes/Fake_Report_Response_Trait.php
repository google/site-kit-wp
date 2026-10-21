<?php
/**
 * Trait Google\Site_Kit\Tests\Fake_Report_Response_Trait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DimensionHeader;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DimensionValue;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Row;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportResponse;

/**
 * Trait for building an Analytics report response from the dimension values of its rows.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Fake_Report_Response_Trait {

	/**
	 * Builds a report response with the given dimensions and the dimension values of each row.
	 *
	 * @since n.e.x.t
	 *
	 * @param string[] $dimension_names The names of the dimensions, such as `pagePathPlusQueryString`.
	 * @param array    $rows            The dimension values of each row, in the order of the dimensions, such as `array( array( '/?p=1' ) )`.
	 * @return RunReportResponse The report response.
	 */
	protected function create_report_response( array $dimension_names, array $rows ) {
		$response = new RunReportResponse();

		$response->setDimensionHeaders(
			array_map(
				function ( $dimension_name ) {
					$dimension_header = new DimensionHeader();
					$dimension_header->setName( $dimension_name );
					return $dimension_header;
				},
				$dimension_names
			)
		);

		$response->setRows(
			array_map(
				function ( $dimension_values ) {
					$row = new Row();
					$row->setDimensionValues(
						array_map(
							function ( $value ) {
								$dimension_value = new DimensionValue();
								$dimension_value->setValue( $value );
								return $dimension_value;
							},
							$dimension_values
						)
					);
					return $row;
				},
				$rows
			)
		);

		return $response;
	}

	/**
	 * Gets one dimension's value of each row of a report response.
	 *
	 * @since n.e.x.t
	 *
	 * @param RunReportResponse $response        The report response.
	 * @param int               $dimension_index The index of the dimension, `0` for the first one.
	 * @return string[] The value of the dimension in each row, in the order of the rows.
	 */
	protected function get_dimension_values( RunReportResponse $response, $dimension_index ) {
		return array_map(
			function ( $row ) use ( $dimension_index ) {
				return $row->getDimensionValues()[ $dimension_index ]->getValue();
			},
			$response->getRows()
		);
	}
}
