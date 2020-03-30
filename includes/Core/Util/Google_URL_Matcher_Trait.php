<?php
/**
 * Trait Google\Site_Kit\Core\Util\Google_URL_Matcher_Trait
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Trait for matching URLs and domains for Google Site Verification and Search Console.
 *
 * @since 1.6.0
 * @access private
 * @ignore
 */
trait Google_URL_Matcher_Trait {

	/**
	 * Compares two URLs for whether they qualify for a Site Verification or Search Console URL match.
	 *
	 * In order for the URLs to be considered a match, they have to be fully equal, except for a potential
	 * trailing slash in one of them, which will be ignored.
	 *
	 * @since 1.6.0
	 *
	 * @param string $url     The URL.
	 * @param string $compare The URL to compare.
	 * @return bool True if the URLs are considered a match, false otherwise.
	 */
	protected function is_url_match( $url, $compare ) {
		$url     = untrailingslashit( $url );
		$compare = untrailingslashit( $compare );
		$url     = $this->decode_unicode_url_or_domain( $url );
		$compare = $this->decode_unicode_url_or_domain( $compare );

		return $url === $compare;
	}

	/**
	 * Compares two domains for whether they qualify for a Site Verification or Search Console domain match.
	 *
	 * The value to compare may be either a domain or a full URL. If the latter, its scheme and a potential trailing
	 * slash will be stripped out before the comparison.
	 *
	 * In order for the comparison to be considered a match then, the domains have to fully match, except for a
	 * potential "www." prefix, which will be ignored. If the value to compare is a full URL and includes a path other
	 * than just a trailing slash, it will not be a match.
	 *
	 * @since 1.6.0
	 *
	 * @param string $domain  A domain.
	 * @param string $compare The domain or URL to compare.
	 * @return bool True if the URLs/domains are considered a match, false otherwise.
	 */
	protected function is_domain_match( $domain, $compare ) {
		$domain  = $this->strip_domain_www( $domain );
		$compare = $this->strip_domain_www( $this->strip_url_scheme( untrailingslashit( $compare ) ) );
		$domain  = $this->decode_unicode_url_or_domain( $domain );
		$compare = $this->decode_unicode_url_or_domain( $compare );

		return $domain === $compare;
	}

	/**
	 * Strips the scheme from a URL.
	 *
	 * @since 1.6.0
	 *
	 * @param string $url URL with or without scheme.
	 * @return string The passed $url without its scheme.
	 */
	protected function strip_url_scheme( $url ) {
		return preg_replace( '#^(\w+:)?//#', '', $url );
	}

	/**
	 * Strips the "www." prefix from a domain.
	 *
	 * @since 1.6.0
	 *
	 * @param string $domain Domain with or without "www." prefix.
	 * @return string The passed $domain without "www." prefix.
	 */
	protected function strip_domain_www( $domain ) {
		return preg_replace( '/^www\./', '', $domain );
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
