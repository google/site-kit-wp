<?php
/**
 * User_Input_Site_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Core\User_Input
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User_Input;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\User_Input\User_Input_Site_Settings;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

class User_Input_Site_SettingsTest extends SettingsTestCase {

	/**
	 * Options object.
	 *
	 * @var Options
	 */
	private $options;

	public function set_up() {
		parent::set_up();

		$user_id       = $this->factory()->user->create();
		$context       = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options = new Options( $context, $user_id );
	}

	public function test_get_sanitize_callback() {
		$user_input_site_settings = new User_Input_Site_Settings( $this->options );
		$user_input_site_settings->register();

		$this->assertEmpty( $user_input_site_settings->get() );

		// Setting the value to a non-array will result in an empty array.
		$user_input_site_settings->set( false );
		$this->assertEquals( array(), $user_input_site_settings->get() );

		$user_input_site_settings->set( 123 );
		$this->assertEquals( array(), $user_input_site_settings->get() );

		// Setting the value to an array but with non-scoped keys will
		// result in an empty array.
		$user_input_site_settings->set( array( 'goals' => array() ) );
		$this->assertEquals( array(), $user_input_site_settings->get() );

		// Setting the value to an array with scoped keys but a non-array
		// value will result in an empty array.
		$user_input_site_settings->set( array( 'purpose' => 'a' ) );
		$this->assertEquals( array(), $user_input_site_settings->get() );

		// Setting the value to an associative array with scoped keys and array
		// with valid values as the value works as expected.
		$user_input_site_settings->set(
			array(
				'purpose' => array(
					'scope'      => 'site',
					'values'     => array( 'purpose1' ),
					'answeredBy' => 1,
				),
			)
		);
		$this->assertEquals(
			array(
				'purpose' => array(
					'scope'      => 'site',
					'values'     => array( 'purpose1' ),
					'answeredBy' => 1,
				),
			),
			$user_input_site_settings->get()
		);
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return User_Input_Site_Settings::OPTION;
	}
}
