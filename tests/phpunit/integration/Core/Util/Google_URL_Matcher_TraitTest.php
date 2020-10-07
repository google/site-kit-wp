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

use Google\Site_Kit\Core\Util\Google_URL_Normalizer;
use Google\Site_Kit\Tests\Core\Util\Google_URL_Matcher;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Google_URL_Matcher_TraitTest extends TestCase {

	private $matcher;
	private $url_normalizer;

	public function setUp() {
		parent::setUp();

		$this->matcher        = new Google_URL_Matcher();
		$this->url_normalizer = new Google_URL_Normalizer();
	}


	/**
	 * @dataProvider data_url_normalizer
	 *
	 * @param string $domain   A domain.
	 * @param string $compare  The domain or URL to compare.
	 * @param bool   $expected Whether a match is expected or not.
	 */
	public function test_url_normalizer( $domain, $compare, $expected ) {
		$domain  = $this->url_normalizer->normalize_url( $domain );
		$compare = $this->url_normalizer->normalize_url( $compare );

		$result = $domain === $compare;
		if ( $expected ) {
			$this->assertTrue( $result );
		} else {
			$this->assertFalse( $result );
		}
	}

	public function data_url_normalizer() {
		return array(
			'equal URL'                           => array(
				'http://example.com',
				'http://example.com',
				true,
			),
			'equal URL except trailing slash'     => array(
				'http://example.com',
				'http://example.com/',
				true,
			),
			'equal compare except trailing slash' => array(
				'http://example.com/',
				'http://example.com',
				true,
			),
			'different domain'                    => array(
				'http://example.com',
				'http://example2.com',
				false,
			),
			'different path'                      => array(
				'http://example.com',
				'http://example.com/test/',
				false,
			),
			'different scheme'                    => array(
				'http://example.com',
				'https://example.com',
				false,
			),
			'subdomain'                           => array(
				'http://example.com',
				'http://blog.example.com',
				false,
			),
			'www subdomain'                       => array(
				'http://example.com',
				'http://www.example.com',
				false,
			),
			'unicode domain'                      => array(
				'http://türkish.com',
				'http://türkish.com',
				true,
			),
			'unicode and punycode domain'         => array(
				'http://türkish.com',
				'http://xn--trkish-3ya.com',
				true,
			),
			'unicode different path'              => array(
				'http://türkish.com/path',
				'http://xn--trkish-3ya.com/other-path',
				false,
			),
			'punycode domains'                    => array(
				'http://xn--trkish-3ya.com',
				'http://xn--trkish-3ya.com',
				true,
			),
			'unicode and non-unicode domain'      => array(
				'http://türkish.com',
				'http://turkish.com',
				false,
			),
			'url with and without bidirectional control characters' => array(
				'xn--5dbedds0a1eb4361d.xn--9dbq2a',
				'‬ביקדקוםה.קום',
				true,
			),
			'url with and without bidirectional control characters' => array(
				'xn--5dbedds0a1eb4361d.xn--9dbq2a',
				'http://‫בדיקה‬.‫קום‬/',
				//'‬ביקדקוםה.קום',
				true,
			),

		);
	}


}

