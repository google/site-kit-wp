<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking\Page_ClassifierTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking;

use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Page_Classifier;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Analytics_4
 */
class Page_ClassifierTest extends TestCase {

	/**
	 * @dataProvider data_pages
	 *
	 * @param string $url     The page's path or URL.
	 * @param string $title   The page's title.
	 * @param string $verdict The page's verdict on a site with its own front page.
	 */
	public function test_classify__gives_each_page_its_verdict( $url, $title, $verdict ) {
		$this->assertSame( $verdict, ( new Page_Classifier( true ) )->classify( $url, $title ), 'The page should have its verdict.' );
	}

	public function data_pages() {
		return array(
			'the root'                                     => array( '/', '', Page_Classifier::HOMEPAGE ),
			'the root without a slash'                     => array( '', '', Page_Classifier::HOMEPAGE ),
			'the root with a query'                        => array( '/?utm_source=x', '', Page_Classifier::HOMEPAGE ),
			'an absolute URL without a path'               => array( 'https://example.com', '', Page_Classifier::HOMEPAGE ),
			'`/home`'                                      => array( '/home/', '', Page_Classifier::HOMEPAGE ),
			'`/home2`'                                     => array( '/home2', '', Page_Classifier::HOMEPAGE ),
			'`/index.php`'                                 => array( '/index.php', '', Page_Classifier::HOMEPAGE ),
			'`/inicio`'                                    => array( '/Inicio/', '', Page_Classifier::HOMEPAGE ),
			'the sample post'                              => array( '/2024/01/hello-world/', '', Page_Classifier::NON_CONTENT ),
			'the sample post by its title'                 => array( '/first/', 'Hello world!', Page_Classifier::NON_CONTENT ),
			'a later page of a list'                       => array( '/blog/page/2/', '', Page_Classifier::NON_CONTENT ),
			'a test page'                                  => array( '/test/form/', '', Page_Classifier::NON_CONTENT ),
			'a tag test page by its title'                 => array( '/a/', 'Tagtest page', Page_Classifier::NON_CONTENT ),
			'a repeated login segment'                     => array( '/login/a/login/', '', Page_Classifier::NON_CONTENT ),
			'a feed'                                       => array( '/blog/feed/', '', Page_Classifier::NON_CONTENT ),
			'an admin page'                                => array( '/wp-admin/edit.php', '', Page_Classifier::NON_CONTENT ),
			'the login page'                               => array( '/wp-login.php', '', Page_Classifier::NON_CONTENT ),
			'a cart'                                       => array( '/shop/cart/', '', Page_Classifier::NON_CONTENT ),
			'the search on a site with its own front page' => array( '/search', '', Page_Classifier::NON_CONTENT ),
			'the first page of a list'                     => array( '/blog/page/1/', '', Page_Classifier::CONTENT ),
			'a post'                                       => array( '/plant-garlic/', 'How to plant garlic', Page_Classifier::CONTENT ),
			'a single segment'                             => array( '/blog/', '', Page_Classifier::CONTENT ),
			'a post about tests'                           => array( '/testing-tips/', '', Page_Classifier::CONTENT ),
		);
	}

	public function test_classify__reads_the_search_of_a_site_without_its_own_front_page_as_the_homepage() {
		$this->assertSame( Page_Classifier::HOMEPAGE, ( new Page_Classifier( false ) )->classify( '/search' ), 'The search page of a site without its own front page should be the homepage.' );
		$this->assertSame( Page_Classifier::NON_CONTENT, ( new Page_Classifier( null ) )->classify( '/search' ), 'A site whose front page is not known should count as having one.' );
	}

	public function test_classify__reads_the_folder_the_site_lives_under_as_the_homepage() {
		$classifier = new Page_Classifier( false, '/blog/' );

		$this->assertSame( Page_Classifier::HOMEPAGE, $classifier->classify( '/blog/' ), 'The site\'s own homepage should be the homepage.' );
		$this->assertSame( Page_Classifier::CONTENT, $classifier->classify( '/blog/plant-garlic/' ), 'A post under the folder should be content.' );
	}

	public function test_is_displayable__shows_only_content() {
		$classifier = new Page_Classifier( true );

		$this->assertTrue( $classifier->is_displayable( '/plant-garlic/' ), 'A post should be displayable.' );
		$this->assertFalse( $classifier->is_displayable( '/' ), 'The root should not be displayable.' );
		$this->assertFalse( $classifier->is_displayable( '/feed/' ), 'A feed should not be displayable.' );
		$this->assertFalse( $classifier->is_displayable( '(not set)' ), 'A placeholder should not be displayable.' );
	}

	/**
	 * @dataProvider data_front_page_shares
	 *
	 * @param array     $page_rows      The landing page rows.
	 * @param bool|null $has_front_page Whether the site has its own front page.
	 */
	public function test_has_front_page__tells_from_the_roots_share_of_the_visits( array $page_rows, $has_front_page ) {
		$this->assertSame( $has_front_page, Page_Classifier::has_front_page( $page_rows ), 'The site should have its own front page when its root carries 1% of its visits.' );
	}

	public function data_front_page_shares() {
		$row = fn( $page, $current, $previous ) => array(
			'page'     => $page,
			'current'  => $current,
			'previous' => $previous,
		);

		return array(
			'a root with 1% of the visits' => array( array( $row( '/', 1, 1 ), $row( '/a/', 100, 98 ) ), true ),
			'a root with under 1%'         => array( array( $row( '/', 1, 0 ), $row( '/a/', 100, 99 ) ), false ),
			'no root'                      => array( array( $row( '/a/', 100, 100 ) ), false ),
			'no visits to tell from'       => array( array(), null ),
		);
	}
}
