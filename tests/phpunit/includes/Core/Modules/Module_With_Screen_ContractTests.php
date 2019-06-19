<?php
/**
 * Module_With_Screen_ContractTests
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Core\Admin\Screens;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Screen;
use Google\Site_Kit\Tests\TestCase_Context_Trait;

trait Module_With_Screen_ContractTests {

	use TestCase_Context_Trait;

	/**
	 * @return Module|Module_With_Screen
	 */
	abstract protected function get_module_with_screen();

	/**
	 * @group Admin
	 */
	public function test_get_screen() {
		$testcase = $this->get_testcase();
		$module   = $this->get_module_with_screen();

		$screen = $module->get_screen();

		$testcase->assertInstanceOf( 'Google\Site_Kit\Core\Admin\Screen', $screen );
		$testcase->assertEquals( Screens::PREFIX . 'module-' . $module->slug, $screen->get_slug() );
	}
}
