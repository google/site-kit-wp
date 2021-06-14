<?php
/**
 * Trait Google\Site_Kit\Core\Tags\Tag_With_DNS_Prefetch_Trait
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags;

/**
 * Trait for adding the dns-prefetch directive to a url.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Tag_With_DNS_Prefetch_Trait {
	/**
	 * Adds the dns-prefetch directive to a specified URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $url URL to which the dns-prefetch directive should be added.
	 * @return array List of urls.
	 */
	protected function get_dns_prefetch_hints_callback( $url ) {
		return function( $urls, $relation_type ) use ( $url ) {
			if ( 'dns-prefetch' === $relation_type ) {
				$urls[] = $url;
			}
			return $urls;
		};
	}
}
