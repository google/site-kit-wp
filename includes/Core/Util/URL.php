<?php
/**
 * Class Google\Site_Kit\Core\Util\URL
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit_Dependencies\TrueBV\Punycode;

/**
 * Class for custom URL parsing methods.
 *
 * @since 1.84.0
 * @access private
 * @ignore
 */
class URL {

	/**
	 * Parses URLs with UTF-8 multi-byte characters,
	 * otherwise similar to `wp_parse_url()`.
	 *
	 * @since 1.84.0
	 *
	 * @param string $url       The URL to parse.
	 * @param int    $component The specific component to retrieve. Use one of the PHP
	 *                          predefined constants to specify which one.
	 *                          Defaults to -1 (= return all parts as an array).
	 * @return mixed False on parse failure; Array of URL components on success;
	 *               When a specific component has been requested: null if the component
	 *               doesn't exist in the given URL; a string or - in the case of
	 *               PHP_URL_PORT - integer when it does. See parse_url()'s return values.
	 */
	public static function parse( $url, $component = -1 ) {
		$url = (string) $url;

		if ( mb_strlen( $url, 'UTF-8' ) === strlen( $url ) ) {
			return wp_parse_url( $url, $component );
		}

		$to_unset = array();
		if ( '//' === mb_substr( $url, 0, 2 ) ) {
			$to_unset[] = 'scheme';
			$url        = 'placeholder:' . $url;
		} elseif ( '/' === mb_substr( $url, 0, 1 ) ) {
			$to_unset[] = 'scheme';
			$to_unset[] = 'host';
			$url        = 'placeholder://placeholder' . $url;
		}

		$parts = self::mb_parse_url( $url );

		if ( false === $parts ) {
			// Parsing failure.
			return $parts;
		}

		// Remove the placeholder values.
		foreach ( $to_unset as $key ) {
			unset( $parts[ $key ] );
		}

		return _get_component_from_parsed_url_array( $parts, $component );
	}

	/**
	 * Replacement for parse_url which is UTF-8 multi-byte character aware.
	 *
	 * @since 1.84.0
	 *
	 * @param string $url The URL to parse.
	 * @return mixed False on parse failure; Array of URL components on success
	 */
	private static function mb_parse_url( $url ) {
		$enc_url = preg_replace_callback(
			'%[^:/@?&=#]+%usD',
			function ( $matches ) {
				return rawurlencode( $matches[0] );
			},
			$url
		);

		$parts = parse_url( $enc_url ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url

		if ( false === $parts ) {
			return $parts;
		}

		foreach ( $parts as $name => $value ) {
			$parts[ $name ] = urldecode( $value );
		}

		return $parts;
	}

	/**
	 * Permutes site URL to cover all different variants of it (not considering the path).
	 *
	 * @since 1.99.0
	 *
	 * @param string $site_url Site URL to get permutations for.
	 * @return array List of permutations.
	 */
	public static function permute_site_url( $site_url ) {
		$hostname = self::parse( $site_url, PHP_URL_HOST );
		$path     = self::parse( $site_url, PHP_URL_PATH );

		return array_reduce(
			self::permute_site_hosts( $hostname ),
			function ( $urls, $host ) use ( $path ) {
				$host_with_path = $host . $path;
				array_push( $urls, "https://$host_with_path", "http://$host_with_path" );
				return $urls;
			},
			array()
		);
	}

	/**
	 * Generates common variations of the given hostname.
	 *
	 * Returns a list of hostnames that includes:
	 * - (if IDN) in Punycode encoding
	 * - (if IDN) in Unicode encoding
	 * - with and without www. subdomain (including IDNs)
	 *
	 * @since 1.99.0
	 *
	 * @param string $hostname Hostname to generate variations of.
	 * @return string[] Hostname variations.
	 */
	public static function permute_site_hosts( $hostname ) {
		$punycode = new Punycode();
		// See \Requests_IDNAEncoder::is_ascii.
		$is_ascii = preg_match( '/(?:[^\x00-\x7F])/', $hostname ) !== 1;
		$is_www   = 0 === strpos( $hostname, 'www.' );
		// Normalize hostname without www.
		$hostname = $is_www ? substr( $hostname, strlen( 'www.' ) ) : $hostname;
		$hosts    = array( $hostname, "www.$hostname" );

		try {
			// An ASCII hostname can only be non-IDN or punycode-encoded.
			if ( $is_ascii ) {
				// If the hostname is in punycode encoding, add the decoded version to the list of hosts.
				if ( 0 === strpos( $hostname, Punycode::PREFIX ) || false !== strpos( $hostname, '.' . Punycode::PREFIX ) ) {
					$host_decoded = $punycode->decode( $hostname );
					array_push( $hosts, $host_decoded, "www.$host_decoded" );
				}
			} else {
				// If it's not ASCII, then add the punycode encoded version.
				$host_encoded = $punycode->encode( $hostname );
				array_push( $hosts, $host_encoded, "www.$host_encoded" );
			}
		} catch ( Exception $exception ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Do nothing.
		}

		return $hosts;
	}

}
