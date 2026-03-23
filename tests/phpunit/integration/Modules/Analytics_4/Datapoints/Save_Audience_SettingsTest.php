<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Save_Audience_SettingsTest
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
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Save_Audience_Settings;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Save_Audience_SettingsTest extends TestCase {

	/**
	 * Save_Audience_Settings datapoint instance.
	 *
	 * @var Save_Audience_Settings
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

		$this->datapoint = new Save_Audience_Settings(
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

	public function test_create_request_returns_error_for_non_admin() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'editor' ) );
		wp_set_current_user( $user->ID );

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'save-audience-settings',
			array(
				'settings' => array(
					'audienceSegmentationSetupCompletedBy' => 1,
				),
			)
		);

		$response = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'The `create-request` method should return a WP_Error for non-admin users.' );
		$this->assertEquals( 'forbidden', $response->get_error_code(), 'The `create-request` method should return a `forbidden` error for non-admin users.' );
	}

	public function test_create_request_validates_setup_completed_by_type() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'save-audience-settings',
			array(
				'settings' => array(
					'audienceSegmentationSetupCompletedBy' => 'not-an-integer',
				),
			)
		);

		$this->expectException( Invalid_Param_Exception::class );
		$this->datapoint->create_request( $data_request );
	}

	public function test_create_request() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'save-audience-settings',
			array(
				'settings' => array(
					'audienceSegmentationSetupCompletedBy' => 1,
				),
			)
		);

		$request = $this->datapoint->create_request( $data_request );

		$this->assertIsCallable( $request, 'The `create_request` method should return a callable.' );

		$response        = $request();
		$parsed_response = $this->datapoint->parse_response( $response, $data_request );

		$this->assertIsArray( $parsed_response, 'The `create-request` method should return an array.' );
		$this->assertEquals( 1, $parsed_response['audienceSegmentationSetupCompletedBy'], 'The `audienceSegmentationSetupCompletedBy` setting should be saved.' );

		$saved_settings = $this->audience_settings->get();
		$this->assertEquals( 1, $saved_settings['audienceSegmentationSetupCompletedBy'], 'The `audienceSegmentationSetupCompletedBy` setting should be persisted in the audience settings.' );
	}

	public function test_create_request_only_merges_known_settings() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'save-audience-settings',
			array(
				'settings' => array(
					'unknownSetting' => 'some-value',
				),
			)
		);

		$request  = $this->datapoint->create_request( $data_request );
		$response = $request();

		$this->assertArrayNotHasKey( 'unknownSetting', $response, 'Unknown settings should not be included in the response.' );
	}

	public function test_parse_response() {
		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'save-audience-settings', array() );
		$test_data    = array( 'audienceSegmentationSetupCompletedBy' => 1 );

		$this->assertSame( $test_data, $this->datapoint->parse_response( $test_data, $data_request ), 'The `parse_response` method should return the response unchanged.' );
	}
}
