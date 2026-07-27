<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\Save_User_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Save_User_Settings;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\User_Settings;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Save_User_SettingsTest extends TestCase {

	/**
	 * Save_User_Settings datapoint instance.
	 *
	 * @var Save_User_Settings
	 */
	private $datapoint;

	/**
	 * User_Settings instance.
	 *
	 * @var User_Settings
	 */
	private $user_settings;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context             = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options        = new User_Options( $context, $user_id );
		$this->user_settings = new User_Settings( $user_options );
		$this->user_settings->register();

		$this->datapoint = new Save_User_Settings(
			array(
				'user_settings' => $this->user_settings,
				'service'       => '',
			)
		);
	}

	public function test_create_request__merges_and_returns_updated_settings() {
		$this->user_settings->merge(
			array(
				'lastActionedExpressSetups' => array(
					'publicationSetup' => 1752451200,
				),
			)
		);

		$data_request = new Data_Request(
			'POST',
			'modules',
			'reader-revenue-manager',
			'user-settings',
			array(
				'lastActionedExpressSetups' => array(
					'productSetup' => 1752537600,
				),
			)
		);
		$request      = $this->datapoint->create_request( $data_request );
		$response     = $request();

		$expected          = array(
			'lastActionedExpressSetups' => array(
				'publicationSetup' => 1752451200,
				'productSetup'     => 1752537600,
			),
		);
		$expected_response = $expected;

		$expected_response['lastActionedExpressSetups'] = (object) $expected_response['lastActionedExpressSetups'];

		$this->assertEquals(
			$expected_response,
			$response,
			'The datapoint should merge and return the updated user settings.'
		);
		$this->assertSame(
			$expected,
			$this->user_settings->get(),
			'The datapoint should persist the merged user settings.'
		);
	}

	public function test_create_request__returns_empty_last_actioned_express_setups_as_object() {
		$data_request = new Data_Request( 'POST', 'modules', 'reader-revenue-manager', 'user-settings', array() );
		$request      = $this->datapoint->create_request( $data_request );

		$this->assertEquals(
			array( 'lastActionedExpressSetups' => (object) array() ),
			$request(),
			'The datapoint should return an empty object for the default express setup timestamps.'
		);
	}

	public function test_create_request__sanitizes_settings() {
		$data_request = new Data_Request(
			'POST',
			'modules',
			'reader-revenue-manager',
			'user-settings',
			array(
				'lastActionedExpressSetups' => array(
					'publicationSetup' => 1752451200,
					'invalidSetup'     => '1752537600',
				),
				'unknownSetting'            => 'unknown-value',
			)
		);
		$request      = $this->datapoint->create_request( $data_request );

		$this->assertEquals(
			array(
				'lastActionedExpressSetups' => (object) array(
					'publicationSetup' => 1752451200,
				),
			),
			$request(),
			'The datapoint should rely on User_Settings to sanitize values and ignore unknown keys.'
		);
	}

	public function test_parse_response() {
		$data_request = new Data_Request( 'POST', 'modules', 'reader-revenue-manager', 'user-settings', array() );
		$settings     = array( 'lastActionedExpressSetups' => array() );

		$this->assertSame(
			$settings,
			$this->datapoint->parse_response( $settings, $data_request ),
			'The datapoint should return the response unchanged.'
		);
	}

	public function test_permission_callback() {
		$this->assertSame(
			current_user_can( Permissions::VIEW_DASHBOARD ),
			$this->datapoint->permission_callback(),
			'The datapoint permission should gate on the VIEW_DASHBOARD capability.'
		);
	}
}
