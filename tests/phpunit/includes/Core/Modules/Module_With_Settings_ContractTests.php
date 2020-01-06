<?php
/**
 * Module_With_Setting_ContractTests
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Tests\TestCase_Context_Trait;

trait Module_With_Settings_ContractTests {

	use TestCase_Context_Trait;

	/**
	 * @return Module_With_Settings
	 */
	abstract protected function get_module_with_settings();

	public function test_get_setting() {
		$testcase = $this->get_testcase();
		$module   = $this->get_module_with_settings();
		$settings = $module->get_settings();

		$testcase->assertInstanceOf( 'Google\\Site_Kit\\Core\\Storage\\Setting', $settings );

		$testcase->assertEquals(
			"googlesitekit_{$module->slug}_settings",
			constant( get_class( $settings ) . '::OPTION' )
		);
	}

	public function test_setting_registration() {
		$testcase    = $this->get_testcase();
		$settings    = $this->get_module_with_settings()->get_settings();
		$option_name = constant( get_class( $settings ) . '::OPTION' );
		unregister_setting( $option_name, $option_name );

		$testcase->assertSettingNotRegistered( $option_name );

		$settings->register();

		$testcase->assertSettingRegistered( $option_name );
	}
}
