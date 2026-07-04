<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Webdatastreams_BatchTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Exception;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Webdatastreams_Batch;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin as Google_Service_GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaDataStream;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListDataStreamsResponse;
use WP_Error;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Webdatastreams_BatchTest extends TestCase {

	/**
	 * Get_Webdatastreams_Batch datapoint instance.
	 *
	 * @var Get_Webdatastreams_Batch
	 */
	private $datapoint;

	public function set_up() {
		parent::set_up();

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user           = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options   = new User_Options( $context, $user->ID );
		$authentication = new Authentication( $context, $options, $user_options );
		$analytics      = new Analytics_4( $context, $options, $user_options, $authentication );

		$analytics->get_client()->withDefer( true );
		$service = new Google_Service_GoogleAnalyticsAdmin( $analytics->get_client() );

		$this->datapoint = new Get_Webdatastreams_Batch(
			array(
				'service' => function () use ( $service ) {
					return $service;
				},
			)
		);
	}

	public function test_create_request_validates_required_param() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'webdatastreams-batch', array() );
		$response     = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'Missing propertyIDs should return a WP_Error response.' );
		$this->assertEquals( 'missing_required_param', $response->get_error_code(), 'Missing propertyIDs should return missing_required_param.' );
	}

	public function test_create_request_validates_invalid_batch_size() {
		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'webdatastreams-batch',
			array(
				'propertyIDs' => range( 1, 11 ),
			)
		);

		$response = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'Invalid propertyIDs batch size should return a WP_Error response.' );
		$this->assertEquals( 'rest_invalid_param', $response->get_error_code(), 'Invalid propertyIDs batch size should return rest_invalid_param.' );
	}

	public function test_create_request() {
		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'webdatastreams-batch',
			array(
				'propertyIDs' => array( '123456', '234567' ),
			)
		);

		$request = $this->datapoint->create_request( $data_request );

		$this->assertIsCallable( $request, 'Batch web data streams request should return a callable batch execution handler.' );
	}

	public function test_parse_response() {
		$response_1_stream = new GoogleAnalyticsAdminV1betaDataStream();
		$response_1_stream->setName( 'properties/123456/dataStreams/111' );
		$response_1_stream->setType( 'WEB_DATA_STREAM' );

		$response_1 = new GoogleAnalyticsAdminV1betaListDataStreamsResponse();
		$response_1->setDataStreams( array( $response_1_stream ) );

		$response_2_stream = new GoogleAnalyticsAdminV1betaDataStream();
		$response_2_stream->setName( 'properties/234567/dataStreams/222' );
		$response_2_stream->setType( 'WEB_DATA_STREAM' );

		$response_2 = new GoogleAnalyticsAdminV1betaListDataStreamsResponse();
		$response_2->setDataStreams( array( $response_2_stream ) );

		$batch_response = array(
			$response_1,
			new Exception( 'Request failed' ),
			$response_2,
		);

		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'webdatastreams-batch',
			array(
				'propertyIDs' => array( '123456', '234567' ),
			)
		);

		$response = $this->datapoint->parse_response( $batch_response, $data_request );

		$this->assertArrayHasKey( '123456', $response, 'Batch parsed response should include first property key.' );
		$this->assertArrayHasKey( '234567', $response, 'Batch parsed response should include second property key.' );
		$this->assertEquals( '111', $response['123456'][0]->_id, 'Batch parsed response should include first stream _id.' );
		$this->assertEquals( '222', $response['234567'][0]->_id, 'Batch parsed response should include second stream _id.' );
	}
}
