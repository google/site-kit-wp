<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Advanced_Data_Breakdowns_SettingsTest
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
use Google\Site_Kit\Modules\Analytics_4\Advanced_Data_Breakdowns_Settings;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Advanced_Data_Breakdowns_Settings;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Advanced_Data_Breakdowns_SettingsTest extends TestCase {

	/**
	 * @var Get_Advanced_Data_Breakdowns_Settings
	 */
	private Get_Advanced_Data_Breakdowns_Settings $datapoint;

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

		$this->datapoint = new Get_Advanced_Data_Breakdowns_Settings(
			array(
				'advanced_data_breakdowns_settings' => $this->settings,
				'service'                           => '',
			)
		);

		// Let an admin pass the `Permissions::MANAGE_OPTIONS` check without setting up Site Kit authentication.
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

	public function test_create_request__returns_dedicated_option_for_admin(): void {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );

		$this->settings->merge( array( 'enabled' => true ) );

		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'advanced-data-breakdowns-settings', array() );
		$request      = $this->datapoint->create_request( $data_request );
		$response     = $request();

		$this->assertSame(
			array( 'enabled' => true ),
			$response,
			'An admin should see the dedicated option as-is.'
		);
	}

	public function test_create_request__returns_view_only_keys_for_non_admin(): void {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'editor' ) );
		wp_set_current_user( $user->ID );

		$this->settings->merge( array( 'enabled' => true ) );

		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'advanced-data-breakdowns-settings', array() );
		$request      = $this->datapoint->create_request( $data_request );
		$response     = $request();

		$this->assertArrayHasKey(
			'enabled',
			$response,
			'View-only users should see the `enabled` key.'
		);
		$this->assertTrue( $response['enabled'], 'View-only users should read the stored value.' );
	}

	public function test_merge__does_not_touch_main_analytics_4_settings(): void {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );

		update_option(
			'googlesitekit_analytics-4_settings',
			array( 'propertyID' => '12345' )
		);

		$this->settings->merge( array( 'enabled' => true ) );

		$analytics_4_settings = get_option( 'googlesitekit_analytics-4_settings' );
		$this->assertSame(
			'12345',
			$analytics_4_settings['propertyID'],
			'The main Analytics 4 settings option should remain untouched after writing the dedicated option.'
		);
	}

	public function test_parse_response_returns_unchanged(): void {
		$data_request = new Data_Request( 'GET', 'modules', 'analytics-4', 'advanced-data-breakdowns-settings', array() );
		$payload      = array( 'enabled' => true );

		$this->assertSame(
			$payload,
			$this->datapoint->parse_response( $payload, $data_request ),
			'`parse_response` should return its input as-is.'
		);
	}
}
