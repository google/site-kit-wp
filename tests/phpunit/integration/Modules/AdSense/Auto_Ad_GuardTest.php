<?php
/**
 * Class Google\Site_Kit\Tests\Modules\AdSense\Auto_Ad_GuardTest
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
use Google\Site_Kit\Modules\AdSense\Auto_Ad_Guard;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group AdSense
 */
class Auto_Ad_GuardTest extends TestCase {

	private function get_auto_ad_guard( $auto_ads_disabled = array() ) {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$guard    = new Auto_Ad_Guard( $settings );

		update_option( Settings::OPTION, array( 'autoAdsDisabled' => $auto_ads_disabled ) );

		return $guard;
	}

	public function test_can_activate() {
		$guard = $this->get_auto_ad_guard();

		$this->assertTrue( $guard->can_activate() );
	}

	public function test_cant_activate_logged_in_users() {
		$guard = $this->get_auto_ad_guard( array( 'loggedinUsers' ) );

		// Login basic user
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		$this->assertFalse( $guard->can_activate(), 'Should return FALSE when loggedinUsers is set.' );
	}

	public function test_cant_activate_content_creators() {
		$guard = $this->get_auto_ad_guard( array( 'contentCreators' ) );

		$editor_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );

		$this->assertFalse( $guard->can_activate(), 'Should return FALSE when contentCreators is set.' );
	}
}
