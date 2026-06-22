<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Save_Advanced_Data_Breakdowns_SettingsTest
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
use Google\Site_Kit\Modules\Analytics_4\Advanced_Data_Breakdowns_Settings;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Save_Advanced_Data_Breakdowns_Settings;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Save_Advanced_Data_Breakdowns_SettingsTest extends TestCase {

	/**
	 * @var Save_Advanced_Data_Breakdowns_Settings
	 */
	private Save_Advanced_Data_Breakdowns_Settings $datapoint;

	/**
	 * @var Advanced_Data_Breakdowns_Settings
	 */
	private Advanced_Data_Breakdowns_Settings $settings;

	public function set_up(): void {
		parent::set_up();

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$this->settings = new Advanced_Data_Breakdowns_Settings( $options );
		$this->settings->register();

		$this->datapoint = new Save_Advanced_Data_Breakdowns_Settings(
			array(
				'advanced_data_breakdowns_settings' => $this->settings,
				'service'                           => '',
			)
		);

		add_filter(
			'map_meta_cap',
			function ( $caps, $cap ): array {
				if ( Permissions::MANAGE_OPTIONS === $cap ) {
					return array( 'manage_options' );
				}
				return $caps;
			},
			99,
			2
		);
	}

	public function test_create_request__saves_property_map(): void {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'save-advanced-data-breakdowns-settings',
			array(
				'settings' => array(
					'123456789' => true,
					'987654321' => false,
				),
			)
		);

		$request  = $this->datapoint->create_request( $data_request );
		$response = $request();

		$this->assertSame(
			array(
				'123456789' => true,
				'987654321' => false,
			),
			$response,
			'The merged map of property states should be returned.'
		);
		$this->assertTrue( $this->settings->is_enabled( '123456789' ), 'The enabled property should be persisted.' );
		$this->assertFalse( $this->settings->is_enabled( '987654321' ), 'The disabled property should be persisted.' );
	}

	public function test_create_request__keeps_other_properties_states(): void {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );

		$this->settings->merge( array( '987654321' => true ) );

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'save-advanced-data-breakdowns-settings',
			array(
				'settings' => array( '123456789' => true ),
			)
		);

		$request  = $this->datapoint->create_request( $data_request );
		$response = $request();

		$this->assertSame(
			array(
				'987654321' => true,
				'123456789' => true,
			),
			$response,
			'Saving one property should keep the other properties\' states.'
		);
	}

	public function test_create_request__does_not_touch_main_analytics_4_settings(): void {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );

		update_option(
			'googlesitekit_analytics-4_settings',
			array( 'propertyID' => '12345' )
		);

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'save-advanced-data-breakdowns-settings',
			array(
				'settings' => array( '123456789' => true ),
			)
		);

		$request = $this->datapoint->create_request( $data_request );
		$request();

		$analytics_4_settings = get_option( 'googlesitekit_analytics-4_settings' );
		$this->assertSame(
			'12345',
			$analytics_4_settings['propertyID'],
			'Saving the dedicated option should not modify the main Analytics 4 settings.'
		);
		$this->assertArrayNotHasKey(
			'123456789',
			$analytics_4_settings,
			'The property flag should not appear on the main Analytics 4 settings.'
		);
	}

	public function test_create_request__returns_error_for_non_admin(): void {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'editor' ) );
		wp_set_current_user( $user->ID );

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'save-advanced-data-breakdowns-settings',
			array(
				'settings' => array( '123456789' => true ),
			)
		);

		$response = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'Non-admin users should be rejected with a WP_Error.' );
		$this->assertEquals( 'forbidden', $response->get_error_code(), 'The error code should be `forbidden`.' );
	}

	public function test_create_request__validates_property_value_type(): void {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'save-advanced-data-breakdowns-settings',
			array(
				'settings' => array( '123456789' => 'yes' ),
			)
		);

		try {
			$this->datapoint->create_request( $data_request );
			$this->fail( 'Expected `Invalid_Param_Exception` to be thrown when a property value is not a boolean.' );
		} catch ( Invalid_Param_Exception $exception ) {
			$this->assertEquals(
				'Invalid parameter: settings.',
				$exception->getMessage(),
				'The thrown exception should name the invalid `settings` parameter.'
			);
		}
	}

	public function test_parse_response__returns_the_settings_unchanged(): void {
		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'save-advanced-data-breakdowns-settings', array() );
		$payload      = array( '123456789' => true );

		$this->assertSame(
			$payload,
			$this->datapoint->parse_response( $payload, $data_request ),
			'`parse_response` should return its input as-is.'
		);
	}
}
