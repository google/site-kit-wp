<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Key_EventsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Key_Events;
use Google\Site_Kit\Modules\Analytics_4\Report\Response as ReportResponse;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_Error;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin as Google_Service_GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListKeyEventsResponse;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaKeyEvent;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Key_EventsTest extends TestCase {

	/**
	 * Get_Key_Events datapoint instance.
	 *
	 * @var Get_Key_Events
	 */
	private $datapoint;

	/**
	 * Get key events request instance.
	 *
	 * @var Request
	 */
	private $get_key_events_request;

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

		$this->datapoint = new Get_Key_Events(
			array(
				'service'  => function () use ( $service ) {
					return $service;
				},
				'settings' => $this->analytics->get_settings(),
			),
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->get_key_events_request = $request;

				$response = new GoogleAnalyticsAdminV1betaListKeyEventsResponse();
				$response->setKeyEvents( array( new GoogleAnalyticsAdminV1betaKeyEvent() ) );

				return new FulfilledPromise(
					new Response(
						200,
						array(),
						json_encode( $response )
					)
				);
			}
		);

		wp_set_current_user( $user->ID );
	}

	public function test_create_request__requires_property_id() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'key-events' );

		$request = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $request, 'The datapoint should return an error when the `propertyID` setting is missing.' );

		$this->assertEquals( 'missing_required_setting', $request->get_error_code(), 'The datapoint should return a `missing_required_setting` error when the `propertyID` setting is missing.' );
	}

	public function test_create_request() {
		$this->get_key_events_request = null;

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '12345',
			)
		);

		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'key-events' );

		$request = $this->datapoint->create_request( $data_request );

		$result = $this->analytics->get_client()->execute( $request );

		$this->assertEquals(
			'https://analyticsadmin.googleapis.com/v1beta/properties/12345/keyEvents',
			$this->get_key_events_request->getUri(),
			'The request should be made to the correct endpoint.'
		);
	}

	public function test_parse_response() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'key-events' );

		$key_events_response = new GoogleAnalyticsAdminV1betaListKeyEventsResponse();
		$key_events_response->setKeyEvents( array( new GoogleAnalyticsAdminV1betaKeyEvent() ) );

		$response = $this->datapoint->parse_response( $key_events_response, $data_request );

		$this->assertEquals(
			$response,
			$key_events_response->getKeyEvents(),
			'The datapoint should return an array of events.'
		);
	}
}
