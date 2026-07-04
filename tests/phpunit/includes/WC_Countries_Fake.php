<?php
/**
 * WC_Countries_Fake
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

/**
 * Fake WC_Countries class for testing phone normalization.
 */
class WC_Countries_Fake {

	/**
	 * The calling code to return from get_country_calling_code.
	 *
	 * @var string
	 */
	public static $test_calling_code = '';

	/**
	 * Mock method to get country calling code.
	 *
	 * @param string $country Country code.
	 * @return string Calling code.
	 */
	// phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found -- Fake method signature must match WC_Countries.
	public function get_country_calling_code( $country ) {
		return self::$test_calling_code;
	}
}
