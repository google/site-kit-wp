<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Sync_AudiencesTest
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
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4\Audience_Utilities;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Sync_Audiences;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdminV1alpha;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdminV1alpha\GoogleAnalyticsAdminV1alphaAudience;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdminV1alpha\GoogleAnalyticsAdminV1alphaListAudiencesResponse;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_Error;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Sync_AudiencesTest extends TestCase {

	/**
	 * Sync_Audiences datapoint instance.
	 *
	 * @var Sync_Audiences
	 */
	private $datapoint;

	/**
	 * Sync audiences request instance.
	 *
	 * @var Request
	 */
	private $sync_audiences_request;

	/**
	 * Analytics_4 instance.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	/**
	 * Authentication instance.
	 *
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Audience_Settings instance.
	 *
	 * @var Audience_Settings
	 */
	private $audience_settings;

	public function set_up() {
		parent::set_up();

		$context              = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options              = new Options( $context );
		$user                 = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options         = new User_Options( $context, $user->ID );
		$this->authentication = new Authentication( $context, $options, $user_options );
		$this->analytics      = new Analytics_4( $context, $options, $user_options, $this->authentication );

		$this->audience_settings = new Audience_Settings( $options );
		$audience_utilities      = new Audience_Utilities( $this->audience_settings );

		$this->analytics->get_client()->withDefer( true );
		$service = new GoogleAnalyticsAdminV1alpha( $this->analytics->get_client() );

		$this->datapoint = new Sync_Audiences(
			array(
				'authentication'     => $this->authentication,
				'settings'           => $this->analytics->get_settings(),
				'audience_utilities' => $audience_utilities,
				'service'            => function () use ( $service ) {
					return $service;
				},
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->sync_audiences_request = $request;

				$audience_1 = new GoogleAnalyticsAdminV1alphaAudience();
				$audience_1->setName( 'properties/12345/audiences/1' );
				$audience_1->setDisplayName( 'All Users' );
				$audience_1->setDescription( 'All users' );

				$audience_2 = new GoogleAnalyticsAdminV1alphaAudience();
				$audience_2->setName( 'properties/12345/audiences/2' );
				$audience_2->setDisplayName( 'Purchasers' );
				$audience_2->setDescription( 'Users who have made a purchase' );

				$response = new GoogleAnalyticsAdminV1alphaListAudiencesResponse();
				$response->setAudiences( array( $audience_1, $audience_2 ) );

				return new FulfilledPromise( new Response( 200, array(), json_encode( $response ) ) );
			}
		);
	}

	public function test_create_request_returns_error_when_unauthenticated() {
		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '12345',
			)
		);

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'sync-audiences', array() );
		$response     = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'Sync audiences should return a WP_Error when user is not authenticated.' );
		$this->assertEquals( 'forbidden', $response->get_error_code(), 'Sync audiences should return forbidden when user is not authenticated.' );
	}

	public function test_create_request_returns_error_when_property_setting_is_missing() {
		$this->authentication->get_oauth_client()->set_token( array( 'access_token' => 'test-token' ) );

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '',
			)
		);

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'sync-audiences', array() );
		$response     = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'Sync audiences should return a WP_Error when propertyID is missing from settings.' );
		$this->assertEquals( 'missing_required_setting', $response->get_error_code(), 'Sync audiences should return missing_required_setting when propertyID is missing from settings.' );
	}

	public function test_create_request() {
		$this->sync_audiences_request = null;

		$this->authentication->get_oauth_client()->set_token( array( 'access_token' => 'test-token' ) );

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '12345',
			)
		);

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'sync-audiences', array() );
		$request      = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$this->assertEquals(
			'https://analyticsadmin.googleapis.com/v1alpha/properties/12345/audiences',
			$this->sync_audiences_request->getUri()->__toString(),
			'Sync audiences request should target the expected API endpoint.'
		);
	}

	public function test_parse_response() {
		$this->authentication->get_oauth_client()->set_token( array( 'access_token' => 'test-token' ) );

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '12345',
			)
		);

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'sync-audiences', array() );
		$request      = $this->datapoint->create_request( $data_request );
		$response     = $this->datapoint->parse_response(
			$this->analytics->get_client()->execute( $request ),
			$data_request
		);

		$this->assertIsArray( $response, 'Sync audiences should return an array of audiences.' );
		$this->assertNotEmpty( $response, 'Sync audiences should return a non-empty array of audiences.' );

		$this->assertArrayHasKey( 'name', $response[0], 'Each audience should have a name key.' );
		$this->assertArrayHasKey( 'displayName', $response[0], 'Each audience should have a displayName key.' );
		$this->assertArrayHasKey( 'audienceType', $response[0], 'Each audience should have an audienceType key.' );
		$this->assertArrayHasKey( 'audienceSlug', $response[0], 'Each audience should have an audienceSlug key.' );

		$audience_settings = $this->audience_settings->get();
		$this->assertNotNull( $audience_settings['availableAudiences'], 'Available audiences should be updated after sync.' );
		$this->assertGreaterThan( 0, $audience_settings['availableAudiencesLastSyncedAt'], 'Sync timestamp should be set after sync.' );
	}

	public function test_parse_response_propagates_wp_error() {
		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'sync-audiences', array() );
		$wp_error     = new WP_Error( 'test_error', 'Test error' );

		$this->assertSame( $wp_error, $this->datapoint->parse_response( $wp_error, $data_request ), 'parse_response should return WP_Error responses unchanged.' );
	}
}
