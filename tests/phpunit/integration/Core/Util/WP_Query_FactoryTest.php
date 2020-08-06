<?php
/**
 * Class Google\Site_Kit\Tests\Core\Util\WP_Query_FactoryTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\WP_Query_Factory;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Utill
 */
class WP_Query_FactoryTest extends TestCase {

	/**
	 * @dataProvider data_from_url
	 *
	 * @param string $url           URL to get query arguments.
	 * @param array  $expected_args Expected query arguments.
	 * @param array  $template_tags Map of template tag method names and whether they should be `true` or `false`.
	 */
	public function test_from_url( $url, $expected_args, $template_tags ) {
		global $wp_rewrite;

		add_filter(
			'option_home',
			function() {
				return 'https://example.com';
			}
		);

		$wp_rewrite->set_permalink_structure( '/%postname%/' );

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
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $home_id );
		update_option( 'page_for_posts', $blog_id );

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

		flush_rewrite_rules();

		$query = WP_Query_Factory::from_url( $url );
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

	public function data_from_url() {
		// Home URL is 'https://example.com'.
		// Permalink structure is '/%postname%/'.
		// Front page is a static page with slug 'home'.
		// Posts page has the slug 'blog'.
		// There is a custom post type called 'customposttype'.
		// There is a custom taxonomy called 'customtaxonomy'.
		return array(
			'front page'                 => array(
				'https://example.com/',
				array(),
				array(
					'is_front_page' => true,
					'is_page'       => true,
					'is_home'       => false,
					'is_singular'   => true,
				),
			),
			'blog page'                  => array(
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
			'blog page, page 3'          => array(
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
			'single post'                => array(
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
			'author archives'            => array(
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
			'author archives, page 2'    => array(
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
			'year archives'              => array(
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
			'year archives, page 3'      => array(
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
			'month archives'             => array(
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
			'month archives, page 3'     => array(
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
			'day archives'               => array(
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
			'day archives, page 3'       => array(
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
			'custom post type post'      => array(
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
			'post type archives'         => array(
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
			'post type archives, page 3' => array(
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
			'taxonomy archives'          => array(
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
			'taxonomy archives, page 3'  => array(
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
			function() {
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

		$query = WP_Query_Factory::from_url( $url );
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
