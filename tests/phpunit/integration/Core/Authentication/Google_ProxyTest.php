<?php
/**
 * Class Google\Site_Kit\Tests\Core\Authentication${FILE_NAME}
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use WPDieException;

class Google_ProxyTest extends TestCase {

	public function test_register() {
		$proxy = new Google_Proxy( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$setup_proxy_admin_action = 'admin_action_' . Google_Proxy::ACTION_SETUP;
		remove_all_actions( $setup_proxy_admin_action );

		$proxy->register();

		$this->assertTrue( has_action( $setup_proxy_admin_action ) );
	}

	public function test_verify_proxy_setup_nonce() {
		$setup_proxy_admin_action = 'admin_action_' . Google_Proxy::ACTION_SETUP;
		remove_all_actions( $setup_proxy_admin_action );
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$proxy = new Google_Proxy( $context );
		$proxy->register();

		// Ensure that wp_die is called if nonce verification fails.
		$_GET['nonce'] = 'bad-nonce';

		try {
			do_action( $setup_proxy_admin_action );
		} catch ( WPDieException $exception ) {
			$this->assertEquals( 'Invalid nonce.', $exception->getMessage() );
			return;
		}

		$this->fail( 'Expected WPDieException!' );
	}
}
