<?php
/**
 * URLTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class URLTest extends TestCase {

	/**
	 * @dataProvider data_urls
	 */
	public function test_parse( $url, $component, $expected ) {
		$this->assertEquals(
			$expected,
			URL::parse( $url, $component )
		);
	}

	public function data_urls() {
		return array(
			'Simple URL and requesting all components'   => array(
				'http://éxämplę.test',
				-1,
				array(
					'scheme' => 'http',
					'host'   => 'éxämplę.test',
				),
			),
			'URL with all components and requesting all components' => array(
				'https://www.éxämplę.test:8080/sub-diręctory?nämé=john&surnäme=doé#änchor',
				-1,
				array(
					'scheme'   => 'https',
					'host'     => 'www.éxämplę.test',
					'port'     => '8080',
					'path'     => '/sub-diręctory',
					'query'    => 'nämé=john&surnäme=doé',
					'fragment' => 'änchor',
				),
			),
			'Relative URL but requesting all components' => array(
				'/sub-diręctory?nämé=john&surnäme=doé#änchor',
				-1,
				array(
					'path'     => '/sub-diręctory',
					'query'    => 'nämé=john&surnäme=doé',
					'fragment' => 'änchor',
				),
			),
			'Schemeless URL beginning with slashes which have all other components and requesting all components' => array(
				'//www.éxämplę.test:8080/sub-diręctory?nämé=john&surnäme=doé#änchor',
				-1,
				array(
					'host'     => 'www.éxämplę.test',
					'port'     => '8080',
					'path'     => '/sub-diręctory',
					'query'    => 'nämé=john&surnäme=doé',
					'fragment' => 'änchor',
				),
			),
			'URL with all components and requesting URL scheme' => array(
				'https://www.éxämplę.test:8080/sub-diręctory?nämé=john&surnäme=doé#änchor',
				PHP_URL_SCHEME,
				'https',
			),
			'Schemeless URL with all components and requesting URL scheme' => array(
				'www.éxämplę.test:8080/sub-diręctory?nämé=john&surnäme=doé#änchor',
				PHP_URL_SCHEME,
				null,
			),
			'URL with all components and requesting URL host' => array(
				'https://www.éxämplę.test:8080/sub-diręctory?nämé=john&surnäme=doé#änchor',
				PHP_URL_HOST,
				'www.éxämplę.test',
			),
			'Schemeless URL with all components and requesting URL port' => array(
				'www.éxämplę.test:8080/sub-diręctory?nämé=john&surnäme=doé#änchor',
				PHP_URL_PORT,
				'8080',
			),
			'URL with all components and requesting URL path' => array(
				'https://www.éxämplę.test:8080/sub-diręctory?nämé=john&surnäme=doé#änchor',
				PHP_URL_PATH,
				'/sub-diręctory',
			),
			'URL with all components and requesting URL query params' => array(
				'https://www.éxämplę.test:8080/sub-diręctory?nämé=john&surnäme=doé#änchor',
				PHP_URL_QUERY,
				'nämé=john&surnäme=doé',
			),
			'URL with all components and requesting URL fragment' => array(
				'https://www.éxämplę.test:8080/sub-diręctory?nämé=john&surnäme=doé#änchor',
				PHP_URL_FRAGMENT,
				'änchor',
			),
		);
	}

	/**
	 * @dataProvider data_site_hosts
	 */
	public function test_permute_site_hosts( $hostname, $expected ) {
		$this->assertEqualSets( $expected, URL::permute_site_hosts( $hostname ) );
	}

	public function data_site_hosts() {
		return array(
			'example.com'              => array(
				'example.com',
				array(
					'example.com',
					'www.example.com',
				),
			),
			'www.example.com'          => array(
				'www.example.com',
				array(
					'example.com',
					'www.example.com',
				),
			),
			'éxämplę.test'             => array(
				'éxämplę.test',
				array(
					'éxämplę.test',
					'www.éxämplę.test',
					'xn--xmpl-loa2a55a.test',
					'www.xn--xmpl-loa2a55a.test',
				),
			),
			'éxämplę.test as punycode' => array(
				'xn--xmpl-loa2a55a.test',
				array(
					'éxämplę.test',
					'www.éxämplę.test',
					'xn--xmpl-loa2a55a.test',
					'www.xn--xmpl-loa2a55a.test',
				),
			),
		);
	}

	/**
	 * @dataProvider data_site_urls
	 */
	public function test_permute_site_url( $site_url, $expected ) {
		$this->assertEqualSets( $expected, URL::permute_site_url( $site_url ) );
	}

	public function data_site_urls() {
		return array(
			'http://éxämplę.test'               => array(
				'http://éxämplę.test',
				array(
					'http://éxämplę.test',
					'https://éxämplę.test',
					'http://www.éxämplę.test',
					'https://www.éxämplę.test',
					'http://xn--xmpl-loa2a55a.test',
					'https://xn--xmpl-loa2a55a.test',
					'http://www.xn--xmpl-loa2a55a.test',
					'https://www.xn--xmpl-loa2a55a.test',
				),
			),
			'http://éxämplę.test/sub-directory' => array(
				'http://éxämplę.test/sub-directory',
				array(
					'http://éxämplę.test/sub-directory',
					'https://éxämplę.test/sub-directory',
					'http://www.éxämplę.test/sub-directory',
					'https://www.éxämplę.test/sub-directory',
					'http://xn--xmpl-loa2a55a.test/sub-directory',
					'https://xn--xmpl-loa2a55a.test/sub-directory',
					'http://www.xn--xmpl-loa2a55a.test/sub-directory',
					'https://www.xn--xmpl-loa2a55a.test/sub-directory',
				),
			),
			'http://éxämplę.test/sub-directory as punycode' => array(
				'http://xn--xmpl-loa2a55a.test/sub-directory',
				array(
					'http://éxämplę.test/sub-directory',
					'https://éxämplę.test/sub-directory',
					'http://www.éxämplę.test/sub-directory',
					'https://www.éxämplę.test/sub-directory',
					'http://xn--xmpl-loa2a55a.test/sub-directory',
					'https://xn--xmpl-loa2a55a.test/sub-directory',
					'http://www.xn--xmpl-loa2a55a.test/sub-directory',
					'https://www.xn--xmpl-loa2a55a.test/sub-directory',
				),
			),
		);
	}
}
