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

	public function test_case_insensitive_list_sort() {
		// Sorts an array correctly, ordered by the field 'firstname'.
		$this->assertEquals(
			Sort::case_insensitive_list_sort(
				array(
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
				),
				'firstname'
			),
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
			)
		);

		// Sorts an array correctly, ordered by the field 'lastname'.
		$this->assertEquals(
			Sort::case_insensitive_list_sort(
				array(
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
				),
				'lastname'
			),
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
			)
		);
	}
}
