<?php
/**
 * Class Google\Site_Kit\Core\Util\Google_URL_Normalizer
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Handles URL normalization for comparisons and API requests.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Google_URL_Normalizer {

	/**
	 * Normalize a URL by converting to all lowercase, converting Unicode characters
	 * to punycode, removing trailing slashes and removing bidirectional control
	 * characters.
	 *
	 * @param string $url The URL to normalize.
	 * @return string The normalized URL.
	 */
	public function normalize_url( $url ) {
		// Remove bidirectional control characters.
		$url = $this->decode_unicode_url_or_domain( $url );
		$url = str_replace( '\u202b', '', $url );
		$url = str_replace( '\u202c', '', $url );
		$url = untrailingslashit( $url );
		$url = strtolower( $url );

		return $url;
	}

	/**
	 * Returns a punycode encoded unicode URL or domain name.
	 *
	 * @since 1.6.0
	 *
	 * @param string $url The URL or domain name to decode.
	 */
	protected function decode_unicode_url_or_domain( $url ) {
		$parts = wp_parse_url( $url );
		if ( ! $parts || ! isset( $parts['host'] ) || '' === $parts['host'] ) {
			return \Requests_IDNAEncoder::encode( $url );
		}
		$decoded_host = \Requests_IDNAEncoder::encode( $parts['host'] );
		return str_replace( $parts['host'], $decoded_host, $url );
	}
}
