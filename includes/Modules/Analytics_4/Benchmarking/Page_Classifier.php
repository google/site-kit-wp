<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Page_Classifier
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Benchmarking;

/**
 * Tells which landing pages a key factor card may name, by the rules of
 * service §5.8.
 *
 * A reader doesn't recognise the homepage by its address, nor test, sample,
 * feed, admin or login pages, so no card or row names them. A page gets the
 * same verdict whatever its figures, so a page is hidden or shown the same way
 * every week.
 *
 * The service puts the pages its rules leave unresolved, single-segment paths
 * on a site without its own front page, to a model. The plugin has none, so
 * it reads them as content, as the spec says. It also knows the folder the
 * site lives under, which is the site's homepage, so it reads that folder as
 * the homepage without a model.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Page_Classifier {

	/**
	 * The verdict of a page a card may name.
	 *
	 * @since n.e.x.t
	 */
	const CONTENT = 'CONTENT';

	/**
	 * The verdict of the homepage or one of its other addresses.
	 *
	 * @since n.e.x.t
	 */
	const HOMEPAGE = 'HOMEPAGE';

	/**
	 * The verdict of a page that is no content a reader would recognise, such
	 * as a feed or a login page.
	 *
	 * @since n.e.x.t
	 */
	const NON_CONTENT = 'NON_CONTENT';

	/**
	 * The share of the landing pages' visits the root needs for the site to
	 * have its own front page.
	 *
	 * @since n.e.x.t
	 */
	const FRONT_PAGE_SHARE = 0.01;

	/**
	 * The page keys of the root: the homepage at the top of the site's domain.
	 *
	 * @since n.e.x.t
	 */
	const ROOT_KEYS = array( '', '/home', '/index.html' );

	/**
	 * Whether the site has its own front page, or null when it is not known.
	 *
	 * @since n.e.x.t
	 * @var bool|null
	 */
	private $has_front_page;

	/**
	 * The page key of the site's homepage when the site lives under a folder,
	 * or an empty string for a site at the root of its domain.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $home_key;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param bool|null $has_front_page Whether the site has its own front page, as `has_front_page()` tells it, or null when it is not known, which counts as having one.
	 * @param string    $home_path      Optional. The path of the site's homepage, such as `/blog/` for a site that lives under a folder. Default `/`.
	 */
	public function __construct( $has_front_page, $home_path = '/' ) {
		$this->has_front_page = $has_front_page;
		$this->home_key       = self::get_page_key( $home_path );
	}

	/**
	 * Tells whether a site has its own front page: the root carries at least
	 * `FRONT_PAGE_SHARE` of its landing pages' visits.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $page_rows The landing page rows, each with `page`, `current` and `previous`.
	 * @param string $home_path Optional. The path of the site's homepage. Default `/`.
	 * @return bool|null True when it has, false when it hasn't, or null without visits to tell from.
	 */
	public static function has_front_page( array $page_rows, $home_path = '/' ) {
		$home_key    = self::get_page_key( $home_path );
		$root_visits = 0;
		$visits      = 0;

		foreach ( $page_rows as $row ) {
			$row_visits = (int) $row['current'] + (int) $row['previous'];
			$key        = self::get_page_key( $row['page'] );
			$visits    += $row_visits;

			if ( in_array( $key, self::ROOT_KEYS, true ) || $home_key === $key ) {
				$root_visits += $row_visits;
			}
		}

		if ( $visits <= 0 ) {
			return null;
		}

		return $root_visits >= self::FRONT_PAGE_SHARE * $visits;
	}

	/**
	 * Gets the key a page's verdict is kept by: its path in lower case without
	 * a trailing slash, its query and fragment left out.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $url The page's path or URL.
	 * @return string The key, an empty string for the root.
	 */
	public static function get_page_key( $url ) {
		return strtolower( untrailingslashit( self::get_path( $url ) ) );
	}

	/**
	 * Gets the path of a landing page, without its query and fragment.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $url The page's path or URL.
	 * @return string The path, such as `/plant-garlic/`, or an empty string for a URL without one.
	 */
	public static function get_path( $url ) {
		$path = wp_parse_url( trim( (string) $url ), PHP_URL_PATH );

		return is_string( $path ) ? $path : '';
	}

	/**
	 * Tells whether a page is the root, the homepage at the top of the site's
	 * domain.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $url The page's path or URL.
	 * @return bool True when it is the root.
	 */
	public static function is_root( $url ) {
		return in_array( self::get_page_key( $url ), self::ROOT_KEYS, true );
	}

	/**
	 * Gets a page's verdict. The first rule that matches decides it.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $url   The page's path or URL.
	 * @param string $title Optional. The page's title. Default empty string.
	 * @return string `HOMEPAGE`, `NON_CONTENT` or `CONTENT`.
	 */
	public function classify( $url, $title = '' ) {
		$key   = self::get_page_key( $url );
		$title = strtolower( trim( $title ) );

		if ( in_array( $key, self::ROOT_KEYS, true ) || ( '' !== $this->home_key && $this->home_key === $key ) ) {
			return self::HOMEPAGE;
		}

		if ( preg_match( '#^/(home\d*|index(\.(html?|php))?|default(\.(html?|php))?|inicio)$#', $key ) ) {
			return self::HOMEPAGE;
		}

		if ( $this->is_non_content( $key, $title ) ) {
			return self::NON_CONTENT;
		}

		if ( '/search' === $key ) {
			// A site without its own front page shows its search page in its
			// place. On any other site, it is the site's internal search.
			return false === $this->has_front_page ? self::HOMEPAGE : self::NON_CONTENT;
		}

		return self::CONTENT;
	}

	/**
	 * Tells whether a card or a row may name a page: it is a page, not the
	 * root, and its verdict is `CONTENT`.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $url   The page's path or URL.
	 * @param string $title Optional. The page's title. Default empty string.
	 * @return bool True when a card or a row may name it.
	 */
	public function is_displayable( $url, $title = '' ) {
		return ! Insight_Request_Builder::is_placeholder( $url ) && self::CONTENT === $this->classify( $url, $title );
	}

	/**
	 * Tells whether a page is no content a reader would recognise: a sample,
	 * test, paginated, feed, admin or login page.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $key   The page key.
	 * @param string $title The page's title, in lower case.
	 * @return bool True when it is not.
	 */
	private function is_non_content( $key, $title ) {
		$segments = array_values( array_filter( explode( '/', $key ), 'strlen' ) );
		$last     = empty( $segments ) ? '' : $segments[ count( $segments ) - 1 ];

		// The sample post of a new WordPress site.
		if ( 'hello-world' === $last || 'hello world!' === $title ) {
			return true;
		}

		// A page after the first of a list.
		if ( preg_match( '#/page/(\d+)$#', $key, $matches ) && (int) $matches[1] >= 2 ) {
			return true;
		}

		// Test pages.
		foreach ( array( 'tagtest', 'test_with_uid', 'hybrid_gaia', 'appspot.com' ) as $marker ) {
			if ( false !== strpos( $key, $marker ) ) {
				return true;
			}
		}

		if ( array_intersect( $segments, array( 'test', 'tag-test', 'sandbox' ) ) || false !== strpos( $title, 'tagtest' ) || 0 === strpos( $key, '/v0/b/' ) ) {
			return true;
		}

		// A segment repeated by a crawler going round in circles.
		$counts = array_count_values( $segments );

		foreach ( array( 'login', 'order', 'inbox', 'reviews' ) as $segment ) {
			if ( isset( $counts[ $segment ] ) && $counts[ $segment ] > 1 ) {
				return true;
			}
		}

		// Feeds.
		if ( in_array( $last, array( 'feed', 'rss', 'atom' ), true ) ) {
			return true;
		}

		// Admin, login and shop pages.
		foreach ( $segments as $segment ) {
			if ( in_array( $segment, array( 'wp-admin', 'xmlrpc.php', 'cart', 'checkout', 'my-account' ), true ) || 0 === strpos( $segment, 'wp-login' ) ) {
				return true;
			}
		}

		return false;
	}
}
