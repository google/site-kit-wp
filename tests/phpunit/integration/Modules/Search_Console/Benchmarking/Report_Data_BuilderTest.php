<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Search_Console\Benchmarking\Report_Data_BuilderTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Search_Console\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Search_Console\Benchmarking;

use Google\Site_Kit\Modules\Search_Console\Benchmarking\Report_Data_Builder;
use Google\Site_Kit\Tests\Authenticated_Search_Console_Trait;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Modules
 * @group Search_Console
 */
class Report_Data_BuilderTest extends TestCase {

	use Authenticated_Search_Console_Trait;

	/**
	 * Report_Data_Builder instance.
	 *
	 * @var Report_Data_Builder
	 */
	private $builder;

	/**
	 * Rows the fake Search Console API returns, keyed by the identifier of the
	 * report, `current` or `previous`.
	 *
	 * Each row lists its query, its clicks, and its average position.
	 *
	 * @var array
	 */
	private $report_rows = array();

	/**
	 * The identifier of the report the fake Search Console API refuses, or an
	 * empty string when it refuses none.
	 *
	 * @var string
	 */
	private $refused_report_identifier = '';

	/**
	 * Whether the fake Search Console API refuses the whole batch call.
	 *
	 * @var bool
	 */
	private $is_batch_call_refused = false;

	/**
	 * Body of the batch call the fake Search Console API received.
	 *
	 * @var string
	 */
	private $batch_request_body = '';

	public function set_up() {
		parent::set_up();

		$search_console = $this->create_authenticated_search_console(
			function ( Request $request ) {
				$this->batch_request_body = (string) $request->getBody();

				if ( $this->is_batch_call_refused ) {
					return new FulfilledPromise( $this->create_error_response() );
				}

				return new FulfilledPromise(
					FakeHttp::create_batch_response(
						$request,
						function ( $identifier ) {
							if ( $identifier === $this->refused_report_identifier ) {
								return $this->create_error_response();
							}

							return new Response(
								200,
								array(),
								wp_json_encode(
									array(
										'rows' => array_map(
											fn( $row ) => array(
												'keys'     => array( $row[0] ),
												'clicks'   => $row[1],
												'position' => $row[2],
											),
											$this->report_rows[ $identifier ] ?? array()
										),
									)
								)
							);
						}
					)
				);
			}
		);

		$search_console->get_settings()->merge( array( 'propertyID' => 'https://example.com/' ) );

		$this->builder = new Report_Data_Builder( $search_console );
	}

	/**
	 * Creates the response the Search Console API refuses a request with.
	 *
	 * @since n.e.x.t
	 *
	 * @return Response The `403` response.
	 */
	private function create_error_response() {
		return new Response(
			403,
			array( 'Content-Type' => 'application/json' ),
			wp_json_encode(
				array(
					'error' => array(
						'code'    => 403,
						'message' => 'User does not have sufficient permission for site.',
						'errors'  => array(
							array(
								'message' => 'User does not have sufficient permission for site.',
								'domain'  => 'global',
								'reason'  => 'forbidden',
							),
						),
					),
				)
			)
		);
	}

	public function test_build_search_query_rows__pairs_each_query_across_the_two_periods() {
		$this->report_rows = array(
			'current'  => array(
				array( 'plant garlic', 300, 3.4 ),
				array( 'raised beds', 280, 5 ),
			),
			'previous' => array(
				array( 'raised beds', 200, 5.5 ),
				array( 'plant garlic', 210, 4.8 ),
			),
		);

		$rows = $this->builder->build_search_query_rows(
			array(
				'start_date'         => '2026-08-19',
				'end_date'           => '2026-09-15',
				'compare_start_date' => '2026-07-22',
				'compare_end_date'   => '2026-08-18',
				'row_limit'          => 50,
			)
		);

		$this->assertSame(
			array(
				array(
					'label'            => 'plant garlic',
					'current'          => 300,
					'previous'         => 210,
					'positionCurrent'  => 3.4,
					'positionPrevious' => 4.8,
				),
				array(
					'label'            => 'raised beds',
					'current'          => 280,
					'previous'         => 200,
					'positionCurrent'  => 5.0,
					'positionPrevious' => 5.5,
				),
			),
			$rows,
			'Each query should have its clicks and its average position in the selected and the compare period.'
		);
	}

	public function test_build_search_query_rows__asks_for_the_queries_of_each_period_with_the_row_limit() {
		$this->builder->build_search_query_rows(
			array(
				'start_date'         => '2026-08-19',
				'end_date'           => '2026-09-15',
				'compare_start_date' => '2026-07-22',
				'compare_end_date'   => '2026-08-18',
				'row_limit'          => 50,
			)
		);

		// Each part of the batch body has its JSON request on one line.
		preg_match_all( '/^\{.*\}$/m', $this->batch_request_body, $request_bodies );

		$this->assertSame(
			array(
				array(
					'dimensions' => array( 'query' ),
					'endDate'    => '2026-09-15',
					'rowLimit'   => 50,
					'startDate'  => '2026-08-19',
				),
				array(
					'dimensions' => array( 'query' ),
					'endDate'    => '2026-08-18',
					'rowLimit'   => 50,
					'startDate'  => '2026-07-22',
				),
			),
			array_map(
				fn( $request_body ) => array_intersect_key(
					json_decode( $request_body, true ),
					array_flip( array( 'dimensions', 'startDate', 'endDate', 'rowLimit' ) )
				),
				$request_bodies[0]
			),
			'The batch call should ask for the queries of the selected period, then of the compare period, each limited to 50 rows.'
		);
	}

	public function test_build_search_query_rows__lists_0_clicks_and_no_position_for_a_query_missing_from_a_period() {
		$this->report_rows = array(
			'current'  => array(
				array( 'compost bin', 40, 9.2 ),
			),
			'previous' => array(
				array( 'seed trays', 25, 8.1 ),
			),
		);

		$rows = $this->builder->build_search_query_rows(
			array(
				'start_date'         => '2026-08-19',
				'end_date'           => '2026-09-15',
				'compare_start_date' => '2026-07-22',
				'compare_end_date'   => '2026-08-18',
				'row_limit'          => 50,
			)
		);

		$this->assertSame(
			array(
				array(
					'label'            => 'compost bin',
					'current'          => 40,
					'previous'         => 0,
					'positionCurrent'  => 9.2,
					'positionPrevious' => null,
				),
				array(
					'label'            => 'seed trays',
					'current'          => 0,
					'previous'         => 25,
					'positionCurrent'  => null,
					'positionPrevious' => 8.1,
				),
			),
			$rows,
			'A query reported in one period only should have `0` clicks and a `null` average position in the other.'
		);
	}

	public function test_build_search_query_rows__returns_no_rows_when_the_batch_call_fails() {
		$this->report_rows = array(
			'current'  => array(
				array( 'plant garlic', 300, 3.4 ),
			),
			'previous' => array(
				array( 'plant garlic', 210, 4.8 ),
			),
		);

		$this->is_batch_call_refused = true;

		$rows = $this->builder->build_search_query_rows(
			array(
				'start_date'         => '2026-08-19',
				'end_date'           => '2026-09-15',
				'compare_start_date' => '2026-07-22',
				'compare_end_date'   => '2026-08-18',
				'row_limit'          => 50,
			)
		);

		$this->assertSame( array(), $rows, 'There should be no rows when Search Console refuses the batch call.' );
	}

	public function test_build_search_query_rows__returns_no_rows_when_the_report_of_the_compare_period_fails() {
		$this->report_rows = array(
			'current'  => array(
				array( 'plant garlic', 300, 3.4 ),
			),
			'previous' => array(
				array( 'plant garlic', 210, 4.8 ),
			),
		);

		$this->refused_report_identifier = 'previous';

		$rows = $this->builder->build_search_query_rows(
			array(
				'start_date'         => '2026-08-19',
				'end_date'           => '2026-09-15',
				'compare_start_date' => '2026-07-22',
				'compare_end_date'   => '2026-08-18',
				'row_limit'          => 50,
			)
		);

		$this->assertSame( array(), $rows, 'There should be no rows when the report of the compare period fails, rather than rows with `0` clicks in it.' );
	}

	public function test_build_search_query_rows__returns_no_rows_when_the_report_of_the_selected_period_fails() {
		$this->report_rows = array(
			'current'  => array(
				array( 'plant garlic', 300, 3.4 ),
			),
			'previous' => array(
				array( 'plant garlic', 210, 4.8 ),
			),
		);

		$this->refused_report_identifier = 'current';

		$rows = $this->builder->build_search_query_rows(
			array(
				'start_date'         => '2026-08-19',
				'end_date'           => '2026-09-15',
				'compare_start_date' => '2026-07-22',
				'compare_end_date'   => '2026-08-18',
				'row_limit'          => 50,
			)
		);

		$this->assertSame( array(), $rows, 'There should be no rows when the report of the selected period fails, rather than rows with `0` clicks in it.' );
	}

	public function test_build_search_query_rows__returns_no_rows_when_neither_report_has_rows() {
		$rows = $this->builder->build_search_query_rows(
			array(
				'start_date'         => '2026-08-19',
				'end_date'           => '2026-09-15',
				'compare_start_date' => '2026-07-22',
				'compare_end_date'   => '2026-08-18',
				'row_limit'          => 50,
			)
		);

		$this->assertSame( array(), $rows, 'There should be no rows when neither report has a row.' );
	}
}
