<?php
/**
 * User_Input_User_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Core\User_Input
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User_Input;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User_Input\User_Input_User_Settings;
use Google\Site_Kit\Tests\TestCase;

class User_Input_User_SettingsTest extends TestCase {

	/**
	 * @var User_Options
	 */
	protected $user_options;

	public function set_up() {
		parent::set_up();
		$user_id            = $this->factory()->user->create();
		$context            = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options = new User_Options( $context, $user_id );
		$meta_key           = $this->user_options->get_meta_key( User_Input_User_Settings::OPTION );
		unregister_meta_key( 'user', $meta_key );
		// Needed to unregister the instance registered during plugin bootstrap.
		remove_all_filters( "sanitize_user_meta_{$meta_key}" );
	}

	public function test_get_sanitize_callback() {
		$user_input_user_settings = new User_Input_User_Settings( $this->user_options );
		$user_input_user_settings->register();

		$this->assertEmpty( $user_input_user_settings->get() );

		// Setting the value to a non-array will result in an empty array.
		$user_input_user_settings->set( false );
		$this->assertEquals( array(), $user_input_user_settings->get() );

		$user_input_user_settings->set( 123 );
		$this->assertEquals( array(), $user_input_user_settings->get() );

		// Setting the value to an array but with non-scoped keys will
		// result in an empty array.
		$user_input_user_settings->set( array( 'purpose' => array() ) );
		$this->assertEquals( array(), $user_input_user_settings->get() );

		// Setting the value to an array with scoped keys but a non-array
		// value will result in an empty array.
		$user_input_user_settings->set( array( 'goals' => 'a' ) );
		$this->assertEquals( array(), $user_input_user_settings->get() );

		// Setting the value to an associative array with scoped keys and array
		// with valid values as the value works as expected.
		$user_input_user_settings->set(
			array(
				'goals' => array(
					'scope'  => 'user',
					'values' => array( 'goal1', 'goal2' ),
				),
			)
		);
		$this->assertEquals(
			array(
				'goals' => array(
					'scope'  => 'user',
					'values' => array( 'goal1', 'goal2' ),
				),
			),
			$user_input_user_settings->get()
		);
	}
}
