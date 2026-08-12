<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Sync_Custom_DimensionsTest
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
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Custom_Dimensions_Data_Available;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Sync_Custom_Dimensions;
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
class Sync_Custom_DimensionsTest extends TestCase {

	/**
	 * Sync_Custom_Dimensions datapoint instance.
	 *
	 * @var Sync_Custom_Dimensions
	 */
	private $datapoint;

	/**
	 * Sync custom dimensions request instance.
	 *
	 * @var Request
	 */
	private $sync_custom_dimensions_request;

	/**
	 * Analytics_4 instance.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	/**
	 * Custom_Dimensions_Data_Available instance.
	 *
	 * @var Custom_Dimensions_Data_Available
	 */
	private $custom_dimensions_data_available;

	public function set_up() {
		parent::set_up();

		$context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options         = new Options( $context );
		$user            = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options    = new User_Options( $context, $user->ID );
		$authentication  = new Authentication( $context, $options, $user_options );
		$this->analytics = new Analytics_4( $context, $options, $user_options, $authentication );

		$this->custom_dimensions_data_available = new Custom_Dimensions_Data_Available( new Transients( $context ) );

		$this->analytics->get_client()->withDefer( true );
		$service = new Google_Service_GoogleAnalyticsAdmin( $this->analytics->get_client() );

		$this->datapoint = new Sync_Custom_Dimensions(
			array(
				'service'                          => function () use ( $service ) {
					return $service;
				},
				'settings'                         => $this->analytics->get_settings(),
				'custom_dimensions_data_available' => $this->custom_dimensions_data_available,
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->sync_custom_dimensions_request = $request;

				$custom_dimension_1 = new GoogleAnalyticsAdminV1betaCustomDimension();
				$custom_dimension_1->setParameterName( 'googlesitekit_post_categories' );

				$custom_dimension_2 = new GoogleAnalyticsAdminV1betaCustomDimension();
				$custom_dimension_2->setParameterName( 'sessionDefaultChannelGroup' );

				$response = new GoogleAnalyticsAdminV1betaListCustomDimensionsResponse();
				$response->setCustomDimensions( array( $custom_dimension_1, $custom_dimension_2 ) );

				return new FulfilledPromise( new Response( 200, array(), json_encode( $response ) ) );
			}
		);
	}

	public function test_create_request_returns_error_when_property_setting_is_missing() {
		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '',
			)
		);

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'sync-custom-dimensions', array() );
		$response     = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'Sync custom dimensions should return a WP_Error when propertyID is missing from settings.' );
		$this->assertEquals( 'missing_required_setting', $response->get_error_code(), 'Sync custom dimensions should return missing_required_setting when propertyID is missing from settings.' );
	}

	public function test_create_request() {
		$this->sync_custom_dimensions_request = null;

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '123456',
			)
		);

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'sync-custom-dimensions', array() );
		$request      = $this->datapoint->create_request( $data_request );
		$this->analytics->get_client()->execute( $request );

		$this->assertEquals(
			'https://analyticsadmin.googleapis.com/v1beta/properties/123456/customDimensions',
			$this->sync_custom_dimensions_request->getUri()->__toString(),
			'Sync custom dimensions request should target the expected API endpoint.'
		);
	}

	public function test_parse_response() {
		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '123456',
			)
		);

		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_author' );
		$this->custom_dimensions_data_available->set_data_available( 'googlesitekit_post_categories' );

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'sync-custom-dimensions', array() );
		$request      = $this->datapoint->create_request( $data_request );
		$response     = $this->datapoint->parse_response(
			$this->analytics->get_client()->execute( $request ),
			$data_request
		);

		$this->assertEquals( array( 'googlesitekit_post_categories' ), $response, 'Only Site Kit custom dimensions should be returned after syncing.' );
		$this->assertEquals(
			array( 'googlesitekit_post_categories' ),
			$this->analytics->get_settings()->get()['availableCustomDimensions'],
			'Syncing custom dimensions should persist the filtered custom dimensions in module settings.'
		);
		$this->assertEquals(
			array(
				'googlesitekit_post_date'       => false,
				'googlesitekit_post_author'     => false,
				'googlesitekit_post_categories' => true,
				'googlesitekit_post_type'       => false,
				'googlesitekit_event_provider'  => false,
				'googlesitekit_form_id'         => false,
			),
			$this->custom_dimensions_data_available->get_data_availability(),
			'Syncing custom dimensions should reset data available state for missing custom dimensions.'
		);
	}

	public function test_parse_response_propagates_wp_error() {
		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'sync-custom-dimensions', array() );
		$wp_error     = new WP_Error( 'test_error', 'Test error' );

		$this->assertSame( $wp_error, $this->datapoint->parse_response( $wp_error, $data_request ), 'parse_response should return WP_Error responses unchanged.' );
	}
}
