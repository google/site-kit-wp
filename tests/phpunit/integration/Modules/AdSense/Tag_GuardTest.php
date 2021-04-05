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

	protected function get_guard( array $options = array() ) {
		static $guard = null;

		if ( is_null( $guard ) ) {
			$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
			$guard    = new Tag_Guard( $settings );
		}

		update_option(
			Settings::OPTION,
			array_merge(
				array(
					'clientID'   => 'test-client-id',
					'useSnippet' => true,
				),
				$options
			)
		);

		return $guard;
	}

	public function test_can_activate() {
		$guard = $this->get_guard();
		$this->assertTrue( $guard->can_activate() );
	}

	public function test_cant_activate_when_usesnippet_is_falsy() {
		$guard = $this->get_guard( array( 'useSnippet' => false ) );
		$this->assertFalse( $guard->can_activate(), 'Should return FALSE when useSnippet has negative value.' );
	}

	public function test_cant_activate_when_clientid_is_invalid() {
		$guard = $this->get_guard( array( 'clientID' => '' ) );
		$this->assertFalse( $guard->can_activate(), 'Should return FALSE when clientID is empty.' );
	}

	public function test_cant_activate_on_404() {
		$guard = $this->get_guard();

		$this->go_to( '/?p=123456789' );
		$this->assertQueryTrue( 'is_404' );

		$this->assertFalse( $guard->can_activate(), 'Should return FALSE when the current page doesnt exist (is_404).' );
	}

}
