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
	 * Sample unsorted array.
	 * @var array
	 */
	private static $unsorted_array = array(
		array(
			'firstname' => 'John',
			'lastname'  => 'Doe',
		),
		array(
			'firstname' => 'Harry',
			'lastname'  => 'Smith',
		),
		array(
			'firstname' => 'foo',
			'lastname'  => 'bar',
		),
	);

	/**
	 * Array sorted, ordered by 'firstname` in 'ASC' order.
	 * @var array
	 */
	private static $sorted_array_firstname_asc = array(
		array(
			'firstname' => 'foo',
			'lastname'  => 'bar',
		),
		array(
			'firstname' => 'Harry',
			'lastname'  => 'Smith',
		),
		array(
			'firstname' => 'John',
			'lastname'  => 'Doe',
		),
	);

	/**
	 * Array sorted, ordered by 'lastname` in 'DESC' order.
	 * @var array
	 */
	private static $sorted_array_lastname_desc = array(
		array(
			'firstname' => 'Harry',
			'lastname'  => 'Smith',
		),
		array(
			'firstname' => 'John',
			'lastname'  => 'Doe',
		),
		array(
			'firstname' => 'foo',
			'lastname'  => 'bar',
		),
	);

	public function test_case_insensitive_list_sort() {
		// Sorts array correctly, ordered by 'firstname` in 'ASC' order.
		$this->assertEquals(
			Sort::case_insensitive_list_sort( static::$unsorted_array, 'firstname', 'ASC' ),
			static::$sorted_array_firstname_asc
		);

		// Sorts array correctly, ordered by 'lastname` in 'DESC' order.
		$this->assertEquals(
			Sort::case_insensitive_list_sort( static::$unsorted_array, 'lastname', 'DESC' ),
			static::$sorted_array_lastname_desc
		);
	}
}
