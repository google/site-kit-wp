<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Container_LookupTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Container_Lookup;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaGoogleAdsLink;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListGoogleAdsLinksResponse;
use Google\Site_Kit_Dependencies\Google\Service\TagManager\Container;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use Google\Site_Kit_Dependencies\Google\Service\TagManager as Google_Service_TagManager;
use WP_Error;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Container_LookupTest extends TestCase {

	/**
	 * Get_Container_Lookup datapoint instance.
	 *
	 * @var Get_Container_Lookup
	 */
	private $datapoint;

	/**
	 * Get container lookup request instance.
	 *
	 * @var Request
	 */
	private $get_container_lookup_request;

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
		$service = new Google_Service_TagManager( $this->analytics->get_client() );

		$this->datapoint = new Get_Container_Lookup(
			array(
				'service' => function () use ( $service ) {
					return $service;
				},
			),
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->get_container_lookup_request = $request;

				$response = new Container();

				return new FulfilledPromise( new Response( 200, array(), json_encode( $response ) ) );
			}
		);
	}

	public function test_create_request__requires_destination_id_param() {
		$data = array();

		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'container-lookup', $data );

		$request = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $request, 'The datapoint should return an error when the `destinationID` param is missing.' );

		$this->assertEquals( 'missing_required_param', $request->get_error_code(), 'The datapoint should return a `missing_required_param` error when the `destinationID` param is missing.' );
	}

	public function test_create_request() {
		$this->get_container_lookup_request = null;

		$data = array(
			'destinationID' => '12345',
		);

		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'container-lookup', $data );

		$request = $this->datapoint->create_request( $data_request );

		$result = $this->analytics->get_client()->execute( $request );

		$this->assertEquals(
			'https://tagmanager.googleapis.com/tagmanager/v2/accounts/containers:lookup?destinationId=12345',
			$this->get_container_lookup_request->getUri(),
			'The request should be made to the correct endpoint.'
		);
	}

	public function test_parse_response() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'container-lookup' );

		$container = new Container();

		$response = $this->datapoint->parse_response( $container, $data_request );

		$this->assertSame(
			$response,
			$container,
			'The datapoint should return the GTM container unmodified.'
		);
	}
}
