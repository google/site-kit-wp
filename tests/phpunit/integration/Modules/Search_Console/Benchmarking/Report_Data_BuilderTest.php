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
	 * report, such as `current` or `previous-pages`.
	 *
	 * Each row lists its keys, the query and then the page or the device of a
	 * page or device report, then its clicks and its average position.
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

							$rows = array_map(
								fn( $row ) => array(
									'keys'     => array_slice( $row, 0, -2 ),
									'clicks'   => $row[ count( $row ) - 2 ],
									'position' => $row[ count( $row ) - 1 ],
								),
								$this->report_rows[ $identifier ] ?? array()
							);

							// Google APIs leave an empty list out of their JSON, so a
							// report with no rows has no `rows` key.
							return new Response(
								200,
								array(),
								wp_json_encode( empty( $rows ) ? array() : array( 'rows' => $rows ) )
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
	 * @since 1.190.0
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

	/**
	 * Builds the rows for the period of every test.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The rows, keyed by contextual data key.
	 */
	private function build_rows() {
		return $this->builder->build_rows(
			array(
				'start_date'         => '2026-08-19',
				'end_date'           => '2026-09-15',
				'compare_start_date' => '2026-07-22',
				'compare_end_date'   => '2026-08-18',
				'row_limit'          => 50,
			)
		);
	}

	public function test_build_rows__pairs_each_query_across_the_two_periods() {
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

		$this->assertSame(
			array(
				'searchQueries' => array(
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
			),
			$this->build_rows(),
			'Each query should have its clicks and its average position in the selected and the compare period.'
		);
	}

	public function test_build_rows__asks_for_the_queries_their_pages_and_their_devices_of_each_period_with_the_row_limit() {
		$this->build_rows();

		// Each part of the batch body has its JSON request on one line.
		preg_match_all( '/^\{.*\}$/m', $this->batch_request_body, $request_bodies );

		$requests = array();

		foreach ( array( array( 'query' ), array( 'query', 'page' ), array( 'query', 'device' ) ) as $dimensions ) {
			$requests[] = array(
				'dimensions' => $dimensions,
				'endDate'    => '2026-09-15',
				'rowLimit'   => 50,
				'startDate'  => '2026-08-19',
			);
			$requests[] = array(
				'dimensions' => $dimensions,
				'endDate'    => '2026-08-18',
				'rowLimit'   => 50,
				'startDate'  => '2026-07-22',
			);
		}

		$this->assertSame(
			$requests,
			array_map(
				fn( $request_body ) => array_intersect_key(
					json_decode( $request_body, true ),
					array_flip( array( 'dimensions', 'startDate', 'endDate', 'rowLimit' ) )
				),
				$request_bodies[0]
			),
			'The batch call should ask for the queries, the queries by page, and the queries by device, each of the selected period and then of the compare period, each limited to 50 rows.'
		);
	}

	public function test_build_rows__lists_0_clicks_and_no_position_for_a_query_missing_from_a_period() {
		$this->report_rows = array(
			'current'  => array(
				array( 'compost bin', 40, 9.2 ),
			),
			'previous' => array(
				array( 'seed trays', 25, 8.1 ),
			),
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
			$this->build_rows()['searchQueries'],
			'A query reported in one period only should have `0` clicks and a `null` average position in the other.'
		);
	}

	public function test_build_rows__lists_the_page_of_each_query_as_its_path_and_adds_up_the_urls_of_a_path() {
		$this->report_rows = array(
			'current-pages'  => array(
				array( 'plant garlic', 'https://example.com/plant-garlic/', 90, 2.0 ),
				array( 'plant garlic', 'http://example.com/plant-garlic/', 10, 3.0 ),
				array( 'plant garlic', 'https://example.com', 5, 1.0 ),
			),
			'previous-pages' => array(
				array( 'plant garlic', 'https://example.com/plant-garlic/', 40, 4.0 ),
			),
		);

		$this->assertSame(
			array(
				array(
					'query'    => 'plant garlic',
					'page'     => '/plant-garlic/',
					'current'  => 100,
					'previous' => 40,
				),
				array(
					'query'    => 'plant garlic',
					'page'     => '/',
					'current'  => 5,
					'previous' => 0,
				),
			),
			$this->build_rows()['searchQueryPages'],
			'Each page should be its path, as Analytics names a landing page, with the clicks of its `http` and `https` URLs added up.'
		);
	}

	public function test_build_rows__lists_the_device_of_each_query_in_lowercase() {
		$this->report_rows = array(
			'current-devices'  => array(
				array( 'plant garlic', 'MOBILE', 70, 2.0 ),
			),
			'previous-devices' => array(
				array( 'plant garlic', 'MOBILE', 30, 3.0 ),
				array( 'plant garlic', 'DESKTOP', 5, 3.0 ),
			),
		);

		$this->assertSame(
			array(
				array(
					'query'    => 'plant garlic',
					'device'   => 'mobile',
					'current'  => 70,
					'previous' => 30,
				),
				array(
					'query'    => 'plant garlic',
					'device'   => 'desktop',
					'current'  => 0,
					'previous' => 5,
				),
			),
			$this->build_rows()['searchQueryDevices'],
			'Each device should be in lowercase, as Analytics names it.'
		);
	}

	public function test_build_rows__returns_no_rows_when_the_batch_call_fails() {
		$this->report_rows = array(
			'current'  => array(
				array( 'plant garlic', 300, 3.4 ),
			),
			'previous' => array(
				array( 'plant garlic', 210, 4.8 ),
			),
		);

		$this->is_batch_call_refused = true;

		$this->assertSame( array(), $this->build_rows(), 'There should be no rows when Search Console refuses the batch call.' );
	}

	/**
	 * @dataProvider data_refused_query_reports
	 *
	 * @param string $refused_report_identifier The identifier of the report Search Console refuses.
	 */
	public function test_build_rows__returns_no_query_rows_when_the_query_report_of_either_period_fails( $refused_report_identifier ) {
		$this->report_rows = array(
			'current'  => array(
				array( 'plant garlic', 300, 3.4 ),
			),
			'previous' => array(
				array( 'plant garlic', 210, 4.8 ),
			),
		);

		$this->refused_report_identifier = $refused_report_identifier;

		$this->assertSame( array(), $this->build_rows(), "There should be no query rows when the `{$refused_report_identifier}` report fails, rather than rows with `0` clicks in it." );
	}

	public function data_refused_query_reports() {
		return array(
			'the selected period' => array( 'current' ),
			'the compare period'  => array( 'previous' ),
		);
	}

	public function test_build_rows__keeps_the_queries_and_their_devices_when_a_page_report_fails() {
		$this->report_rows = array(
			'current'          => array(
				array( 'plant garlic', 300, 3.4 ),
			),
			'previous'         => array(
				array( 'plant garlic', 210, 4.8 ),
			),
			'current-pages'    => array(
				array( 'plant garlic', 'https://example.com/plant-garlic/', 300, 3.4 ),
			),
			'current-devices'  => array(
				array( 'plant garlic', 'MOBILE', 300, 3.4 ),
			),
			'previous-devices' => array(
				array( 'plant garlic', 'MOBILE', 210, 4.8 ),
			),
		);

		$this->refused_report_identifier = 'previous-pages';

		$this->assertSame( array( 'searchQueries', 'searchQueryDevices' ), array_keys( $this->build_rows() ), 'A failed page report should leave out the pages alone.' );
	}

	public function test_build_rows__returns_no_rows_when_no_report_has_rows() {
		$this->assertSame( array(), $this->build_rows(), 'There should be no rows when no report has a row.' );
	}
}
