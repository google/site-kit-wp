<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Custom_DimensionsTest
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
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Custom_Dimensions;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin as Google_Service_GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaCustomDimension;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListCustomDimensionsResponse;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_Error;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Custom_DimensionsTest extends TestCase {

	/**
	 * Get_Custom_Dimensions datapoint instance.
	 *
	 * @var Get_Custom_Dimensions
	 */
	private $datapoint;

	/**
	 * Captured HTTP request to the custom dimensions endpoint.
	 *
	 * @var Request
	 */
	private $get_custom_dimensions_request;

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

		$this->datapoint = new Get_Custom_Dimensions(
			array(
				'service' => function () use ( $service ) {
					return $service;
				},
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->get_custom_dimensions_request = $request;

				$custom_dimension_1 = new GoogleAnalyticsAdminV1betaCustomDimension();
				$custom_dimension_1->setParameterName( 'googlesitekit_post_author' );

				$custom_dimension_2 = new GoogleAnalyticsAdminV1betaCustomDimension();
				$custom_dimension_2->setParameterName( 'sessionDefaultChannelGroup' );

				$response = new GoogleAnalyticsAdminV1betaListCustomDimensionsResponse();
				$response->setCustomDimensions( array( $custom_dimension_1, $custom_dimension_2 ) );

				return new FulfilledPromise( new Response( 200, array(), json_encode( $response ) ) );
			}
		);
	}

	public function test_create_request__requires_a_property_id() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'custom-dimensions', array() );

		try {
			$this->datapoint->create_request( $data_request );
			$this->fail( 'Expected `Missing_Required_Param_Exception` to be thrown.' );
		} catch ( \Exception $exception ) {
			$this->assertInstanceOf( Missing_Required_Param_Exception::class, $exception, 'The datapoint should throw `Missing_Required_Param_Exception` when the `propertyID` parameter is missing.' );
		}
	}

	public function test_create_request__targets_the_property_custom_dimensions_endpoint() {
		$this->get_custom_dimensions_request = null;

		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'custom-dimensions',
			array(
				'propertyID' => '123456',
			)
		);

		$request = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$this->assertEquals(
			'https://analyticsadmin.googleapis.com/v1beta/properties/123456/customDimensions',
			$this->get_custom_dimensions_request->getUri()->__toString(),
			'Custom dimensions request should target the requested property\'s endpoint.'
		);
	}

	public function test_parse_response__keeps_only_site_kit_custom_dimensions() {
		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'custom-dimensions',
			array(
				'propertyID' => '123456',
			)
		);

		$request  = $this->datapoint->create_request( $data_request );
		$response = $this->datapoint->parse_response(
			$this->analytics->get_client()->execute( $request ),
			$data_request
		);

		$this->assertEquals( array( 'googlesitekit_post_author' ), $response, 'Only Site Kit custom dimensions should be returned for the property.' );
	}

	public function test_parse_response__returns_the_wp_error_unchanged() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'custom-dimensions', array() );
		$wp_error     = new WP_Error( 'test_error', 'Test error' );

		$this->assertSame( $wp_error, $this->datapoint->parse_response( $wp_error, $data_request ), '`parse_response` should return a `WP_Error` response unchanged.' );
	}

	public function test_parse_response__returns_an_empty_array_when_the_property_has_no_custom_dimensions() {
		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'custom-dimensions',
			array(
				'propertyID' => '123456',
			)
		);

		// When a property has no custom dimensions, the API leaves out the
		// `customDimensions` field, so the response object holds none.
		$response = new GoogleAnalyticsAdminV1betaListCustomDimensionsResponse();

		$this->assertSame(
			array(),
			$this->datapoint->parse_response( $response, $data_request ),
			'A property with no custom dimensions should return an empty array.'
		);
	}
}
