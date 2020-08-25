<?php
/**
 * Module_With_Owner_ContractTests
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Tests\TestCase_Context_Trait;

trait Module_With_Owner_ContractTests {

	use TestCase_Context_Trait;

	/**
	 * @return Module_With_Owner
	 */
	abstract protected function get_module_with_owner();

	public function test_owner_id() {
		$testcase = $this->get_testcase();
		$module   = $this->get_module_with_owner();

		// By default ownerID is 0.
		$testcase->assertEquals( 0, $module->get_owner_id() );
	}
}
