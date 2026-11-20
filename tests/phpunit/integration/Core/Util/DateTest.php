<?php
/**
 * DateTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Date;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class DateTest extends TestCase {

	public function test_is_valid_date__accepts_a_real_day() {
		$this->assertTrue( Date::is_valid_date( '2026-02-28' ), 'A real day written as YYYY-MM-DD should be valid.' );
	}

	/**
	 * @dataProvider data_invalid_dates
	 *
	 * @param mixed $value The value to check.
	 */
	public function test_is_valid_date__refuses_a_value_that_is_not_a_real_day( $value ) {
		$this->assertFalse( Date::is_valid_date( $value ), 'A value that is not a real day written as YYYY-MM-DD should be invalid.' );
	}

	public function data_invalid_dates() {
		return array(
			'a month and a day that do not exist' => array( '2026-13-45' ),
			'a day the month does not have'       => array( '2026-02-30' ),
			'a trailing newline'                  => array( "2026-02-28\n" ),
			'a day without leading zeros'         => array( '2026-2-28' ),
			'a value that is not a string'        => array( 20260228 ),
		);
	}
}
