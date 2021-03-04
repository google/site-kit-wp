<?php
/**
 * Class Google\Site_Kit\Tests\Core\Util\Synthetic_WP_QueryTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Synthetic_WP_Query;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Synthetic_WP_QueryTest extends TestCase {

	public function test_parse_query() {
		$query_args = array(
			'post_type'      => 'page',
			'post_status'    => 'publish',
			'posts_per_page' => 3,
		);

		$query = new Synthetic_WP_Query();

		// After parsing initial query, query vars should be populated.
		$query->parse_query( $query_args );
		$this->assertNotEmpty( $query->query_vars );

		// Set query vars to empty array to check below that it's not re-populated.
		$query->query_vars = array();

		// When parsing query again (by relying on `$query` property), the logic shouldn't run.
		$query->parse_query();
		$this->assertEmpty( $query->query_vars );

		// When providing the same query again, the logic shouldn't run.
		$query->parse_query( $query_args );
		$this->assertEmpty( $query->query_vars );

		// When setting a different `$query` property and parsing query, the logic should run.
		$query->query = array( 'post_type' => 'attachment' );
		$query->parse_query();
		$this->assertNotEmpty( $query->query_vars );
	}

	public function test_get_posts_no_404() {
		// Set up query without 404 detection enabled (default).
		$query = new Synthetic_WP_Query();

		// Non-existing page should not be a 404.
		$query->parse_query( array( 'pagename' => 'invalid-page-slug' ) );
		$query->get_posts();
		$this->assertTrue( $query->is_page() );
		$this->assertFalse( $query->is_404() );
	}

	public function test_get_posts_404_singular() {
		// Create regular non-paginated page.
		self::factory()->post->create(
			array(
				'post_title' => 'Non-Paginated Page',
				'post_name'  => 'non-paginated-page',
				'post_type'  => 'page',
			)
		);

		// Create paginated page.
		self::factory()->post->create(
			array(
				'post_title'   => 'Paginated Page',
				'post_name'    => 'paginated-page',
				'post_type'    => 'page',
				'post_content' => "Page 1\n<!--nextpage-->\nPage 2\n<!--nextpage-->\nPage 3",
			)
		);

		// Set up query with 404 detection enabled.
		$query = new Synthetic_WP_Query();
		$query->enable_404_detection( true );

		// Existing regular page.
		$query->parse_query( array( 'pagename' => 'non-paginated-page' ) );
		$query->get_posts();
		$this->assertTrue( $query->is_page() );
		$this->assertFalse( $query->is_404() );

		// Non-existing page.
		$query->parse_query( array( 'pagename' => 'invalid-page-slug' ) );
		$query->get_posts();
		$this->assertFalse( $query->is_page() );
		$this->assertTrue( $query->is_404() );

		// Paginated content queried without pagination.
		$query->parse_query( array( 'pagename' => 'paginated-page' ) );
		$query->get_posts();
		$this->assertTrue( $query->is_page() );
		$this->assertFalse( $query->is_404() );

		// Paginated content queried with pagination within bounds.
		$query->parse_query(
			array(
				'pagename' => 'paginated-page',
				'page'     => '3',
			)
		);
		$query->get_posts();
		$this->assertTrue( $query->is_page() );
		$this->assertFalse( $query->is_404() );

		// Paginated content queried with pagination out of bounds.
		$query->parse_query(
			array(
				'pagename' => 'paginated-page',
				'page'     => '4',
			)
		);
		$query->get_posts();
		$this->assertFalse( $query->is_page() );
		$this->assertTrue( $query->is_404() );

		// Paginated content queried with pagination when the content is not paginated at all.
		$query->parse_query(
			array(
				'pagename' => 'home',
				'page'     => '2',
			)
		);
		$query->get_posts();
		$this->assertFalse( $query->is_page() );
		$this->assertTrue( $query->is_404() );
	}

	public function test_get_posts_404_home() {
		// Create blog page and assign it.
		$blog_id = self::factory()->post->create(
			array(
				'post_title' => 'Blog',
				'post_name'  => 'blog',
				'post_type'  => 'page',
			)
		);
		update_option( 'show_on_front', 'page' );
		update_option( 'page_for_posts', $blog_id );

		// Set up query with 404 detection enabled.
		$query = new Synthetic_WP_Query();
		$query->enable_404_detection( true );

		// Blog page without pagination.
		$query->parse_query( array( 'pagename' => 'blog' ) );
		$query->get_posts();
		$this->assertTrue( $query->is_home() );
		$this->assertFalse( $query->is_404() );

		// Blog page with pagination out of bounds.
		$query->parse_query(
			array(
				'pagename' => 'blog',
				'paged'    => '2', // This would only work if there were more than 10 posts.
			)
		);
		$query->get_posts();
		$this->assertFalse( $query->is_home() );
		$this->assertTrue( $query->is_404() );
	}

	public function test_get_posts_404_taxonomy_archive() {
		// Create post in default category.
		self::factory()->post->create(
			array(
				'post_title' => 'Uncategorized Post',
				'post_name'  => 'uncategorized-post',
			)
		);

		// Create empty category.
		self::factory()->category->create(
			array(
				'name' => 'Empty category',
				'slug' => 'empty-category',
			)
		);

		// Set up query with 404 detection enabled.
		$query = new Synthetic_WP_Query();
		$query->enable_404_detection( true );

		// Category with content, without pagination.
		$query->parse_query( array( 'category_name' => 'uncategorized' ) );
		$query->get_posts();
		$this->assertTrue( $query->is_category() );
		$this->assertFalse( $query->is_404() );

		// Category without content, without pagination.
		$query->parse_query( array( 'category_name' => 'empty-category' ) );
		$query->get_posts();
		$this->assertTrue( $query->is_category() );
		$this->assertFalse( $query->is_404() );

		// Non-existing category, without pagination.
		$query->parse_query( array( 'category_name' => 'invalid-category-slug' ) );
		$query->get_posts();
		$this->assertFalse( $query->is_category() );
		$this->assertTrue( $query->is_404() );

		// Category with content, with pagination out of bounds.
		$query->parse_query(
			array(
				'category_name' => 'uncategorized',
				'paged'         => '2',
			)
		);
		$query->get_posts();
		$this->assertFalse( $query->is_category() );
		$this->assertTrue( $query->is_404() );
	}

	public function test_get_posts_404_author_archive() {
		// Create user with posts.
		$posts_user_id = self::factory()->user->create(
			array(
				'role'         => 'editor',
				'display_name' => 'Johnny Withposts',
				'user_login'   => 'johnnywithposts',
			)
		);
		self::factory()->post->create( array( 'post_author' => $posts_user_id ) );

		// Create user without posts.
		$noposts_user_id = self::factory()->user->create(
			array(
				'role'         => 'editor',
				'display_name' => 'Johnny Noposts',
				'user_login'   => 'johnnynoposts',
			)
		);

		// Set up query with 404 detection enabled.
		$query = new Synthetic_WP_Query();
		$query->enable_404_detection( true );

		// User with content, without pagination.
		$query->parse_query( array( 'author' => $posts_user_id ) );
		$query->get_posts();
		$this->assertTrue( $query->is_author() );
		$this->assertFalse( $query->is_404() );

		// User without content, without pagination.
		$query->parse_query( array( 'author' => $noposts_user_id ) );
		$query->get_posts();
		$this->assertTrue( $query->is_author() );
		$this->assertFalse( $query->is_404() );

		// Non-existing user, without pagination.
		$query->parse_query( array( 'author' => 6789 ) );
		$query->get_posts();
		$this->assertFalse( $query->is_author() );
		$this->assertTrue( $query->is_404() );

		// User with content, with pagination out of bounds.
		$query->parse_query(
			array(
				'author' => $posts_user_id,
				'paged'  => '2',
			)
		);
		$query->get_posts();
		$this->assertFalse( $query->is_author() );
		$this->assertTrue( $query->is_404() );
	}
}
