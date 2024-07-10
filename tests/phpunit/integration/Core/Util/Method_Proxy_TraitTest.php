<?php
/**
 * Method_Proxy_TraitTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Tests\TestCase;

/**
 * Class Method_Proxy_TraitTest
 *
 * @group Util
 */
class Method_Proxy_TraitTest extends TestCase {

	use Method_Proxy_Trait;

	private $calls;

	public function test_method_proxy() {
		$this->calls = 0;
		$callback    = $this->get_method_proxy( 'hidden_function' );

		$callback();
		$callback();

		$this->assertEquals( 2, $this->calls );
	}

	public function test_method_proxy_once() {
		$this->calls = 0;
		$callback    = $this->get_method_proxy_once( 'hidden_function' );

		$callback();
		$callback();

		$this->assertEquals( 1, $this->calls );
	}

	private function hidden_function() {
		++$this->calls;
	}
}
