<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\Get_User_SettingsTest
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
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_User_Settings;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\User_Settings;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Get_User_SettingsTest extends TestCase {

	/**
	 * Get_User_Settings datapoint instance.
	 *
	 * @var Get_User_Settings
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

		$this->datapoint = new Get_User_Settings(
			array(
				'user_settings' => $this->user_settings,
			)
		);
	}

	public function test_create_request__returns_default_settings() {
		$data_request = new Data_Request( 'GET', 'modules', 'reader-revenue-manager', 'user-settings', array() );
		$request      = $this->datapoint->create_request( $data_request );

		$this->assertEquals(
			array( 'lastActionedExpressSetups' => (object) array() ),
			$request(),
			'The datapoint should return an empty object for the default express setup timestamps.'
		);
	}

	public function test_create_request__returns_saved_settings() {
		$settings = array(
			'lastActionedExpressSetups' => array(
				'publicationSetup' => 1752451200,
			),
		);
		$this->user_settings->merge( $settings );

		$data_request = new Data_Request( 'GET', 'modules', 'reader-revenue-manager', 'user-settings', array() );
		$request      = $this->datapoint->create_request( $data_request );
		$expected     = $settings;

		$expected['lastActionedExpressSetups'] = (object) $expected['lastActionedExpressSetups'];

		$this->assertEquals(
			$expected,
			$request(),
			'The datapoint should return the saved user settings.'
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
