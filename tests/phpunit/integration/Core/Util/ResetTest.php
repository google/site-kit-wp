<?php
/**
 * ResetTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Util\Reset;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\OptionsTestTrait;
use Google\Site_Kit\Tests\UserOptionsTestTrait;
use Google\Site_Kit\Tests\TransientsTestTrait;
use WPDieException;

/**
 * @group Util
 */
class ResetTest extends TestCase {
	use OptionsTestTrait, UserOptionsTestTrait, TransientsTestTrait;

	public function test_all() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertFalse( $context->is_network_mode() );
		update_option( 'googlesitekitkeep', 'keep' );
		update_option( 'googlesitekit-keep', 'keep' );

		$this->run_reset( $context );

		// Ensure options that don't start with googlesitekit_ are not deleted.
		$this->assertEquals( 'keep', get_option( 'googlesitekitkeep' ) );
		$this->assertEquals( 'keep', get_option( 'googlesitekit-keep' ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_all() {
		$this->network_activate_site_kit();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertTrue( $context->is_network_mode() );

		$this->run_reset( $context );
	}

	public function test_handle_reset_action() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		remove_all_actions( 'admin_action_' . Reset::ACTION );
		$reset = new Reset( $context );
		$reset->register();
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );
		// Set up a test option as a way to check if reset ran or not.
		// When the reset runs, this option will no longer exist.
		$test_option = 'googlesitekit_test_option';
		update_option( $test_option, 'test-value' );

		$_GET['nonce'] = 'bad-nonce';
		try {
			do_action( 'admin_action_' . Reset::ACTION );
			$this->fail( 'Expected invalid nonce exception' );
		} catch ( WPDieException $die_exception ) {
			$this->assertContains( 'Invalid nonce', $die_exception->getMessage() );
		}

		$this->assertOptionExists( $test_option );

		$_GET['nonce'] = wp_create_nonce( Reset::ACTION );
		// Requires Site Kit setup permissions.
		try {
			do_action( 'admin_action_' . Reset::ACTION );
			$this->fail( 'Expected insufficient permissions exception' );
		} catch ( WPDieException $die_exception ) {
			$this->assertContains( 'permissions to set up Site Kit', $die_exception->getMessage() );
		}

		$this->assertOptionExists( $test_option );

		$this->assertFalse( current_user_can( Permissions::SETUP ), 'failed asserting current user cannot Permissions::SETUP' );
		wp_get_current_user()->set_role( 'administrator' );
		$this->assertTrue( current_user_can( Permissions::SETUP ), 'failed asserting current user can Permissions::SETUP' );
		// Expect redirects on success.
		try {
			do_action( 'admin_action_' . Reset::ACTION );
			$this->fail( 'Expected redirection' );
		} catch ( RedirectException $redirect ) {
			$redirect_url = $redirect->get_location();
			$this->assertContains( $context->admin_url( 'splash' ), $redirect_url );
			$this->assertContains( '&googlesitekit_reset_session=1', $redirect_url );
			$this->assertContains( '&notification=reset_success', $redirect_url );
		}
		// Reset ran and option no longer exists.
		$this->assertOptionNotExists( $test_option );
	}

	protected function run_reset( Context $context ) {
		wp_load_alloptions();
		$this->assertNotFalse( wp_cache_get( 'alloptions', 'options' ) );

		$user_id         = $this->factory()->user->create();
		$reset           = new Reset( $context );
		$is_network_mode = $context->is_network_mode();

		$this->init_option_values( $is_network_mode );
		$this->init_user_option_values( $user_id, $is_network_mode );
		$this->init_transient_values( $is_network_mode );

		$reset->all();

		// Ensure options cache is flushed (must check before accessing other options as this will re-prime the cache)
		$this->assertFalse( wp_cache_get( 'alloptions', 'options' ) );
		$this->assertOptionsDeleted( $is_network_mode );
		$this->assertUserOptionsDeleted( $user_id, $is_network_mode );
		$this->assertTransientsDeleted( $is_network_mode );
	}
}
