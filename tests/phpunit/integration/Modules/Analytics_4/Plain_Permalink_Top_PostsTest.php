<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Plain_Permalink_Top_PostsTest
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Analytics_4\Plain_Permalink_Top_Posts;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 */
class Plain_Permalink_Top_PostsTest extends TestCase {

	/**
	 * Plain_Permalink_Top_Posts instance.
	 *
	 * @var Plain_Permalink_Top_Posts
	 */
	private $top_posts;

	public function set_up() {
		parent::set_up();

		// An administrator can read a draft, so a draft that counts for no post
		// proves the class's own check of the post status.
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );

		$this->set_permalink_structure( '' );

		// Each post type gets its name as its query var, as WooCommerce's `product`
		// does.
		register_post_type( 'product', array( 'public' => true ) );
		register_post_type( 'book', array( 'public' => true ) );

		$this->top_posts = new Plain_Permalink_Top_Posts( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	public function tear_down() {
		unregister_post_type( 'product' );
		unregister_post_type( 'book' );

		if ( post_type_exists( 'invoice' ) ) {
			unregister_post_type( 'invoice' );
		}

		parent::tear_down();
	}

	/**
	 * Gets the top posts of a report with the given visitors of each URL.
	 *
	 * @since 1.191.0
	 *
	 * @param array $visitors_by_url The visitors of each URL of the report, most visitors first, such as `array( '/?p=123' => 10 )`.
	 * @param int   $limit        Optional. The maximum number of posts. Default 10.
	 * @return array The top posts.
	 */
	private function get( array $visitors_by_url, $limit = 10 ) {
		$url_rows = array();

		foreach ( $visitors_by_url as $url => $visitors ) {
			$url_rows[] = array(
				'url'      => $url,
				'visitors' => $visitors,
			);
		}

		return $this->top_posts->get( $url_rows, $limit );
	}

	/**
	 * @dataProvider data_single_posts
	 *
	 * @param string $post_label            The kind of single post, for the assertion message.
	 * @param array  $post_args             The arguments the post is created with.
	 * @param string $page_path_format      The page path of the report, with `%d` for the post ID.
	 * @param string $permalink_path_format The permalink of the post with no scheme or host, with `%d` for the post ID.
	 */
	public function test_get__returns_a_published_single_post( $post_label, $post_args, $page_path_format, $permalink_path_format ) {
		$post_id        = $this->factory()->post->create( $post_args );
		$page_path      = sprintf( $page_path_format, $post_id );
		$permalink_path = sprintf( $permalink_path_format, $post_id );

		$this->assertSame(
			array(
				array(
					'id'       => $post_id,
					'title'    => $post_args['post_title'],
					'url'      => "http://example.org$permalink_path",
					'pagePath' => $permalink_path,
					'visitors' => 10,
				),
			),
			$this->get( array( $page_path => 10 ) ),
			"The page path of $post_label should count for that post."
		);
	}

	public function data_single_posts() {
		return array(
			'post'                                      => array(
				'a post',
				array( 'post_title' => 'Travel tips' ),
				'/?p=%d',
				'/?p=%d',
			),
			'page'                                      => array(
				'a page',
				array(
					'post_title' => 'About',
					'post_type'  => 'page',
				),
				'/?page_id=%d',
				'/?page_id=%d',
			),
			'product, by its query var'                 => array(
				'a product, by its query var,',
				array(
					'post_title' => 'Hoodie',
					'post_name'  => 'hoodie',
					'post_type'  => 'product',
				),
				'/?product=hoodie',
				'/?product=hoodie',
			),
			'custom post type, by its query var'        => array(
				'a post of a public custom post type, by its query var,',
				array(
					'post_title' => 'Dune',
					'post_name'  => 'dune',
					'post_type'  => 'book',
				),
				'/?book=dune',
				'/?book=dune',
			),
			// The page path of the report names the post by its post type and ID,
			// and its permalink names it by its query var.
			'custom post type, by its post type and ID' => array(
				'a post of a public custom post type, by its post type and ID,',
				array(
					'post_title' => 'Dune',
					'post_name'  => 'dune',
					'post_type'  => 'book',
				),
				'/?post_type=book&p=%d',
				'/?book=dune',
			),
		);
	}

	public function test_get__returns_an_attachment_page() {
		$post_id       = $this->factory()->post->create( array( 'post_title' => 'Travel tips' ) );
		$attachment_id = $this->factory()->attachment->create(
			array(
				'file'           => 'map.jpg',
				'post_parent'    => $post_id,
				'post_title'     => 'Map',
				'post_mime_type' => 'image/jpeg',
			)
		);

		$this->assertSame(
			array(
				array(
					'id'       => $attachment_id,
					'title'    => 'Map',
					'url'      => "http://example.org/?attachment_id=$attachment_id",
					'pagePath' => "/?attachment_id=$attachment_id",
					'visitors' => 10,
				),
			),
			$this->get( array( "/?attachment_id=$attachment_id" => 10 ) ),
			'The page path of an attachment page should count for the attachment, because its parent post is published.'
		);
	}

	public function test_get__returns_no_post_for_an_attachment_of_a_draft() {
		$post_id       = $this->factory()->post->create( array( 'post_status' => 'draft' ) );
		$attachment_id = $this->factory()->attachment->create(
			array(
				'file'           => 'map.jpg',
				'post_parent'    => $post_id,
				'post_title'     => 'Map',
				'post_mime_type' => 'image/jpeg',
			)
		);

		$this->assertSame(
			array(),
			$this->get( array( "/?attachment_id=$attachment_id" => 10 ) ),
			'The attachment page of a draft should not count for any post, because the attachment takes the status of its parent post.'
		);
	}

	public function test_get__returns_an_attachment_page_whose_parent_post_is_in_the_trash() {
		$post_id       = $this->factory()->post->create( array( 'post_title' => 'Travel tips' ) );
		$attachment_id = $this->factory()->attachment->create(
			array(
				'file'           => 'map.jpg',
				'post_parent'    => $post_id,
				'post_title'     => 'Map',
				'post_mime_type' => 'image/jpeg',
			)
		);

		wp_trash_post( $post_id );

		$this->assertSame(
			array(
				array(
					'id'       => $attachment_id,
					'title'    => 'Map',
					'url'      => "http://example.org/?attachment_id=$attachment_id",
					'pagePath' => "/?attachment_id=$attachment_id",
					'visitors' => 10,
				),
			),
			$this->get( array( "/?attachment_id=$attachment_id" => 10 ) ),
			'The attachment page of a trashed post should count for the attachment, because the attachment takes the status the post had before the trash.'
		);
	}

	public function test_get__adds_up_the_visitors_of_each_url_of_a_post() {
		// `<!--nextpage-->` splits the post into two pages, so `page=2` shows its
		// second page.
		$post_id = $this->factory()->post->create(
			array(
				'post_title'   => 'Travel tips',
				'post_content' => 'Packing<!--nextpage-->Flights',
			)
		);

		$this->assertSame(
			array(
				array(
					'id'       => $post_id,
					'title'    => 'Travel tips',
					'url'      => "http://example.org/?p=$post_id",
					'pagePath' => "/?p=$post_id",
					'visitors' => 28,
				),
			),
			$this->get(
				array(
					"/?p=$post_id"                       => 10,
					"/?p=$post_id&utm_source=newsletter" => 8,
					"/index.php?p=$post_id"              => 6,
					"/?p=$post_id&page=2"                => 4,
				)
			),
			'A post should count the visitors of each of its URLs, with a campaign query arg, with `index.php` and on its second page.'
		);
	}

	public function test_get__returns_no_post_for_a_page_past_the_last_page_of_a_post() {
		// The post has two pages, so WordPress shows a 404 for its third page.
		$post_id = $this->factory()->post->create(
			array(
				'post_title'   => 'Travel tips',
				'post_content' => 'Packing<!--nextpage-->Flights',
			)
		);

		$this->assertSame( array(), $this->get( array( "/?p=$post_id&page=3" => 10 ) ), 'A page past the last page of a post should not count for any post, because WordPress shows a 404 there.' );
	}

	public function test_get__returns_a_post_at_the_home_path_of_a_site_in_a_subdirectory() {
		// The home URL has no trailing slash, as WordPress saves it.
		add_filter( 'pre_option_home', fn () => 'http://example.org/blog' );

		$post_id = $this->factory()->post->create( array( 'post_title' => 'Travel tips' ) );

		$this->assertSame(
			array(
				array(
					'id'       => $post_id,
					'title'    => 'Travel tips',
					'url'      => "http://example.org/blog/?p=$post_id",
					'pagePath' => "/blog/?p=$post_id",
					'visitors' => 15,
				),
			),
			$this->get(
				array(
					"/blog/?p=$post_id"          => 10,
					"/blog/index.php?p=$post_id" => 5,
				)
			),
			'A post at the home path of a site in a subdirectory should count the visitors of its URLs there, with and without `index.php`.'
		);
	}

	public function test_get__returns_a_post_at_the_home_path_of_the_reference_site_url() {
		// The filter moves the reference site URL alone, and the home URL stays
		// at `http://example.org`.
		add_filter( 'googlesitekit_site_url', fn () => 'http://example.org/blog' );

		$post_id = $this->factory()->post->create( array( 'post_title' => 'Travel tips' ) );

		$this->assertSame(
			array(
				array(
					'id'       => $post_id,
					'title'    => 'Travel tips',
					'url'      => "http://example.org/?p=$post_id",
					'pagePath' => "/?p=$post_id",
					'visitors' => 15,
				),
			),
			$this->get(
				array(
					"/?p=$post_id"               => 50,
					"/blog/?p=$post_id"          => 10,
					"/blog/index.php?p=$post_id" => 5,
				)
			),
			'A post should count only the visitors of its URLs at `/blog/`, the home path of the reference site URL.'
		);
	}

	/**
	 * @dataProvider data_urls_outside_the_home_path
	 *
	 * @param string $url_format A URL outside the home path `/blog/`, with `%d` for the post ID.
	 */
	public function test_get__returns_no_post_for_a_url_outside_the_home_path( $url_format ) {
		add_filter( 'pre_option_home', fn () => 'http://example.org/blog' );

		$post_id = $this->factory()->post->create( array( 'post_title' => 'Travel tips' ) );
		$url     = sprintf( $url_format, $post_id );

		$this->assertSame( array(), $this->get( array( $url => 10 ) ), "The URL $url should not count for any post, because WordPress serves no page there." );
	}

	public function data_urls_outside_the_home_path() {
		return array(
			'above the home path'          => array( '/?p=%d' ),
			'at another path under it'     => array( '/blog/forum/?p=%d' ),
			'another site, by two slashes' => array( '//example.com/blog/?p=%d' ),
		);
	}

	public function test_get__adds_up_the_visitors_of_a_static_homepage() {
		$homepage_id = $this->factory()->post->create(
			array(
				'post_title' => 'Welcome',
				'post_type'  => 'page',
			)
		);
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $homepage_id );

		$this->assertSame(
			array(
				array(
					'id'       => $homepage_id,
					'title'    => 'Welcome',
					'url'      => 'http://example.org/',
					'pagePath' => '/',
					'visitors' => 65,
				),
			),
			$this->get(
				array(
					'/'                       => 45,
					"/?page_id=$homepage_id"  => 15,
					'/?utm_source=newsletter' => 5,
				)
			),
			'A static homepage should count the visitors of the home path, of its own page path and of a URL with no public query var.'
		);
	}

	/**
	 * @dataProvider data_empty_query_vars
	 *
	 * @param string $page_path   A page path whose public query var has an empty value, such as `/?product=`.
	 * @param string $shown_label What WordPress shows at the page path, for the assertion message.
	 */
	public function test_get__returns_no_post_for_an_empty_query_var_with_a_static_homepage( $page_path, $shown_label ) {
		// Without its empty query var, the page path would be `/`, which shows the
		// static homepage.
		$homepage_id = $this->factory()->post->create( array( 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $homepage_id );

		$this->assertSame( array(), $this->get( array( $page_path => 10 ) ), "The page path $page_path should not count for any post, because WordPress shows $shown_label there, not the static homepage." );
	}

	public function data_empty_query_vars() {
		return array(
			'search'            => array( '/?s=', 'search results' ),
			'product query var' => array( '/?product=', 'the latest posts' ),
		);
	}

	public function test_get__returns_a_page_at_a_woocommerce_endpoint() {
		$checkout_id = $this->factory()->post->create(
			array(
				'post_title' => 'Checkout',
				'post_type'  => 'page',
			)
		);

		// WooCommerce adds `order-received` as a public query var this way. The
		// order key, `key`, isn't one.
		add_filter(
			'query_vars',
			function ( $query_vars ) {
				$query_vars[] = 'order-received';
				return $query_vars;
			}
		);

		$this->assertSame(
			array(
				array(
					'id'       => $checkout_id,
					'title'    => 'Checkout',
					'url'      => "http://example.org/?page_id=$checkout_id",
					'pagePath' => "/?page_id=$checkout_id",
					'visitors' => 10,
				),
			),
			$this->get( array( "/?page_id=$checkout_id&order-received=123&key=wc_order_Xy7" => 10 ) ),
			'The order received endpoint of the checkout page should count for the checkout page, with no order number or order key in its page path.'
		);
	}

	public function test_get__returns_no_post_for_the_latest_posts_on_the_home_page() {
		$this->factory()->post->create( array( 'post_title' => 'Travel tips' ) );
		update_option( 'show_on_front', 'posts' );

		$this->assertSame( array(), $this->get( array( '/' => 10 ) ), 'The home path should not count for any post, because it shows the latest posts.' );
	}

	public function test_get__returns_no_post_for_the_posts_page() {
		// The posts page lists this post, so only the check for a single post
		// can make the page path count for no post.
		$this->factory()->post->create( array( 'post_title' => 'Travel tips' ) );
		$homepage_id   = $this->factory()->post->create( array( 'post_type' => 'page' ) );
		$posts_page_id = $this->factory()->post->create( array( 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $homepage_id );
		update_option( 'page_for_posts', $posts_page_id );

		$this->assertSame( array(), $this->get( array( "/?page_id=$posts_page_id" => 10 ) ), 'The posts page should not count for any post, because it lists the latest posts.' );
	}

	public function test_get__returns_no_post_for_the_woocommerce_shop_page() {
		// The fake declares `wc_get_page_id()`, as an active WooCommerce does.
		require_once TESTS_PLUGIN_DIR . '/tests/phpunit/includes/wc-function-fakes.php';

		$shop_id = $this->factory()->post->create(
			array(
				'post_title' => 'Shop',
				'post_type'  => 'page',
			)
		);
		update_option( 'woocommerce_shop_page_id', $shop_id );

		$this->assertSame( array(), $this->get( array( "/?page_id=$shop_id" => 10 ) ), 'The WooCommerce shop page should not count for any post, because WooCommerce shows the product archive there.' );
	}

	public function test_get__returns_no_post_for_the_woocommerce_shop_page_as_the_static_homepage() {
		// The fake declares `wc_get_page_id()`, as an active WooCommerce does.
		require_once TESTS_PLUGIN_DIR . '/tests/phpunit/includes/wc-function-fakes.php';

		$shop_id = $this->factory()->post->create(
			array(
				'post_title' => 'Shop',
				'post_type'  => 'page',
			)
		);
		update_option( 'woocommerce_shop_page_id', $shop_id );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $shop_id );

		$this->assertSame( array(), $this->get( array( '/' => 10 ) ), 'The home path should not count for any post, because the static homepage is the WooCommerce shop page.' );
	}

	/**
	 * @dataProvider data_page_paths_of_no_single_post
	 *
	 * @param string $page_path A page path that shows no single post, such as `/?s=hats`.
	 */
	public function test_get__returns_no_post_for_a_page_path_that_shows_no_single_post( $page_path ) {
		// The search and each archive list one of these posts, so the test fails
		// without the check for a single post. No post has the ID `999999`.
		$this->factory()->post->create(
			array(
				'post_title'  => 'Summer hats',
				'post_author' => 1,
			)
		);
		$this->factory()->post->create(
			array(
				'post_title' => 'Hoodie',
				'post_type'  => 'product',
			)
		);

		$this->assertSame( array(), $this->get( array( $page_path => 10 ) ), "The page path $page_path should not count for any post." );
	}

	public function data_page_paths_of_no_single_post() {
		return array(
			'search'           => array( '/?s=hats' ),
			'category archive' => array( '/?cat=1' ),
			'product archive'  => array( '/?post_type=product' ),
			'author archive'   => array( '/?author=1' ),
			'missing post'     => array( '/?p=999999' ),
		);
	}

	public function test_get__runs_no_posts_query_for_a_search() {
		$this->factory()->post->create( array( 'post_title' => 'Summer hats' ) );

		$posts_queries = 0;

		add_filter(
			'posts_request',
			function ( $sql ) use ( &$posts_queries ) {
				$posts_queries++;
				return $sql;
			}
		);

		$this->get( array( '/?s=hats' => 10 ) );

		$this->assertSame( 0, $posts_queries, 'A search should run no posts query, because it shows no single post.' );
	}

	/**
	 * Other tests load the WooCommerce function fakes, which declare
	 * `wc_get_page_id()` until the process ends. So this test runs in a process
	 * of its own.
	 *
	 * @runInSeparateProcess
	 */
	public function test_get__returns_a_page_with_woocommerce_inactive() {
		$page_id = $this->factory()->post->create(
			array(
				'post_title' => 'About',
				'post_type'  => 'page',
			)
		);

		$this->assertSame(
			array(
				array(
					'id'       => $page_id,
					'title'    => 'About',
					'url'      => "http://example.org/?page_id=$page_id",
					'pagePath' => "/?page_id=$page_id",
					'visitors' => 10,
				),
			),
			$this->get( array( "/?page_id=$page_id" => 10 ) ),
			'A page should count for that page where WooCommerce is inactive, with no `wc_get_page_id()` function.'
		);
	}

	/**
	 * @dataProvider data_unpublished_post_statuses
	 *
	 * @param string $post_status A status other than `publish`, such as `draft`.
	 */
	public function test_get__returns_no_post_for_a_post_that_is_not_published( $post_status ) {
		$post_id = $this->factory()->post->create(
			array(
				'post_status' => $post_status,
				'post_date'   => 'future' === $post_status ? '2099-01-01 00:00:00' : '',
			)
		);

		$this->assertSame( array(), $this->get( array( "/?p=$post_id" => 10 ) ), "A post with the $post_status status should not count for any post." );
	}

	public function data_unpublished_post_statuses() {
		return array(
			'draft'     => array( 'draft' ),
			'pending'   => array( 'pending' ),
			'private'   => array( 'private' ),
			'scheduled' => array( 'future' ),
		);
	}

	public function test_get__returns_no_post_for_a_post_of_a_type_that_is_not_viewable() {
		register_post_type( 'invoice', array( 'public' => false ) );

		$post_id = $this->factory()->post->create( array( 'post_type' => 'invoice' ) );

		// `/?p=<ID>` finds only a `post`, so the action below stands for a plugin
		// that changes the post type. Then only the check of a viewable post type
		// makes the invoice count for no post.
		add_action(
			'pre_get_posts',
			fn ( $query ) => $query->set( 'post_type', 'invoice' )
		);

		$this->assertSame( array(), $this->get( array( "/?p=$post_id" => 10 ) ), 'A post of a type that is not viewable should not count for any post, even where another plugin adds that type to the query.' );
	}

	public function test_get__returns_the_title_as_plain_text() {
		// `wptexturize()` curls the `'` of this title, so the expected title has `’`.
		$post_id = $this->factory()->post->create( array( 'post_title' => "Tips & tricks: don't <em>miss</em> it" ) );

		$top_posts = $this->get( array( "/?p=$post_id" => 10 ) );

		$this->assertSame( 'Tips & tricks: don’t miss it', $top_posts[0]['title'], 'The title should be plain text, with its tags stripped and its entities decoded.' );
	}

	public function test_get__returns_the_title_of_a_protected_post_with_no_prefix() {
		// Outside the admin, `get_the_title()` would add "Protected: " to this title.
		$post_id = $this->factory()->post->create(
			array(
				'post_title'    => 'Members only',
				'post_password' => 'secret',
			)
		);

		$top_posts = $this->get( array( "/?p=$post_id" => 10 ) );

		$this->assertSame( 'Members only', $top_posts[0]['title'], 'The title of a protected post should have no "Protected:" prefix.' );
	}

	public function test_get__returns_an_empty_title_and_the_page_path_for_a_post_with_no_title() {
		$post_id = $this->factory()->post->create( array( 'post_title' => '' ) );

		$top_posts = $this->get( array( "/?p=$post_id&utm_source=newsletter" => 10 ) );

		$this->assertSame(
			array(
				'title'    => '',
				'pagePath' => "/?p=$post_id",
			),
			array(
				'title'    => $top_posts[0]['title'],
				'pagePath' => $top_posts[0]['pagePath'],
			),
			'A post with no title should have an empty title, and the path of its permalink as its page path.'
		);
	}

	public function test_get__returns_the_posts_with_the_most_visitors_first_up_to_the_limit() {
		$first_post_id  = $this->factory()->post->create();
		$second_post_id = $this->factory()->post->create();
		$third_post_id  = $this->factory()->post->create( array( 'post_content' => 'Packing<!--nextpage-->Flights' ) );

		// Each of the third post's two page paths has fewer visitors than the first
		// post's 30, but together they have 31.
		$top_posts = $this->get(
			array(
				"/?p=$first_post_id"        => 30,
				"/?p=$third_post_id&page=2" => 26,
				"/?p=$second_post_id"       => 20,
				"/?p=$third_post_id"        => 5,
			),
			2
		);

		$this->assertSame(
			array(
				$third_post_id => 31,
				$first_post_id => 30,
			),
			array_column( $top_posts, 'visitors', 'id' ),
			'The posts should come most visitors first, after the visitors of their page paths add up, and no more of them than the limit.'
		);
	}

	public function test_get__returns_posts_with_equal_visitors_in_the_order_of_their_page_paths_in_the_report() {
		// PHP 7.4 keeps equal items in order in a list of up to 16, so the test
		// uses 20 posts.
		$post_ids = $this->factory()->post->create_many( 20 );
		$post_ids = array_reverse( $post_ids );

		$top_posts = $this->get(
			array_fill_keys(
				array_map( fn ( $post_id ) => "/?p=$post_id", $post_ids ),
				10
			),
			20
		);

		$this->assertSame( $post_ids, array_column( $top_posts, 'id' ), 'Posts with equal visitors, each with one page path, should come in the order of their page paths in the report.' );
	}

	public function test_get__returns_posts_with_equal_visitors_in_the_order_of_their_page_paths_with_the_most_visitors() {
		// Each post has two pages. The second post is created first, so it has the
		// lower ID.
		$second_post_id = $this->factory()->post->create( array( 'post_content' => 'Packing<!--nextpage-->Flights' ) );
		$first_post_id  = $this->factory()->post->create( array( 'post_content' => 'Packing<!--nextpage-->Flights' ) );

		// Both posts have 8 visitors. An order by ID, or by the visitors of the second
		// page, would put the second post first.
		$top_posts = $this->get(
			array(
				"/?p=$first_post_id"         => 7,
				"/?p=$second_post_id"        => 5,
				"/?p=$second_post_id&page=2" => 3,
				"/?p=$first_post_id&page=2"  => 1,
			)
		);

		$this->assertSame( array( $first_post_id, $second_post_id ), array_column( $top_posts, 'id' ), 'Posts with equal visitors should come in the order of their page paths with the most visitors.' );
	}

	/**
	 * @dataProvider data_page_path_positions
	 *
	 * @param string $position_label     The position of the post's page path by visitors, for the assertion message.
	 * @param int    $missing_page_paths The number of page paths with more visitors than the post's, each of a missing post.
	 * @param bool   $is_looked_up       Whether the post's page path is among those looked up.
	 */
	public function test_get__looks_up_only_the_50_page_paths_with_the_most_visitors( $position_label, $missing_page_paths, $is_looked_up ) {
		$post_id         = $this->factory()->post->create();
		$visitors_by_url = array();

		// No post has an ID from `999901` on.
		for ( $position = 1; $position <= $missing_page_paths; $position++ ) {
			$visitors_by_url[ '/?p=' . ( 999900 + $position ) ] = 1000 - $position;
		}

		$visitors_by_url[ "/?p=$post_id" ] = 1;

		$this->assertSame(
			$is_looked_up ? array( $post_id ) : array(),
			array_column( $this->get( $visitors_by_url ), 'id' ),
			"The $position_label page path by visitors should be looked up only where it is among the first 50."
		);
	}

	public function data_page_path_positions() {
		return array(
			'the 50th page path' => array( '50th', 49, true ),
			'the 51st page path' => array( '51st', 50, false ),
		);
	}

	public function test_get__adds_up_the_visitors_of_the_urls_of_a_page_path_before_it_picks_the_50_page_paths_with_the_most_visitors() {
		$post_id         = $this->factory()->post->create();
		$visitors_by_url = array();

		// No post has an ID from `999901` on.
		for ( $position = 1; $position <= 50; $position++ ) {
			$visitors_by_url[ '/?p=' . ( 999900 + $position ) ] = 10;
		}

		for ( $source = 1; $source <= 60; $source++ ) {
			$visitors_by_url[ "/?p=$post_id&utm_source=s$source" ] = 1;
		}

		$this->assertSame( array( $post_id ), array_column( $this->get( $visitors_by_url ), 'id' ), 'A post whose URLs together have the most visitors should be looked up, even when each URL has fewer visitors than the 50th page path.' );
	}
}
