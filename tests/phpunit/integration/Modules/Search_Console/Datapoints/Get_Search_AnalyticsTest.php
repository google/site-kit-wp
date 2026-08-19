<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Search_Console\Datapoints\Get_Search_AnalyticsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Search_Console\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Search_Console\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Search_Console;
use Google\Site_Kit\Modules\Search_Console\Datapoints\Get_Search_Analytics;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole as Google_Service_SearchConsole;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\ApiDataRow;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\SearchAnalyticsQueryResponse;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Modules
 * @group Search_Console
 * @group Datapoints
 */
class Get_Search_AnalyticsTest extends TestCase {

	/**
	 * Datapoint instance.
	 *
	 * @var Get_Search_Analytics
	 */
	private $datapoint;

	/**
	 * Search Console module instance.
	 *
	 * @var Search_Console
	 */
	private $search_console;

	/**
	 * Captured outgoing request.
	 *
	 * @var Request
	 */
	private $captured_request;

	public function set_up() {
		parent::set_up();

		$context              = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options              = new Options( $context );
		$user                 = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options         = new User_Options( $context, $user->ID );
		$authentication       = new Authentication( $context, $options, $user_options );
		$this->search_console = new Search_Console( $context, $options, $user_options, $authentication );

		$this->search_console->get_settings()->merge( array( 'propertyID' => 'https://example.com' ) );

		$this->search_console->get_client()->withDefer( true );
		$service = new Google_Service_SearchConsole( $this->search_console->get_client() );

		$this->datapoint = new Get_Search_Analytics(
			array(
				'service'   => function () use ( $service ) {
					return $service;
				},
				'shareable' => true,
				'settings'  => $this->search_console->get_settings(),
				'context'   => $context,
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->search_console->get_client(),
			function ( Request $request ) {
				$this->captured_request = $request;

				return new FulfilledPromise( new Response( 200, array(), '{}' ) );
			}
		);

		wp_set_current_user( $user->ID );
	}

	public function test_create_request__queries_the_configured_property() {
		$data_request = new Data_Request(
			'GET',
			'modules',
			Search_Console::MODULE_SLUG,
			'searchanalytics',
			array(
				'startDate' => '2024-01-01',
				'endDate'   => '2024-01-07',
			)
		);

		$request = $this->datapoint->create_request( $data_request );

		$this->search_console->get_client()->execute( $request );

		$this->assertEquals(
			'https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fexample.com/searchAnalytics/query',
			(string) $this->captured_request->getUri(),
			'The request should query the search analytics endpoint for the configured property.'
		);

		$body = json_decode( (string) $this->captured_request->getBody(), true );

		$this->assertEquals( '2024-01-01', $body['startDate'], 'The request should use the provided start date.' );
		$this->assertEquals( '2024-01-07', $body['endDate'], 'The request should use the provided end date.' );
		$this->assertEquals( 'all', $body['dataState'], 'The request should always ask for the `all` data state.' );
	}

	public function test_create_request__passes_dimensions_and_row_limit() {
		$data_request = new Data_Request(
			'GET',
			'modules',
			Search_Console::MODULE_SLUG,
			'searchanalytics',
			array(
				'startDate'  => '2024-01-01',
				'endDate'    => '2024-01-07',
				'dimensions' => 'date,page',
				'limit'      => 5,
			)
		);

		$request = $this->datapoint->create_request( $data_request );

		$this->search_console->get_client()->execute( $request );

		$body = json_decode( (string) $this->captured_request->getBody(), true );

		$this->assertEquals( array( 'date', 'page' ), $body['dimensions'], 'A comma separated dimensions string should be parsed into a list.' );
		$this->assertEquals( 5, $body['rowLimit'], 'The `limit` parameter should map to the request row limit.' );
	}

	public function test_parse_response__returns_rows_from_search_analytics_query_response() {
		$row = new ApiDataRow();
		$row->setKeys( array( '2024-01-01' ) );
		$row->setClicks( 5 );

		$query_response = new SearchAnalyticsQueryResponse();
		$query_response->setRows( array( $row ) );

		$parsed = $this->datapoint->parse_response( $query_response, $this->get_data_request() );

		$this->assertEquals( $query_response->getRows(), $parsed, 'A SearchAnalyticsQueryResponse should be reduced to its rows.' );
	}

	public function test_parse_response__returns_rows_from_any_object_exposing_get_rows() {
		$response = new class() {

			/**
			 * Returns fake rows.
			 *
			 * @return array Rows.
			 */
			public function getRows() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid
				return array( 'row-1', 'row-2' );
			}
		};

		$parsed = $this->datapoint->parse_response( $response, $this->get_data_request() );

		$this->assertEquals( array( 'row-1', 'row-2' ), $parsed, 'Any object exposing getRows() should be reduced to its rows.' );
	}

	public function test_parse_response__passes_through_values_without_rows() {
		$response = array( 'unexpected' => 'value' );

		$parsed = $this->datapoint->parse_response( $response, $this->get_data_request() );

		$this->assertEquals( $response, $parsed, 'A response without rows should be passed through unchanged.' );
	}

	/**
	 * Gets a minimal data request for the datapoint.
	 *
	 * @return Data_Request Data request instance.
	 */
	private function get_data_request() {
		return new Data_Request( 'GET', 'modules', Search_Console::MODULE_SLUG, 'searchanalytics' );
	}
}
