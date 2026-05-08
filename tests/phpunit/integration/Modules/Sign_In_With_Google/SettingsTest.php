<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Sign_In_With_Google\SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Sign_In_With_Google;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Modules
 * @group Sign_In_With_Google
 */
class SettingsTest extends SettingsTestCase {

	public function test_get_default() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();
		$default = get_option( Settings::OPTION );

		$this->assertIsArray( $default, 'Default settings should be an array.' );
		$this->assertArrayHasKey( 'clientID', $default, 'Default settings should include clientID.' );
		$this->assertArrayHasKey( 'text', $default, 'Default settings should include text.' );
		$this->assertArrayHasKey( 'theme', $default, 'Default settings should include theme.' );
		$this->assertArrayHasKey( 'shape', $default, 'Default settings should include shape.' );
		$this->assertArrayHasKey( 'oneTapEnabled', $default, 'Default settings should include oneTapEnabled.' );

		$this->assertSame( '', $default['clientID'], 'Default clientID should be empty.' );
		$this->assertSame( Settings::TEXT_SIGN_IN_WITH_GOOGLE['value'], $default['text'], 'Default text should be Sign in with Google.' );
		$this->assertSame( Settings::THEME_LIGHT['value'], $default['theme'], 'Default theme should be Light.' );
		$this->assertSame( Settings::SHAPE_RECTANGULAR['value'], $default['shape'], 'Default shape should be Rectangular.' );
		$this->assertSame( false, $default['oneTapEnabled'], 'Default oneTapEnabled should be false.' );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}

	/**
	 * @dataProvider data_value_label_map
	 *
	 * @param array  $args     Arguments to pass to the pointer constructor.
	 * @param bool   $expected Whether the check is expected to evaluate to true or false.
	 */
	public function test_get_label( $setting_name, $value, $label ) {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$this->assertEquals( $label, $settings->get_label( $setting_name, $value ), 'Label for setting should match expected.' );
	}

	public function data_value_label_map() {
		return array(
			array( 'invalid-setting', 'continue_with', '' ),
			array( null, 'continue_with', '' ),
			array( 'text', 'invalid-value', '' ),
			array( 'text', null, '' ),
			array( 'text', 'continue_with', 'Continue with Google' ),
			array( 'text', 'signin', 'Sign in' ),
			array( 'text', 'signin_with', 'Sign in with Google' ),
			array( 'text', 'signup_with', 'Sign up with Google' ),
			array( 'theme', 'outline', 'Light' ),
			array( 'theme', 'filled_blue', 'Neutral' ),
			array( 'theme', 'filled_black', 'Dark' ),
			array( 'shape', 'rectangular', 'Rectangular' ),
			array( 'shape', 'pill', 'Pill' ),
		);
	}
}
