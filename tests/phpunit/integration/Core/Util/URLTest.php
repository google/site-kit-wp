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
	public function test_parse( $url, $expected ) {
		$this->assertEquals(
			$expected,
			URL::parse( $url )
		);
	}

	public function data_urls() {
		return array(
			'http://éxämplę.test'                    => array(
				'http://éxämplę.test',
				array(
					'scheme' => 'http',
					'host'   => 'éxämplę.test',
				),
			),
			'https://www.éxämplę.test/sub-directory' => array(
				'https://www.éxämplę.test/sub-directory',
				array(
					'scheme' => 'https',
					'host'   => 'www.éxämplę.test',
					'path'   => '/sub-directory',
				),
			),
		);
	}

}
