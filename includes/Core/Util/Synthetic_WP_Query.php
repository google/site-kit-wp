<?php
/**
 * Class Google\Site_Kit\Core\Util\Synthetic_WP_Query
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use WP_Query;
use WP_Post;

/**
 * Class extending WordPress core's `WP_Query` for more self-contained behavior.
 *
 * @since 1.16.0
 * @access private
 * @ignore
 */
final class Synthetic_WP_Query extends WP_Query {

	/**
	 * The hash of the `$query` last parsed into `$query_vars`.
	 *
	 * @since 1.16.0
	 * @var string
	 */
	private $parsed_query_hash = '';

	/**
	 * Whether automatic 404 detection in `get_posts()` method is enabled.
	 *
	 * @since 1.16.0
	 * @var bool
	 */
	private $enable_404_detection = false;

	/**
	 * Sets whether 404 detection in `get_posts()` method should be enabled.
	 *
	 * @since 1.16.0
	 *
	 * @param bool $enable Whether or not to enable 404 detection.
	 */
	public function enable_404_detection( $enable ) {
		$this->enable_404_detection = (bool) $enable;
	}

	/**
	 * Initiates object properties and sets default values.
	 *
	 * @since 1.16.0
	 */
	public function init() {
		parent::init();

		$this->parsed_query_hash = '';
	}

	/**
	 * Extends `WP_Query::parse_query()` to ensure it is not unnecessarily run twice.
	 *
	 * @since 1.16.0
	 *
	 * @param string|array $query Optional. Array or string of query parameters. See `WP_Query::parse_query()`.
	 */
	public function parse_query( $query = '' ) {
		if ( ! empty( $query ) ) {
			$query_to_hash = wp_parse_args( $query );
		} elseif ( ! isset( $this->query ) ) {
			$query_to_hash = $this->query_vars;
		} else {
			$query_to_hash = $this->query;
		}

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
		$query_hash = md5( serialize( $query_to_hash ) );

		// If this query was parsed before, bail early.
		if ( $query_hash === $this->parsed_query_hash ) {
			return;
		}

		parent::parse_query( $query );

		// Set query hash for current `$query` and `$query_vars` properties.
		$this->parsed_query_hash = $query_hash;
	}

	/**
	 * Extends `WP_Query::get_posts()` to include supplemental logic such as detecting a 404 state.
	 *
	 * The majority of the code is a copy of `WP::handle_404()`.
	 *
	 * @since 1.16.0
	 *
	 * @return WP_Post[]|int[] Array of post objects or post IDs.
	 */
	public function get_posts() {
		$results = parent::get_posts();

		// If 404 detection is not enabled, just return the results.
		if ( ! $this->enable_404_detection ) {
			return $results;
		}

		// Check if this is a single paginated post query.
		if ( $this->posts && $this->is_singular() && $this->post && ! empty( $this->query_vars['page'] ) ) {
			// If the post is actually paged and the 'page' query var is within bounds, it's all good.
			$next = '<!--nextpage-->';
			if ( false !== strpos( $this->post->post_content, $next ) && (int) trim( $this->query_vars['page'], '/' ) <= ( substr_count( $this->post->post_content, $next ) + 1 ) ) {
				return $results;
			}

			// Otherwise, this query is out of bounds, so set a 404.
			$this->set_404();
			return $results;
		}

		// If no posts were found, this is technically a 404.
		if ( ! $this->posts ) {
			// If this is a paginated query (i.e. out of bounds), always consider it a 404.
			if ( $this->is_paged() ) {
				$this->set_404();
				return $results;
			}

			// If this is an author archive, don't consider it a 404 if the author exists.
			if ( $this->is_author() ) {
				$author = $this->get( 'author' );
				if ( is_numeric( $author ) && $author > 0 && is_user_member_of_blog( $author ) ) {
					return $results;
				}
			}

			// If this is a valid taxonomy or post type archive, don't consider it a 404.
			if ( ( $this->is_category() || $this->is_tag() || $this->is_tax() || $this->is_post_type_archive() ) && $this->get_queried_object() ) {
				return $results;
			}

			// If this is a search results page or the home index, don't consider it a 404.
			if ( $this->is_home() || $this->is_search() ) {
				return $results;
			}

			// Otherwise, set a 404.
			$this->set_404();
		}

		return $results;
	}
}
