<?php
/**
 * Module_Sharing_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

class Module_Sharing_SettingsTest extends SettingsTestCase {

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Module_Sharing_Settings::OPTION;
	}

	public function test_get_default() {
		$settings = new Module_Sharing_Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		$this->assertEmpty(
			get_option( Module_Sharing_Settings::OPTION )
		);
	}

	public function test_get_sanitize_callback() {
		$settings = new Module_Sharing_Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		// Test invalid sharedRoles.
		$test_sharing_settings = array(
			'analytics'          => array(
				'sharedRoles' => array( 'invalidrole', 'editor' ),
				'management'  => 'owner',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => 'invalidrole',
				'management'  => 'all_admins',
			),
		);
		$expected              = array(
			'analytics'          => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array(),
				'management'  => 'all_admins',
			),
		);
		$settings->set( $test_sharing_settings );
		$this->assertEquals( $expected, get_option( Module_Sharing_Settings::OPTION ) );
	}



}
