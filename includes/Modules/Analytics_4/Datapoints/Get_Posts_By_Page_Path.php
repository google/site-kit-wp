<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Posts_By_Page_Path
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Shareable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\Util\WP_Query_Factory;
use WP_Post;

/**
 * Class for the datapoint that finds the post each page path shows.
 *
 * On plain permalinks, every post shares the path of the home page, and only
 * the query string tells posts apart, such as `/?p=123`. So the Recent activity
 * tab reads each URL of its report with its query string, and asks this
 * datapoint which published post WordPress shows there.
 *
 * A view-only user may read it, because it returns only the ID, the title and
 * the URL of a published post of a viewable post type, which WordPress shows
 * to any visitor.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Posts_By_Page_Path extends Shareable_Datapoint implements Executable_Datapoint {

	/**
	 * The maximum number of page paths that one request can look up.
	 *
	 * `POSTS_BY_PAGE_PATH_MAX_PAGE_PATHS` in `assets/js/modules/analytics-4/datastore/constants.ts`
	 * sets the same limit for the dashboard, which asks for the posts of up to
	 * that many page paths at once, so a lower limit here fails its request.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	const MAX_PAGE_PATHS = 50;

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable Closure that returns an array keyed by each page path, such as `/?p=123`. Each value is the post's `id`, `title` and `url`, or `null` where the page path shows no single published post.
	 * @throws Missing_Required_Param_Exception Thrown when `pagePaths` is missing or empty, such as an empty list.
	 * @throws Invalid_Param_Exception Thrown when `pagePaths` isn't a list of at most `MAX_PAGE_PATHS` strings that each start with `/`.
	 */
	public function create_request( Data_Request $data_request ) {
		$page_paths = $data_request['pagePaths'];

		if ( empty( $page_paths ) ) {
			throw new Missing_Required_Param_Exception( 'pagePaths' );
		}

		if ( ! $this->is_valid_page_path_list( $page_paths ) ) {
			throw new Invalid_Param_Exception( 'pagePaths' );
		}

		return function () use ( $page_paths ) {
			$posts = array();

			foreach ( $page_paths as $page_path ) {
				$posts[ $page_path ] = $this->get_post_data( $page_path );
			}

			return $posts;
		};
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed The response without any modifications.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}

	/**
	 * Checks whether a `pagePaths` parameter is a list of at most `MAX_PAGE_PATHS` page paths.
	 *
	 * A page path starts with `/`, so no key of the response is a number.
	 * Number keys that run `0`, `1`, `2` and so on would make the response a
	 * JSON array rather than an object.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $page_paths The `pagePaths` parameter, as the request sent it.
	 * @return bool True where the parameter is a list of page paths, false otherwise.
	 */
	private function is_valid_page_path_list( $page_paths ) {
		if ( ! is_array( $page_paths ) || count( $page_paths ) > self::MAX_PAGE_PATHS ) {
			return false;
		}

		foreach ( $page_paths as $page_path ) {
			if ( ! is_string( $page_path ) || 0 !== strpos( $page_path, '/' ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Gets the ID, the plain text title and the permalink of the post that a page path shows.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $page_path The page path, such as `/?p=123`.
	 * @return array|null The post's `id`, `title` and `url`, or `null` where the page path shows no single published post.
	 */
	private function get_post_data( $page_path ) {
		$post = $this->get_post( $page_path );

		if ( ! $post ) {
			return null;
		}

		return array(
			'id'    => $post->ID,
			'title' => $this->get_plain_title( $post ),
			'url'   => get_permalink( $post ),
		);
	}

	/**
	 * Gets the published single post that WordPress shows at a page path.
	 *
	 * The query reads the page path the way WordPress reads a request, so a
	 * static homepage shows at `/`, and the posts page at `/?page_id=<ID>` lists
	 * the latest posts, which is no single post.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $page_path The page path, such as `/?p=123`.
	 * @return WP_Post|null The post, or `null` where the page path shows no single published post.
	 */
	private function get_post( $page_path ) {
		$query = WP_Query_Factory::from_url( $page_path );

		// `from_url()` returns `null` for a page path on another host, such as `//example.org/?p=1`.
		if ( ! $query ) {
			return null;
		}

		// `from_url()` has already run `parse_query()`, which sets `is_singular()`
		// from the page path, so a search or an archive returns here with no
		// database query.
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

		// The query returns an unpublished post, such as a draft, to a user who
		// can edit it, so we check the status here. For an attachment,
		// `get_post_status()` returns the status of its parent post, or
		// `publish` where it has no parent.
		if ( 'publish' !== get_post_status( $post ) || ! is_post_type_viewable( $post->post_type ) ) {
			return null;
		}

		// WooCommerce shows the product archive at its shop page, also as the
		// static homepage, through a redirect or a change to the main query. So
		// this query still reads the shop page as a single page.
		if ( function_exists( 'wc_get_page_id' ) && wc_get_page_id( 'shop' ) === $post->ID ) {
			return null;
		}

		return $post;
	}

	/**
	 * Gets the title of a post as plain text, with no HTML and no `Protected:` prefix.
	 *
	 * `get_the_title()` adds the `Protected:` prefix to the title of a post with
	 * a password wherever `is_admin()` is `false`, as it is in a REST request.
	 * So the title runs through the `the_title` filters here, as it does inside
	 * `get_the_title()`, with no prefix.
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
