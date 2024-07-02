<?php
/**
 * SanitizeTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Sanitize;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class SanitizeTest extends TestCase {

	/**
	 * @dataProvider data_lists
	 */
	public function test_sanitize_string_list( $data_list, $expected ) {
		$this->assertEquals(
			$expected,
			Sanitize::sanitize_string_list( $data_list )
		);
	}

	public function data_lists() {
		return array(
			'List with arrays, null values, boolean values, empty and non-empty strings' => array(
				array(
					'',
					'non-empty-string',
					true,
					false,
					null,
					array( 'edit' ),
				),
				array(
					'non-empty-string',
				),
			),
			'Empty list'                  => array(
				array(),
				array(),
			),
			'Empty list with null value'  => array(
				array( null ),
				array(),
			),
			'List with all valid strings' => array(
				array( 'valid-string-1', 'valid-string-2', 'valid-string-3' ),
				array( 'valid-string-1', 'valid-string-2', 'valid-string-3' ),
			),
		);
	}
}
