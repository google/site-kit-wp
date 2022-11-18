<?php
/**
 * Class Google\Site_Kit\Tests\Core\User_Input\User_Input_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Core\User_Input
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User_Input;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\User_Input\User_Input_Settings;
use Google\Site_Kit\Core\User_Input\User_Input_Site_Settings;
use Google\Site_Kit\Core\User_Input\User_Input_User_Settings;
use Google\Site_Kit\Tests\TestCase;

class User_Input_SettingsTest extends TestCase {

	/**
	 * Context object.
	 *
	 * @var Context
	 */
	private $context;

	public function set_up() {
		parent::set_up();
		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
	}

	public function test_are_settings_empty() {
		$settings = new User_Input_Settings( $this->context );

		$data = array(
			'setting1' => array( 'values' => null ),
		);
		$this->assertTrue( $settings->are_settings_empty( $data ) );

		$data = array(
			'setting1' => array( 'values' => null ),
			'setting2' => array( 'values' => array( '1', '2', '3' ) ),
		);
		$this->assertTrue( $settings->are_settings_empty( $data ) );

		$data = array(
			'setting1' => array( 'values' => array( 'a', 'b', 'c' ) ),
			'setting2' => array( 'values' => array( '1', '2', '3' ) ),
		);
		$this->assertFalse( $settings->are_settings_empty( $data ) );
	}

	public function test_get_settings() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$settings = new User_Input_Settings( $this->context );

		update_option(
			User_Input_Site_Settings::OPTION,
			array(
				'purpose' => array(
					'values' => array( 'purpose1' ),
					'scope'  => 'site',
				),
			)
		);

		update_user_option(
			$user_id,
			User_Input_User_Settings::OPTION,
			array(
				'postFrequency' => array(
					'values' => array( 'daily' ),
					'scope'  => 'user',
				),
				'goals'         => array(
					'values' => array( 'goal1', 'goal2' ),
					'scope'  => 'user',
				),
			)
		);

		$this->assertEquals(
			array(
				'purpose'       => array(
					'values' => array( 'purpose1' ),
					'scope'  => 'site',
				),
				'postFrequency' => array(
					'values' => array( 'daily' ),
					'scope'  => 'user',
				),
				'goals'         => array(
					'values' => array( 'goal1', 'goal2' ),
					'scope'  => 'user',
				),
			),
			$settings->get_settings()
		);
	}

	public function test_set_settings() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$settings = new User_Input_Settings( $this->context );
		$response = $settings->set_settings(
			array(
				'purpose'       => array( 'purpose1' ),
				'postFrequency' => array( 'daily' ),
				'goals'         => array( 'goal1', 'goal2' ),
			)
		);

		$this->assertEquals(
			array(
				'purpose'       => array(
					'values' => array( 'purpose1' ),
					'scope'  => 'site',
				),
				'postFrequency' => array(
					'values' => array( 'daily' ),
					'scope'  => 'user',
				),
				'goals'         => array(
					'values' => array( 'goal1', 'goal2' ),
					'scope'  => 'user',
				),
			),
			$response
		);
	}
}
