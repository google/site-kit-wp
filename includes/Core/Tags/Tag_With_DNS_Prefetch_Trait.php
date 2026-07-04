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
 * @since 1.35.0
 * @access private
 * @ignore
 */
trait Tag_With_DNS_Prefetch_Trait {

	/**
	 * Gets a callback that can be used for the wp_resource_hints filter to set the dns-prefetch directive for a specified URL.
	 *
	 * @since 1.35.0
	 *
	 * @param string $url URL to which the dns-prefetch directive should be added.
	 * @return array List of urls.
	 */
	protected function get_dns_prefetch_hints_callback( $url ) {
		return function ( $urls, $relation_type ) use ( $url ) {
			if ( 'dns-prefetch' === $relation_type ) {
				$urls[] = $url;
			}
			return $urls;
		};
	}
}
