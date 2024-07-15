<?php
/**
 * Class Google\Site_Kit\Tests\Core\Util\Entity_FactoryTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Closure;
use Google\Site_Kit\Core\Util\Entity_Factory;
use Google\Site_Kit\Core\Util\Entity;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\FixWPCoreEntityRewriteTrait;
use WP_Post;
use WP_Query;

/**
 * @group Util
 */
class Entity_FactoryTest extends TestCase {
	use Fake_Site_Connection_Trait;
	use FixWPCoreEntityRewriteTrait;

	private static $orig_permalink_structure;
	private static $orig_show_on_front;
	private static $orig_page_on_front;
	private static $orig_page_for_posts;
	private static $post_titles_to_ids;
	private static $term_names_to_ids;
	private static $skip_delete_uncategorized;
	private static $user_display_names_to_ids;

	public static function wpSetUpBeforeClass( $factory ) {
		global $wp_rewrite;

		self::$orig_permalink_structure = get_option( 'permalink_structure', '' );
		$wp_rewrite->set_permalink_structure( '/blog/%postname%/' );

		// Manually add public query vars and rewrite rules for post types and taxonomies because the latter were
		// originally skipped due to an empty permalink structure.
		foreach ( get_post_types( array(), 'objects' ) as $post_type ) {
			self::fix_post_type_rewrite( $post_type );
			$post_type->add_rewrite_rules();
		}
		foreach ( get_taxonomies( array(), 'objects' ) as $taxonomy ) {
			self::fix_taxonomy_rewrite( $taxonomy );
			$taxonomy->add_rewrite_rules();
		}

		flush_rewrite_rules();

		// Register a custom post type and a custom taxonomy.
		register_post_type(
			'customposttype',
			array(
				'label'       => 'Custom Post Type',
				'public'      => true,
				'has_archive' => true,
			)
		);
		register_taxonomy(
			'customtaxonomy',
			'post',
			array(
				'label'  => 'Custom Taxonomy',
				'public' => true,
			)
		);

		// Set up special pages.
		$blog_id = $factory->post->create(
			array(
				'post_title' => 'Blog',
				'post_name'  => 'blog',
				'post_type'  => 'page',
			)
		);
		$home_id = $factory->post->create(
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

		// Add more 'post' entities.
		self::$post_titles_to_ids['Some Post'] = $factory->post->create(
			array(
				'post_title' => 'Some Post',
				'post_name'  => 'some-post',
				'post_type'  => 'post',
			)
		);
		self::$post_titles_to_ids['Some Page'] = $factory->post->create(
			array(
				'post_title' => 'Some Page',
				'post_name'  => 'some-page',
				'post_type'  => 'page',
			)
		);
		self::$post_titles_to_ids['Coffee']    = $factory->post->create(
			array(
				'post_title' => 'Coffee',
				'post_name'  => 'coffee',
				'post_type'  => 'customposttype',
			)
		);

		// Add 'term' entities.
		self::$term_names_to_ids                  = array();
		self::$term_names_to_ids['Uncategorized'] = term_exists( 'Uncategorized', 'category' );
		if ( self::$term_names_to_ids['Uncategorized'] ) {
			self::$skip_delete_uncategorized          = true;
			self::$term_names_to_ids['Uncategorized'] = (int) self::$term_names_to_ids['Uncategorized']['term_id'];
		} else {
			self::$skip_delete_uncategorized          = false;
			self::$term_names_to_ids['Uncategorized'] = $factory->category->create(
				array(
					'name' => 'Uncategorized',
					'slug' => 'uncategorized',
				)
			);
		}
		self::$term_names_to_ids['Sub Cat'] = $factory->category->create(
			array(
				'name'   => 'Sub Cat',
				'slug'   => 'subcat',
				'parent' => self::$term_names_to_ids['Uncategorized'],
			)
		);
		self::$term_names_to_ids['Food']    = $factory->tag->create(
			array(
				'name' => 'Food',
				'slug' => 'food',
			)
		);
		self::$term_names_to_ids['Images']  = $factory->term->create(
			array(
				'taxonomy' => 'post_format',
				'name'     => 'post-format-image',
				'slug'     => 'post-format-image',
			)
		);
		self::$term_names_to_ids['Coffee']  = $factory->term->create(
			array(
				'taxonomy' => 'customtaxonomy',
				'name'     => 'Coffee',
				'slug'     => 'coffee',
			)
		);

		// Add 'user' entities.
		self::$user_display_names_to_ids = array(
			'John Doe' => $factory->user->create(
				array(
					'role'         => 'editor',
					'display_name' => 'John Doe',
					'user_login'   => 'johndoe',
				)
			),
		);
	}

	public static function wpTearDownAfterClass() {
		global $wp_rewrite;

		// No need to actually delete the added DB content here since core's testcase class takes care of that.
		update_option( 'show_on_front', self::$orig_show_on_front );
		update_option( 'page_on_front', self::$orig_page_on_front );
		update_option( 'page_for_posts', self::$orig_page_for_posts );

		unregister_post_type( 'customposttype' );
		unregister_taxonomy( 'customtaxonomy' );

		$wp_rewrite->set_permalink_structure( self::$orig_permalink_structure );
		flush_rewrite_rules();
	}

	public function test_from_context_admin() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$this->set_and_authorize_current_user( $user );

		// Set admin context.
		set_current_screen( 'dashboard' );
		$this->assertTrue( is_admin() );

		// Set up a global public post.
		$public_post_id = $this->factory()->post->create();
		( new WP_Query( array( 'p' => $public_post_id ) ) )->the_post();
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
		( new WP_Query( array( 'p' => $private_post_id ) ) )->the_post();
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
		$wp_the_query = new WP_Query();
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

		// Pretend we're in the admin. The URL-based logic should ignore that.
		set_current_screen( 'edit.php' );

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

		// High-level assertion to ensure 404s are considered as expected.
		// In this example, it is a valid taxonomy term archive, but the pagination is out of bounds.
		$this->assertNull( Entity_Factory::from_url( trailingslashit( get_term_link( self::$term_names_to_ids['Food'] ) ) . 'page/2/' ) );
	}

	/**
	 * @dataProvider data_from_wp_query
	 *
	 * @param array   $query_args          Query arguments.
	 * @param Closure $get_expected_entity Function that returns the expected Entity.
	 */
	public function test_from_wp_query( array $query_args, Closure $get_expected_entity ) {
		$expected_entity = $get_expected_entity();

		add_filter(
			'option_home',
			function () {
				return 'https://example.com';
			}
		);

		// Run the actual query.
		$query = new WP_Query();
		$query->query( $query_args );

		// For date-based archive, set a fake post as query result because these archives only exist when there is
		// content available for them.
		if ( $expected_entity && in_array( $expected_entity->get_type(), array( 'year', 'month', 'day' ), true ) ) {
			$year     = isset( $query_args['year'] ) ? $query_args['year'] : current_time( 'Y' );
			$monthnum = isset( $query_args['monthnum'] ) ? $query_args['monthnum'] : current_time( 'm' );
			$day      = isset( $query_args['day'] ) ? $query_args['day'] : current_time( 'd' );

			$query->posts               = array( new \WP_Post( new \stdClass() ) );
			$query->posts[0]->post_date = "{$year}-{$monthnum}-{$day} 12:00:00";
			$query->posts[0]->filter    = 'raw'; // Avoids attempt to fetch this fake post.
		}

		$entity = Entity_Factory::from_wp_query( $query );
		if ( $expected_entity ) {
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
		// There is a custom post type called 'customposttype' (name 'Custom Post Type').
		// There is a custom taxonomy called 'customtaxonomy' (name 'Custom Taxonomy').
		//
		// Additional existing entities:
		// * 'post' (post type 'post', slug 'some-post', title 'Some Post')
		// * 'post' (post type 'page', slug 'some-page', title 'Some Page')
		// * 'post' (post type 'customposttype', slug 'coffee', title 'Coffee')
		// * 'term' (taxonomy 'category', slug 'uncategorized', title 'Uncategorized')
		// * 'term' (taxonomy 'category', slug 'subcat', title 'Sub Cat', parent 'uncategorized')
		// * 'term' (taxonomy 'post_tag', slug 'food', title 'Food')
		// * 'term' (taxonomy 'post_format', slug 'post-format-image', title 'post-format-image')
		// * 'term' (taxonomy 'customtaxonomy', slug 'coffee', title 'Coffee')
		// * 'user' (slug 'johndoe', title 'John Doe')
		return array(
			'front page'            => array(
				array(),
				function () {
					return new Entity(
						'https://example.com/',
						array(
							'type'  => 'post',
							'title' => 'Home',
							'id'    => self::$post_titles_to_ids['Home'],
						)
					);
				},
			),
			'blog page'             => array(
				array(
					'pagename' => 'blog',
				),
				function () {
					return new Entity(
						'https://example.com/blog/',
						array(
							'type'  => 'blog',
							'title' => 'Blog',
							'id'    => self::$post_titles_to_ids['Blog'],
						)
					);
				},
			),
			'single post'           => array(
				array(
					'name' => 'some-post',
				),
				function () {
					return new Entity(
						'https://example.com/blog/some-post/',
						array(
							'type'  => 'post',
							'title' => 'Some Post',
							'id'    => self::$post_titles_to_ids['Some Post'],
						)
					);
				},
			),
			'single page'           => array(
				array(
					'pagename' => 'some-page',
				),
				function () {
					return new Entity(
						'https://example.com/some-page/',
						array(
							'type'  => 'post',
							'title' => 'Some Page',
							'id'    => self::$post_titles_to_ids['Some Page'],
						)
					);
				},
			),
			'category archives'     => array(
				array(
					'category_name' => 'uncategorized',
				),
				function () {
					return new Entity(
						'https://example.com/blog/category/uncategorized/',
						array(
							'type'  => 'term',
							'title' => 'Category: Uncategorized',
							'id'    => self::$term_names_to_ids['Uncategorized'],
						)
					);
				},
			),
			'sub-category archives' => array(
				array(
					'category_name' => 'uncategorized/subcat',
				),
				function () {
					return new Entity(
						'https://example.com/blog/category/uncategorized/subcat/',
						array(
							'type'  => 'term',
							'title' => 'Category: Sub Cat',
							'id'    => self::$term_names_to_ids['Sub Cat'],
						)
					);
				},
			),
			'tag archives'          => array(
				array(
					'tag' => 'food',
				),
				function () {
					return new Entity(
						'https://example.com/blog/tag/food/',
						array(
							'type'  => 'term',
							'title' => 'Tag: Food',
							'id'    => self::$term_names_to_ids['Food'],
						)
					);
				},
			),
			'post format archives'  => array(
				array(
					// Passing 'image' works for WP request parsing,
					// but the query requires the actual 'post-format-image'.
					'post_format' => 'post-format-image',
					'post_type'   => array( 'post' ),
				),
				function () {
					return new Entity(
						'https://example.com/blog/type/image/',
						array(
							'type'  => 'term',
							'title' => 'Images',
							'id'    => self::$term_names_to_ids['Images'],
						)
					);
				},
			),
			'author archives'       => array(
				array(
					'author_name' => 'johndoe',
				),
				function () {
					return new Entity(
						'https://example.com/blog/author/johndoe/',
						array(
							'type'  => 'user',
							'title' => 'Author: John Doe',
							'id'    => self::$user_display_names_to_ids['John Doe'],
						)
					);
				},
			),
			'year archives'         => array(
				array(
					'year' => '2020',
				),
				function () {
					return new Entity(
						'https://example.com/blog/2020/',
						array(
							'type'  => 'year',
							'title' => 'Year: 2020',
						)
					);
				},
			),
			'month archives'        => array(
				array(
					'year'     => '2020',
					'monthnum' => '08',
				),
				function () {
					return new Entity(
						'https://example.com/blog/2020/08/',
						array(
							'type'  => 'month',
							'title' => 'Month: August 2020',
						)
					);
				},
			),
			'day archives'          => array(
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'day'      => '04',
				),
				function () {
					return new Entity(
						'https://example.com/blog/2020/08/04/',
						array(
							'type'  => 'day',
							'title' => 'Day: August 4, 2020',
						)
					);
				},
			),
			'custom post type post' => array(
				array(
					'customposttype' => 'coffee',
					'post_type'      => 'customposttype',
					'name'           => 'coffee',
					'page'           => '',
				),
				function () {
					return new Entity(
						'https://example.com/blog/customposttype/coffee/',
						array(
							'type'  => 'post',
							'title' => 'Coffee',
							'id'    => self::$post_titles_to_ids['Coffee'],
						)
					);
				},
			),
			'post type archives'    => array(
				array(
					'post_type' => 'customposttype',
				),
				function () {
					return new Entity(
						'https://example.com/blog/customposttype/',
						array(
							'type'  => 'post_type',
							'title' => 'Archives: Custom Post Type',
						)
					);
				},
			),
			'taxonomy archives'     => array(
				array(
					'customtaxonomy' => 'coffee',
				),
				function () {
					return new Entity(
						'https://example.com/blog/customtaxonomy/coffee/',
						array(
							'type'  => 'term',
							'title' => 'Custom Taxonomy: Coffee',
							'id'    => self::$term_names_to_ids['Coffee'],
						)
					);
				},
			),
		);
	}

	/**
	 * @dataProvider data_from_wp_query_paginated
	 *
	 * @param array $query_args           Query arguments.
	 * @param Closure $get_expected_entity_args Function that returns an array of args used to construct the expected Entities.
	 */
	public function test_from_wp_query_paginated( array $query_args, Closure $get_expected_entity_args ) {
		global $wp_rewrite;

		$orig_permalink_structure = get_option( 'permalink_structure', '' );

		$permalink_structures = array(
			'',                  // Not using permalinks.
			'/blog/%postname%/', // Using permalinks.
		);

		$expected_entity_args = $get_expected_entity_args();

		foreach ( $permalink_structures as $index => $permalink_structure ) {
			$wp_rewrite->set_permalink_structure( $permalink_structure );

			$this->test_from_wp_query(
				$query_args,
				function () use ( $expected_entity_args, $index ) {
					return new Entity(
						$expected_entity_args['urls'][ $index ],
						$expected_entity_args['args']
					);
				}
			);
		}

		$wp_rewrite->set_permalink_structure( $orig_permalink_structure );
	}

	public function data_from_wp_query_paginated() {
		// See notes in `data_from_wp_query()`.
		// In the `urls` array, the first item is the non-permalinked URL, the second item is the permalinked URL.

		return array(
			'blog page, page 3'            => array(
				array(
					'pagename' => 'blog',
					'paged'    => '3',
				),
				function () {
					return array(
						'urls' => array(
							'https://example.com/?paged=3&page_id=' . self::$post_titles_to_ids['Blog'],
							'https://example.com/blog/page/3/',
						),
						'args' => array(
							'type'  => 'blog',
							'title' => 'Blog',
							'id'    => self::$post_titles_to_ids['Blog'],
						),
					);
				},
			),
			'single post, paginated'       => array(
				array(
					'name' => 'some-post',
					'page' => '2',
				),
				function () {
					return array(
						'urls' => array(
							'https://example.com/?p=' . self::$post_titles_to_ids['Some Post'] . '&page=2',
							'https://example.com/blog/some-post/2/',
						),
						'args' => array(
							'type'  => 'post',
							'title' => 'Some Post',
							'id'    => self::$post_titles_to_ids['Some Post'],
						),
					);
				},
			),
			'category archives, page 3'    => array(
				array(
					'category_name' => 'uncategorized',
					'paged'         => '3',
				),
				function () {
					return array(
						'urls' => array(
							'https://example.com/?paged=3&cat=' . self::$term_names_to_ids['Uncategorized'],
							'https://example.com/blog/category/uncategorized/page/3/',
						),
						'args' => array(
							'type'  => 'term',
							'title' => 'Category: Uncategorized',
							'id'    => self::$term_names_to_ids['Uncategorized'],
						),
					);
				},
			),
			'tag archives, page 3'         => array(
				array(
					'tag'   => 'food',
					'paged' => '3',
				),
				function () {
					return array(
						'urls' => array(
							'https://example.com/?paged=3&tag=food',
							'https://example.com/blog/tag/food/page/3/',
						),
						'args' => array(
							'type'  => 'term',
							'title' => 'Tag: Food',
							'id'    => self::$term_names_to_ids['Food'],
						),
					);
				},
			),
			'post format archives, page 2' => array(
				array(
					// Passing 'image' works for WP request parsing,
					// but the query requires the actual 'post-format-image'.
					'post_format' => 'post-format-image',
					'post_type'   => array( 'post' ),
					'paged'       => '2',
				),
				function () {
					return array(
						'urls' => array(
							'https://example.com/?paged=2&post_format=image',
							'https://example.com/blog/type/image/page/2/',
						),
						'args' => array(
							'type'  => 'term',
							'title' => 'Images',
							'id'    => self::$term_names_to_ids['Images'],
						),
					);
				},
			),
			'author archives, page 2'      => array(
				array(
					'author_name' => 'johndoe',
					'paged'       => '2',
				),
				function () {
					return array(
						'urls' => array(
							'https://example.com/?paged=2&author=' . self::$user_display_names_to_ids['John Doe'],
							'https://example.com/blog/author/johndoe/page/2/',
						),
						'args' => array(
							'type'  => 'user',
							'title' => 'Author: John Doe',
							'id'    => self::$user_display_names_to_ids['John Doe'],
						),
					);
				},
			),
			'year archives, page 3'        => array(
				array(
					'year'  => '2020',
					'paged' => '3',
				),
				function () {
					return array(
						'urls' => array(
							'https://example.com/?paged=3&m=2020',
							'https://example.com/blog/2020/page/3/',
						),
						'args' => array(
							'type'  => 'year',
							'title' => 'Year: 2020',
						),
					);
				},
			),
			'month archives, page 3'       => array(
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'paged'    => '3',
				),
				function () {
					return array(
						'urls' => array(
							'https://example.com/?paged=3&m=202008',
							'https://example.com/blog/2020/08/page/3/',
						),
						'args' => array(
							'type'  => 'month',
							'title' => 'Month: August 2020',
						),
					);
				},
			),
			'day archives, page 3'         => array(
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'day'      => '04',
					'paged'    => '3',
				),
				function () {
					return array(
						'urls' => array(
							'https://example.com/?paged=3&m=20200804',
							'https://example.com/blog/2020/08/04/page/3/',
						),
						'args' => array(
							'type'  => 'day',
							'title' => 'Day: August 4, 2020',
						),
					);
				},
			),
			'post type archives, page 3'   => array(
				array(
					'post_type' => 'customposttype',
					'paged'     => '3',
				),
				function () {
					return array(
						'urls' => array(
							'https://example.com/?paged=3&post_type=customposttype',
							'https://example.com/blog/customposttype/page/3/',
						),
						'args' => array(
							'type'  => 'post_type',
							'title' => 'Archives: Custom Post Type',
						),
					);
				},
			),
			'taxonomy archives, page 3'    => array(
				array(
					'customtaxonomy' => 'coffee',
					'paged'          => '3',
				),
				function () {
					return array(
						'urls' => array(
							'https://example.com/?paged=3&customtaxonomy=coffee',
							'https://example.com/blog/customtaxonomy/coffee/page/3/',
						),
						'args' => array(
							'type'  => 'term',
							'title' => 'Custom Taxonomy: Coffee',
							'id'    => self::$term_names_to_ids['Coffee'],
						),
					);
				},
			),
		);
	}

	/**
	 * @param $post_factory
	 * @param $expected_url
	 * @param $expected_title
	 *
	 * @dataProvider data_posts
	 */
	public function test_create_entity_for_post( Closure $post_factory, $expected_url, $expected_title, $pagenum = 1 ) {
		$post = $post_factory();
		$this->assertInstanceOf( WP_Post::class, $post );

		$entity = Entity_Factory::create_entity_for_post( $post, $pagenum );

		$this->assertEquals( $expected_url, $entity->get_url() );
		$this->assertEquals( $expected_title, $entity->get_title() );
	}

	public function data_posts() {
		$arabic_test = 'امتحان';

		return array(
			'basic post'                      => array(
				fn () => $this->factory()->post->create_and_get(
					array(
						'post_name'  => 'test',
						'post_title' => 'Test',
					)
				),
				'http://example.org/blog/test/',
				'Test',
			),
			'basic post with page num'        => array(
				fn () => $this->factory()->post->create_and_get(
					array(
						'post_name'  => 'test',
						'post_title' => 'Test',
					)
				),
				'http://example.org/blog/test/3/',
				'Test',
				3,
			),
			'with utf8 slug'                  => array(
				fn () => $this->factory()->post->create_and_get(
					array(
						'post_name'  => $arabic_test,
						'post_title' => $arabic_test,
					)
				),
				"http://example.org/blog/$arabic_test/",
				$arabic_test,
			),
			'with utf8 slug and page'         => array(
				fn () => $this->factory()->post->create_and_get(
					array(
						'post_name'  => $arabic_test . '-1',
						'post_title' => $arabic_test,
					)
				),
				"http://example.org/blog/$arabic_test-1/3/",
				$arabic_test,
				3,
			),
			'with special characters in slug' => array(
				fn () => $this->factory()->post->create_and_get(
					array(
						'post_name'  => 'test-!@#$%^&*()',
						'post_title' => 'Test',
					)
				),
				'http://example.org/blog/test/',
				'Test',
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
		$authentication->get_oauth_client()->set_token( array( 'access_token' => 'test-access-token' ) );
	}
}
