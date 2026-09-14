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
	 * Fakes `wc_get_price_decimals()` for a test that runs WooCommerce-aware code
	 * with the WooCommerce plugin inactive.
	 *
	 * Like the real function, it reads the `woocommerce_price_num_decimals`
	 * option and runs the `wc_get_price_decimals` filter. A test can set either
	 * one.
	 *
	 * @since 1.187.0
	 *
	 * @return int The store's decimal places, `2` until a test changes them.
	 */
	function wc_get_price_decimals() {
		return absint( apply_filters( 'wc_get_price_decimals', get_option( 'woocommerce_price_num_decimals', 2 ) ) );
	}
}

if ( ! function_exists( 'wc_format_decimal' ) ) {
	/**
	 * Fakes `wc_format_decimal()` for a test that runs WooCommerce-aware code
	 * with the WooCommerce plugin inactive.
	 *
	 * It hands the price back untouched, because every test passes a plain number
	 * such as `12.3456`. The real function also removes the thousand separator
	 * and rewrites the decimal separator for the store's locale.
	 *
	 * @since 1.187.0
	 *
	 * @param mixed $number The price, as a float or a string, such as `12.3456` or `'20.00'`.
	 * @return string The same price, as a string.
	 */
	function wc_format_decimal( $number ) {
		return (string) $number;
	}
}

if ( ! function_exists( 'get_woocommerce_currency' ) ) {
	/**
	 * Fakes `get_woocommerce_currency()` for a test that runs WooCommerce-aware
	 * code with the WooCommerce plugin inactive.
	 *
	 * Like the real function, it reads the `woocommerce_currency` option and runs
	 * the `woocommerce_currency` filter. A test can set either one.
	 *
	 * @since 1.187.0
	 *
	 * @return string The store's currency code, `USD` until a test changes it.
	 */
	function get_woocommerce_currency() {
		return apply_filters( 'woocommerce_currency', get_option( 'woocommerce_currency', 'USD' ) );
	}
}

if ( ! function_exists( 'is_wc_endpoint_url' ) ) {
	/**
	 * Fakes `is_wc_endpoint_url()` for a test that runs WooCommerce-aware code
	 * with the WooCommerce plugin inactive.
	 *
	 * The real function reads the query vars WooCommerce registers for the cart
	 * page, the checkout page, and the account pages. WooCommerce registers none
	 * of them here, so this fake reports every page as no endpoint. A test that
	 * needs one of those pages has to replace this fake.
	 *
	 * @since 1.187.0
	 *
	 * @param string|false $endpoint The endpoint to look for, such as `order-received`. This fake ignores it.
	 * @return bool Always `false`.
	 */
	// phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found -- The argument matches the WooCommerce signature, and the fake never reads it.
	function is_wc_endpoint_url( $endpoint = false ) {
		return false;
	}
}
