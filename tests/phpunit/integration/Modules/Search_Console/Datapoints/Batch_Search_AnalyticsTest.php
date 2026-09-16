<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Search_Console\Datapoints\Batch_Search_AnalyticsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Search_Console\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Search_Console\Datapoints;

use Exception;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Search_Console;
use Google\Site_Kit\Modules\Search_Console\Datapoints\Batch_Search_Analytics;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\Exception as Google_Service_Exception;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole as Google_Service_SearchConsole;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\ApiDataRow;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\SearchAnalyticsQueryResponse;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_Error;

/**
 * @group Modules
 * @group Search_Console
 * @group Datapoints
 */
class Batch_Search_AnalyticsTest extends TestCase {

	/**
	 * Datapoint instance.
	 *
	 * @var Batch_Search_Analytics
	 */
	private $datapoint;

	/**
	 * Search Console module instance.
	 *
	 * @var Search_Console
	 */
	private $search_console;

	/**
	 * Plugin context instance.
	 *
	 * @var Context
	 */
	private $context;

	public function set_up() {
		parent::set_up();

		$this->context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options              = new Options( $this->context );
		$user                 = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options         = new User_Options( $this->context, $user->ID );
		$authentication       = new Authentication( $this->context, $options, $user_options );
		$this->search_console = new Search_Console( $this->context, $options, $user_options, $authentication );

		$this->search_console->get_settings()->merge( array( 'propertyID' => 'https://example.com' ) );

		$this->search_console->get_client()->withDefer( true );
		$service = new Google_Service_SearchConsole( $this->search_console->get_client() );

		$this->datapoint = $this->create_datapoint(
			function () use ( $service ) {
				return $service;
			}
		);

		FakeHttp::fake_google_http_handler(
			$this->search_console->get_client(),
			function () {
				return new FulfilledPromise( new Response( 200, array(), '{}' ) );
			}
		);

		wp_set_current_user( $user->ID );
	}

	public function test_create_request__requires_requests_param() {
		$this->expectException( Missing_Required_Param_Exception::class );

		$this->datapoint->create_request( $this->get_data_request( array() ) );
	}

	public function test_create_request__requires_requests_param_to_be_an_array() {
		$this->expectException( Missing_Required_Param_Exception::class );

		$this->datapoint->create_request( $this->get_data_request( array( 'requests' => 'not-an-array' ) ) );
	}

	public function test_create_request__requires_an_identifier_per_request() {
		$this->expectException( Missing_Required_Param_Exception::class );

		$this->datapoint->create_request(
			$this->get_data_request(
				array(
					'requests' => array(
						array( 'startDate' => '2024-01-01' ),
					),
				)
			)
		);
	}

	public function test_create_request__adds_every_valid_entry_to_the_batch() {
		$service   = $this->get_recording_service_double();
		$datapoint = $this->create_datapoint(
			function () use ( $service ) {
				return $service;
			}
		);

		$request = $datapoint->create_request(
			$this->get_data_request(
				array(
					'requests' => array(
						array(
							'identifier' => 'first',
							'startDate'  => '2024-01-01',
							'endDate'    => '2024-01-07',
						),
						array(
							'id'        => 'second',
							'startDate' => '2024-01-08',
							'endDate'   => '2024-01-14',
						),
					),
				)
			)
		);

		$this->assertIsCallable( $request, 'A batch of valid requests should return an executable callable.' );
		$this->assertEquals(
			array( 'first', 'second' ),
			array_keys( $service->batch->added ),
			'Every valid entry should be added to the batch keyed by its identifier, supporting both `identifier` and `id`.'
		);
		$this->assertEquals(
			array( 'executed' => true ),
			$request(),
			'Invoking the returned callable should execute the batch rather than short-circuiting to an empty result.'
		);
	}

	public function test_create_request__returns_empty_result_when_every_entry_fails() {
		$datapoint = $this->create_datapoint(
			function () {
				return $this->get_failing_service_double();
			}
		);

		$request = $datapoint->create_request(
			$this->get_data_request(
				array(
					'requests' => array(
						array( 'identifier' => 'first' ),
					),
				)
			)
		);

		$this->assertIsCallable( $request, 'A batch with no valid requests should still return a callable.' );
		$this->assertSame( array(), $request(), 'A batch with no valid requests should resolve to an empty array.' );

		$parsed = $datapoint->parse_response( array(), $this->get_data_request( array() ) );

		$this->assertArrayHasKey( 'first', $parsed, 'The failed entry should be represented in the parsed response.' );
		$this->assertInstanceOf( WP_Error::class, $parsed['first'], 'A failed entry should be mapped to a WP_Error.' );
		$this->assertEquals(
			'searchanalytics_batch_request_failed',
			$parsed['first']->get_error_code(),
			'A failed entry should use the batch request failure error code.'
		);
	}

	public function test_parse_response__maps_responses_in_request_order() {
		$this->create_batch_request( array( 'first', 'second' ) );

		$parsed = $this->datapoint->parse_response(
			array(
				'response-second' => $this->get_query_response( 2 ),
				'response-first'  => $this->get_query_response( 1 ),
			),
			$this->get_data_request( array() )
		);

		$this->assertEquals(
			array( 'first', 'second' ),
			array_keys( $parsed ),
			'Responses should be ordered by the original request order and have the `response-` prefix stripped.'
		);
		$this->assertEquals( 1, $parsed['first'][0]->getClicks(), 'The first identifier should map to its own response.' );
		$this->assertEquals( 2, $parsed['second'][0]->getClicks(), 'The second identifier should map to its own response.' );
	}

	public function test_parse_response__falls_back_to_an_error_for_missing_responses() {
		$this->create_batch_request( array( 'first', 'second' ) );

		$parsed = $this->datapoint->parse_response(
			array( 'response-first' => $this->get_query_response( 1 ) ),
			$this->get_data_request( array() )
		);

		$this->assertInstanceOf( WP_Error::class, $parsed['second'], 'A missing response should fall back to a WP_Error.' );
		$this->assertEquals(
			'searchanalytics_batch_missing_response',
			$parsed['second']->get_error_code(),
			'A missing response should use the missing response error code.'
		);
	}

	public function test_parse_response__converts_api_exceptions_to_wp_error() {
		$this->create_batch_request( array( 'first' ) );

		$parsed = $this->datapoint->parse_response(
			array( 'response-first' => new Google_Service_Exception( 'Rate limit exceeded', 429 ) ),
			$this->get_data_request( array() )
		);

		$this->assertInstanceOf( WP_Error::class, $parsed['first'], 'An API exception should be converted to a WP_Error.' );
		$this->assertEquals( 'searchanalytics_batch_request_failed', $parsed['first']->get_error_code(), 'The converted error should use the batch request failure code.' );
		$this->assertEquals( 'Rate limit exceeded', $parsed['first']->get_error_message(), 'The converted error should preserve the exception message.' );
		$this->assertEquals( 429, $parsed['first']->get_error_data()['status'], 'The converted error should preserve the exception status code.' );
	}

	public function test_parse_response__returns_wp_error_responses_unchanged() {
		$error = new WP_Error( 'batch_failed', 'Batch failed.' );

		$this->assertSame(
			$error,
			$this->datapoint->parse_response( $error, $this->get_data_request( array() ) ),
			'A WP_Error batch response should be returned unchanged.'
		);
	}

	/**
	 * Gets a Search Console service double that records everything added to its batch.
	 *
	 * @return object Service double exposing the created batch via `$batch`.
	 */
	private function get_recording_service_double() {
		return new class() {

			/**
			 * Search analytics resource double.
			 *
			 * @var object
			 */
			public $searchanalytics;

			/**
			 * Batch double, populated on first use.
			 *
			 * @var object
			 */
			public $batch;

			/**
			 * Constructor.
			 */
			public function __construct() {
				$this->searchanalytics = new class() {

					/**
					 * Returns a stand-in request object.
					 *
					 * @param string $property_id Property ID.
					 * @param mixed  $request     Query request.
					 * @return object Stand-in request.
					 */
					public function query( $property_id, $request ) {
						return (object) array( 'property_id' => $property_id );
					}
				};

				$this->batch = new class() {

					/**
					 * Requests added to the batch, keyed by identifier.
					 *
					 * @var array
					 */
					public $added = array();

					/**
					 * Records an added request.
					 *
					 * @param mixed  $request    Request instance.
					 * @param string $identifier Request identifier.
					 */
					public function add( $request, $identifier ) {
						$this->added[ $identifier ] = $request;
					}

					/**
					 * Executes the batch.
					 *
					 * @return array Marker result.
					 */
					public function execute() {
						return array( 'executed' => true );
					}
				};
			}

			/**
			 * Returns the recording batch double.
			 *
			 * @return object Batch double.
			 */
			public function createBatch() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid -- Mirrors the Google client API.
				return $this->batch;
			}
		};
	}

	/**
	 * Gets a Search Console service double whose every search analytics query fails.
	 *
	 * Mirrors the surface the datapoint relies on: `createBatch()` for the batch
	 * container and `searchanalytics->query()` for each individual request.
	 *
	 * @return object Service double.
	 */
	private function get_failing_service_double() {
		return new class() {

			/**
			 * Search analytics resource double.
			 *
			 * @var object
			 */
			public $searchanalytics;

			/**
			 * Constructor.
			 */
			public function __construct() {
				$this->searchanalytics = new class() {

					/**
					 * Always fails, mimicking a rejected Search Console query.
					 *
					 * @param string $property_id Property ID.
					 * @param mixed  $request     Query request.
					 * @throws Exception Always.
					 */
					public function query( $property_id, $request ) {
						throw new Exception( 'Search Console query failed.', 400 );
					}
				};
			}

			/**
			 * Creates a batch double.
			 *
			 * @return object Batch double.
			 */
			public function createBatch() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid -- Mirrors the Google client API.
				return new class() {

					/**
					 * Collects a request, never called in this scenario.
					 *
					 * @param mixed  $request    Request instance.
					 * @param string $identifier Request identifier.
					 */
					public function add( $request, $identifier ) {} // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedFunction,Generic.CodeAnalysis.UnusedFunctionParameter.Found

					/**
					 * Executes the batch.
					 *
					 * @return array Empty result.
					 */
					public function execute() {
						return array();
					}
				};
			}
		};
	}

	/**
	 * Creates a datapoint instance backed by the given service resolver.
	 *
	 * @param callable $get_service Service resolver.
	 * @return Batch_Search_Analytics Datapoint instance.
	 */
	private function create_datapoint( callable $get_service ) {
		return new Batch_Search_Analytics(
			array(
				'service'   => $get_service,
				'shareable' => true,
				'settings'  => $this->search_console->get_settings(),
				'context'   => $this->context,
			)
		);
	}

	/**
	 * Primes the datapoint with a batch request for the given identifiers.
	 *
	 * @param string[] $identifiers Request identifiers.
	 */
	private function create_batch_request( array $identifiers ) {
		$requests = array_map(
			function ( $identifier ) {
				return array(
					'identifier' => $identifier,
					'startDate'  => '2024-01-01',
					'endDate'    => '2024-01-07',
				);
			},
			$identifiers
		);

		$this->datapoint->create_request( $this->get_data_request( array( 'requests' => $requests ) ) );
	}

	/**
	 * Builds a search analytics query response with a single row.
	 *
	 * @param int $clicks Number of clicks for the row.
	 * @return SearchAnalyticsQueryResponse Query response with a single row.
	 */
	private function get_query_response( $clicks ) {
		$row = new ApiDataRow();
		$row->setClicks( $clicks );

		$query_response = new SearchAnalyticsQueryResponse();
		$query_response->setRows( array( $row ) );

		return $query_response;
	}

	/**
	 * Gets a data request for the datapoint.
	 *
	 * @param array $data Request data.
	 * @return Data_Request Data request instance.
	 */
	private function get_data_request( array $data ) {
		return new Data_Request( 'POST', 'modules', Search_Console::MODULE_SLUG, 'searchanalytics-batch', $data );
	}
}
