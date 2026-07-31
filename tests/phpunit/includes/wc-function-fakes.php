<?php
/**
 * WooCommerce function fakes.
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

if ( ! function_exists( 'wc_get_page_permalink' ) ) {
	/**
	 * Fake `wc_get_page_permalink()` for tests exercising WooCommerce-aware
	 * code without the WooCommerce plugin loaded.
	 *
	 * @param string $page WooCommerce page slug, e.g. 'myaccount'.
	 * @return string Fake permalink for the given page slug.
	 */
	function wc_get_page_permalink( $page ) {
		return home_url( '/' . $page . '/' );
	}
}
