<?php
/**
 * WooCommerce function stubs for tests.
 *
 * Defines the small subset of WooCommerce global-namespace functions used by
 * the Site Kit conversion-event provider so the provider can be exercised in
 * test environments without a fully active WooCommerce plugin.
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

if ( ! function_exists( 'wc_get_price_decimals' ) ) {
	/**
	 * Stub of the WooCommerce helper.
	 *
	 * Reads from the `woocommerce_price_decimals` option, falling back to 2
	 * to mirror the WooCommerce default.
	 *
	 * @return int Number of decimal places used by the store currency.
	 */
	function wc_get_price_decimals() {
		return (int) get_option( 'woocommerce_price_decimals', 2 );
	}
}

if ( ! function_exists( 'wc_format_decimal' ) ) {
	/**
	 * Stub of the WooCommerce helper.
	 *
	 * Strips everything except digits and the decimal point.
	 *
	 * @param mixed $value Value to normalize.
	 * @return string|float Normalized numeric value.
	 */
	function wc_format_decimal( $value ) {
		if ( is_string( $value ) ) {
			return preg_replace( '/[^0-9.]/', '', $value );
		}
		return $value;
	}
}

if ( ! function_exists( 'get_woocommerce_currency' ) ) {
	/**
	 * Stub of the WooCommerce helper.
	 *
	 * Returns the currency code stored on the `woocommerce_currency` option,
	 * defaulting to USD.
	 *
	 * @return string Currency code.
	 */
	function get_woocommerce_currency() {
		return (string) get_option( 'woocommerce_currency', 'USD' );
	}
}

if ( ! function_exists( 'is_wc_endpoint_url' ) ) {
	/**
	 * Stub of the WooCommerce helper.
	 *
	 * @param string|false $endpoint Optional endpoint to check for. Unused in tests.
	 * @return bool Always false; the test never runs on a real WC endpoint URL.
	 */
	function is_wc_endpoint_url( $endpoint = false ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
		return false;
	}
}
