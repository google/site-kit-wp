<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Create_Custom_DimensionTest
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
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Create_Custom_Dimension;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin as Google_Service_GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaCustomDimension;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_Error;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Create_Custom_DimensionTest extends TestCase {

	/**
	 * Create_Custom_Dimension datapoint instance.
	 *
	 * @var Create_Custom_Dimension
	 */
	private $datapoint;

	/**
	 * Create custom dimension request instance.
	 *
	 * @var Request
	 */
	private $create_custom_dimension_request;

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

		$this->datapoint = new Create_Custom_Dimension(
			array(
				'service'                => function () use ( $service ) {
					return $service;
				},
				'scopes'                 => array( Analytics_4::EDIT_SCOPE ),
				'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics custom dimension on your behalf.', 'google-site-kit' ),
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->create_custom_dimension_request = $request;

				$response = new GoogleAnalyticsAdminV1betaCustomDimension();
				$response->setParameterName( 'googlesitekit_post_author' );
				$response->setDisplayName( 'Post Author' );
				$response->setScope( 'EVENT' );

				return new FulfilledPromise( new Response( 200, array(), json_encode( $response ) ) );
			}
		);
	}

	public function required_parameters() {
		return array(
			array( 'propertyID' ),
			array( 'customDimension' ),
		);
	}

	/**
	 * @dataProvider required_parameters
	 */
	public function test_create_request_validates_required_params( $required_param ) {
		$data = array(
			'propertyID'      => '123456',
			'customDimension' => array(
				'parameterName' => 'googlesitekit_post_author',
				'displayName'   => 'Post Author',
				'scope'         => 'EVENT',
			),
		);
		unset( $data[ $required_param ] );

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'create-custom-dimension', $data );

		$this->expectException( Missing_Required_Param_Exception::class );
		$this->datapoint->create_request( $data_request );
	}

	public function test_create_request_validates_invalid_custom_dimension_properties() {
		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'create-custom-dimension',
			array(
				'propertyID'      => '123456',
				'customDimension' => array(
					'invalidField' => 'invalidValue',
				),
			)
		);

		$response = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'Invalid customDimension fields should return a WP_Error response.' );
		$this->assertEquals( 'invalid_property_name', $response->get_error_code(), 'Invalid customDimension fields should return the invalid_property_name error code.' );
	}

	public function test_create_request_validates_invalid_scope() {
		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'create-custom-dimension',
			array(
				'propertyID'      => '123456',
				'customDimension' => array(
					'parameterName' => 'googlesitekit_post_author',
					'displayName'   => 'Post Author',
					'scope'         => 'invalid-scope',
				),
			)
		);

		$response = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'Invalid customDimension scope should return a WP_Error response.' );
		$this->assertEquals( 'invalid_scope', $response->get_error_code(), 'Invalid customDimension scope should return the invalid_scope error code.' );
	}

	public function test_create_request_defaults_scope_to_event() {
		$this->create_custom_dimension_request = null;

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'create-custom-dimension',
			array(
				'propertyID'      => '123456',
				'customDimension' => array(
					'parameterName' => 'googlesitekit_post_author',
					'displayName'   => 'Post Author',
				),
			)
		);

		$request = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$custom_dimension_request = new GoogleAnalyticsAdminV1betaCustomDimension(
			json_decode( $this->create_custom_dimension_request->getBody()->getContents(), true )
		);
		$this->assertEquals( 'EVENT', $custom_dimension_request->getScope(), 'Custom dimension scope should default to EVENT when not provided.' );
	}

	public function test_create_request() {
		$this->create_custom_dimension_request = null;

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'create-custom-dimension',
			array(
				'propertyID'      => '123456',
				'customDimension' => array(
					'parameterName' => 'googlesitekit_post_author',
					'displayName'   => 'Post Author',
					'description'   => 'Post author custom dimension',
					'scope'         => 'EVENT',
				),
			)
		);

		$request = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$this->assertEquals(
			'https://analyticsadmin.googleapis.com/v1beta/properties/123456/customDimensions',
			$this->create_custom_dimension_request->getUri()->__toString(),
			'Custom dimension request should target the expected API endpoint.'
		);

		$custom_dimension_request = new GoogleAnalyticsAdminV1betaCustomDimension(
			json_decode( $this->create_custom_dimension_request->getBody()->getContents(), true )
		);

		$this->assertEquals( 'googlesitekit_post_author', $custom_dimension_request->getParameterName(), 'Custom dimension parameter name should match the request payload.' );
		$this->assertEquals( 'Post Author', $custom_dimension_request->getDisplayName(), 'Custom dimension display name should match the request payload.' );
		$this->assertEquals( 'EVENT', $custom_dimension_request->getScope(), 'Custom dimension scope should match the request payload.' );
	}

	public function test_parse_response() {
		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'create-custom-dimension',
			array(
				'propertyID'      => '123456',
				'customDimension' => array(
					'parameterName' => 'googlesitekit_post_author',
					'displayName'   => 'Post Author',
					'scope'         => 'EVENT',
				),
			)
		);

		$request  = $this->datapoint->create_request( $data_request );
		$response = $this->datapoint->parse_response(
			$this->analytics->get_client()->execute( $request ),
			$data_request
		);

		$this->assertNotWPError( $response );
		$this->assertInstanceOf( GoogleAnalyticsAdminV1betaCustomDimension::class, $response, 'Create custom dimension parse_response should return the original custom dimension response object.' );
		$this->assertEquals( 'googlesitekit_post_author', $response->getParameterName(), 'Parsed custom dimension response should contain the expected parameterName value.' );
	}
}
