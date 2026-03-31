<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_WebdatastreamsTest
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
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Webdatastreams;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin as Google_Service_GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaDataStream;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListDataStreamsResponse;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_Error;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_WebdatastreamsTest extends TestCase {

	/**
	 * Get_Webdatastreams datapoint instance.
	 *
	 * @var Get_Webdatastreams
	 */
	private $datapoint;

	/**
	 * Get web data streams request instance.
	 *
	 * @var Request
	 */
	private $get_webdatastreams_request;

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
		$service = new Google_Service_GoogleAnalyticsAdmin( $this->analytics->get_client() );

		$this->datapoint = new Get_Webdatastreams(
			array(
				'service' => function () use ( $service ) {
					return $service;
				},
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->get_webdatastreams_request = $request;

				$web_stream = new GoogleAnalyticsAdminV1betaDataStream();
				$web_stream->setName( 'properties/123456/dataStreams/111' );
				$web_stream->setType( 'WEB_DATA_STREAM' );

				$app_stream = new GoogleAnalyticsAdminV1betaDataStream();
				$app_stream->setName( 'properties/123456/dataStreams/222' );
				$app_stream->setType( 'ANDROID_APP_DATA_STREAM' );

				$response = new GoogleAnalyticsAdminV1betaListDataStreamsResponse();
				$response->setDataStreams( array( $web_stream, $app_stream ) );

				return new FulfilledPromise( new Response( 200, array(), wp_json_encode( $response ) ) );
			}
		);
	}

	public function test_create_request_validates_required_param() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'webdatastreams', array() );
		$response     = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'Missing propertyID should return a WP_Error response.' );
		$this->assertEquals( 'missing_required_param', $response->get_error_code(), 'Missing propertyID should return missing_required_param.' );
	}

	public function test_create_request() {
		$this->get_webdatastreams_request = null;

		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'webdatastreams',
			array(
				'propertyID' => '123456',
			)
		);

		$request = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$this->assertEquals(
			'https://analyticsadmin.googleapis.com/v1beta/properties/123456/dataStreams',
			$this->get_webdatastreams_request->getUri()->__toString(),
			'Web data streams request should target the expected API endpoint.'
		);
	}

	public function test_parse_response() {
		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'webdatastreams',
			array(
				'propertyID' => '123456',
			)
		);

		$request  = $this->datapoint->create_request( $data_request );
		$response = $this->datapoint->parse_response(
			$this->analytics->get_client()->execute( $request ),
			$data_request
		);

		$this->assertCount( 1, $response, 'Only web data streams should be returned.' );
		$this->assertEquals( '111', $response[0]->_id, 'Web data stream response should include parsed _id value.' );
		$this->assertEquals( '123456', $response[0]->_propertyID, 'Web data stream response should include parsed _propertyID value.' );
	}
}
