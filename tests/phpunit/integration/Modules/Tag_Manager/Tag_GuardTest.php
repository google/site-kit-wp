<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Tag_Manager\Tag_GuardTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Tag_Manager
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Tag_Manager;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Tag_Manager\Settings;
use Google\Site_Kit\Modules\Tag_Manager\Tag_Guard;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Tag_Manager
 */
class Tag_GuardTest extends TestCase {

	public function test_can_activate_for_web() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$guard    = new Tag_Guard( $settings, false );

		update_option(
			Settings::OPTION,
			array(
				'containerID' => 'test-container-id',
				'useSnippet'  => true,
			)
		);

		$this->assertTrue( $guard->can_activate() );
	}

	public function test_cant_activate_for_web() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$guard    = new Tag_Guard( $settings, false );

		update_option(
			Settings::OPTION,
			array(
				'containerID' => 'test-container-id',
				'useSnippet'  => false,
			)
		);

		$this->assertFalse( $guard->can_activate(), 'Should return FALSE when useSnippet has negative value.' );

		update_option(
			Settings::OPTION,
			array(
				'containerID' => '',
				'useSnippet'  => true,
			)
		);

		$this->assertFalse( $guard->can_activate(), 'Should return FALSE when containerID is empty.' );
	}

	public function test_can_activate_for_amp() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$guard    = new Tag_Guard( $settings, true );

		update_option(
			Settings::OPTION,
			array(
				'ampContainerID' => 'test-amp-container-id',
				'useSnippet'     => true,
			)
		);

		$this->assertTrue( $guard->can_activate() );
	}

	public function test_cant_activate_for_amp() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$guard    = new Tag_Guard( $settings, true );

		update_option(
			Settings::OPTION,
			array(
				'ampContainerID' => 'test-amp-container-id',
				'useSnippet'     => false,
			)
		);

		$this->assertFalse( $guard->can_activate(), 'Should return FALSE when useSnippet has negative value.' );

		update_option(
			Settings::OPTION,
			array(
				'ampContainerID' => '',
				'useSnippet'     => true,
			)
		);

		$this->assertFalse( $guard->can_activate(), 'Should return FALSE when ampContainerID is empty.' );
	}
}
