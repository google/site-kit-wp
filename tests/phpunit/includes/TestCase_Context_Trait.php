<?php
/**
 * TestCase_Context_Trait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

trait TestCase_Context_Trait {
	/**
	 * Get the current TestCase instance.
	 *
	 * @return TestCase
	 */
	abstract protected function get_testcase();
}
