<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Optimize\Tag_GuardTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Optimize
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Optimize;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Optimize\Settings;
use Google\Site_Kit\Modules\Optimize\Tag_Guard;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Optimize
 */
class Tag_GuardTest extends TestCase {

	private function get_auto_ad_guard( $place_anti_flicker_snippet = false ) {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$guard    = new Tag_Guard( $settings );

		update_option( Settings::OPTION, array( 'placeAntiFlickerSnippet' => $place_anti_flicker_snippet ) );

		return $guard;
	}

	public function test_can_activate() {
		$guard = $this->get_auto_ad_guard( true );

		$this->assertTrue( $guard->can_activate() );
	}

	public function test_cant_activate() {
		$guard = $this->get_auto_ad_guard();

		$this->assertFalse( $guard->can_activate(), 'Should return FALSE when placeAntiFlickerSnippet has negative value.' );
	}

}
