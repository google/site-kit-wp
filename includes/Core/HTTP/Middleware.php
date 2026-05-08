<?php
/**
 * Class Google\Site_Kit\Core\HTTP\Middleware
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\HTTP;

use Google\Site_Kit_Dependencies\GuzzleHttp\Exception\RequestException;
use WP_Http;

/**
 * Guzzle Middleware.
 *
 * @since 1.159.0
 */
class Middleware {

	/**
	 * Middleware for blocking external requests using WordPress block_request.
	 *
	 * @since 1.159.0
	 *
	 * @return callable Returns a function that blocks external requests using WordPress block_request.
	 */
	public static function block_external_request() {
		return static function ( callable $handler ) {
			return function ( $request, $options ) use ( $handler ) {
				$uri = $request->getUri();

				$wp_http = new WP_Http();
				if ( $wp_http->block_request( $uri ) ) {
					throw new RequestException(
						__( 'User has blocked requests through HTTP.', 'default' ),
						$request
					);
				}

				return $handler( $request, $options );
			};
		};
	}
}
