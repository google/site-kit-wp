<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Enhanced_Measurement_SettingsTest
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
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Enhanced_Measurement_Settings;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdminV1alpha;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdminV1alpha\GoogleAnalyticsAdminV1alphaEnhancedMeasurementSettings;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_Error;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Enhanced_Measurement_SettingsTest extends TestCase {

	/**
	 * Get_Enhanced_Measurement_Settings datapoint instance.
	 *
	 * @var Get_Enhanced_Measurement_Settings
	 */
	private $datapoint;

	/**
	 * Get enhanced measurement settings request instance.
	 *
	 * @var Request
	 */
	private $get_enhanced_measurement_settings_request;

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
		$service = new GoogleAnalyticsAdminV1alpha( $this->analytics->get_client() );

		$this->datapoint = new Get_Enhanced_Measurement_Settings(
			array(
				'service' => function () use ( $service ) {
					return $service;
				},
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->get_enhanced_measurement_settings_request = $request;

				$response = new GoogleAnalyticsAdminV1alphaEnhancedMeasurementSettings();
				$response->setName( 'properties/123456/dataStreams/654321/enhancedMeasurementSettings' );
				$response->setStreamEnabled( true );

				return new FulfilledPromise( new Response( 200, array(), wp_json_encode( $response ) ) );
			}
		);
	}

	public function required_parameters() {
		return array(
			array( 'propertyID' ),
			array( 'webDataStreamID' ),
		);
	}

	/**
	 * @dataProvider required_parameters
	 */
	public function test_create_request_validates_required_params( $required_param ) {
		$data = array(
			'propertyID'      => '123456',
			'webDataStreamID' => '654321',
		);
		unset( $data[ $required_param ] );

		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'enhanced-measurement-settings', $data );
		$response     = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'Missing required params should return a WP_Error response.' );
		$this->assertEquals( 'missing_required_param', $response->get_error_code(), 'Missing required params should return missing_required_param.' );
	}

	public function test_create_request() {
		$this->get_enhanced_measurement_settings_request = null;

		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'enhanced-measurement-settings',
			array(
				'propertyID'      => '123456',
				'webDataStreamID' => '654321',
			)
		);

		$request = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$this->assertEquals(
			'https://analyticsadmin.googleapis.com/v1alpha/properties/123456/dataStreams/654321/enhancedMeasurementSettings',
			$this->get_enhanced_measurement_settings_request->getUri()->__toString(),
			'Enhanced measurement settings request should target the expected API endpoint.'
		);
	}

	public function test_parse_response() {
		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'enhanced-measurement-settings',
			array(
				'propertyID'      => '123456',
				'webDataStreamID' => '654321',
			)
		);

		$request  = $this->datapoint->create_request( $data_request );
		$response = $this->analytics->get_client()->execute( $request );
		$parsed   = $this->datapoint->parse_response( $response, $data_request );

		$this->assertSame( $response, $parsed, 'parse_response should return enhanced measurement settings response unchanged.' );
	}
}
