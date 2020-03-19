<?php
/**
 * Google_URL_Matcher_TraitTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Tests\Core\Util\Google_URL_Matcher;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Google_URL_Matcher_TraitTest extends TestCase {

	private $matcher;

	public function setUp() {
		parent::setUp();

		$this->matcher = new Google_URL_Matcher();
	}

	/**
	 * @dataProvider data_is_url_match
	 *
	 * @param string $url      The URL.
	 * @param string $compare  The URL to compare.
	 * @param bool   $expected Whether a match is expected or not.
	 */
	public function test_is_url_match( $url, $compare, $expected ) {
		$result = $this->matcher->is_url_match( $url, $compare );
		if ( $expected ) {
			$this->assertTrue( $result );
		} else {
			$this->assertFalse( $result );
		}
	}

	public function data_is_url_match() {
		return array(
			'equal URL'                       => array(
				'http://example.com',
				'http://example.com',
				true,
			),
			'equal URL except trailing slash' => array(
				'http://example.com',
				'http://example.com/',
				true,
			),
			'different domain'                => array(
				'http://example.com',
				'http://example2.com',
				false,
			),
			'different path'                  => array(
				'http://example.com',
				'http://example.com/test/',
				false,
			),
			'different protocol'              => array(
				'http://example.com',
				'https://example.com',
				false,
			),
			'subdomain'                       => array(
				'http://example.com',
				'http://blog.example.com',
				false,
			),
			'www subdomain'                   => array(
				'http://example.com',
				'http://www.example.com',
				false,
			),
		);
	}

	/**
	 * @dataProvider data_is_domain_match
	 *
	 * @param string $domain   A domain.
	 * @param string $compare  The domain or URL to compare.
	 * @param bool   $expected Whether a match is expected or not.
	 */
	public function test_is_domain_match( $domain, $compare, $expected ) {
		$result = $this->matcher->is_domain_match( $domain, $compare );
		if ( $expected ) {
			$this->assertTrue( $result );
		} else {
			$this->assertFalse( $result );
		}
	}

	public function data_is_domain_match() {
		return array(
			'equal domain'                          => array(
				'example.com',
				'example.com',
				true,
			),
			'different domain'                      => array(
				'example.com',
				'example2.com',
				false,
			),
			'subdomain'                             => array(
				'example.com',
				'blog.example.com',
				false,
			),
			'www subdomain'                         => array(
				'example.com',
				'www.example.com',
				true,
			),
			'full URL with equal domain and only trailing slash' => array(
				'example.com',
				'http://example.com/',
				true,
			),
			'full URL with equal domain and a path' => array(
				'example.com',
				'http://example.com/home',
				false,
			),
			'full URL with subdomain'               => array(
				'example.com',
				'http://blog.example.com',
				false,
			),
			'full URL with www subdomain'           => array(
				'example.com',
				'http://www.example.com',
				true,
			),
		);
	}
}
