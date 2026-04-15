<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_PropertiesTest
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
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Properties;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin as Google_Service_GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListPropertiesResponse;
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
class Get_PropertiesTest extends TestCase {

	/**
	 * Get_Properties datapoint instance.
	 *
	 * @var Get_Properties
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

		$this->datapoint = new Get_Properties(
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

				$prop_z = new GoogleAnalyticsAdminV1betaProperty();
				$prop_z->setName( 'properties/3' );
				$prop_z->setParent( 'accounts/99' );
				$prop_z->setDisplayName( 'Zebra' );

				$prop_a = new GoogleAnalyticsAdminV1betaProperty();
				$prop_a->setName( 'properties/1' );
				$prop_a->setParent( 'accounts/99' );
				$prop_a->setDisplayName( 'alpha' );

				$prop_b = new GoogleAnalyticsAdminV1betaProperty();
				$prop_b->setName( 'properties/2' );
				$prop_b->setParent( 'accounts/99' );
				$prop_b->setDisplayName( 'Beta' );

				$response = new GoogleAnalyticsAdminV1betaListPropertiesResponse();
				$response->setProperties( array( $prop_z, $prop_a, $prop_b ) );

				return new FulfilledPromise( new Response( 200, array(), wp_json_encode( $response ) ) );
			}
		);
	}

	public function test_create_request_validates_required_param() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'properties', array() );

		try {
			$this->datapoint->create_request( $data_request );
			$this->fail( 'Expected `Missing_Required_Param_Exception` to be thrown.' );
		} catch ( \Exception $e ) {
			$this->assertInstanceOf( Missing_Required_Param_Exception::class, $e, 'The datapoint should throw `Missing_Required_Param_Exception` when the `accountID` parameter is missing.' );
		}
	}

	public function test_create_request() {
		$this->captured_request = null;

		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'properties',
			array(
				'accountID' => '99',
			)
		);
		$request      = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$uri = $this->captured_request->getUri()->__toString();
		$this->assertStringContainsString(
			'analyticsadmin.googleapis.com/v1beta/properties',
			$uri,
			'Properties request should target the expected API endpoint.'
		);
		$this->assertStringContainsString(
			'pageSize=200',
			$uri,
			'Properties request should request the expected page size.'
		);
		$this->assertStringContainsString(
			'filter=parent%3Aaccounts%2F99',
			$this->captured_request->getUri()->getQuery(),
			'Properties request should filter by the normalized parent account.'
		);
	}

	public function test_parse_response_sorts_by_display_name() {
		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'properties',
			array(
				'accountID' => '99',
			)
		);
		$request      = $this->datapoint->create_request( $data_request );
		$response     = $this->datapoint->parse_response(
			$this->analytics->get_client()->execute( $request ),
			$data_request
		);

		$this->assertCount( 3, $response, 'Properties response should include one entry per property.' );
		$this->assertEquals(
			'alpha',
			$response[0]->displayName,
			'Properties should be sorted case-insensitively by display name.'
		);
		$this->assertEquals( 'Beta', $response[1]->displayName, 'Second property should follow sort order.' );
		$this->assertEquals( 'Zebra', $response[2]->displayName, 'Third property should follow sort order.' );
		$this->assertEquals( '1', $response[0]->_id, 'Property should include parsed _id.' );
		$this->assertEquals( '99', $response[0]->_accountID, 'Property should include parsed _accountID.' );
	}
}
