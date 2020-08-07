<?php
/**
 * Class Google\Site_Kit\Tests\Core\Util\Entity_FactoryTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Entity_Factory;
use Google\Site_Kit\Core\Util\Entity;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;

/**
 * @group Util
 */
class Entity_FactoryTest extends TestCase {
	use Fake_Site_Connection_Trait;

	private static $orig_permalink_structure;
	private static $orig_show_on_front;
	private static $orig_page_on_front;
	private static $orig_page_for_posts;
	private static $post_titles_to_ids;

	public static function wpSetUpBeforeClass( $factory ) {
		global $wp_rewrite;

		self::$orig_permalink_structure = get_option( 'permalink_structure', '' );
		$wp_rewrite->set_permalink_structure( '/blog/%postname%/' );

		// Register a custom post type and a custom taxonomy.
		register_post_type(
			'customposttype',
			array(
				'public'      => true,
				'has_archive' => true,
			)
		);
		register_taxonomy(
			'customtaxonomy',
			'post',
			array(
				'public' => true,
			)
		);

		// Set up special pages.
		$blog_id = self::factory()->post->create(
			array(
				'post_title' => 'Blog',
				'post_name'  => 'blog',
				'post_type'  => 'page',
			)
		);
		$home_id = self::factory()->post->create(
			array(
				'post_title' => 'Home',
				'post_name'  => 'home',
				'post_type'  => 'page',
			)
		);

		self::$orig_show_on_front  = get_option( 'show_on_front' );
		self::$orig_page_on_front  = get_option( 'page_on_front' );
		self::$orig_page_for_posts = get_option( 'page_for_posts' );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $home_id );
		update_option( 'page_for_posts', $blog_id );

		self::$post_titles_to_ids = array(
			'Blog' => $blog_id,
			'Home' => $home_id,
		);

		// Add more entities.
		self::$post_titles_to_ids['Some Post'] = self::factory()->post->create(
			array(
				'post_title' => 'Some Post',
				'post_name'  => 'some-post',
				'post_type'  => 'post',
			)
		);
		self::$post_titles_to_ids['Some Page'] = self::factory()->post->create(
			array(
				'post_title' => 'Some Page',
				'post_name'  => 'some-page',
				'post_type'  => 'page',
			)
		);
		self::$post_titles_to_ids['Coffee']    = self::factory()->post->create(
			array(
				'post_title' => 'Coffee',
				'post_name'  => 'coffee',
				'post_type'  => 'customposttype',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		global $wp_rewrite;

		update_option( 'show_on_front', self::$orig_show_on_front );
		update_option( 'page_on_front', self::$orig_page_on_front );
		update_option( 'page_for_posts', self::$orig_page_for_posts );

		foreach ( self::$post_titles_to_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}

		unregister_post_type( 'customposttype' );
		unregister_taxonomy( 'customtaxonomy' );

		$wp_rewrite->set_permalink_structure( self::$orig_permalink_structure );
	}

	public function test_from_context_admin() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$this->set_and_authorize_current_user( $user );

		// Set admin context.
		set_current_screen( 'dashboard' );
		$this->assertTrue( is_admin() );

		// Set up a global public post.
		$public_post_id = $this->factory()->post->create();
		( new \WP_Query( array( 'p' => $public_post_id ) ) )->the_post();
		$this->assertEquals( $public_post_id, get_post()->ID );

		// The entity is null by default.
		$this->assertNull( Entity_Factory::from_context() );

		// The post edit screen should reference the global post.
		set_current_screen( 'post.php' );
		$this->assertEntity(
			new Entity(
				get_permalink( $public_post_id ),
				array(
					'type'  => 'post',
					'title' => get_the_title( $public_post_id ),
					'id'    => $public_post_id,
				)
			),
			Entity_Factory::from_context()
		);

		// Set up a global private post.
		$private_post_id = $this->factory()->post->create( array( 'post_status' => 'private' ) );
		( new \WP_Query( array( 'p' => $private_post_id ) ) )->the_post();
		$this->assertEquals( $private_post_id, get_post()->ID );

		// The entity is null despite editing a post, because that post is private.
		$this->assertNull( Entity_Factory::from_context() );
	}

	public function test_from_context_frontend() {
		global $wp_the_query;

		$this->assertFalse( is_admin() );

		// The entity is null by default (no main `WP_Query` available).
		$wp_the_query = null;
		$this->assertNull( Entity_Factory::from_context() );

		// Set up main `WP_Query` to query default 'posts' home page archive.
		update_option( 'show_on_front', 'posts' );
		$wp_the_query = new \WP_Query();
		$wp_the_query->query( array() );
		$this->assertFalse( $wp_the_query->is_singular() );
		$this->assertTrue( $wp_the_query->is_home() );
		$this->assertTrue( $wp_the_query->is_front_page() );

		// Ensure that query instance is used (thus returns the home 'blog' entity).
		$this->assertEntity(
			new Entity(
				user_trailingslashit( home_url() ),
				array(
					'type'  => 'blog',
					'title' => 'Home',
				)
			),
			Entity_Factory::from_context()
		);
	}

	public function test_from_url() {
		// URL is not part of the site.
		$this->assertNull( Entity_Factory::from_url( 'https://www.google.com' ) );

		// Set 'show_on_front' to 'posts' home page archive.
		update_option( 'show_on_front', 'posts' );

		// Expect home 'blog' entity for home URL (and the above 'show_on_front').
		$this->assertEntity(
			new Entity(
				user_trailingslashit( home_url() ),
				array(
					'type'  => 'blog',
					'title' => 'Home',
				)
			),
			Entity_Factory::from_url( home_url() )
		);
	}

	/**
	 * @dataProvider data_from_wp_query
	 *
	 * @param array       $query_args      Query arguments.
	 * @param Entity|null $expected_entity Expected entity, or null.
	 */
	public function test_from_wp_query( array $query_args, Entity $expected_entity = null ) {
		global $wp_rewrite;

		add_filter(
			'option_home',
			function() {
				return 'https://example.com';
			}
		);

		// Run the actual query.
		$query = new \WP_Query();
		$query->query( $query_args );

		$entity = Entity_Factory::from_wp_query( $query );
		if ( $expected_entity ) {
			// Fill in post IDs because they are unknown to the data provider.
			if ( in_array( $expected_entity->get_type(), array( 'post', 'blog' ), true ) && ! $expected_entity->get_id() ) {
				$title = $expected_entity->get_title();
				if ( isset( self::$post_titles_to_ids[ $title ] ) ) {
					$this->force_set_property( $expected_entity, 'id', (int) self::$post_titles_to_ids[ $title ] );
				}
			}
			$this->assertEntity( $expected_entity, $entity );
		} else {
			$this->assertNull( $entity );
		}
	}

	public function data_from_wp_query() {
		// Home URL is 'https://example.com'.
		// Permalink structure is '/blog/%postname%/'.
		// Front page is a static page with slug 'home' and title 'Home'.
		// Posts page has the slug 'blog' and title 'Blog'.
		// There is a custom post type called 'customposttype'.
		// There is a custom taxonomy called 'customtaxonomy'.
		//
		// Additional existing entities:
		// * 'post' (post type 'post', slug 'some-post', title 'Some Post')
		// * 'post' (post type 'page', slug 'some-page', title 'Some Page')
		// * 'post' (post type 'customposttype', slug 'coffee', title 'Coffee')
		return array(
			'front page'                   => array(
				array(),
				new Entity(
					'https://example.com/',
					array(
						'type'  => 'post',
						'title' => 'Home',
						'id'    => 0, // Filled via title lookup.
					)
				),
			),
			'blog page'                    => array(
				array(
					'pagename' => 'blog',
				),
				new Entity(
					'https://example.com/blog/',
					array(
						'type'  => 'blog',
						'title' => 'Blog',
						'id'    => 0, // Filled via title lookup.
					)
				),
			),
			'blog page, page 3'            => array(
				array(
					'pagename' => 'blog',
					'paged'    => '3',
				),
				// This is wrong, should be 'https://example.com/blog/page/3/'.
				new Entity(
					'https://example.com/blog/',
					array(
						'type'  => 'blog',
						'title' => 'Blog',
						'id'    => 0, // Filled via title lookup.
					)
				),
			),
			'single post'                  => array(
				array(
					'name' => 'some-post',
				),
				new Entity(
					'https://example.com/blog/some-post/',
					array(
						'type'  => 'post',
						'title' => 'Some Post',
						'id'    => 0, // Filled via title lookup.
					)
				),
			),
			'single post, paginated'       => array(
				array(
					'name' => 'some-post',
					'page' => '2',
				),
				// This is wrong, should be 'https://example.com/blog/some-post/2/'.
				new Entity(
					'https://example.com/blog/some-post/',
					array(
						'type'  => 'post',
						'title' => 'Some Post',
						'id'    => 0, // Filled via title lookup.
					)
				),
			),
			'single page'                  => array(
				array(
					'pagename' => 'some-page',
				),
				new Entity(
					'https://example.com/some-page/',
					array(
						'type'  => 'post',
						'title' => 'Some Page',
						'id'    => 0, // Filled via title lookup.
					)
				),
			),
			'category archives'            => array(
				//'https://example.com/blog/category/uncategorized/',
				array(
					'category_name' => 'uncategorized',
				),
				null,
			),
			'sub-category archives'        => array(
				//'https://example.com/blog/category/uncategorized/subcat/',
				array(
					'category_name' => 'uncategorized/subcat',
				),
				null,
			),
			'category archives, page 3'    => array(
				//'https://example.com/blog/category/uncategorized/page/3/',
				array(
					'category_name' => 'uncategorized',
					'paged'         => '3',
				),
				null,
			),
			'tag archives'                 => array(
				//'https://example.com/blog/tag/food/',
				array(
					'tag' => 'food',
				),
				null,
			),
			'tag archives, page 3'         => array(
				//'https://example.com/blog/tag/food/page/3/',
				array(
					'tag'   => 'food',
					'paged' => '3',
				),
				null,
			),
			'post format archives'         => array(
				//'https://example.com/blog/type/image/',
				array(
					'post_format' => 'image',
				),
				null,
			),
			'post format archives, page 2' => array(
				//'https://example.com/blog/type/image/page/2/',
				array(
					'post_format' => 'image',
					'paged'       => '2',
				),
				null,
			),
			'author archives'              => array(
				//'https://example.com/blog/author/johndoe/',
				array(
					'author_name' => 'johndoe',
				),
				null,
			),
			'author archives, page 2'      => array(
				//'https://example.com/blog/author/johndoe/page/2/',
				array(
					'author_name' => 'johndoe',
					'paged'       => '2',
				),
				null,
			),
			'year archives'                => array(
				//'https://example.com/blog/2020/',
				array(
					'year' => '2020',
				),
				null,
			),
			'year archives, page 3'        => array(
				//'https://example.com/blog/2020/page/3/',
				array(
					'year'  => '2020',
					'paged' => '3',
				),
				null,
			),
			'month archives'               => array(
				//'https://example.com/blog/2020/08/',
				array(
					'year'     => '2020',
					'monthnum' => '08',
				),
				null,
			),
			'month archives, page 3'       => array(
				//'https://example.com/blog/2020/08/page/3/',
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'paged'    => '3',
				),
				null,
			),
			'day archives'                 => array(
				//'https://example.com/blog/2020/08/04/',
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'day'      => '04',
				),
				null,
			),
			'day archives, page 3'         => array(
				//'https://example.com/blog/2020/08/04/page/3/',
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'day'      => '04',
					'paged'    => '3',
				),
				null,
			),
			'time archives'                => array(
				//'https://example.com/blog/2020/08/04/?hour=11',
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'day'      => '04',
					'hour'     => '11',
				),
				null,
			),
			'time archives, page 3'        => array(
				//'https://example.com/blog/2020/08/04/page/3/?hour=11',
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'day'      => '04',
					'hour'     => '11',
					'paged'    => '3',
				),
				null,
			),
			'custom post type post'        => array(
				array(
					'customposttype' => 'coffee',
					'post_type'      => 'customposttype',
					'name'           => 'coffee',
					'page'           => '',
				),
				new Entity(
					'https://example.com/blog/customposttype/coffee/',
					array(
						'type'  => 'post',
						'title' => 'Coffee',
						'id'    => 0, // Filled via title lookup.
					)
				),
			),
			'post type archives'           => array(
				//'https://example.com/blog/customposttype/',
				array(
					'post_type' => 'customposttype',
				),
				null,
			),
			'post type archives, page 3'   => array(
				//'https://example.com/blog/customposttype/page/3/',
				array(
					'post_type' => 'customposttype',
					'paged'     => '3',
				),
				null,
			),
			'taxonomy archives'            => array(
				//'https://example.com/blog/customtaxonomy/coffee/',
				array(
					'customtaxonomy' => 'coffee',
				),
				null,
			),
			'taxonomy archives, page 3'    => array(
				//'https://example.com/blog/customtaxonomy/coffee/page/3/',
				array(
					'customtaxonomy' => 'coffee',
					'paged'          => '3',
				),
				null,
			),
		);
	}

	protected function assertEntity( Entity $expected, $actual ) {
		$this->assertInstanceOf( Entity::class, $actual );
		$this->assertSame( $expected->get_url(), $actual->get_url(), "Failed asserting that entity URL {$actual->get_url()} is {$expected->get_url()}." );
		$this->assertSame( $expected->get_type(), $actual->get_type(), "Failed asserting that entity type {$actual->get_type()} is {$expected->get_type()}." );
		$this->assertSame( $expected->get_title(), $actual->get_title(), "Failed asserting that entity title {$actual->get_title()} is {$expected->get_title()}." );
		$this->assertSame( $expected->get_id(), $actual->get_id(), "Failed asserting that entity ID {$actual->get_id()} is {$expected->get_id()}." );
	}

	private function set_and_authorize_current_user( \WP_User $user ) {
		wp_set_current_user( $user->ID );
		// The only way to change the current user in bootstrapped Site Kit class instances (e.g. Permissions)
		do_action( 'wp_login', $user->user_login, $user );

		// Fake setup and authentication for access to dashboard.
		$this->fake_proxy_site_connection();
		remove_all_filters( 'googlesitekit_setup_complete' );
		$authentication = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_access_token( 'test-access-token', HOUR_IN_SECONDS );
	}
}
