<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_ReportTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Report;
use Google\Site_Kit\Modules\Analytics_4\Report\Response as Analytics_4_Report_Response;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_Error;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData as Google_Service_AnalyticsData;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportResponse as Google_Service_AnalyticsData_RunReportResponse;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_ReportTest extends TestCase {

	/**
	 * Get_Report datapoint instance.
	 *
	 * @var Get_Report
	 */
	private $datapoint;

	/**
	 * Get report request instance.
	 *
	 * @var Request
	 */
	private $get_report_request;

	/**
	 * Analytics_4 instance.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	/**
	 * Analytics_4_Report_Response instance.
	 *
	 * @var Analytics_4_Report_Response
	 */
	private $reportResponse;

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

		$this->reportResponse = new Analytics_4_Report_Response( $context );

		$this->datapoint = new Get_Report(
			array(
				'service'           => function () use ( $service ) {
					return $service;
				},
				'shareable'         => true,
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
				$this->get_report_request = $request;

				$response = new Google_Service_AnalyticsData_RunReportResponse();

				return new FulfilledPromise( new Response( 200, array(), json_encode( $response ) ) );
			}
		);

		wp_set_current_user( $user->ID );
	}

	public function test_create_request__requires_metrics_param() {
		$data = array();

		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'report', $data );

		$request = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $request, 'The datapoint should return an error when the `metrics` parameter is missing.' );

		$this->assertEquals( 'missing_required_param', $request->get_error_code(), 'The datapoint should return a `missing_required_param` error when the `metrics` parameter is missing.' );
	}

	public function test_create_request__requires_property_id() {
		$data = array(
			'metrics' => array( 'sessions' ),
		);

		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'report', $data );

		$request = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $request, 'The datapoint should return an error when the `propertyID` setting is missing.' );

		$this->assertEquals( 'missing_required_setting', $request->get_error_code(), 'The datapoint should return a `missing_required_setting` error when the `propertyID` setting is missing.' );
	}

	public function test_create_request() {
		$this->get_report_request = null;

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '12345',
			)
		);

		$data = array(
			'metrics' => array( 'sessions' ),
		);

		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'report', $data );

		$request = $this->datapoint->create_request( $data_request );

		$result = $this->analytics->get_client()->execute( $request );

		$this->assertEquals(
			'https://analyticsdata.googleapis.com/v1beta/properties/12345:runReport',
			$this->get_report_request->getUri(),
			'The request should be made to the correct endpoint.'
		);
	}

	public function test_parse_response() {
		$data = array(
			'metrics' => array( 'sessions' ),
		);

		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'report', $data );

		$response = $this->datapoint->parse_response( new Google_Service_AnalyticsData_RunReportResponse(), $data_request );

		$this->assertEquals(
			$response,
			$this->reportResponse->parse_response( $data_request, new Google_Service_AnalyticsData_RunReportResponse() ),
			'The datapoint should parse the response using Analytics_4_Report_Response.'
		);
	}
}
