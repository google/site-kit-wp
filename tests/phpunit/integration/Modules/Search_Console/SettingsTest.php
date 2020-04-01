<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Search_Console\SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Search_Console
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Search_Console;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Search_Console\Settings;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Modules
 * @group Search_Console
 */
class SettingsTest extends SettingsTestCase {

	public function test_get_default() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		$this->assertEqualSetsWithIndex(
			array(
				'propertyID' => '',
			),
			get_option( Settings::OPTION )
		);
	}

	public function test_legacy_options() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();
		$legacy_property_id_option = 'googlesitekit_search_console_property';

		// Default uses legacy option as a fallback for property ID.
		$this->assertEquals( '', $settings->get()['propertyID'] );
		update_option( $legacy_property_id_option, 'http://example.com/' );
		$this->assertEquals( 'http://example.com/', $settings->get()['propertyID'] );

		// If propertyID is set, fallback is not used.
		$settings->set( array( 'propertyID' => 'http://sitekit.withgoogle.com/' ) );
		$this->assertEquals( 'http://sitekit.withgoogle.com/', $settings->get()['propertyID'] );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}
}
