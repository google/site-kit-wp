<?php
/**
 * Google_URL_NormalizerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Google_URL_Normalizer;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Google_URL_NormalizerTest extends TestCase {

	private $url_normalizer;

	public function set_up() {
		parent::set_up();

		$this->url_normalizer = new Google_URL_Normalizer();
	}

	/**
	 * @dataProvider data_normalize_url
	 *
	 * @param string $url      URL to normalize.
	 * @param string $expected Expected normalization result.
	 */
	public function test_normalize_url( $url, $expected ) {
		$actual = $this->url_normalizer->normalize_url( $url );
		$this->assertSame( $expected, $actual );
	}

	public function data_normalize_url() {
		return array(
			'regular URL'           => array(
				'https://example.com',
				'https://example.com',
			),
			'camel-case URL'        => array(
				'https://exampleSite.com',
				'https://examplesite.com',
			),
			'unicode URL'           => array(
				'https://türkish.com',
				'https://xn--trkish-3ya.com',
			),
			'punycode URL'          => array(
				'https://xn--trkish-3ya.com',
				'https://xn--trkish-3ya.com',
			),
			'unicode URL with path' => array(
				'https://türkish.com/path',
				'https://xn--trkish-3ya.com/path',
			),
			'unicode domain'        => array(
				'türkish.com',
				'xn--trkish-3ya.com',
			),
			'unicode domain with bidirectional control characters' => array(
				'‬ביקדקוםה.קום',
				'xn--5dbedds0a1eb.xn--9dbq2a',
			),
			'punycode domain with bidirectional control characters' => array(
				'‬xn--5dbedds0a1eb.xn--9dbq2a',
				'xn--5dbedds0a1eb.xn--9dbq2a',
			),
		);
	}
}
