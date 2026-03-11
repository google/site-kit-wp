<?php
/**
 * BC_FunctionsTest.
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class BC_FunctionsTest extends TestCase {
	public function test_array_is_list() {
		$this->assertTrue(
			BC_Functions::array_is_list( array() ),
			'An empty array should be considered a list.'
		);

		$this->assertTrue(
			BC_Functions::array_is_list(
				array(
					0 => 'a',
					1 => 'b',
				)
			),
			'An indexed array should be considered a list.'
		);

		$this->assertFalse(
			BC_Functions::array_is_list( array( 'a' => 'b' ) ),
			'An associative array should not be considered a list.'
		);
	}
}
