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

if ( ! function_exists( 'wc_get_price_decimals' ) ) {
	/**
	 * Fakes `wc_get_price_decimals()` so a test can run WooCommerce-aware code
	 * with the plugin inactive.
	 *
	 * It reads the `woocommerce_price_num_decimals` option and runs the
	 * `wc_get_price_decimals` filter, the same as the real function, so a test
	 * can set either one.
	 *
	 * @since n.e.x.t
	 *
	 * @return int The store's decimal places, `2` unless a test overrides them.
	 */
	function wc_get_price_decimals() {
		return absint( apply_filters( 'wc_get_price_decimals', get_option( 'woocommerce_price_num_decimals', 2 ) ) );
	}
}

if ( ! function_exists( 'wc_format_decimal' ) ) {
	/**
	 * Fakes `wc_format_decimal()` so a test can run WooCommerce-aware code with
	 * the plugin inactive.
	 *
	 * It returns the price unchanged, because every test passes one that already
	 * reads as a plain number, such as `12.3456`. The real function also strips
	 * the thousand separator and rewrites the decimal separator for the store's
	 * locale.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $number The price, as a float or a string, such as `12.3456` or `'20.00'`.
	 * @return string The same price, as a string and otherwise untouched.
	 */
	function wc_format_decimal( $number ) {
		return (string) $number;
	}
}

if ( ! function_exists( 'get_woocommerce_currency' ) ) {
	/**
	 * Fakes `get_woocommerce_currency()` so a test can run WooCommerce-aware
	 * code with the plugin inactive.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The store's currency code, `USD` unless a test overrides it.
	 */
	function get_woocommerce_currency() {
		return apply_filters( 'woocommerce_currency', get_option( 'woocommerce_currency', 'USD' ) );
	}
}

if ( ! function_exists( 'is_wc_endpoint_url' ) ) {
	/**
	 * Fakes `is_wc_endpoint_url()` so a test can run WooCommerce-aware code with
	 * the plugin inactive.
	 *
	 * It always reports no endpoint, because WooCommerce isn't loaded and
	 * registers none. The real function reads the query vars WooCommerce
	 * registers for the cart, the checkout, and the account screens, so a test
	 * that needs one of those screens has to replace the fake.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool WooCommerce registers no endpoint here, so this is always `false`.
	 */
	function is_wc_endpoint_url() {
		return false;
	}
}
