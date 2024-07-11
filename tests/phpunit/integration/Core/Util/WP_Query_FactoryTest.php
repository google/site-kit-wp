<?php
/**
 * Class Google\Site_Kit\Tests\Core\Util\WP_Query_FactoryTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\WP_Query_Factory;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\FixWPCoreEntityRewriteTrait;
use WP_Query;

/**
 * @group Util
 */
class WP_Query_FactoryTest extends TestCase {
	use FixWPCoreEntityRewriteTrait;

	private static $orig_show_on_front;
	private static $orig_page_on_front;
	private static $orig_page_for_posts;
	private static $post_ids;

	public static function wpSetUpBeforeClass( $factory ) {
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

		self::$post_ids = array( $home_id, $blog_id );
	}

	public static function wpTearDownAfterClass() {
		update_option( 'show_on_front', self::$orig_show_on_front );
		update_option( 'page_on_front', self::$orig_page_on_front );
		update_option( 'page_for_posts', self::$orig_page_for_posts );

		foreach ( self::$post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}

		unregister_post_type( 'customposttype' );
		unregister_taxonomy( 'customtaxonomy' );
	}

	/**
	 * @dataProvider data_from_url_querystring
	 *
	 * @param string $url           URL to get query arguments.
	 * @param array  $expected_args Expected query arguments.
	 * @param array  $template_tags Map of template tag method names and whether they should be `true` or `false`.
	 */
	public function test_from_url_querystring( $url, $expected_args, $template_tags ) {
		global $wp_rewrite;

		add_filter(
			'option_home',
			function () {
				return 'https://example.com';
			}
		);

		$wp_rewrite->set_permalink_structure( '' );

		// Manually add public query vars for post types and taxonomies.
		foreach ( get_post_types( array(), 'objects' ) as $post_type ) {
			$post_type->add_rewrite_rules();
		}
		foreach ( get_taxonomies( array(), 'objects' ) as $taxonomy ) {
			$taxonomy->add_rewrite_rules();
		}

		$query = WP_Query_Factory::from_url( $url );
		// This test focuses on correct query flags being set, hence disable 404 detection.
		$query->enable_404_detection( false );
		$query->get_posts();

		$this->assertEqualSetsWithIndex( $expected_args, $query->query );

		foreach ( $template_tags as $template_tag => $expected_result ) {
			if ( $expected_result ) {
				$this->assertTrue( $query->$template_tag(), "Failed asserting that $template_tag is true." );
			} else {
				$this->assertFalse( $query->$template_tag(), "Failed asserting that $template_tag is false." );
			}
		}
	}

	public function data_from_url_querystring() {
		// Home URL is 'https://example.com'.
		// Permalink structure is ''.
		// Front page is a static page with slug 'home'.
		// Posts page has the slug 'blog'.
		// There is a custom post type called 'customposttype'.
		// There is a custom taxonomy called 'customtaxonomy'.
		return array(
			'front page'                         => array(
				'https://example.com/',
				array(),
				array(
					'is_front_page' => true,
					'is_page'       => true,
					'is_home'       => false,
					'is_singular'   => true,
				),
			),
			'blog page'                          => array(
				'https://example.com/?pagename=blog',
				array(
					'pagename' => 'blog',
				),
				array(
					'is_front_page' => false,
					'is_home'       => true,
					'is_paged'      => false,
					'is_singular'   => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'blog page, page 3'                  => array(
				'https://example.com/?pagename=blog&paged=3',
				array(
					'pagename' => 'blog',
					'paged'    => '3',
				),
				array(
					'is_front_page' => false,
					'is_home'       => true,
					'is_paged'      => true,
					'is_singular'   => false,
				),
			),
			'single post, by ID'                 => array(
				'https://example.com/?p=42',
				array(
					'p' => '42',
				),
				array(
					'is_single'   => true,
					'is_singular' => true,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'single post, by ID, paginated'      => array(
				'https://example.com/?p=42&page=2',
				array(
					'p'    => '42',
					'page' => '2',
				),
				array(
					'is_single'   => true,
					'is_singular' => true,
				),
			),
			'single post, by slug'               => array(
				'https://example.com/?name=some-post',
				array(
					'name' => 'some-post',
				),
				array(
					'is_single'   => true,
					'is_singular' => true,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'single post, by slug, paginated'    => array(
				'https://example.com/?name=some-post&page=2',
				array(
					'name' => 'some-post',
					'page' => '2',
				),
				array(
					'is_single'   => true,
					'is_singular' => true,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'non-existing post'                  => array(
				'https://example.com/?name=non-existing-post',
				array(
					'name' => 'non-existing-post',
				),
				array(
					'is_single'   => true,
					'is_singular' => true,
				),
			),
			'category archives, by ID'           => array(
				'https://example.com/?cat=23',
				array(
					'cat' => '23',
				),
				array(
					'is_category' => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'category archives, by ID, page 3'   => array(
				'https://example.com/?cat=23&paged=3',
				array(
					'cat'   => '23',
					'paged' => '3',
				),
				array(
					'is_category' => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'category archives, by slug'         => array(
				'https://example.com/?category_name=uncategorized',
				array(
					'category_name' => 'uncategorized',
				),
				array(
					'is_category' => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			'sub-category archives, by slug'     => array(
				'https://example.com/?category_name=uncategorized/subcat',
				array(
					'category_name' => 'uncategorized/subcat',
				),
				array(
					'is_category' => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'category archives, by slug, page 3' => array(
				'https://example.com/?category_name=uncategorized&paged=3',
				array(
					'category_name' => 'uncategorized',
					'paged'         => '3',
				),
				array(
					'is_category' => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'tag archives'                       => array(
				'https://example.com/?tag=food',
				array(
					'tag' => 'food',
				),
				array(
					'is_tag'      => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'tag archives, page 3'               => array(
				'https://example.com/?tag=food&paged=3',
				array(
					'tag'   => 'food',
					'paged' => '3',
				),
				array(
					'is_tag'      => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'post format archives'               => array(
				'https://example.com/?post_format=image',
				array(
					'post_format' => 'post-format-image',
					'post_type'   => array( 'post' ),
				),
				array(
					'is_tax'      => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'post format archives, page 2'       => array(
				'https://example.com/?post_format=image&paged=2',
				array(
					'post_format' => 'post-format-image',
					'post_type'   => array( 'post' ),
					'paged'       => '2',
				),
				array(
					'is_tax'      => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'author archives, by ID'             => array(
				'https://example.com/?author=1',
				array(
					'author' => '1',
				),
				array(
					'is_author'   => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'author archives, by ID, page 2'     => array(
				'https://example.com/?author=1&paged=2',
				array(
					'author' => '1',
					'paged'  => '2',
				),
				array(
					'is_author'   => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'author archives, by slug'           => array(
				'https://example.com/?author_name=johndoe',
				array(
					'author_name' => 'johndoe',
				),
				array(
					'is_author'   => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'author archives, by slug, page 2'   => array(
				'https://example.com/?author_name=johndoe&paged=2',
				array(
					'author_name' => 'johndoe',
					'paged'       => '2',
				),
				array(
					'is_author'   => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'year archives'                      => array(
				'https://example.com/?year=2020',
				array(
					'year' => '2020',
				),
				array(
					'is_year'     => true,
					'is_date'     => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'year archives, page 3'              => array(
				'https://example.com/?year=2020&paged=3',
				array(
					'year'  => '2020',
					'paged' => '3',
				),
				array(
					'is_year'     => true,
					'is_date'     => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'month archives'                     => array(
				'https://example.com/?year=2020&monthnum=08',
				array(
					'year'     => '2020',
					'monthnum' => '08',
				),
				array(
					'is_year'     => false,
					'is_month'    => true,
					'is_date'     => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'month archives, page 3'             => array(
				'https://example.com/?year=2020&monthnum=08&paged=3',
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'paged'    => '3',
				),
				array(
					'is_year'     => false,
					'is_month'    => true,
					'is_date'     => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'day archives'                       => array(
				'https://example.com/?year=2020&monthnum=08&day=04',
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'day'      => '04',
				),
				array(
					'is_year'     => false,
					'is_month'    => false,
					'is_day'      => true,
					'is_date'     => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'day archives, page 3'               => array(
				'https://example.com/?year=2020&monthnum=08&day=04&paged=3',
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'day'      => '04',
					'paged'    => '3',
				),
				array(
					'is_year'     => false,
					'is_month'    => false,
					'is_day'      => true,
					'is_date'     => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'time archives'                      => array(
				'https://example.com/?year=2020&monthnum=08&day=04&hour=11',
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'day'      => '04',
					'hour'     => '11',
				),
				array(
					'is_year'     => false,
					'is_month'    => false,
					'is_day'      => false,
					'is_date'     => true,
					'is_time'     => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'time archives, page 3'              => array(
				'https://example.com/?year=2020&monthnum=08&day=04&hour=11&paged=3',
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'day'      => '04',
					'hour'     => '11',
					'paged'    => '3',
				),
				array(
					'is_year'     => false,
					'is_month'    => false,
					'is_day'      => false,
					'is_date'     => true,
					'is_time'     => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'custom post type post'              => array(
				'https://example.com/?customposttype=coffee',
				array(
					'customposttype' => 'coffee',
					'post_type'      => 'customposttype',
					'name'           => 'coffee',
				),
				array(
					'is_single'   => true,
					'is_singular' => true,
				),
			),
			'post type archives'                 => array(
				'https://example.com/?post_type=customposttype',
				array(
					'post_type' => 'customposttype',
				),
				array(
					'is_post_type_archive' => true,
					'is_paged'             => false,
					'is_singular'          => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'post type archives, page 3'         => array(
				'https://example.com/?post_type=customposttype&paged=3',
				array(
					'post_type' => 'customposttype',
					'paged'     => '3',
				),
				array(
					'is_post_type_archive' => true,
					'is_paged'             => true,
					'is_singular'          => false,
				),
			),
			'taxonomy archives'                  => array(
				'https://example.com/?customtaxonomy=coffee',
				array(
					'customtaxonomy' => 'coffee',
				),
				array(
					'is_tax'      => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'taxonomy archives, page 3'          => array(
				'https://example.com/?customtaxonomy=coffee&paged=3',
				array(
					'customtaxonomy' => 'coffee',
					'paged'          => '3',
				),
				array(
					'is_tax'      => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'search'                             => array(
				'https://example.com/?s=lego',
				array(
					's' => 'lego',
				),
				array(
					'is_search'   => true,
					'is_singular' => false,
				),
			),
		);
	}

	/**
	 * @dataProvider data_from_url_rewrites
	 *
	 * @param string $url           URL to get query arguments.
	 * @param array  $expected_args Expected query arguments.
	 * @param array  $template_tags Map of template tag method names and whether they should be `true` or `false`.
	 */
	public function test_from_url_rewrites( $url, $expected_args, $template_tags ) {
		global $wp_rewrite;

		add_filter(
			'option_home',
			function () {
				return 'https://example.com';
			}
		);

		$wp_rewrite->set_permalink_structure( '/%postname%/' );

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

		$query = WP_Query_Factory::from_url( $url );
		// This test focuses on correct query flags being set, hence disable 404 detection.
		$query->enable_404_detection( false );
		$query->get_posts();

		$this->assertEqualSetsWithIndex( $expected_args, $query->query );

		foreach ( $template_tags as $template_tag => $expected_result ) {
			if ( $expected_result ) {
				$this->assertTrue( $query->$template_tag(), "Failed asserting that $template_tag is true." );
			} else {
				$this->assertFalse( $query->$template_tag(), "Failed asserting that $template_tag is false." );
			}
		}
	}

	public function data_from_url_rewrites() {
		// Home URL is 'https://example.com'.
		// Permalink structure is '/%postname%/'.
		// Front page is a static page with slug 'home'.
		// Posts page has the slug 'blog'.
		// There is a custom post type called 'customposttype'.
		// There is a custom taxonomy called 'customtaxonomy'.
		return array(
			'front page'                   => array(
				'https://example.com/',
				array(),
				array(
					'is_front_page' => true,
					'is_page'       => true,
					'is_home'       => false,
					'is_singular'   => true,
				),
			),
			'blog page'                    => array(
				'https://example.com/blog/',
				array(
					'pagename' => 'blog',
					'page'     => '',
				),
				array(
					'is_front_page' => false,
					'is_home'       => true,
					'is_paged'      => false,
					'is_singular'   => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'blog page, page 3'            => array(
				'https://example.com/blog/page/3/',
				array(
					'pagename' => 'blog',
					'paged'    => '3',
				),
				array(
					'is_front_page' => false,
					'is_home'       => true,
					'is_paged'      => true,
					'is_singular'   => false,
				),
			),
			'single post'                  => array(
				'https://example.com/some-post/',
				array(
					'name' => 'some-post',
					'page' => '',
				),
				array(
					'is_single'   => true,
					'is_singular' => true,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'single post, paginated'       => array(
				'https://example.com/some-post/2/',
				array(
					'name' => 'some-post',
					'page' => '2',
				),
				array(
					'is_single'   => true,
					'is_singular' => true,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'non-existing post'            => array(
				'https://example.com/non-existing-post/',
				array(
					'name' => 'non-existing-post',
					'page' => '',
				),
				array(
					'is_single'   => true,
					'is_singular' => true,
				),
			),
			'category archives'            => array(
				'https://example.com/category/uncategorized/',
				array(
					'category_name' => 'uncategorized',
				),
				array(
					'is_category' => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			'sub-category archives'        => array(
				'https://example.com/category/uncategorized/subcat/',
				array(
					'category_name' => 'uncategorized/subcat',
				),
				array(
					'is_category' => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'category archives, page 3'    => array(
				'https://example.com/category/uncategorized/page/3/',
				array(
					'category_name' => 'uncategorized',
					'paged'         => '3',
				),
				array(
					'is_category' => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'tag archives'                 => array(
				'https://example.com/tag/food/',
				array(
					'tag' => 'food',
				),
				array(
					'is_tag'      => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'tag archives, page 3'         => array(
				'https://example.com/tag/food/page/3/',
				array(
					'tag'   => 'food',
					'paged' => '3',
				),
				array(
					'is_tag'      => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'post format archives'         => array(
				'https://example.com/type/image/',
				array(
					'post_format' => 'post-format-image',
					'post_type'   => array( 'post' ),
				),
				array(
					'is_tax'      => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'post format archives, page 2' => array(
				'https://example.com/type/image/page/2/',
				array(
					'post_format' => 'post-format-image',
					'post_type'   => array( 'post' ),
					'paged'       => '2',
				),
				array(
					'is_tax'      => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'author archives'              => array(
				'https://example.com/author/johndoe/',
				array(
					'author_name' => 'johndoe',
				),
				array(
					'is_author'   => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'author archives, page 2'      => array(
				'https://example.com/author/johndoe/page/2/',
				array(
					'author_name' => 'johndoe',
					'paged'       => '2',
				),
				array(
					'is_author'   => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'year archives'                => array(
				'https://example.com/2020/',
				array(
					'year' => '2020',
				),
				array(
					'is_year'     => true,
					'is_date'     => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'year archives, page 3'        => array(
				'https://example.com/2020/page/3/',
				array(
					'year'  => '2020',
					'paged' => '3',
				),
				array(
					'is_year'     => true,
					'is_date'     => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'month archives'               => array(
				'https://example.com/2020/08/',
				array(
					'year'     => '2020',
					'monthnum' => '08',
				),
				array(
					'is_year'     => false,
					'is_month'    => true,
					'is_date'     => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'month archives, page 3'       => array(
				'https://example.com/2020/08/page/3/',
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'paged'    => '3',
				),
				array(
					'is_year'     => false,
					'is_month'    => true,
					'is_date'     => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'day archives'                 => array(
				'https://example.com/2020/08/04/',
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'day'      => '04',
				),
				array(
					'is_year'     => false,
					'is_month'    => false,
					'is_day'      => true,
					'is_date'     => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'day archives, page 3'         => array(
				'https://example.com/2020/08/04/page/3/',
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'day'      => '04',
					'paged'    => '3',
				),
				array(
					'is_year'     => false,
					'is_month'    => false,
					'is_day'      => true,
					'is_date'     => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'time archives'                => array(
				// Time archives don't have any rewrite rules.
				'https://example.com/2020/08/04/?hour=11',
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'day'      => '04',
					'hour'     => '11',
				),
				array(
					'is_year'     => false,
					'is_month'    => false,
					'is_day'      => false,
					'is_date'     => true,
					'is_time'     => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'time archives, page 3'        => array(
				// Time archives don't have any rewrite rules.
				'https://example.com/2020/08/04/page/3/?hour=11',
				array(
					'year'     => '2020',
					'monthnum' => '08',
					'day'      => '04',
					'hour'     => '11',
					'paged'    => '3',
				),
				array(
					'is_year'     => false,
					'is_month'    => false,
					'is_day'      => false,
					'is_date'     => true,
					'is_time'     => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
			'custom post type post'        => array(
				'https://example.com/customposttype/coffee/',
				array(
					'customposttype' => 'coffee',
					'post_type'      => 'customposttype',
					'name'           => 'coffee',
					'page'           => '',
				),
				array(
					'is_single'   => true,
					'is_singular' => true,
				),
			),
			'post type archives'           => array(
				'https://example.com/customposttype/',
				array(
					'post_type' => 'customposttype',
				),
				array(
					'is_post_type_archive' => true,
					'is_paged'             => false,
					'is_singular'          => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'post type archives, page 3'   => array(
				'https://example.com/customposttype/page/3/',
				array(
					'post_type' => 'customposttype',
					'paged'     => '3',
				),
				array(
					'is_post_type_archive' => true,
					'is_paged'             => true,
					'is_singular'          => false,
				),
			),
			'taxonomy archives'            => array(
				'https://example.com/customtaxonomy/coffee/',
				array(
					'customtaxonomy' => 'coffee',
				),
				array(
					'is_tax'      => true,
					'is_paged'    => false,
					'is_singular' => false,
				),
			),
			// This is technically a 404, but irrelevant for this test.
			'taxonomy archives, page 3'    => array(
				'https://example.com/customtaxonomy/coffee/page/3/',
				array(
					'customtaxonomy' => 'coffee',
					'paged'          => '3',
				),
				array(
					'is_tax'      => true,
					'is_paged'    => true,
					'is_singular' => false,
				),
			),
		);
	}

	/**
	 * @dataProvider data_from_url_homepage
	 *
	 * @param string $url           URL to get query arguments.
	 * @param string $show_on_front Either 'posts' or 'page'.
	 * @param array  $expected_args Expected query arguments.
	 */
	public function test_from_url_homepage( $url, $show_on_front, $expected_args ) {
		global $wp_rewrite;

		add_filter(
			'option_home',
			function () {
				return 'https://example.com';
			}
		);

		$wp_rewrite->set_permalink_structure( '/%postname%/' );

		if ( 'page' === $show_on_front ) {
			$home_id = self::factory()->post->create(
				array(
					'post_title' => 'Home',
					'post_type'  => 'page',
				)
			);
			update_option( 'show_on_front', 'page' );
			update_option( 'page_on_front', $home_id );
		} else {
			update_option( 'show_on_front', 'posts' );
		}

		flush_rewrite_rules();

		// Pretend we're in the admin. The URL-based logic should ignore that.
		set_current_screen( 'edit.php' );

		$query = WP_Query_Factory::from_url( $url );
		// This test focuses on correct query flags being set, hence disable 404 detection.
		$query->enable_404_detection( false );
		$query->get_posts();

		$this->assertEqualSetsWithIndex( $expected_args, $query->query );

		$this->assertTrue( $query->is_front_page() );
		if ( 'page' === $show_on_front ) {
			$this->assertTrue( $query->is_page() );
			$this->assertFalse( $query->is_home() );
		} else {
			$this->assertTrue( $query->is_home() );
			$this->assertFalse( $query->is_page() );
		}
	}

	public function data_from_url_homepage() {
		// Home URL is 'https://example.com'.
		// Permalink structure is '/%postname%/'.
		return array(
			'posts'                       => array(
				'https://example.com',
				'posts',
				array(),
			),
			'posts with trailing slash'   => array(
				'https://example.com/',
				'posts',
				array(),
			),
			'posts with different scheme' => array(
				'http://example.com',
				'posts',
				array(),
			),
			'posts with index.php'        => array(
				'https://example.com/index.php',
				'posts',
				array(),
			),
			'posts, page 5'               => array(
				'https://example.com/page/5',
				'posts',
				array(
					'paged' => '5',
				),
			),
			'page'                        => array(
				'https://example.com',
				'page',
				array(),
			),
			'page with trailing slash'    => array(
				'https://example.com/',
				'page',
				array(),
			),
			'page with different scheme'  => array(
				'http://example.com',
				'page',
				array(),
			),
			'page with index.php'         => array(
				'https://example.com/index.php',
				'page',
				array(),
			),
		);
	}
}
