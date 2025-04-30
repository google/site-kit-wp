<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Module_With_Existing_Tag_Trait
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

trait Module_With_Existing_Tag_Trait {

	/**
	 * Gets the existing tag for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The existing tag for the module.
	 */
	public function get_existing_tag() {
		return $this->fetch_existing_tag();
	}

	/**
	 * Fetches the existing tag for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return string|null The existing tag for the module or null if not found.
	 */
	private function fetch_existing_tag() {
		$home_url = $this->context->get_canonical_home_url();
		$amp_mode = $this->context->get_amp_mode();
		$urls     = $this->get_existing_tag_urls( $home_url, $amp_mode );

		foreach ( $urls as $url ) {
			$html = $this->get_html_for_url( $url );
			// if ( $html ) {
			// return $html;
			// }
			$tag = $this->extract_existing_tag( $html, $this->get_existing_tag_matchers() );
			if ( $tag ) {
				return $tag;
			}
		}

		return null;
	}

	/**
	 * Fetches HTML for a given URL.
	 *
	 * @param string $url The URL to fetch HTML from.
	 * @return string|null The HTML content or null if not found.
	 */
	private function get_html_for_url( $url ) {
		$query_args = array(
			'tagverify' => 1,
			'timestamp' => time(),
		);

		$url = add_query_arg( $query_args, $url );

		$response = wp_remote_get(
			$url,
			array(
				'timeout'   => 15,
				'sslverify' => false,
			)
		);

		if ( is_wp_error( $response ) ) {
			return null;
		}

		$html = wp_remote_retrieve_body( $response );

		if ( empty( $html ) ) {
			return null;
		}

		return $html;
	}

	/**
	 * Extracts an existing tag from HTML using provided matchers.
	 *
	 * @param string $html        The HTML content to search in.
	 * @param array  $tag_matchers Array of regular expression patterns.
	 * @return string|false The matched tag or false if no match found.
	 */
	private function extract_existing_tag( $html, $tag_matchers ) {
		foreach ( $tag_matchers as $pattern ) {
			if ( preg_match( $pattern, $html, $matches ) ) {
				return $matches[1];
			}
		}

		return false;
	}

	/**
	 * Gets existing tag URLs.
	 *
	 * @param string $home_url The home URL.
	 * @param string $amp_mode The AMP mode.
	 * @return array Array of URLs.
	 */
	private function get_existing_tag_urls( $home_url, $amp_mode ) {
		// Validate home URL.
		if ( ! filter_var( $home_url, FILTER_VALIDATE_URL ) ) {
			throw new \InvalidArgumentException( 'home_url must be valid URL' );
		}

		// Initialize urls with home URL.
		$urls = array( $home_url );

		// Add first post in AMP mode if AMP mode is secondary.
		if ( 'secondary' === $amp_mode ) {
			$posts = get_posts(
				array(
					'posts_per_page'   => 1,
					'post_type'        => 'post',
					'post_status'      => 'publish',
					'suppress_filters' => false,
				)
			);

			if ( ! empty( $posts ) ) {
				$post         = $posts[0];
				$amp_post_url = add_query_arg( 'amp', 1, get_permalink( $post->ID ) );
				if ( $amp_post_url ) {
						$urls[] = $amp_post_url;
				}
			}
		}

		return $urls;
	}


	/**
	 * Gets the tag matchers for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The tag matchers for the module.
	 */
	public function get_existing_tag_matchers() {
		return array();
	}

	/**
	 * Checks if a tag is valid for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if the tag is valid, false otherwise.
	 */
	public function is_valid_existing_tag() {
		return false;
	}
}
