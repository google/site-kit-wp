<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Compatibility_Checks\Conflicting_Plugins_CheckTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Compatibility_Checks
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Compatibility_Checks;

use Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks\Conflicting_Plugins_Check;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Sign_In_With_Google
 * @group Compatibility_Checks
 */
class Conflicting_Plugins_CheckTest extends TestCase {

	private $check;

	public function set_up() {
		parent::set_up();

		$this->check = new Conflicting_Plugins_Check();
	}

	public function test_get_slug() {
		$this->assertEquals( 'conflicting_plugins', $this->check->get_slug(), 'Expected correct slug to be returned' );
	}
}
