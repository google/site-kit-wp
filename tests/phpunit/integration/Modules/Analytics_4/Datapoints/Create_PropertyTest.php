<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Create_PropertyTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit_Dependencies\Google\Service\Exception;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin as Google_Service_GoogleAnalyticsAdmin;
use WP_User;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Create_Property;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProperty;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Create_PropertyTest extends TestCase {

	/**
	 * Create_Property datapoint instance.
	 *
	 * @var Create_Property
	 */
	private $datapoint;

	/**
	 * Create property request instance.
	 *
	 * @var Request
	 */
	private $create_property_request;

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

		$this->datapoint = new Create_Property(
			array(
				'reference_site_url'     => $context->get_reference_site_url(),
				'service'                => function () use ( $service ) {
					return $service;
				},
				'scopes'                 => array( Analytics_4::EDIT_SCOPE ),
				'request_scopes_message' => __( 'You’ll need to grant Site Kit permission to create a new Analytics property on your behalf.', 'google-site-kit' ),
			),
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->create_property_request = $request;

				$response = new GoogleAnalyticsAdminV1betaProperty();
				$response->setParent( 'accounts/123456' );
				$response->setName( 'properties/234567' );

				return new FulfilledPromise( new Response( 200, array(), json_encode( $response ) ) );
			}
		);
	}

	public function required_parameters() {
		return array(
			array( 'accountID' ),
		);
	}

	/**
	 * @dataProvider required_parameters
	 */
	public function test_create_request_validates_required_params( $required_param ) {
		$data = array(
			'accountID'   => '123456',
			'displayName' => 'test display name',
			'timezone'    => 'UTC',
		);
		// Remove the required parameter under test.
		unset( $data[ $required_param ] );

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'create-property', $data );

		try {
			$this->datapoint->create_request( $data_request );
			$this->fail( 'Expected Missing_Required_Param_Exception to be thrown.' );
		} catch ( Missing_Required_Param_Exception $e ) {
			$this->assertStringContainsString( "Request parameter is empty: $required_param", $e->getMessage(), 'Should indicate the missing parameter.' );
		}
	}


	public function test_create_request() {
		$this->create_property_request = null;

		$data = array(
			'accountID'   => '123456',
			'displayName' => 'test display name',
			'timezone'    => 'UTC',
		);

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'create-property', $data );
		$request      = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );
		$this->assertEquals( 'https://analyticsadmin.googleapis.com/v1beta/properties', $this->create_property_request->getUri()->__toString(), 'The request should be made to the correct endpoint.' );
		$property_request = new GoogleAnalyticsAdminV1betaProperty( json_decode( $this->create_property_request->getBody()->getContents(), true ) );
		$this->assertEquals( 'accounts/123456', $property_request->getParent(), 'Account ID should match the provided value.' );
		$this->assertEquals( 'test display name', $property_request->getDisplayName(), 'Display name should match the provided value.' );
		$this->assertEquals( 'UTC', $property_request->getTimeZone(), 'Timezone should match the provided value.' );
	}

	public function test_create_request_falls_back_to_site_options_for_timezone() {
		$this->create_property_request = null;

		$data = array(
			'accountID'   => '123456',
			'displayName' => 'test display name',
		);

		add_filter(
			'option_timezone_string',
			function () {
				return 'GMT+1';
			}
		);

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'create-property', $data );
		$request      = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$property_request = new GoogleAnalyticsAdminV1betaProperty( json_decode( $this->create_property_request->getBody()->getContents(), true ) );
		$this->assertEquals( 'GMT+1', $property_request->getTimeZone(), 'Timezone should match the site option value.' );
	}

	public function test_create_request_falls_back_to_reference_site_url_for_display_name() {
		$this->create_property_request = null;

		$data = array(
			'accountID' => '123456',
			'timezone'  => 'UTC',
		);

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'create-property', $data );
		$request      = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$property_request = new GoogleAnalyticsAdminV1betaProperty( json_decode( $this->create_property_request->getBody()->getContents(), true ) );
		$this->assertEquals( 'example.org', $property_request->getDisplayName(), 'Display name should match the provided value.' );
	}

	public function test_parse_response() {
		$this->create_property_request = null;

		$data = array(
			'accountID'   => '123456',
			'displayName' => 'test display name',
			'timezone'    => 'UTC',
		);

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'create-property', $data );
		$request      = $this->datapoint->create_request( $data_request );
		$response     = $this->datapoint->parse_response( $this->analytics->get_client()->execute( $request ), $data_request );

		$this->assertNotWPError( $response, 'Property creation should succeed when all required parameters are provided.' );
		$this->assertEquals( 'stdClass', get_class( $response ), 'Parsed response should be an stdClass object.' );
		$this->assertEquals( '234567', $response->_id, 'Parsed response should have the parsed property ID.' );
		$this->assertEquals( '123456', $response->_accountID, 'Parsed response should have the parsed account ID.' );
	}
}
