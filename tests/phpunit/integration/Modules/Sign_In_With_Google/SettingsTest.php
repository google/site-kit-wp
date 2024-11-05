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

		$this->assertIsArray( $default );
		$this->assertArrayHasKey( 'clientID', $default );
		$this->assertArrayHasKey( 'text', $default );
		$this->assertArrayHasKey( 'theme', $default );
		$this->assertArrayHasKey( 'shape', $default );
		$this->assertArrayHasKey( 'oneTapEnabled', $default );

		$this->assertSame( '', $default['clientID'] );
		$this->assertSame( Settings::TEXT_SIGN_IN_WITH_GOOGLE, $default['text'] );
		$this->assertSame( Settings::THEME_LIGHT['value'], $default['theme'] );
		$this->assertSame( Settings::SHAPE_RECTANGULAR, $default['shape'] );
		$this->assertSame( false, $default['oneTapEnabled'] );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}
}
