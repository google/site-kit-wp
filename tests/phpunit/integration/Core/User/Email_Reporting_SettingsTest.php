<?php
/**
 * Class Google\Site_Kit\Tests\Core\User\Email_Reporting_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Core\User
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;

class Email_Reporting_SettingsTest extends TestCase {

	/**
	 * Email_Reporting_Settings instance.
	 *
	 * @var Email_Reporting_Settings
	 */
	private $settings;

	public function set_up() {
		parent::set_up();
		$user_id      = $this->factory()->user->create();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );
		$meta_key     = $user_options->get_meta_key( Email_Reporting_Settings::OPTION );

		unregister_meta_key( 'user', $meta_key );
		// Needed to unregister the instance registered during plugin bootstrap.
		remove_all_filters( "sanitize_user_meta_{$meta_key}" );

		$this->settings = new Email_Reporting_Settings( $user_options );

		$this->settings->register();
	}

	public function test_get_default() {
		$this->assertEquals(
			array(
				'subscribed' => false,
				'frequency'  => Email_Reporting_Settings::FREQUENCY_WEEKLY,
			),
			$this->settings->get(),
			'Default settings should be unsubscribed with weekly frequency'
		);
	}

	public function test_merge__with_valid_settings() {
		// Test merging subscribed setting.
		$this->assertTrue( $this->settings->merge( array( 'subscribed' => true ) ), 'Merging subscribed setting should return true' );
		$this->assertEquals(
			array(
				'subscribed' => true,
				'frequency'  => Email_Reporting_Settings::FREQUENCY_WEEKLY,
			),
			$this->settings->get(),
			'Subscribed setting should be updated to true'
		);

		// Test merging frequency setting.
		$this->assertTrue( $this->settings->merge( array( 'frequency' => Email_Reporting_Settings::FREQUENCY_MONTHLY ) ), 'Merging frequency setting should return true' );
		$this->assertEquals(
			array(
				'subscribed' => true,
				'frequency'  => Email_Reporting_Settings::FREQUENCY_MONTHLY,
			),
			$this->settings->get(),
			'Frequency setting should be updated to monthly'
		);

		// Test merging both settings.
		$this->assertTrue(
			$this->settings->merge(
				array(
					'subscribed' => false,
					'frequency'  => Email_Reporting_Settings::FREQUENCY_QUARTERLY,
				)
			),
			'Merging all settings should work/return true'
		);
		$this->assertEquals(
			array(
				'subscribed' => false,
				'frequency'  => Email_Reporting_Settings::FREQUENCY_QUARTERLY,
			),
			$this->settings->get(),
			'All settings should be updated to their new values'
		);
	}

	public function test_merge__filters_null_values() {
		$this->assertTrue(
			$this->settings->merge(
				array(
					'subscribed' => null,
					'frequency'  => Email_Reporting_Settings::FREQUENCY_MONTHLY,
				)
			),
			'Merging with null value should return true'
		);
		$this->assertEquals(
			array(
				'subscribed' => false,
				'frequency'  => Email_Reporting_Settings::FREQUENCY_MONTHLY,
			),
			$this->settings->get(),
			'null values should be ignored and original settings preserved'
		);
	}

	public function test_merge__ignores_invalid_keys() {
		$this->assertTrue(
			$this->settings->merge(
				array(
					'invalid_key' => 'value',
					'frequency'   => Email_Reporting_Settings::FREQUENCY_MONTHLY,
				)
			),
			'Merging with invalid key should return true'
		);
		$this->assertEquals(
			array(
				'subscribed' => false,
				'frequency'  => Email_Reporting_Settings::FREQUENCY_MONTHLY,
			),
			$this->settings->get(),
			'Invalid keys should be ignored and original settings preserved'
		);
	}

	/**
	 * @dataProvider data_sanitize_settings
	 *
	 * @param mixed $input    Values to pass to the `set()` method.
	 * @param array $expected The expected sanitized array.
	 */
	public function test_get_sanitize_callback( $input, $expected ) {
		$this->settings->set( $input );
		$this->assertEquals( $expected, $this->settings->get(), 'Settings should be sanitized correctly' );
	}

	public function data_sanitize_settings() {
		return array(
			'empty by default'                     => array(
				null,
				array(),
			),
			'non-array - bool'                     => array(
				false,
				array(),
			),
			'non-array - int'                      => array(
				123,
				array(),
			),
			'non-array - string'                   => array(
				'string',
				array(),
			),
			'subscribed as boolean true'           => array(
				array( 'subscribed' => true ),
				array( 'subscribed' => true ),
			),
			'subscribed as boolean false'          => array(
				array( 'subscribed' => false ),
				array( 'subscribed' => false ),
			),
			'subscribed as string "1"'             => array(
				array( 'subscribed' => '1' ),
				array( 'subscribed' => true ),
			),
			'subscribed as string "0"'             => array(
				array( 'subscribed' => '0' ),
				array( 'subscribed' => false ),
			),
			'subscribed as int 1'                  => array(
				array( 'subscribed' => 1 ),
				array( 'subscribed' => true ),
			),
			'subscribed as int 0'                  => array(
				array( 'subscribed' => 0 ),
				array( 'subscribed' => false ),
			),
			'frequency as valid weekly'            => array(
				array( 'frequency' => Email_Reporting_Settings::FREQUENCY_WEEKLY ),
				array( 'frequency' => Email_Reporting_Settings::FREQUENCY_WEEKLY ),
			),
			'frequency as valid monthly'           => array(
				array( 'frequency' => Email_Reporting_Settings::FREQUENCY_MONTHLY ),
				array( 'frequency' => Email_Reporting_Settings::FREQUENCY_MONTHLY ),
			),
			'frequency as valid quarterly'         => array(
				array( 'frequency' => Email_Reporting_Settings::FREQUENCY_QUARTERLY ),
				array( 'frequency' => Email_Reporting_Settings::FREQUENCY_QUARTERLY ),
			),
			'frequency as invalid string'          => array(
				array( 'frequency' => 'invalid' ),
				array( 'frequency' => Email_Reporting_Settings::FREQUENCY_WEEKLY ),
			),
			'frequency as number'                  => array(
				array( 'frequency' => 123 ),
				array( 'frequency' => Email_Reporting_Settings::FREQUENCY_WEEKLY ),
			),
			'frequency as boolean'                 => array(
				array( 'frequency' => true ),
				array( 'frequency' => Email_Reporting_Settings::FREQUENCY_WEEKLY ),
			),
			'frequency as array'                   => array(
				array( 'frequency' => array() ),
				array( 'frequency' => Email_Reporting_Settings::FREQUENCY_WEEKLY ),
			),
			'both settings valid'                  => array(
				array(
					'subscribed' => true,
					'frequency'  => Email_Reporting_Settings::FREQUENCY_MONTHLY,
				),
				array(
					'subscribed' => true,
					'frequency'  => Email_Reporting_Settings::FREQUENCY_MONTHLY,
				),
			),
			'both settings with invalid frequency' => array(
				array(
					'subscribed' => true,
					'frequency'  => 'invalid',
				),
				array(
					'subscribed' => true,
					'frequency'  => Email_Reporting_Settings::FREQUENCY_WEEKLY,
				),
			),
			'extra keys ignored'                   => array(
				array(
					'subscribed' => true,
					'frequency'  => Email_Reporting_Settings::FREQUENCY_MONTHLY,
					'extra'      => 'ignored',
				),
				array(
					'subscribed' => true,
					'frequency'  => Email_Reporting_Settings::FREQUENCY_MONTHLY,
				),
			),
		);
	}

	public function test_is_user_subscribed() {
		// Test default value.
		$this->assertFalse( $this->settings->is_user_subscribed(), 'User should not be subscribed by default' );

		// Test when user is subscribed.
		$this->settings->merge( array( 'subscribed' => true ) );
		$this->assertTrue( $this->settings->is_user_subscribed(), 'User should be subscribed after setting "subscribed" to true' );

		// Test when user is unsubscribed.
		$this->settings->merge( array( 'subscribed' => false ) );
		$this->assertFalse( $this->settings->is_user_subscribed(), 'Previously-subscribed user should not be subscribed after setting "subscribed" to false' );
	}
}
