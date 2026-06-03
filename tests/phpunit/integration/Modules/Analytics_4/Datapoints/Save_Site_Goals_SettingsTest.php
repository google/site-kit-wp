<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Save_Site_Goals_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Save_Site_Goals_Settings;
use Google\Site_Kit\Modules\Analytics_4\Site_Goals_Settings;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Save_Site_Goals_SettingsTest extends TestCase {

	/**
	 * Save_Site_Goals_Settings datapoint instance.
	 *
	 * @var Save_Site_Goals_Settings
	 */
	private $datapoint;

	/**
	 * Site_Goals_Settings instance.
	 *
	 * @var Site_Goals_Settings
	 */
	private $site_goals_settings;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );

		$this->site_goals_settings = new Site_Goals_Settings( $user_options );
		$this->site_goals_settings->register();

		$this->datapoint = new Save_Site_Goals_Settings(
			array(
				'site_goals_settings' => $this->site_goals_settings,
				'service'             => '',
			)
		);
	}

	public function test_create_request__merges_and_returns_updated_settings() {
		$settings = array(
			'goalDrivers'       => array(
				'ecommerce' => array( 'topTrafficChannels' ),
				'lead'      => array( 'visitorType' ),
			),
			'visitorEngagement' => array(
				'ecommerce' => array( 'add_to_cart' ),
				'lead'      => array(),
			),
		);

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'save-site-goals-settings',
			array( 'settings' => $settings )
		);

		$request  = $this->datapoint->create_request( $data_request );
		$response = $request();

		$this->assertEqualSetsWithIndex( $settings, $response, 'The datapoint should return the saved settings.' );
		$this->assertEqualSetsWithIndex( $settings, $this->site_goals_settings->get(), 'The settings should be persisted.' );
	}

	public function test_create_request__preserves_existing_settings_on_partial_save() {
		$this->site_goals_settings->merge(
			array(
				'goalDrivers' => array(
					'ecommerce' => array( 'topTrafficChannels' ),
				),
			)
		);

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'save-site-goals-settings',
			array(
				'settings' => array(
					'visitorEngagement' => array(
						'ecommerce' => array( 'add_to_cart' ),
					),
				),
			)
		);

		$request  = $this->datapoint->create_request( $data_request );
		$response = $request();

		$this->assertEqualSetsWithIndex(
			array(
				'goalDrivers'       => array(
					'ecommerce' => array( 'topTrafficChannels' ),
				),
				'visitorEngagement' => array(
					'ecommerce' => array( 'add_to_cart' ),
				),
			),
			$response,
			'A partial save should preserve the existing settings.'
		);
	}

	public function test_create_request__ignores_unknown_keys() {
		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'save-site-goals-settings',
			array(
				'settings' => array(
					'goalDrivers'    => array(
						'ecommerce' => array( 'topTrafficChannels' ),
					),
					'unknownSetting' => 'some-value',
				),
			)
		);

		$request  = $this->datapoint->create_request( $data_request );
		$response = $request();

		$this->assertArrayNotHasKey( 'unknownSetting', $response, 'Unknown settings should not be included in the response.' );
	}

	public function test_parse_response() {
		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'save-site-goals-settings', array() );
		$test_data    = array( 'goalDrivers' => array() );

		$this->assertSame( $test_data, $this->datapoint->parse_response( $test_data, $data_request ), 'The `parse_response` method should return the response unchanged.' );
	}
}
