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

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
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

		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );

		$this->set_permalink_structure( '' );

		register_post_type( 'book', array( 'public' => true ) );
		register_post_type( 'product', array( 'public' => true ) );

		$this->datapoint = new Get_Posts_By_Page_Path(
			array(
				'service' => '',
				'context' => new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ),
			)
		);
	}

	public function tear_down() {
		unregister_post_type( 'book' );
		unregister_post_type( 'product' );

		parent::tear_down();
	}

	/**
	 * Runs the datapoint's request for the given page paths.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $page_paths The page paths, such as `/?p=123`.
	 * @return array The post or `null` of each page path, keyed by the page path.
	 */
	private function get_posts_by_page_path( array $page_paths ) {
		$request = $this->datapoint->create_request(
			new Data_Request(
				'GET',
				'modules',
				'analytics-4',
				'posts-by-page-path',
				array( 'pagePaths' => $page_paths )
			)
		);

		return $request();
	}

	public function test_create_request__returns_the_post_of_every_url_of_a_post() {
		$post_id = self::factory()->post->create( array( 'post_title' => 'Hello world' ) );

		$post = array(
			'id'       => $post_id,
			'postType' => 'post',
			'title'    => 'Hello world',
			'url'      => "http://example.org/?p={$post_id}",
		);

		$this->assertSame(
			array(
				"/?p={$post_id}"                           => $post,
				"/?p={$post_id}&utm_source=newsletter"     => $post,
				"/index.php?p={$post_id}"                  => $post,
				"/?utm_source=newsletter&p={$post_id}#top" => $post,
			),
			$this->get_posts_by_page_path(
				array(
					"/?p={$post_id}",
					"/?p={$post_id}&utm_source=newsletter",
					"/index.php?p={$post_id}",
					"/?utm_source=newsletter&p={$post_id}#top",
				)
			),
			'Every URL of a post should give the post, keyed by the page path as it arrived.'
		);
	}

	public function test_create_request__returns_the_post_of_a_page_of_a_split_post() {
		$post_id = self::factory()->post->create(
			array(
				'post_title'   => 'Long read',
				'post_content' => 'Page one<!--nextpage-->Page two',
			)
		);

		$this->assertSame(
			array(
				"/?p={$post_id}&page=2" => array(
					'id'       => $post_id,
					'postType' => 'post',
					'title'    => 'Long read',
					'url'      => "http://example.org/?p={$post_id}",
				),
			),
			$this->get_posts_by_page_path( array( "/?p={$post_id}&page=2" ) ),
			'The second page of a split post should give the post.'
		);
	}

	public function test_create_request__returns_a_page() {
		$page_id = self::factory()->post->create(
			array(
				'post_title' => 'About',
				'post_type'  => 'page',
			)
		);

		$this->assertSame(
			array(
				"/?page_id={$page_id}" => array(
					'id'       => $page_id,
					'postType' => 'page',
					'title'    => 'About',
					'url'      => "http://example.org/?page_id={$page_id}",
				),
			),
			$this->get_posts_by_page_path( array( "/?page_id={$page_id}" ) ),
			'A page URL should give the page.'
		);
	}

	public function test_create_request__returns_the_post_of_a_custom_post_type() {
		$book_id = self::factory()->post->create(
			array(
				'post_title' => 'Dune',
				'post_name'  => 'dune',
				'post_type'  => 'book',
			)
		);

		$book = array(
			'id'       => $book_id,
			'postType' => 'book',
			'title'    => 'Dune',
			'url'      => 'http://example.org/?book=dune',
		);

		$this->assertSame(
			array(
				'/?book=dune'                   => $book,
				"/?post_type=book&p={$book_id}" => $book,
				'/?post_type=book&name=dune'    => $book,
			),
			$this->get_posts_by_page_path(
				array(
					'/?book=dune',
					"/?post_type=book&p={$book_id}",
					'/?post_type=book&name=dune',
				)
			),
			'Every URL of a post of a custom post type should give the post.'
		);
	}

	public function test_create_request__returns_a_product() {
		$product_id = self::factory()->post->create(
			array(
				'post_title' => 'Hoodie',
				'post_name'  => 'hoodie',
				'post_type'  => 'product',
			)
		);

		$this->assertSame(
			array(
				'/?product=hoodie&attribute_pa_color=red' => array(
					'id'       => $product_id,
					'postType' => 'product',
					'title'    => 'Hoodie',
					'url'      => 'http://example.org/?product=hoodie',
				),
			),
			$this->get_posts_by_page_path( array( '/?product=hoodie&attribute_pa_color=red' ) ),
			'The URL of a product variation should give its product.'
		);
	}

	public function test_create_request__returns_an_attachment() {
		$attachment_id = self::factory()->attachment->create_object(
			'photo.jpg',
			0,
			array(
				'post_mime_type' => 'image/jpeg',
				'post_title'     => 'Photo',
			)
		);

		$this->assertSame(
			array(
				"/?attachment_id={$attachment_id}" => array(
					'id'       => $attachment_id,
					'postType' => 'attachment',
					'title'    => 'Photo',
					'url'      => "http://example.org/?attachment_id={$attachment_id}",
				),
			),
			$this->get_posts_by_page_path( array( "/?attachment_id={$attachment_id}" ) ),
			'An attachment page URL should give the attachment.'
		);
	}

	public function test_create_request__returns_the_page_set_as_the_homepage() {
		$page_id = self::factory()->post->create(
			array(
				'post_title' => 'Welcome',
				'post_type'  => 'page',
			)
		);
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $page_id );

		$page = array(
			'id'       => $page_id,
			'postType' => 'page',
			'title'    => 'Welcome',
			'url'      => 'http://example.org/',
		);

		$this->assertSame(
			array(
				'/'                       => $page,
				'/?utm_source=newsletter' => $page,
				"/?page_id={$page_id}"    => $page,
			),
			$this->get_posts_by_page_path(
				array(
					'/',
					'/?utm_source=newsletter',
					"/?page_id={$page_id}",
				)
			),
			'The homepage URL and the URL of the page set as the homepage should give that page.'
		);
	}

	public function test_create_request__returns_null_for_the_homepage_that_shows_the_latest_posts() {
		self::factory()->post->create( array( 'post_title' => 'Hello world' ) );
		update_option( 'show_on_front', 'posts' );

		$this->assertSame(
			array( '/' => null ),
			$this->get_posts_by_page_path( array( '/' ) ),
			'The homepage should give no post when it shows the latest posts.'
		);
	}

	public function test_create_request__returns_null_for_the_posts_page() {
		$home_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$blog_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $home_id );
		update_option( 'page_for_posts', $blog_id );

		$this->assertSame(
			array( "/?page_id={$blog_id}" => null ),
			$this->get_posts_by_page_path( array( "/?page_id={$blog_id}" ) ),
			'The posts page should give no post, because it lists the latest posts.'
		);
	}

	public function test_create_request__returns_null_for_a_search_and_an_archive() {
		self::factory()->post->create( array( 'post_title' => 'Hello world' ) );

		$this->assertSame(
			array(
				'/?s=hello'  => null,
				'/?cat=1'    => null,
				'/?author=1' => null,
			),
			$this->get_posts_by_page_path( array( '/?s=hello', '/?cat=1', '/?author=1' ) ),
			'A search and an archive should give no post.'
		);
	}

	public function test_create_request__reads_a_search_with_no_database_query() {
		global $wpdb;

		$queries_before = $wpdb->num_queries;

		$this->get_posts_by_page_path( array( '/?s=hello' ) );

		$this->assertSame( 0, $wpdb->num_queries - $queries_before, 'A search URL should give no post before any database query runs.' );
	}

	public function test_create_request__returns_null_for_a_post_that_visitors_cannot_see() {
		$draft_id     = self::factory()->post->create( array( 'post_status' => 'draft' ) );
		$scheduled_id = self::factory()->post->create(
			array(
				'post_status' => 'future',
				'post_date'   => '2099-01-01 00:00:00',
			)
		);
		$private_id   = self::factory()->post->create( array( 'post_status' => 'private' ) );
		$deleted_id   = self::factory()->post->create();
		wp_delete_post( $deleted_id, true );

		$this->assertSame(
			array(
				"/?p={$draft_id}"     => null,
				"/?p={$scheduled_id}" => null,
				"/?p={$private_id}"   => null,
				"/?p={$deleted_id}"   => null,
				'/?p=999999'          => null,
			),
			$this->get_posts_by_page_path(
				array(
					"/?p={$draft_id}",
					"/?p={$scheduled_id}",
					"/?p={$private_id}",
					"/?p={$deleted_id}",
					'/?p=999999',
				)
			),
			'A draft, a scheduled post, a private post, a deleted post and an ID with no post should give no post, also to an administrator.'
		);
	}

	public function test_create_request__returns_null_for_the_woocommerce_shop_page() {
		require_once TESTS_PLUGIN_DIR . '/tests/phpunit/includes/wc-function-fakes.php';

		$shop_id = self::factory()->post->create(
			array(
				'post_title' => 'Shop',
				'post_type'  => 'page',
			)
		);
		update_option( 'woocommerce_shop_page_id', $shop_id );

		$this->assertSame(
			array( "/?page_id={$shop_id}" => null ),
			$this->get_posts_by_page_path( array( "/?page_id={$shop_id}" ) ),
			'The WooCommerce shop page should give no post, because WooCommerce lists the products there.'
		);
	}

	public function test_create_request__returns_null_for_the_woocommerce_shop_page_set_as_the_homepage() {
		require_once TESTS_PLUGIN_DIR . '/tests/phpunit/includes/wc-function-fakes.php';

		$shop_id = self::factory()->post->create(
			array(
				'post_title' => 'Shop',
				'post_type'  => 'page',
			)
		);
		update_option( 'woocommerce_shop_page_id', $shop_id );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $shop_id );

		$this->assertSame(
			array( '/' => null ),
			$this->get_posts_by_page_path( array( '/' ) ),
			'The homepage should give no post when the WooCommerce shop page is set as the homepage.'
		);
	}

	public function test_create_request__returns_the_title_as_text() {
		$post_id = self::factory()->post->create( array( 'post_title' => 'Don\'t <em>miss</em> it' ) );

		$this->assertSame(
			'Don’t miss it',
			$this->get_posts_by_page_path( array( "/?p={$post_id}" ) )[ "/?p={$post_id}" ]['title'],
			'The title should have no HTML tags and no HTML entities.'
		);
	}

	public function test_create_request__returns_the_title_of_a_password_protected_post_without_its_prefix() {
		$post_id = self::factory()->post->create(
			array(
				'post_title'    => 'Members only',
				'post_password' => 'secret',
			)
		);

		$this->assertSame(
			'Members only',
			$this->get_posts_by_page_path( array( "/?p={$post_id}" ) )[ "/?p={$post_id}" ]['title'],
			'The title of a password-protected post should have no "Protected:" prefix.'
		);
	}

	public function test_create_request__returns_an_empty_title_for_a_post_with_no_title() {
		$post_id = self::factory()->post->create( array( 'post_title' => '' ) );

		$this->assertSame(
			'',
			$this->get_posts_by_page_path( array( "/?p={$post_id}" ) )[ "/?p={$post_id}" ]['title'],
			'The title of a post with no title should be an empty string.'
		);
	}

	public function test_create_request__skips_a_value_that_is_not_a_page_path() {
		$post_id = self::factory()->post->create();

		$this->assertSame(
			array( "/?p={$post_id}" ),
			array_keys( $this->get_posts_by_page_path( array( 123, "?p={$post_id}", "/?p={$post_id}" ) ) ),
			'A value that is not a string starting with a slash should be skipped.'
		);
	}

	public function test_create_request__returns_an_error_when_page_paths_is_not_an_array() {
		$result = $this->datapoint->create_request(
			new Data_Request(
				'GET',
				'modules',
				'analytics-4',
				'posts-by-page-path',
				array( 'pagePaths' => '/?p=1' )
			)
		);

		$this->assertWPError( $result, 'A `pagePaths` value that is not an array should give an error.' );
		$this->assertSame( 'invalid_page_paths', $result->get_error_code(), 'A `pagePaths` value that is not an array should give the `invalid_page_paths` error.' );
		$this->assertSame( array( 'status' => 400 ), $result->get_error_data(), 'A `pagePaths` value that is not an array should give a 400 status.' );
	}

	public function test_create_request__returns_an_error_for_more_than_50_page_paths() {
		$result = $this->datapoint->create_request(
			new Data_Request(
				'GET',
				'modules',
				'analytics-4',
				'posts-by-page-path',
				array( 'pagePaths' => array_fill( 0, 51, '/?p=1' ) )
			)
		);

		$this->assertWPError( $result, 'More than 50 page paths should give an error.' );
		$this->assertSame( 'invalid_page_paths', $result->get_error_code(), 'More than 50 page paths should give the `invalid_page_paths` error.' );
	}

	public function test_is_shareable() {
		$this->assertTrue( $this->datapoint->is_shareable(), 'The datapoint should be shareable, so a view-only user of a shared dashboard can read it.' );
	}

	public function test_permission_callback__allows_a_user_who_can_view_the_dashboard() {
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'subscriber' ) ) );
		add_filter(
			'map_meta_cap',
			fn ( $caps, $cap ) => Permissions::VIEW_DASHBOARD === $cap ? array( 'exist' ) : $caps,
			99,
			2
		);

		$this->assertTrue( $this->datapoint->permission_callback(), 'A user who can view the dashboard should be allowed.' );
	}

	public function test_permission_callback__denies_a_user_who_cannot_view_the_dashboard() {
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$this->assertFalse( $this->datapoint->permission_callback(), 'A user who cannot view the dashboard should be denied.' );
	}

	public function test_parse_response() {
		$response = array( '/?p=1' => null );

		$this->assertSame(
			array( '/?p=1' => null ),
			$this->datapoint->parse_response(
				$response,
				new Data_Request( 'GET', 'modules', 'analytics-4', 'posts-by-page-path', array() )
			),
			'The response should pass through unchanged.'
		);
	}
}
