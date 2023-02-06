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

	public function data_lists() {
		$unsorted_array_of_arrays = array(
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

		$unsorted_array_of_objects = array(
			(object) array(
				'firstname' => 'John',
				'lastname'  => 'Doe',
			),
			(object) array(
				'firstname' => 'Harry',
				'lastname'  => 'Smith',
			),
			(object) array(
				'firstname' => 'foo',
				'lastname'  => 'bar',
			),
		);

		return array(
			'sort array of arrays by firstname'  => array(
				$unsorted_array_of_arrays,
				'firstname',
				array(
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
				),
			),
			'sort array of arrays by lastname'   => array(
				$unsorted_array_of_arrays,
				'lastname',
				array(
					array(
						'firstname' => 'foo',
						'lastname'  => 'bar',
					),
					array(
						'firstname' => 'John',
						'lastname'  => 'Doe',
					),
					array(
						'firstname' => 'Harry',
						'lastname'  => 'Smith',
					),
				),
			),
			'sort array of objects by firstname' => array(
				$unsorted_array_of_objects,
				'firstname',
				array(
					(object) array(
						'firstname' => 'foo',
						'lastname'  => 'bar',
					),
					(object) array(
						'firstname' => 'Harry',
						'lastname'  => 'Smith',
					),
					(object) array(
						'firstname' => 'John',
						'lastname'  => 'Doe',
					),
				),
			),
			'sort array of objects by lastname'  => array(
				$unsorted_array_of_objects,
				'lastname',
				array(
					(object) array(
						'firstname' => 'foo',
						'lastname'  => 'bar',
					),
					(object) array(
						'firstname' => 'John',
						'lastname'  => 'Doe',
					),
					(object) array(
						'firstname' => 'Harry',
						'lastname'  => 'Smith',
					),
				),
			),
		);
	}

	/**
	 * @dataProvider data_lists
	 *
	 * @param array  $unsorted_array        The array/list to sort.
	 * @param string $orderby               The field to sort the list by.
	 * @param array  $expected_sorted_array The sorted array.
	 */
	public function test_case_insensitive_list_sort( $unsorted_array, $orderby, $expected_sorted_array ) {
		$this->assertEquals(
			Sort::case_insensitive_list_sort(
				$unsorted_array,
				$orderby
			),
			$expected_sorted_array
		);
	}
}
