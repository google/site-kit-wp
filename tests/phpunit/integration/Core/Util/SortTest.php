<?php
/**
 * SortTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Sort;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class SortTest extends TestCase {

	/**
	 * Asset arguments.
	 * @var array
	 */
	protected $unsorted_array = array(
		array(
			'firstname' => 'John',
			'lastname'  => 'Doe',
		),
	);

	public function test_case_insensitive_list_sort() {

	}
}
