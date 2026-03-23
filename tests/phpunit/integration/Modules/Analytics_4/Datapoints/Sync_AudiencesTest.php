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
		$this->audience_settings->register();
		$audience_utilities = new Audience_Utilities( $this->audience_settings );

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
			$this->sync_audiences_request->getUri(),
			'The request should be made to the correct endpoint.'
		);
	}

	public function test_create_request__requires_authentication() {
		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '12345',
			)
		);

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'sync-audiences', array() );
		$response     = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'The datapoint should return an error when the user is not authenticated.' );
		$this->assertEquals( 'forbidden', $response->get_error_code(), 'The datapoint should return a `forbidden` error when the user is not authenticated.' );
	}

	public function test_create_request__requires_property_id() {
		$this->authentication->get_oauth_client()->set_token( array( 'access_token' => 'test-token' ) );

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '',
			)
		);

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'sync-audiences', array() );
		$response     = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'The datapoint should return an error when the `propertyID` setting is missing.' );
		$this->assertEquals( 'missing_required_setting', $response->get_error_code(), 'The datapoint should return a `missing_required_setting` error when the `propertyID` setting is missing.' );
	}

	public function data_available_audiences() {
		$raw_audiences = json_decode(
			file_get_contents( GOOGLESITEKIT_PLUGIN_DIR_PATH . 'assets/js/modules/analytics-4/datastore/__fixtures__/audiences.json' ),
			true
		);

		$available_audiences = json_decode(
			file_get_contents( GOOGLESITEKIT_PLUGIN_DIR_PATH . 'assets/js/modules/analytics-4/datastore/__fixtures__/available-audiences.json' ),
			true
		);

		$raw_audience_default_all_users           = $raw_audiences[0];
		$raw_audience_default_purchasers          = $raw_audiences[1];
		$raw_audience_site_kit_new_visitors       = $raw_audiences[2];
		$raw_audience_site_kit_returning_visitors = $raw_audiences[3];
		$raw_audience_user_test                   = $raw_audiences[4];

		$available_audience_default_all_users           = $available_audiences[0];
		$available_audience_default_purchasers          = $available_audiences[1];
		$available_audience_site_kit_new_visitors       = $available_audiences[2];
		$available_audience_site_kit_returning_visitors = $available_audiences[3];
		$available_audience_user_test                   = $available_audiences[4];

		return array(
			'Site Kit audiences in correct order'   => array(
				array(
					'raw_audiences'                => array(
						$raw_audience_site_kit_new_visitors,
						$raw_audience_site_kit_returning_visitors,
					),
					'expected_available_audiences' => array(
						$available_audience_site_kit_new_visitors,
						$available_audience_site_kit_returning_visitors,
					),
				),
			),
			'Site Kit audiences in incorrect order' => array(
				array(
					'raw_audiences'                => array(
						$raw_audience_site_kit_returning_visitors,
						$raw_audience_site_kit_new_visitors,
					),
					'expected_available_audiences' => array(
						$available_audience_site_kit_new_visitors,
						$available_audience_site_kit_returning_visitors,
					),
				),
			),
			'default audiences, case 1'             => array(
				array(
					'raw_audiences'                => array(
						$raw_audience_default_all_users,
						$raw_audience_default_purchasers,
					),
					// As the audiences are of the same type, and not Site Kit-created audiences, they should be returned in the order returned by the API.
					'expected_available_audiences' => array(
						$available_audience_default_all_users,
						$available_audience_default_purchasers,
					),
				),
			),
			'default audiences, case 2'             => array(
				array(
					'raw_audiences'                => array(
						$raw_audience_default_purchasers,
						$raw_audience_default_all_users,
					),
					'expected_available_audiences' => array(
						$available_audience_default_purchasers,
						$available_audience_default_all_users,
					),
				),
			),
			'all audiences, case 1'                 => array(
				array(
					'raw_audiences'                => array(
						$raw_audience_user_test,
						$raw_audience_site_kit_new_visitors,
						$raw_audience_site_kit_returning_visitors,
						$raw_audience_default_all_users,
						$raw_audience_default_purchasers,
					),
					'expected_available_audiences' => array(
						$available_audience_user_test,
						$available_audience_site_kit_new_visitors,
						$available_audience_site_kit_returning_visitors,
						$available_audience_default_all_users,
						$available_audience_default_purchasers,
					),
				),
			),
			'all audiences, case 2'                 => array(
				array(
					'raw_audiences'                => array(
						$raw_audience_site_kit_returning_visitors,
						$raw_audience_user_test,
						$raw_audience_default_purchasers,
						$raw_audience_site_kit_new_visitors,
						$raw_audience_default_all_users,
					),
					'expected_available_audiences' => array(
						$available_audience_user_test,
						$available_audience_site_kit_new_visitors,
						$available_audience_site_kit_returning_visitors,
						$available_audience_default_purchasers,
						$available_audience_default_all_users,
					),
				),
			),
			'all audiences, case 3'                 => array(
				array(
					'raw_audiences'                => array(
						$raw_audience_default_purchasers,
						$raw_audience_default_all_users,
						$raw_audience_site_kit_returning_visitors,
						$raw_audience_site_kit_new_visitors,
						$raw_audience_user_test,
					),
					'expected_available_audiences' => array(
						$available_audience_user_test,
						$available_audience_site_kit_new_visitors,
						$available_audience_site_kit_returning_visitors,
						$available_audience_default_purchasers,
						$available_audience_default_all_users,
					),
				),
			),
		);
	}

	/**
	 * @dataProvider data_available_audiences
	 */
	public function test_parse_response( $available_audiences ) {
		$raw_audiences                = $available_audiences['raw_audiences'];
		$expected_available_audiences = $available_audiences['expected_available_audiences'];

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'sync-audiences', array() );

		$audience_objects = array_map(
			function ( $raw_audience ) {
				return new GoogleAnalyticsAdminV1alphaAudience( $raw_audience );
			},
			$raw_audiences
		);

		$audiences = new GoogleAnalyticsAdminV1alphaListAudiencesResponse();
		$audiences->setAudiences( $audience_objects );

		$this->assertEquals( $expected_available_audiences, $this->datapoint->parse_response( $audiences, $data_request ), 'The `parse_response` method should return the expected available audiences.' );
	}

	public function test_parse_response__propagates_wp_error() {
		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'sync-audiences', array() );
		$wp_error     = new WP_Error( 'test_error', 'Test error' );

		$this->assertSame( $wp_error, $this->datapoint->parse_response( $wp_error, $data_request ), 'The datapoint should return `WP_Error` responses unchanged.' );
	}
}
