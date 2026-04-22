<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_PropertyTest
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
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Property;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin as Google_Service_GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProperty;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_Error;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_PropertyTest extends TestCase {

	/**
	 * Get_Property datapoint instance.
	 *
	 * @var Get_Property
	 */
	private $datapoint;

	/**
	 * Captured HTTP request.
	 *
	 * @var Request
	 */
	private $captured_request;

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

		$this->datapoint = new Get_Property(
			array(
				'service' => function () use ( $service ) {
					return $service;
				},
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->captured_request = $request;

				$response = new GoogleAnalyticsAdminV1betaProperty();
				$response->setParent( 'accounts/88' );
				$response->setName( 'properties/123456' );
				$response->setDisplayName( 'Example property' );

				return new FulfilledPromise( new Response( 200, array(), wp_json_encode( $response ) ) );
			}
		);
	}

	public function test_create_request_validates_required_param() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'property', array() );

		try {
			$this->datapoint->create_request( $data_request );
			$this->fail( 'Expected `Missing_Required_Param_Exception` to be thrown.' );
		} catch ( \Exception $e ) {
			$this->assertInstanceOf( Missing_Required_Param_Exception::class, $e, 'The datapoint should throw `Missing_Required_Param_Exception` when the `propertyID` parameter is missing.' );
		}
	}

	public function test_create_request() {
		$this->captured_request = null;

		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'property',
			array(
				'propertyID' => '123456',
			)
		);
		$request      = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$this->assertStringContainsString(
			'analyticsadmin.googleapis.com/v1beta/properties/123456',
			$this->captured_request->getUri()->__toString(),
			'Property request should target the expected API endpoint.'
		);
	}

	public function test_parse_response() {
		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'property',
			array(
				'propertyID' => '123456',
			)
		);
		$request      = $this->datapoint->create_request( $data_request );
		$response     = $this->datapoint->parse_response(
			$this->analytics->get_client()->execute( $request ),
			$data_request
		);

		$this->assertEquals( '123456', $response->_id, 'Parsed property should include expected _id.' );
		$this->assertEquals( '88', $response->_accountID, 'Parsed property should include expected _accountID.' );
		$this->assertEquals(
			'Example property',
			$response->displayName,
			'Parsed property should preserve display name.'
		);
	}
}
