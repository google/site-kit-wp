<?php
/**
 * Class Google\Site_Kit\Tests\Modules\AdSense\Tag_GuardTest
 *
 * @package   Google\Site_Kit\Tests\Modules\AdSense
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\AdSense;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\AdSense\Settings;
use Google\Site_Kit\Modules\AdSense\Tag_Guard;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group AdSense
 */
class Tag_GuardTest extends TestCase {

	public function test_can_activate() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$guard    = new Tag_Guard( $settings );

		update_option(
			Settings::OPTION,
			array(
				'clientID'   => 'test-client-id',
				'useSnippet' => true,
			)
		);

		$this->assertTrue( $guard->can_activate() );
	}

	public function test_cant_activate() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$guard    = new Tag_Guard( $settings );

		update_option(
			Settings::OPTION,
			array(
				'clientID'   => 'test-client-id',
				'useSnippet' => false,
			)
		);

		$this->assertFalse( $guard->can_activate(), 'Should return FALSE when useSnippet has negative value.' );

		update_option(
			Settings::OPTION,
			array(
				'clientID'   => '',
				'useSnippet' => true,
			)
		);

		$this->assertFalse( $guard->can_activate(), 'Should return FALSE when clientID is empty.' );
	}

}
