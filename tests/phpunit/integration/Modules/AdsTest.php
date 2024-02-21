<?php
/**
 * AdsTest
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Ads;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class AdsTest extends TestCase {

	public function test_magic_methods() {
		$ads = new Ads( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEquals( 'ads', $ads->slug );
		$this->assertEquals( 'Ads', $ads->name );
		$this->assertEquals( 'https://google.com/ads', $ads->homepage );
	}
}
