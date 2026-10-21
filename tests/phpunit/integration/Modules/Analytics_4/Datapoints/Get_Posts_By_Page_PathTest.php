<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Posts_By_Page_PathTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Posts_By_Page_Path;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Posts_By_Page_PathTest extends TestCase {

	/**
	 * Get_Posts_By_Page_Path datapoint instance.
	 *
	 * @var Get_Posts_By_Page_Path
	 */
	private $datapoint;

	public function set_up() {
		parent::set_up();

		// An administrator can read a draft, so a draft that comes back as
		// `null` proves the datapoint's own check of the post status.
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );

		$this->set_permalink_structure( '' );

		// WooCommerce registers `product` with the query var `product`, and a
		// public custom post type gets its own name as its query var.
		register_post_type( 'product', array( 'public' => true ) );
		register_post_type( 'book', array( 'public' => true ) );

		$this->datapoint = new Get_Posts_By_Page_Path( array() );
	}

	public function tear_down() {
		unregister_post_type( 'product' );
		unregister_post_type( 'book' );

		parent::tear_down();
	}

	/**
	 * Builds the data request of a lookup of the given page paths.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $page_paths The `pagePaths` parameter, as the request sends it.
	 * @return Data_Request The data request.
	 */
	private function data_request( $page_paths ) {
		return new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'posts-by-page-path',
			array( 'pagePaths' => $page_paths )
		);
	}

	/**
	 * Loads the WooCommerce function fakes, such as `wc_get_page_id()`.
	 *
	 * Every caller needs the `runInSeparateProcess` annotation, because PHP holds
	 * the global `wc_get_page_id()` function for the rest of the process once the
	 * fake declares it.
	 *
	 * @since n.e.x.t
	 */
	private function activate_woocommerce() {
		require_once TESTS_PLUGIN_DIR . '/tests/phpunit/includes/wc-function-fakes.php';
	}

	/**
	 * Gets the data the datapoint returns for a post.
	 *
	 * @since n.e.x.t
	 *
	 * @param int    $post_id The post ID.
	 * @param string $title   The title the datapoint returns, as plain text.
	 * @return array The post's `id`, `title` and `url`.
	 */
	private function post_data( $post_id, $title ) {
		return array(
			'id'    => $post_id,
			'title' => $title,
			'url'   => get_permalink( $post_id ),
		);
	}

	/**
	 * @dataProvider data_single_posts
	 *
	 * @param string $post_label       The kind of single post, for the assertion message.
	 * @param array  $post_args        The arguments the post is created with.
	 * @param string $page_path_format The page path, with `%d` for the post ID.
	 */
	public function test_create_request__returns_a_published_single_post( $post_label, $post_args, $page_path_format ) {
		$post_id   = $this->factory()->post->create( $post_args );
		$page_path = sprintf( $page_path_format, $post_id );

		$request = $this->datapoint->create_request( $this->data_request( array( $page_path ) ) );

		$this->assertSame(
			array( $page_path => $this->post_data( $post_id, $post_args['post_title'] ) ),
			$request(),
			"The page path of $post_label should map to that post."
		);
	}

	public function data_single_posts() {
		return array(
			'post'                                      => array(
				'a post',
				array( 'post_title' => 'Travel tips' ),
				'/?p=%d',
			),
			'page'                                      => array(
				'a page',
				array(
					'post_title' => 'About',
					'post_type'  => 'page',
				),
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
			),
			'custom post type, by its query var'        => array(
				'a post of a public custom post type, by its query var,',
				array(
					'post_title' => 'Dune',
					'post_name'  => 'dune',
					'post_type'  => 'book',
				),
				'/?book=dune',
			),
			'custom post type, by its post type and ID' => array(
				'a post of a public custom post type, by its post type and ID,',
				array(
					'post_title' => 'Dune',
					'post_name'  => 'dune',
					'post_type'  => 'book',
				),
				'/?post_type=book&p=%d',
			),
		);
	}

	public function test_create_request__returns_an_attachment_page() {
		$post_id       = $this->factory()->post->create( array( 'post_title' => 'Travel tips' ) );
		$attachment_id = $this->factory()->attachment->create(
			array(
				'file'           => 'map.jpg',
				'post_parent'    => $post_id,
				'post_title'     => 'Map',
				'post_mime_type' => 'image/jpeg',
			)
		);
		$page_path     = "/?attachment_id=$attachment_id";

		$request = $this->datapoint->create_request( $this->data_request( array( $page_path ) ) );

		$this->assertSame(
			array( $page_path => $this->post_data( $attachment_id, 'Map' ) ),
			$request(),
			'The page path of an attachment page should map to the attachment, because its parent post is published.'
		);
	}

	public function test_create_request__returns_null_for_an_attachment_of_a_draft() {
		$post_id       = $this->factory()->post->create( array( 'post_status' => 'draft' ) );
		$attachment_id = $this->factory()->attachment->create(
			array(
				'file'           => 'map.jpg',
				'post_parent'    => $post_id,
				'post_title'     => 'Map',
				'post_mime_type' => 'image/jpeg',
			)
		);
		$page_path     = "/?attachment_id=$attachment_id";

		$request = $this->datapoint->create_request( $this->data_request( array( $page_path ) ) );

		$this->assertSame( array( $page_path => null ), $request(), 'The attachment page of a draft should map to no post, because the attachment takes the status of its parent post.' );
	}

	public function test_create_request__maps_each_url_of_one_post_to_that_post() {
		// The "Page Break" block saves `<!--nextpage-->`, which splits the post
		// into two pages, so `page=2` shows its second page.
		$post_id    = $this->factory()->post->create(
			array(
				'post_title'   => 'Travel tips',
				'post_content' => 'Packing<!--nextpage-->Flights',
			)
		);
		$page_paths = array(
			"/?p=$post_id",
			"/?p=$post_id&utm_source=newsletter",
			"/index.php?p=$post_id",
			"/?p=$post_id&page=2",
		);

		$request = $this->datapoint->create_request( $this->data_request( $page_paths ) );

		$this->assertSame(
			array_fill_keys( $page_paths, $this->post_data( $post_id, 'Travel tips' ) ),
			$request(),
			'Each URL of a post should map to that post, with a campaign query arg, with `index.php` and on its second page.'
		);
	}

	public function test_create_request__maps_the_home_path_to_a_static_homepage() {
		$homepage_id = $this->factory()->post->create(
			array(
				'post_title' => 'Welcome',
				'post_type'  => 'page',
			)
		);
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $homepage_id );

		$request = $this->datapoint->create_request( $this->data_request( array( '/', "/?page_id=$homepage_id" ) ) );

		$this->assertSame(
			array(
				'/'                      => $this->post_data( $homepage_id, 'Welcome' ),
				"/?page_id=$homepage_id" => $this->post_data( $homepage_id, 'Welcome' ),
			),
			$request(),
			'The home path and the page ID of a static homepage should both map to that page.'
		);
	}

	public function test_create_request__maps_a_woocommerce_endpoint_to_its_page() {
		$checkout_id = $this->factory()->post->create(
			array(
				'post_title' => 'Checkout',
				'post_type'  => 'page',
			)
		);
		$page_path   = "/?page_id=$checkout_id&order-received=123";

		// WooCommerce adds each endpoint, such as `order-received`, as a public
		// query var through the `query_vars` filter.
		add_filter(
			'query_vars',
			function ( $query_vars ) {
				$query_vars[] = 'order-received';
				return $query_vars;
			}
		);

		$request = $this->datapoint->create_request( $this->data_request( array( $page_path ) ) );

		$this->assertSame(
			array( $page_path => $this->post_data( $checkout_id, 'Checkout' ) ),
			$request(),
			'The order received endpoint of the checkout page should map to the checkout page.'
		);
	}

	public function test_create_request__returns_null_for_the_latest_posts_on_the_home_page() {
		$this->factory()->post->create( array( 'post_title' => 'Travel tips' ) );
		update_option( 'show_on_front', 'posts' );

		$request = $this->datapoint->create_request( $this->data_request( array( '/' ) ) );

		$this->assertSame( array( '/' => null ), $request(), 'The home path should map to no post, because it shows the latest posts.' );
	}

	public function test_create_request__returns_null_for_the_posts_page() {
		// The posts page lists this post, so only the check for a single post
		// can make the page path map to no post.
		$this->factory()->post->create( array( 'post_title' => 'Travel tips' ) );
		$homepage_id   = $this->factory()->post->create( array( 'post_type' => 'page' ) );
		$posts_page_id = $this->factory()->post->create( array( 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $homepage_id );
		update_option( 'page_for_posts', $posts_page_id );
		$page_path = "/?page_id=$posts_page_id";

		$request = $this->datapoint->create_request( $this->data_request( array( $page_path ) ) );

		$this->assertSame( array( $page_path => null ), $request(), 'The posts page should map to no post, because it lists the latest posts.' );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_create_request__returns_null_for_the_woocommerce_shop_page() {
		$this->activate_woocommerce();

		$shop_id = $this->factory()->post->create(
			array(
				'post_title' => 'Shop',
				'post_type'  => 'page',
			)
		);
		update_option( 'woocommerce_shop_page_id', $shop_id );
		$page_path = "/?page_id=$shop_id";

		$request = $this->datapoint->create_request( $this->data_request( array( $page_path ) ) );

		$this->assertSame( array( $page_path => null ), $request(), 'The WooCommerce shop page should map to no post, because WooCommerce shows the product archive there.' );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_create_request__returns_null_for_the_woocommerce_shop_page_as_the_static_homepage() {
		$this->activate_woocommerce();

		$shop_id = $this->factory()->post->create(
			array(
				'post_title' => 'Shop',
				'post_type'  => 'page',
			)
		);
		update_option( 'woocommerce_shop_page_id', $shop_id );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $shop_id );

		$request = $this->datapoint->create_request( $this->data_request( array( '/' ) ) );

		$this->assertSame( array( '/' => null ), $request(), 'The home path should map to no post, because the static homepage is the WooCommerce shop page.' );
	}

	/**
	 * @dataProvider data_page_paths_of_no_single_post
	 *
	 * @param string $page_path A page path that shows no single post, such as `/?s=hats`.
	 */
	public function test_create_request__returns_null_for_a_page_path_that_shows_no_single_post( $page_path ) {
		// The search, both archives and the author archive each list one of
		// these posts, so only the check for a single post can make the page
		// path map to no post.
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

		$request = $this->datapoint->create_request( $this->data_request( array( $page_path ) ) );

		$this->assertSame( array( $page_path => null ), $request(), "The page path $page_path should map to no post." );
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

	public function test_create_request__runs_no_posts_query_for_a_search() {
		$this->factory()->post->create( array( 'post_title' => 'Summer hats' ) );

		$posts_queries = 0;

		add_filter(
			'posts_request',
			function ( $sql ) use ( &$posts_queries ) {
				$posts_queries++;
				return $sql;
			}
		);

		$request = $this->datapoint->create_request( $this->data_request( array( '/?s=hats' ) ) );
		$request();

		$this->assertSame( 0, $posts_queries, 'A search should run no posts query, because it shows no single post.' );
	}

	/**
	 * Other test files load the WooCommerce function fakes as the suite loads,
	 * and a separate process copies the files the suite loaded unless it keeps
	 * no global state. So this test keeps none, to run with no `wc_get_page_id()`.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_create_request__returns_a_page_with_woocommerce_inactive() {
		$page_id   = $this->factory()->post->create(
			array(
				'post_title' => 'About',
				'post_type'  => 'page',
			)
		);
		$page_path = "/?page_id=$page_id";

		$request = $this->datapoint->create_request( $this->data_request( array( $page_path ) ) );

		$this->assertSame(
			array( $page_path => $this->post_data( $page_id, 'About' ) ),
			$request(),
			'A page should map to that page where WooCommerce is inactive, with no `wc_get_page_id()` function.'
		);
	}

	/**
	 * @dataProvider data_unpublished_post_statuses
	 *
	 * @param string $post_status A status other than `publish`, such as `draft`.
	 */
	public function test_create_request__returns_null_for_a_post_that_is_not_published( $post_status ) {
		$post_id   = $this->factory()->post->create(
			array(
				'post_status' => $post_status,
				'post_date'   => 'future' === $post_status ? '2099-01-01 00:00:00' : '',
			)
		);
		$page_path = "/?p=$post_id";

		$request = $this->datapoint->create_request( $this->data_request( array( $page_path ) ) );

		$this->assertSame( array( $page_path => null ), $request(), "A post with the $post_status status should map to no post." );
	}

	public function data_unpublished_post_statuses() {
		return array(
			'draft'     => array( 'draft' ),
			'pending'   => array( 'pending' ),
			'private'   => array( 'private' ),
			'scheduled' => array( 'future' ),
		);
	}

	public function test_create_request__returns_null_for_a_post_of_a_type_that_is_not_viewable() {
		register_post_type( 'invoice', array( 'public' => false ) );

		$post_id   = $this->factory()->post->create( array( 'post_type' => 'invoice' ) );
		$page_path = "/?p=$post_id";

		// `WP_Query_Factory` leaves a post type that isn't publicly queryable out
		// of the query, but another plugin can still add it through
		// `pre_get_posts`.
		add_action(
			'pre_get_posts',
			fn ( $query ) => $query->set( 'post_type', 'invoice' )
		);

		$request = $this->datapoint->create_request( $this->data_request( array( $page_path ) ) );

		$this->assertSame( array( $page_path => null ), $request(), 'A post of a type that is not viewable should map to no post, even where another plugin adds that type to the query.' );

		unregister_post_type( 'invoice' );
	}

	public function test_create_request__returns_null_for_a_url_of_another_site() {
		$post_id   = $this->factory()->post->create();
		$page_path = "//example.com/?p=$post_id";

		$request = $this->datapoint->create_request( $this->data_request( array( $page_path ) ) );

		$this->assertSame( array( $page_path => null ), $request(), 'A URL of another host should map to no post, even where its query names a post of this site.' );
	}

	public function test_create_request__returns_the_title_as_plain_text() {
		// `wptexturize()`, which runs on the `the_title` filter, turns `'` into
		// `&#8217;` and `&` into `&#038;`, so the datapoint decodes both.
		$post_id   = $this->factory()->post->create( array( 'post_title' => "Tips & tricks: don't <em>miss</em> it" ) );
		$page_path = "/?p=$post_id";

		$request = $this->datapoint->create_request( $this->data_request( array( $page_path ) ) );

		$this->assertSame( 'Tips & tricks: don’t miss it', $request()[ $page_path ]['title'], 'The title should be plain text, with its tags stripped and its entities decoded.' );
	}

	public function test_create_request__returns_the_title_of_a_protected_post_with_no_prefix() {
		// Outside the admin, `get_the_title()` would add "Protected: " to this title.
		$post_id   = $this->factory()->post->create(
			array(
				'post_title'    => 'Members only',
				'post_password' => 'secret',
			)
		);
		$page_path = "/?p=$post_id";

		$request = $this->datapoint->create_request( $this->data_request( array( $page_path ) ) );

		$this->assertSame( 'Members only', $request()[ $page_path ]['title'], 'The title of a protected post should have no "Protected:" prefix.' );
	}

	public function test_create_request__returns_an_empty_title_for_a_post_with_no_title() {
		$post_id   = $this->factory()->post->create( array( 'post_title' => '' ) );
		$page_path = "/?p=$post_id";

		$request = $this->datapoint->create_request( $this->data_request( array( $page_path ) ) );

		$this->assertSame( '', $request()[ $page_path ]['title'], 'A post with no title should have an empty title.' );
	}

	/**
	 * @dataProvider data_missing_page_paths
	 *
	 * @param mixed $page_paths A `pagePaths` parameter with no page path, such as `null`.
	 */
	public function test_create_request__throws_when_page_paths_are_missing( $page_paths ) {
		$this->expectException( Missing_Required_Param_Exception::class );

		$this->datapoint->create_request( $this->data_request( $page_paths ) );
	}

	public function data_missing_page_paths() {
		return array(
			'no parameter'  => array( null ),
			'an empty list' => array( array() ),
		);
	}

	/**
	 * @dataProvider data_invalid_page_paths
	 *
	 * @param mixed $page_paths A `pagePaths` parameter that isn't a list of page paths, such as `/?p=1`.
	 */
	public function test_create_request__throws_for_invalid_page_paths( $page_paths ) {
		$this->expectException( Invalid_Param_Exception::class );
		$this->expectExceptionMessage( 'Invalid parameter: pagePaths.' );

		$this->datapoint->create_request( $this->data_request( $page_paths ) );
	}

	public function data_invalid_page_paths() {
		return array(
			'a string'                   => array( '/?p=1' ),
			'a value that is not a path' => array( array( '?p=1' ) ),
			// A query string can send a list in place of a page path, such as
			// `pagePaths[0][]=/?p=1`.
			'a page path that is a list' => array( array( array( '/?p=1' ) ) ),
			'51 page paths'              => array( array_fill( 0, 51, '/?p=1' ) ),
		);
	}

	public function test_create_request__looks_up_50_page_paths() {
		$page_paths = array_map( fn ( $post_id ) => "/?p=$post_id", range( 1, 50 ) );

		$request = $this->datapoint->create_request( $this->data_request( $page_paths ) );

		$this->assertCount( 50, $request(), 'A request should look up each of 50 page paths, because 50 is the most one request can look up.' );
	}

	public function test_is_shareable__returns_true() {
		$this->assertTrue( $this->datapoint->is_shareable(), 'The datapoint should be shareable, so a view-only user sees the same rows.' );
	}

	public function test_parse_response__returns_the_response_unchanged() {
		$response = array( '/?p=1' => null );

		$this->assertSame( $response, $this->datapoint->parse_response( $response, $this->data_request( array( '/?p=1' ) ) ), 'The response should be returned unchanged.' );
	}
}
