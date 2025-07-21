<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Helpers\Block_External
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication\Helpers;

use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit_Dependencies\GuzzleHttp\Exception\RequestException;
use WP_Http;

/**
 * Class for blocking external requests.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Block_External {

	/**
	 * Guzzle Handler for blocking external requests.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable A Guzzle handler that blocks external requests.
	 */
	public static function block_external_request() {
		return static function ( callable $handler ) {
			return function ( $request, $options ) use ( $handler ) {
				$uri = $request->getUri();

				$wp_http = new WP_Http();
				if ( is_string( $uri ) && $wp_http->block_request( $uri ) ) {
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
