<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Report\ResponseTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Report
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Report;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4\Report\Row_Trait as Analytics_4_Report_Row_Trait;
use Google\Site_Kit\Modules\Analytics_4\Report\Response as Analytics_4_Report_Response;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DimensionHeader;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DimensionValue;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\MetricHeader;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Row;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportResponse;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

/**
 * @group Modules
 * @group Analytics_4
 * @group Report
 */
class ResponseTest extends TestCase {

	use Analytics_4_Report_Row_Trait;

	const DEFAULT_VALUE_FOR_EXISTING_ROWS = '99';

	/**
	 * @var Analytics_4_Report_Response
	 */
	protected $report_response;

	public function set_up() {
		parent::set_up();

		$context               = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->report_response = new Analytics_4_Report_Response( $context );
	}

	private function get_parsed_response_for_args( $report_args, $initial_data ) {
		$first_metric = new MetricHeader();
		$first_metric->setType( 'TYPE_INTEGER' );

		$second_metric = new MetricHeader();
		$second_metric->setType( 'TYPE_KILOMETERS' );

		$data          = new Data_Request( '', '', '', '', $report_args );
		$metric_header = array( $first_metric, $second_metric );

		$response = new RunReportResponse();
		$response->setMetricHeaders( $metric_header );

		if ( ! empty( $initial_data ) ) {
			$report_rows = array();

			foreach ( $initial_data as $initial_row ) {
				$report_rows[] = $this->create_report_row(
					$metric_header,
					$initial_row[0],
					isset( $initial_row[1] ) ? $initial_row[1] : false,
					self::DEFAULT_VALUE_FOR_EXISTING_ROWS
				);
			}

			$response->setRows( $report_rows );
			$response->setRowCount( count( $report_rows ) );
		}

		return $this->report_response->parse_response( $data, $response );
	}

	public function data_report_args() {
		return array(
			'single range'                                => array(
				array(
					'report_args'                      => array(
						'startDate'  => '2023-02-01',
						'endDate'    => '2023-02-03',
						'dimensions' => 'date',
					),
					'initial_data'                     => array(),
					'expected_dates_ranges_and_values' => array(
						array( '20230201', '0' ),
						array( '20230202', '0' ),
						array( '20230203', '0' ),
					),
					'expected_dimension_values'        => 1,
				),
			),
			'multiple ranges'                             => array(
				array(
					'report_args'                      => array(
						'startDate'        => '2022-12-05',
						'endDate'          => '2022-12-07',
						'compareStartDate' => '2022-12-02',
						'compareEndDate'   => '2022-12-04',
						'dimensions'       => 'date',
					),
					'initial_data'                     => array(),
					'expected_dates_ranges_and_values' => array(
						array( '20221202', 'date_range_1', '0' ),
						array( '20221202', 'date_range_0', '0' ),
						array( '20221203', 'date_range_1', '0' ),
						array( '20221203', 'date_range_0', '0' ),
						array( '20221204', 'date_range_1', '0' ),
						array( '20221204', 'date_range_0', '0' ),
						array( '20221205', 'date_range_0', '0' ),
						array( '20221205', 'date_range_1', '0' ),
						array( '20221206', 'date_range_0', '0' ),
						array( '20221206', 'date_range_1', '0' ),
						array( '20221207', 'date_range_0', '0' ),
						array( '20221207', 'date_range_1', '0' ),
					),
					'expected_dimension_values'        => 2,
				),
			),
			'overlapping ranges'                          => array(
				array(
					'report_args'                      => array(
						'startDate'        => '2023-01-01',
						'endDate'          => '2023-01-04',
						'compareStartDate' => '2023-01-03',
						'compareEndDate'   => '2023-01-05',
						'dimensions'       => 'date',
					),
					'initial_data'                     => array(),
					'expected_dates_ranges_and_values' => array(
						array( '20230101', 'date_range_0', '0' ),
						array( '20230101', 'date_range_1', '0' ),
						array( '20230102', 'date_range_0', '0' ),
						array( '20230102', 'date_range_1', '0' ),
						array( '20230103', 'date_range_0', '0' ),
						array( '20230103', 'date_range_1', '0' ),
						array( '20230104', 'date_range_0', '0' ),
						array( '20230104', 'date_range_1', '0' ),
						array( '20230105', 'date_range_1', '0' ),
						array( '20230105', 'date_range_0', '0' ),
					),
					'expected_dimension_values'        => 2,
				),
			),
			'some rows exist in the single range request' => array(
				array(
					'report_args'                      => array(
						'startDate'  => '2023-02-01',
						'endDate'    => '2023-02-05',
						'dimensions' => 'date',
					),
					'initial_data'                     => array(
						array( '20230201' ),
						array( '20230204' ),
					),
					'expected_dates_ranges_and_values' => array(
						array( '20230201', self::DEFAULT_VALUE_FOR_EXISTING_ROWS ),
						array( '20230202', '0' ),
						array( '20230203', '0' ),
						array( '20230204', self::DEFAULT_VALUE_FOR_EXISTING_ROWS ),
						array( '20230205', '0' ),
					),
					'expected_dimension_values'        => 1,
				),
			),
			'some rows exist in the multi ranges request' => array(
				array(
					'report_args'                      => array(
						'startDate'        => '2023-02-01',
						'endDate'          => '2023-02-03',
						'compareStartDate' => '2023-01-01',
						'compareEndDate'   => '2023-01-03',
						'dimensions'       => 'date',
					),
					'initial_data'                     => array(
						array( '20230101', 1 ),
						array( '20230203', 0 ),
					),
					'expected_dates_ranges_and_values' => array(
						array( '20230101', 'date_range_1', self::DEFAULT_VALUE_FOR_EXISTING_ROWS ),
						array( '20230101', 'date_range_0', '0' ),
						array( '20230102', 'date_range_1', '0' ),
						array( '20230102', 'date_range_0', '0' ),
						array( '20230103', 'date_range_1', '0' ),
						array( '20230103', 'date_range_0', '0' ),
						array( '20230201', 'date_range_0', '0' ),
						array( '20230201', 'date_range_1', '0' ),
						array( '20230202', 'date_range_0', '0' ),
						array( '20230202', 'date_range_1', '0' ),
						array( '20230203', 'date_range_0', self::DEFAULT_VALUE_FOR_EXISTING_ROWS ),
						array( '20230203', 'date_range_1', '0' ),
					),
					'expected_dimension_values'        => 2,
				),
			),
		);
	}

	/**
	 * @dataProvider data_report_args
	 */
	public function test_parse_response( $args ) {
		$response = $this->get_parsed_response_for_args( $args['report_args'], $args['initial_data'] );
		$this->assertEquals( count( $args['expected_dates_ranges_and_values'] ), $response->getRowCount(), 'Row count should match expected from filled date ranges.' );

		foreach ( $response->getRows() as $i => $row ) {
			// Verify that dimension values are set correctly.
			$dimension_values = $row->getDimensionValues();
			$this->assertCount( $args['expected_dimension_values'], $dimension_values, 'Dimension values count should match expected.' );
			$this->assertEquals( $args['expected_dates_ranges_and_values'][ $i ][0], $dimension_values[0]->getValue(), 'Primary dimension value should match expected date.' );
			$expected_value_index = 1;
			if ( $args['expected_dimension_values'] > 1 ) {
				$this->assertEquals( $args['expected_dates_ranges_and_values'][ $i ][1], $dimension_values[1]->getValue(), 'Secondary dimension value should match expected range key.' );
				++$expected_value_index;
			}

			// Verify that metric values are set correctly.
			$this->assertEquals( $args['expected_dates_ranges_and_values'][ $i ][ $expected_value_index ], $row->getMetricValues()[0]->getValue(), 'First metric value should match expected.' );
			$this->assertEquals( $args['expected_dates_ranges_and_values'][ $i ][ $expected_value_index ], $row->getMetricValues()[1]->getValue(), 'Second metric value should match expected.' );
		}
	}

	/**
	 * Builds a report response with the given dimensions and the dimension values of each row.
	 *
	 * @since n.e.x.t
	 *
	 * @param string[] $dimension_names The names of the dimensions, such as `pagePathPlusQueryString`.
	 * @param array    $rows            The dimension values of each row, in the order of the dimensions.
	 * @return RunReportResponse The report response.
	 */
	private function create_report_response( array $dimension_names, array $rows ) {
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
	private function get_dimension_values( RunReportResponse $response, $dimension_index ) {
		return array_map(
			function ( $row ) use ( $dimension_index ) {
				return $row->getDimensionValues()[ $dimension_index ]->getValue();
			},
			$response->getRows()
		);
	}

	public function test_remove_private_query_args__keeps_only_the_public_query_vars_of_each_url() {
		// WooCommerce adds each endpoint, such as `order-received`, as a public
		// query var through the `query_vars` filter.
		add_filter(
			'query_vars',
			function ( $query_vars ) {
				$query_vars[] = 'order-received';
				return $query_vars;
			}
		);

		$response = $this->create_report_response(
			array( 'pagePathPlusQueryString' ),
			array(
				array( '/?p=1&utm_source=newsletter' ),
				array( '/?page_id=19&order-received=123&key=wc_order_abc' ),
				array( '/?s=hats&email=jo%40example.com' ),
				array( '/?key=wc_order_abc' ),
				array( '/' ),
			)
		);

		$this->report_response->remove_private_query_args( $response );

		$this->assertSame(
			array( '/?p=1', '/?page_id=19&order-received=123', '/?s=hats', '/', '/' ),
			$this->get_dimension_values( $response, 0 ),
			'Each URL should keep only the query vars that WordPress reads, so an order key or an email address never reaches a view-only user.'
		);
	}

	public function test_remove_private_query_args__reads_a_list_query_var_by_its_name() {
		$response = $this->create_report_response(
			array( 'pagePathPlusQueryString' ),
			array( array( '/?post_type%5B%5D=book&key=wc_order_abc' ) )
		);

		$this->report_response->remove_private_query_args( $response );

		$this->assertSame(
			array( '/?post_type%5B%5D=book' ),
			$this->get_dimension_values( $response, 0 ),
			'A list query arg, such as `post_type[]`, should read as the query var named before its brackets.'
		);
	}

	public function test_remove_private_query_args__leaves_other_dimensions_unchanged() {
		$response = $this->create_report_response(
			array( 'pagePathPlusQueryString', 'pageTitle' ),
			array( array( '/?p=1&key=wc_order_abc', 'Order?key=wc_order_abc' ) )
		);

		$this->report_response->remove_private_query_args( $response );

		$this->assertSame(
			array( 'Order?key=wc_order_abc' ),
			$this->get_dimension_values( $response, 1 ),
			'A dimension other than `pagePathPlusQueryString` should keep its value.'
		);
	}

	public function test_remove_private_query_args__returns_a_value_that_is_not_a_report_unchanged() {
		$error = new WP_Error( 'internal_server_error', 'Internal server error' );

		$this->assertSame( $error, $this->report_response->remove_private_query_args( $error ), 'A value that is not a report response, such as an error, should come back unchanged.' );
	}
}
