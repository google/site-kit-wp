<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Audience_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Audience_Settings;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Audience_SettingsTest extends TestCase {

	/**
	 * Get_Audience_Settings datapoint instance.
	 *
	 * @var Get_Audience_Settings
	 */
	private $datapoint;

	/**
	 * Audience_Settings instance.
	 *
	 * @var Audience_Settings
	 */
	private $audience_settings;

	public function set_up() {
		parent::set_up();

		$context                 = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options                 = new Options( $context );
		$this->audience_settings = new Audience_Settings( $options );
		$this->audience_settings->register();

		$this->datapoint = new Get_Audience_Settings(
			array(
				'audience_settings' => $this->audience_settings,
				'service'           => '',
			)
		);

		add_filter(
			'map_meta_cap',
			function ( $caps, $cap ) {
				if ( Permissions::MANAGE_OPTIONS === $cap ) {
					return array( 'manage_options' );
				}
				return $caps;
			},
			99,
			2
		);
	}

	public function test_create_request_returns_callable() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'audience-settings', array() );
		$request      = $this->datapoint->create_request( $data_request );

		$this->assertIsCallable( $request, 'The `create_request` method should return a callable.' );
	}

	public function test_create_request_returns_full_settings_for_admin() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );

		$this->audience_settings->merge(
			array(
				'availableAudiences'                   => array( array( 'name' => 'test' ) ),
				'availableAudiencesLastSyncedAt'       => 1000,
				'audienceSegmentationSetupCompletedBy' => 1,
			)
		);

		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'audience-settings', array() );
		$request      = $this->datapoint->create_request( $data_request );
		$response     = $request();

		$this->assertArrayHasKey( 'availableAudiences', $response, 'An admin should see the `availableAudiences` setting.' );
		$this->assertArrayHasKey( 'availableAudiencesLastSyncedAt', $response, 'An admin should see the `availableAudiencesLastSyncedAt` setting.' );
		$this->assertArrayHasKey( 'audienceSegmentationSetupCompletedBy', $response, 'An admin should see the `audienceSegmentationSetupCompletedBy` setting.' );
	}

	public function test_create_request_returns_filtered_settings_for_non_admin() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'editor' ) );
		wp_set_current_user( $user->ID );

		$this->audience_settings->merge(
			array(
				'availableAudiences'                   => array( array( 'name' => 'test' ) ),
				'availableAudiencesLastSyncedAt'       => 1000,
				'audienceSegmentationSetupCompletedBy' => 1,
			)
		);

		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'audience-settings', array() );
		$request      = $this->datapoint->create_request( $data_request );
		$response     = $request();

		$this->assertArrayHasKey( 'availableAudiences', $response, 'A non-admin should see the `availableAudiences` setting (view-only key).' );
		$this->assertArrayHasKey( 'audienceSegmentationSetupCompletedBy', $response, 'A non-admin should see the `audienceSegmentationSetupCompletedBy` setting (view-only key).' );
		$this->assertArrayNotHasKey( 'availableAudiencesLastSyncedAt', $response, 'A non-admin should not see the `availableAudiencesLastSyncedAt` setting.' );
	}

	public function test_parse_response() {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'audience-settings', array() );
		$test_data    = array( 'availableAudiences' => array() );

		$this->assertSame( $test_data, $this->datapoint->parse_response( $test_data, $data_request ), 'The `parse_response` method should return the response unchanged.' );
	}
}
