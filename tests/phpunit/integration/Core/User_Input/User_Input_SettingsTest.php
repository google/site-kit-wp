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

	/**
	* Context object.
	*
	* @var User_Input_Settings
	*/
	private $user_input_settings;

	/**
	* User ID.
	*
	* @var int
	*/
	private $user_id;

	/**
	 * Settings with empty default values.
	 *
	 * @var array|ArrayAccess
	 */
	private static $empty_settings = array(
		'purpose'       => array(
			'scope'  => 'site',
			'values' => array(),
		),
		'postFrequency' => array(
			'scope'  => 'user',
			'values' => array(),
		),
		'goals'         => array(
			'scope'  => 'user',
			'values' => array(),
		),
	);

	/**
	 * Settings with dummy values.
	 *
	 * @var array|ArrayAccess
	 */
	private static $dummy_settings = array(
		'purpose'       => array(
			'scope'  => 'site',
			'values' => array( 'purpose1' ),
		),
		'postFrequency' => array(
			'scope'  => 'user',
			'values' => array( 'daily' ),
		),
		'goals'         => array(
			'scope'  => 'user',
			'values' => array( 'goal1', 'goal2' ),
		),
	);

	public function set_up() {
		parent::set_up();
		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $this->user_id );

		$this->user_input_settings = new User_Input_Settings( $this->context );
		$this->user_input_settings->register();
	}

	public function test_are_settings_empty() {
		$data = array(
			'setting1' => array( 'values' => null ),
		);
		$this->assertTrue( $this->user_input_settings->are_settings_empty( $data ) );

		$data = array(
			'setting1' => array( 'values' => null ),
			'setting2' => array( 'values' => array( '1', '2', '3' ) ),
		);
		$this->assertTrue( $this->user_input_settings->are_settings_empty( $data ) );

		$data = array(
			'setting1' => array( 'values' => array( 'a', 'b', 'c' ) ),
			'setting2' => array( 'values' => array( '1', '2', '3' ) ),
		);
		$this->assertFalse( $this->user_input_settings->are_settings_empty( $data ) );
	}

	public function test_get_settings() {
		// If settings are not set, it returns empty default values.
		$this->assertEquals(
			static::$empty_settings,
			$this->user_input_settings->get_settings()
		);

		// If settings are partially set, it returns empty default values for unanswered questions.
		update_user_option(
			$this->user_id,
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
					'values' => array(),
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
			$this->user_input_settings->get_settings()
		);

		// Returns all set settings as expected.
		update_option(
			User_Input_Site_Settings::OPTION,
			array(
				'purpose' => array(
					'values'     => array( 'purpose1' ),
					'scope'      => 'site',
					'answeredBy' => $this->user_id,
				),
			)
		);

		update_user_option(
			$this->user_id,
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
			static::$dummy_settings,
			$this->user_input_settings->get_settings()
		);
	}

	public function test_set_settings() {
		$response = $this->user_input_settings->set_settings(
			array(
				'purpose'       => array( 'purpose1' ),
				'postFrequency' => array( 'daily' ),
				'goals'         => array( 'goal1', 'goal2' ),
			)
		);

		$this->assertEquals(
			static::$dummy_settings,
			$response
		);
	}
}
