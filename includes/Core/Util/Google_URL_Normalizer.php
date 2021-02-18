<?php
/**
 * Class Google\Site_Kit\Core\Util\Google_URL_Normalizer
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Class handling URL normalization for comparisons and API requests.
 *
 * @since 1.18.0
 * @access private
 * @ignore
 */
final class Google_URL_Normalizer {

	/**
	 * Normalizes a URL by converting to all lowercase, converting Unicode characters
	 * to punycode, and removing bidirectional control characters.
	 *
	 * @since 1.18.0
	 *
	 * @param string $url The URL or domain to normalize.
	 * @return string The normalized URL or domain.
	 */
	public function normalize_url( $url ) {
		// Remove bidirectional control characters.
		$url = preg_replace( array( '/\xe2\x80\xac/', '/\xe2\x80\xab/' ), '', $url );
		$url = $this->decode_unicode_url_or_domain( $url );
		$url = strtolower( $url );

		return $url;
	}

	/**
	 * Returns the Punycode version of a Unicode URL or domain name.
	 *
	 * @since 1.18.0
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
