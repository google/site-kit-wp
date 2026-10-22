<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Batch_ReportTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Batch_Report;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData as Google_Service_AnalyticsData;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\BatchRunReportsResponse as Google_Service_AnalyticsData_BatchRunReportsResponse;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_Error;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Batch_ReportTest extends TestCase {

	/**
	 * Get_Batch_Report datapoint instance.
	 *
	 * @var Get_Batch_Report
	 */
	private $datapoint;

	/**
	 * Batch report request instance.
	 *
	 * @var Request
	 */
	private $batch_report_request;

	/**
	 * Analytics_4 instance.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	public function set_up() {
		parent::set_up();

		$context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options         = new Options( $context );
		$user            = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options    = new User_Options( $context, $user->ID );
		$authentication  = new Authentication( $context, $options, $user_options );
		$this->analytics = new Analytics_4( $context, $options, $user_options, $authentication );

		$this->analytics->get_client()->withDefer( true );
		$service = new Google_Service_AnalyticsData( $this->analytics->get_client() );

		$this->datapoint = new Get_Batch_Report(
			array(
				'service'           => function () use ( $service ) {
					return $service;
				},
				'settings'          => $this->analytics->get_settings(),
				'context'           => $context,
				'is_shared_request' => function () {
					return false;
				},
			),
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->batch_report_request = $request;

				$response = new Google_Service_AnalyticsData_BatchRunReportsResponse();

				return new FulfilledPromise( new Response( 200, array(), json_encode( $response ) ) );
			}
		);

		wp_set_current_user( $user->ID );
	}

	public function test_create_request__requires_requests_param() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'batch-report', array() );

		$request = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $request, 'The datapoint should return an error when the `requests` parameter is missing.' );

		$this->assertEquals( 'missing_required_param', $request->get_error_code(), 'The datapoint should return a `missing_required_param` error when the `requests` parameter is missing.' );
		$this->assertEquals( array( 'status' => 400 ), $request->get_error_data( 'missing_required_param' ), 'The error data should include status 400 for the missing `requests` parameter.' );
	}

	/**
	 * @dataProvider data_invalid_requests
	 *
	 * @param mixed  $invalid_requests Invalid requests value.
	 * @param string $message          Assertion message for the scenario.
	 */
	public function test_create_request__invalid_requests_param( $invalid_requests, $message ) {
		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'batch-report',
			array( 'requests' => $invalid_requests )
		);

		$request = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $request, $message );
		$this->assertEquals( 'invalid_batch_size', $request->get_error_code(), $message );
		$this->assertEquals( array( 'status' => 400 ), $request->get_error_data( 'invalid_batch_size' ), 'The error data should include status 400 for an invalid batch size.' );
	}

	public function data_invalid_requests() {
		return array(
			'requests not array' => array(
				'not-an-array',
				'The datapoint should reject a non-array `requests` parameter.',
			),
			'too many requests'  => array(
				array_fill( 0, 6, array( 'metrics' => array( 'sessions' ) ) ),
				'The datapoint should reject a `requests` array longer than five entries.',
			),
		);
	}

	public function test_create_request__requires_property_id() {
		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'batch-report',
			array(
				'requests' => array(
					array( 'metrics' => array( 'sessions' ) ),
				),
			)
		);

		$request = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $request, 'The datapoint should return an error when the `propertyID` setting is missing.' );

		$this->assertEquals( 'missing_required_setting', $request->get_error_code(), 'The datapoint should return a `missing_required_setting` error when the `propertyID` setting is missing.' );
		$this->assertEquals( array( 'status' => 500 ), $request->get_error_data( 'missing_required_setting' ), 'The error data should include status 500 for the missing `propertyID` setting.' );
	}

	public function test_create_request() {
		$this->batch_report_request = null;

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '12345',
			)
		);

		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'batch-report',
			array(
				'requests' => array(
					array( 'metrics' => array( 'sessions' ) ),
					array( 'metrics' => array( 'totalUsers' ) ),
				),
			)
		);

		$request = $this->datapoint->create_request( $data_request );

		$this->analytics->get_client()->execute( $request );

		$this->assertEquals(
			'https://analyticsdata.googleapis.com/v1beta/properties/12345:batchRunReports',
			$this->batch_report_request->getUri(),
			'The request should be made to the batchRunReports endpoint for the configured property.'
		);

		$request_params = json_decode( (string) $this->batch_report_request->getBody(), true );

		$this->assertArrayHasKey( 'requests', $request_params, 'The batch payload should include a requests key.' );
		$this->assertCount( 2, $request_params['requests'], 'The batch payload should include both requests.' );
	}

	public function test_create_request__propagates_inner_request_error() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$service = new Google_Service_AnalyticsData( $this->analytics->get_client() );

		// Use a shared request so the underlying report request builder
		// validates dimensions and surfaces a WP_Error for unsupported ones.
		$datapoint = new Get_Batch_Report(
			array(
				'service'           => function () use ( $service ) {
					return $service;
				},
				'settings'          => $this->analytics->get_settings(),
				'context'           => $context,
				'is_shared_request' => function () {
					return true;
				},
			),
		);

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '12345',
			)
		);

		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'batch-report',
			array(
				'requests' => array(
					array(
						'metrics'    => array( 'sessions' ),
						'dimensions' => array( 'unsupportedDimension' ),
					),
				),
			)
		);

		$request = $datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $request, 'The datapoint should return the error raised while building an inner report request.' );
		$this->assertEquals( 'invalid_analytics_4_report_dimensions', $request->get_error_code(), 'The datapoint should propagate the inner report request error code.' );
	}

	public function test_parse_response() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'batch-report', array() );

		$response = new Google_Service_AnalyticsData_BatchRunReportsResponse();

		$this->assertSame(
			$response,
			$this->datapoint->parse_response( $response, $data_request ),
			'The datapoint should return the response unchanged.'
		);
	}
}
