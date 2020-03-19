<?php
/**
 * Google_URL_Matcher
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Google_URL_Matcher_Trait;

/**
 * Class Google_URL_Matcher
 *
 * A proxy class just to access protected trait methods.
 *
 * @package Google\Site_Kit\Tests\Core\Util
 */
class Google_URL_Matcher {
	use Google_URL_Matcher_Trait {
		is_url_match as trait_is_url_match;
		is_domain_match as trait_is_domain_match;
	}

	/**
	 * Calls {@see Google_URL_Matcher_Trait::is_url_match()}.
	 *
	 * @param string $url     The URL.
	 * @param string $compare The URL to compare.
	 * @return bool True if the URLs are considered a match, false otherwise.
	 */
	protected function is_url_match( $url, $compare ) {
		return $this->trait_is_url_match( $url, $compare );
	}

	/**
	 * Calls {@see Google_URL_Matcher_Trait::is_domain_match()}.
	 *
	 * @param string $domain  A domain.
	 * @param string $compare The domain or URL to compare.
	 * @return bool True if the URLs/domains are considered a match, false otherwise.
	 */
	protected function is_domain_match( $domain, $compare ) {
		return $this->trait_is_domain_match( $domain, $compare );
	}
}
