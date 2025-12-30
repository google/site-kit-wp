<?php
/**
 * Class Google\Site_Kit\Tests\Core\User\Initial_Setup_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Core\User
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Initial_Setup_Settings;
use Google\Site_Kit\Tests\TestCase;

class Initial_Setup_SettingsTest extends TestCase {

	/**
	 * Initial_Setup_Settings instance.
	 *
	 * @var Initial_Setup_Settings
	 */
	private $initial_setup_settings;

	public function set_up() {
		parent::set_up();

		$user_id      = $this->factory()->user->create();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );
		$meta_key     = $user_options->get_meta_key( Initial_Setup_Settings::OPTION );

		unregister_meta_key( 'user', $meta_key );
		remove_all_filters( "sanitize_user_meta_{$meta_key}" );

		$this->initial_setup_settings = new Initial_Setup_Settings( $user_options );

		$this->initial_setup_settings->register();
	}

	public function test_get_default() {
		$this->assertEquals(
			array(
				'isAnalyticsSetupComplete' => null,
			),
			$this->initial_setup_settings->get(),
			'Expected initial setup settings to return default values when no user meta exists'
		);
	}

	public function data_initial_setup_settings() {
		return array(
			'empty by default'   => array(
				null,
				array(),
			),
			'non-array bool'     => array(
				false,
				array(),
			),
			'non-array int'      => array(
				123,
				array(),
			),
			'boolean true flag'  => array(
				array( 'isAnalyticsSetupComplete' => true ),
				array( 'isAnalyticsSetupComplete' => true ),
			),
			'boolean false flag' => array(
				array( 'isAnalyticsSetupComplete' => false ),
				array( 'isAnalyticsSetupComplete' => false ),
			),
			'string flag'        => array(
				array( 'isAnalyticsSetupComplete' => 'some string' ),
				array( 'isAnalyticsSetupComplete' => true ),
			),
			'string zero flag'   => array(
				array( 'isAnalyticsSetupComplete' => '0' ),
				array( 'isAnalyticsSetupComplete' => false ),
			),
		);
	}

	/**
	 * @dataProvider data_initial_setup_settings
	 *
	 * @param mixed $input    Values to pass to the `set()` method.
	 * @param array $expected The expected sanitized array.
	 */
	public function test_get_sanitize_callback( $input, $expected ) {
		$this->initial_setup_settings->set( $input );

		$this->assertEquals(
			$expected,
			$this->initial_setup_settings->get(),
			'Initial setup settings should be sanitized correctly'
		);
	}

	public function test_merge() {
		$this->initial_setup_settings->merge( array( 'isAnalyticsSetupComplete' => 1 ) );
		$this->assertEqualSetsWithIndex(
			array( 'isAnalyticsSetupComplete' => true ),
			$this->initial_setup_settings->get(),
			'Expected merge to coerce truthy values to boolean true'
		);

		$this->initial_setup_settings->merge( array( 'test_key' => 'test_value' ) );
		$this->assertEqualSetsWithIndex(
			array( 'isAnalyticsSetupComplete' => true ),
			$this->initial_setup_settings->get(),
			'Expected merge to ignore unsupported settings keys'
		);

		$this->initial_setup_settings->merge( array( 'isAnalyticsSetupComplete' => false ) );
		$this->assertEqualSetsWithIndex(
			array( 'isAnalyticsSetupComplete' => false ),
			$this->initial_setup_settings->get(),
			'Expected merge to update the analytics setup completion flag'
		);

		$this->initial_setup_settings->merge( array( 'isAnalyticsSetupComplete' => null ) );
		$this->assertEqualSetsWithIndex(
			array( 'isAnalyticsSetupComplete' => false ),
			$this->initial_setup_settings->get(),
			'Expected merge to ignore null values when updating settings'
		);
	}
}
