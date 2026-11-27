<?php
/**
 * A fake of PHP-FPM's global `fastcgi_finish_request()` function.
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

if ( ! function_exists( 'fastcgi_finish_request' ) ) {
	$GLOBALS['googlesitekit_finish_request_calls'] = array();

	/**
	 * Reports the response as finished, as PHP-FPM does.
	 *
	 * It adds its name to `$GLOBALS['googlesitekit_finish_request_calls']` at each call.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool Always true.
	 */
	function fastcgi_finish_request() {
		$GLOBALS['googlesitekit_finish_request_calls'][] = __FUNCTION__;

		return true;
	}
}
