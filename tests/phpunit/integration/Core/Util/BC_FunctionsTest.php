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

	public function test_wp_timezone_string_returns_timezone_string_option() {
		$original_timezone_string = get_option( 'timezone_string' );
		$original_gmt_offset      = get_option( 'gmt_offset' );

		update_option( 'timezone_string', 'Europe/Belgrade' );
		update_option( 'gmt_offset', 0 );

		try {
			$this->assertSame(
				'Europe/Belgrade',
				BC_Functions::wp_timezone_string(),
				'Expected wp_timezone_string to return the configured timezone string option.'
			);
		} finally {
			update_option( 'timezone_string', $original_timezone_string );
			update_option( 'gmt_offset', $original_gmt_offset );
		}
	}

	public function test_wp_timezone_string_returns_offset_when_timezone_string_is_empty() {
		$original_timezone_string = get_option( 'timezone_string' );
		$original_gmt_offset      = get_option( 'gmt_offset' );

		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', -5.5 );

		try {
			$this->assertSame(
				'-05:30',
				BC_Functions::wp_timezone_string(),
				'Expected wp_timezone_string to return a ±HH:MM offset when timezone string is not set.'
			);
		} finally {
			update_option( 'timezone_string', $original_timezone_string );
			update_option( 'gmt_offset', $original_gmt_offset );
		}
	}

	public function test_wp_timezone_returns_datetimezone_instance_matching_site_timezone() {
		$original_timezone_string = get_option( 'timezone_string' );
		$original_gmt_offset      = get_option( 'gmt_offset' );

		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', 5.75 );

		try {
			$timezone = BC_Functions::wp_timezone();

			$this->assertInstanceOf(
				\DateTimeZone::class,
				$timezone,
				'Expected wp_timezone to return a DateTimeZone instance.'
			);

			$this->assertSame(
				'+05:45',
				$timezone->getName(),
				'Expected wp_timezone to match the site configured timezone string/offset.'
			);
		} finally {
			update_option( 'timezone_string', $original_timezone_string );
			update_option( 'gmt_offset', $original_gmt_offset );
		}
	}
}
