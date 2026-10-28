<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Plain_Permalink_Top_Posts
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Core\Util\WP_Query_Factory;
use WP_Post;

/**
 * Class for finding the posts with the most visitors on a site with plain permalinks, where the query string tells posts apart, such as `/?p=123`.
 *
 * The class asks WordPress which published post each URL of an Analytics
 * report shows, and adds up the visitors of each post.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Plain_Permalink_Top_Posts {

	/**
	 * The maximum number of the page paths with the most visitors whose post the class looks up.
	 *
	 * Each lookup can run a database query. The visitors of the other page paths
	 * count for no post.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	const MAX_PAGE_PATHS = 50;

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Gets the published single posts with the most visitors.
	 *
	 * A post's visitors add up over all its URLs, such as `/?p=123` and
	 * `/?p=123&utm_source=newsletter`, so a visitor who opened both counts twice.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $url_rows The report rows, each with a `url`, a path with its query string, and its `visitors`.
	 * @param int   $limit    The maximum number of posts to return.
	 * @return array The posts, most visitors first, each with its `id`, `title`, `url`, `pagePath` and `visitors`. The `url` is the permalink, `pagePath` is the permalink with no scheme or host, and `title` is plain text.
	 */
	public function get( array $url_rows, $limit ) {
		$visitors_by_post_id = array();
		$posts_by_id         = array();

		foreach ( $this->get_page_paths_with_most_visitors( $url_rows ) as $page_path => $visitors ) {
			$post = $this->get_post( $page_path );

			if ( ! $post ) {
				continue;
			}

			$posts_by_id[ $post->ID ]         = $post;
			$visitors_by_post_id[ $post->ID ] = ( $visitors_by_post_id[ $post->ID ] ?? 0 ) + $visitors;
		}

		$top_posts = array();

		foreach ( array_slice( $this->sort_by_visitors( $visitors_by_post_id ), 0, $limit, true ) as $post_id => $visitors ) {
			$post      = $posts_by_id[ $post_id ];
			$permalink = get_permalink( $post );

			$top_posts[] = array(
				'id'       => $post_id,
				'title'    => $this->get_plain_title( $post ),
				'url'      => $permalink,
				// A page path of the report can have extra public query vars, such
				// as `order-received`, so `pagePath` comes from the permalink.
				'pagePath' => wp_make_link_relative( $permalink ),
				'visitors' => $visitors,
			);
		}

		return $top_posts;
	}

	/**
	 * Gets the visitors of the page paths with the most visitors, at most `MAX_PAGE_PATHS` of them.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $url_rows The report rows, as `get()` takes them.
	 * @return array The visitors keyed by page path, such as `/?p=123`, most first.
	 */
	private function get_page_paths_with_most_visitors( array $url_rows ) {
		// The report filters by the host of the reference site URL, which isn't
		// always the home URL. So the home path comes from that URL too.
		$home_path         = trailingslashit( (string) URL::parse( $this->context->get_reference_site_url(), PHP_URL_PATH ) );
		$public_query_vars = WP_Query_Factory::get_public_query_vars();
		$visitors_by_path  = array();

		foreach ( $url_rows as $url_row ) {
			$page_path = $this->get_page_path( $url_row['url'], $home_path, $public_query_vars );

			if ( null !== $page_path ) {
				$visitors_by_path[ $page_path ] = ( $visitors_by_path[ $page_path ] ?? 0 ) + $url_row['visitors'];
			}
		}

		return array_slice( $this->sort_by_visitors( $visitors_by_path ), 0, self::MAX_PAGE_PATHS, true );
	}

	/**
	 * Gets the page path that WordPress reads from a URL of the report, such as `/?p=123` for `/index.php?p=123&utm_source=newsletter`.
	 *
	 * @since n.e.x.t
	 *
	 * @param string   $url               The URL of the report, a path with its query string.
	 * @param string   $home_path         The path of the site, with a trailing slash, such as `/blog/`.
	 * @param string[] $public_query_vars The query vars that WordPress reads from a URL.
	 * @return string|null The page path, or `null` where the URL has a host or isn't at the home path or its `index.php`.
	 */
	private function get_page_path( $url, $home_path, array $public_query_vars ) {
		$url_parts = URL::parse( $url );

		// `URL::parse()` reads `//example.com/?p=1` as the host `example.com` and
		// the path `/`, which would match a home path of `/`.
		if ( ! is_array( $url_parts ) || isset( $url_parts['host'] ) || ! isset( $url_parts['path'] ) ) {
			return null;
		}

		if ( $url_parts['path'] !== $home_path && $url_parts['path'] !== $home_path . 'index.php' ) {
			return null;
		}

		parse_str( $url_parts['query'] ?? '', $query_vars );

		$query_vars = array_filter(
			$query_vars,
			// Keep a query var with an empty value, such as `product=`. On a site
			// with a static homepage, `/?product=` lists the latest posts, not the
			// homepage.
			fn( $name ) => in_array( $name, $public_query_vars, true ),
			ARRAY_FILTER_USE_KEY
		);

		if ( empty( $query_vars ) ) {
			return $home_path;
		}

		return $home_path . '?' . http_build_query( $query_vars, '', '&', PHP_QUERY_RFC3986 );
	}

	/**
	 * Sorts the visitors of each key, most first, and keeps keys with equal visitors in the order they come in.
	 *
	 * `uksort()` isn't stable before PHP 8.0, so the position of each key orders
	 * keys with equal visitors.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $visitors The visitors of each key, such as a page path or a post ID.
	 * @return array The same visitors, most first, with their keys.
	 */
	private function sort_by_visitors( array $visitors ) {
		$positions = array_flip( array_keys( $visitors ) );

		uksort(
			$visitors,
			fn( $first_key, $second_key ) => ( $visitors[ $second_key ] <=> $visitors[ $first_key ] )
				?: $positions[ $first_key ] - $positions[ $second_key ]
		);

		return $visitors;
	}

	/**
	 * Gets the published single post that WordPress shows at a page path, such as the static homepage at `/`.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $page_path The page path, such as `/?p=123`.
	 * @return WP_Post|null The post, or `null` where the page path shows no single published post, such as the posts page.
	 */
	private function get_post( $page_path ) {
		$query = WP_Query_Factory::from_url( $page_path );

		// `from_url()` has already parsed the query, so a search or an archive
		// returns here with no database query.
		if ( ! $query->is_singular() ) {
			return null;
		}

		$query->get_posts();

		// Running the query can turn it into a 404, such as for the fifth page of
		// a post split into two pages.
		if ( ! $query->is_singular() || ! $query->post instanceof WP_Post ) {
			return null;
		}

		$post = $query->post;

		// The query returns a draft to a user who can edit it, so we check the
		// status. An attachment's `post_status` is `inherit`, so we read it
		// through `get_post_status()`.
		//
		// A plugin can change the post type through `pre_get_posts`, so we check
		// that the post type is viewable too.
		if ( 'publish' !== get_post_status( $post ) || ! is_post_type_viewable( $post->post_type ) ) {
			return null;
		}

		// WooCommerce shows its product archive at the shop page through a
		// redirect or a change to the main query. This query sees neither, so it
		// reads the shop page as a single page.
		if ( function_exists( 'wc_get_page_id' ) && wc_get_page_id( 'shop' ) === $post->ID ) {
			return null;
		}

		return $post;
	}

	/**
	 * Gets the title of a post as plain text, with no HTML and no `Protected:` prefix.
	 *
	 * `get_the_title()` adds that prefix to a post with a password in a REST
	 * request, so we run the `the_title` filters here.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_Post $post The post.
	 * @return string The title, or an empty string for a post with no title.
	 */
	private function get_plain_title( WP_Post $post ) {
		$title = apply_filters( 'the_title', $post->post_title, $post->ID );

		// `wptexturize()`, which runs on `the_title`, writes an apostrophe as
		// `&#8217;` and an ampersand as `&#038;`.
		return html_entity_decode( wp_strip_all_tags( $title ), ENT_QUOTES | ENT_HTML5, get_bloginfo( 'charset' ) );
	}
}
