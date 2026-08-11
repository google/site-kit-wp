<?php
/**
 * A fake of the Ninja Forms plugin's global `Ninja_Forms()` function.
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

if ( ! function_exists( 'Ninja_Forms' ) ) {
	/**
	 * Returns the single `Ninja_Forms_Fake` instance.
	 *
	 * @since n.e.x.t
	 *
	 * @return \Google\Site_Kit\Tests\Ninja_Forms_Fake The Ninja Forms plugin fake.
	 */
	function Ninja_Forms() {
		return \Google\Site_Kit\Tests\Ninja_Forms_Fake::instance();
	}
}
