<?php
/**
 * Class Google\Site_Kit\Core\Util\BC_Functions
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use BadMethodCallException;
use WP_REST_Request;

/**
 * Class for providing backwards compatible core functions, without polyfilling.
 *
 * @since 1.7.0
 * @access private
 * @ignore
 */
class BC_Functions {

	/**
	 * Proxies calls to global functions, while falling back to the internal method by the same name.
	 *
	 * @since 1.7.0
	 *
	 * @param string $function_name Function name to call.
	 * @param array  $arguments     Arguments passed to function.
	 * @return mixed
	 * @throws BadMethodCallException Thrown if no method exists by the same name as the function.
	 */
	public static function __callStatic( $function_name, $arguments ) {
		if ( function_exists( $function_name ) ) {
			return call_user_func_array( $function_name, $arguments );
		}

		if ( method_exists( __CLASS__, $function_name ) ) {
			return self::{ $function_name }( ...$arguments );
		}

		throw new BadMethodCallException( "$function_name does not exist." );
	}

	/**
	 * Append result of internal request to REST API for purpose of preloading data to be attached to a page.
	 * Expected to be called in the context of `array_reduce`.
	 *
	 * @since 1.7.0
	 * @since WP 5.0.0
	 *
	 * @param  array  $memo Reduce accumulator.
	 * @param  string $path REST API path to preload.
	 * @return array        Modified reduce accumulator.
	 */
	protected static function rest_preload_api_request( $memo, $path ) {
		// array_reduce() doesn't support passing an array in PHP 5.2, so we need to make sure we start with one.
		if ( ! is_array( $memo ) ) {
			$memo = array();
		}

		if ( empty( $path ) ) {
			return $memo;
		}

		$method = 'GET';
		if ( is_array( $path ) && 2 === count( $path ) ) {
			$method = end( $path );
			$path   = reset( $path );

			if ( ! in_array( $method, array( 'GET', 'OPTIONS' ), true ) ) {
				$method = 'GET';
			}
		}

		$path_parts = parse_url( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url
		if ( false === $path_parts ) {
			return $memo;
		}

		$request = new WP_REST_Request( $method, $path_parts['path'] );
		if ( ! empty( $path_parts['query'] ) ) {
			parse_str( $path_parts['query'], $query_params );
			$request->set_query_params( $query_params );
		}

		$response = rest_do_request( $request );
		if ( 200 === $response->status ) {
			$server = rest_get_server();
			$data   = (array) $response->get_data();
			$links  = $server::get_compact_response_links( $response );
			if ( ! empty( $links ) ) {
				$data['_links'] = $links;
			}

			if ( 'OPTIONS' === $method ) {
				$response = rest_send_allow_header( $response, $server, $request );

				$memo[ $method ][ $path ] = array(
					'body'    => $data,
					'headers' => $response->headers,
				);
			} else {
				$memo[ $path ] = array(
					'body'    => $data,
					'headers' => $response->headers,
				);
			}
		}

		return $memo;
	}

	/**
	 * A fallback for the load_script_textdomain function introduced in the WordPress version 5.0.0.
	 *
	 * @since 1.21.0
	 *
	 * @return boolean Always returns FALSE.
	 */
	protected static function load_script_textdomain() {
		return false;
	}

}
