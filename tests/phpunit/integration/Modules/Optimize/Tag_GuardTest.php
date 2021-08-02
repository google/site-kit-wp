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

	public function test_can_activate() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$guard    = new Tag_Guard( $settings, false );

		update_option(
			Settings::OPTION,
			array(
				'placeAntiFlickerSnippet' => true,
			)
		);

		$this->assertTrue( $guard->can_activate() );
	}

	public function test_cant_activate() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$guard    = new Tag_Guard( $settings, false );

		update_option(
			Settings::OPTION,
			array(
				'placeAntiFlickerSnippet' => false,
			)
		);

		$this->assertFalse( $guard->can_activate(), 'Should return FALSE when placeAntiFlickerSnippet has negative value.' );
	}

}
