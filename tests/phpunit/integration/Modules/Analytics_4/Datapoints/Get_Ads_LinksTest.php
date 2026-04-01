<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Ads_LinksTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Ads_Links;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaGoogleAdsLink;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListGoogleAdsLinksResponse;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin as Google_Service_GoogleAnalyticsAdmin;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Ads_LinksTest extends TestCase {

	/**
	 * Get_Ads_Links datapoint instance.
	 *
	 * @var Get_Ads_Links
	 */
	private $datapoint;

	/**
	 * Get Ads links request instance.
	 *
	 * @var Request
	 */
	private $get_ads_links_request;

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

		$this->datapoint = new Get_Ads_Links(
			array(
				'service' => function () use ( $service ) {
					return $service;
				},
			),
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->get_ads_links_request = $request;

				$response = new GoogleAnalyticsAdminV1betaListGoogleAdsLinksResponse();
				$response->setGoogleAdsLinks( array( new GoogleAnalyticsAdminV1betaGoogleAdsLink() ) );

				return new FulfilledPromise( new Response( 200, array(), json_encode( $response ) ) );
			}
		);
	}

	public function test_create_request__requires_property_id_param() {
		$data = array();

		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'ads-links', $data );

		try {
			$this->datapoint->create_request( $data_request );
			$this->fail( 'Expected `Missing_Required_Param_Exception` to be thrown.' );
		} catch ( \Exception $e ) {
			$this->assertInstanceOf( Missing_Required_Param_Exception::class, $e, 'The datapoint should throw `Missing_Required_Param_Exception` when the `propertyID` parameter is missing.' );
		}
	}

	public function test_create_request() {
		$this->get_ads_links_request = null;

		$data = array(
			'propertyID' => '12345',
		);

		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'ads-links', $data );

		$request = $this->datapoint->create_request( $data_request );

		$result = $this->analytics->get_client()->execute( $request );

		$this->assertEquals(
			'https://analyticsadmin.googleapis.com/v1beta/properties/12345/googleAdsLinks',
			$this->get_ads_links_request->getUri(),
			'The request should be made to the correct endpoint.'
		);
	}

	public function test_parse_response() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'ads-links' );

		$ads_links_response = new GoogleAnalyticsAdminV1betaListGoogleAdsLinksResponse();
		$ads_links_response->setGoogleAdsLinks( array( new GoogleAnalyticsAdminV1betaGoogleAdsLink() ) );

		$response = $this->datapoint->parse_response( $ads_links_response, $data_request );

		$this->assertEquals(
			$response,
			$ads_links_response->getGoogleAdsLinks(),
			'The datapoint should return an array of Ads links.'
		);
	}
}
