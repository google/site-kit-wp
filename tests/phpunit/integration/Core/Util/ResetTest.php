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
	use OptionsTestTrait;
	use UserOptionsTestTrait;
	use TransientsTestTrait;

	const TEST_OPTION = 'googlesitekit_test_option';

	/**
	 * @var Context
	 */
	protected $context_with_mutable_input;

	public function set_up() {
		parent::set_up();

		// Set up a test option as a way to check if reset ran or not.
		// When the reset runs, this option will no longer exist.
		update_option( self::TEST_OPTION, 'test-value' );

		$this->context_with_mutable_input = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
	}

	public function test_all() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertFalse( $context->is_network_mode() );
		update_option( 'googlesitekitkeep', 'keep' );
		update_option( 'googlesitekit-keep', 'keep' );

		$post_id = $this->factory()->post->create();
		add_post_meta( $post_id, 'googlesitekitkeep', 'keep' );
		add_post_meta( $post_id, 'googlesitekit-keep', 'keep' );
		add_post_meta( $post_id, 'googlesitekit_keep', 'delete' );

		$this->run_reset( $context );

		// Ensure options that don't start with googlesitekit_ are not deleted.
		$this->assertEquals( 'keep', get_option( 'googlesitekitkeep' ) );
		$this->assertEquals( 'keep', get_option( 'googlesitekit-keep' ) );

		// Ensure post meta that do not start with googlesitekit_ are not deleted.
		$this->assertEquals( 'keep', get_post_meta( $post_id, 'googlesitekitkeep', true ) );
		$this->assertEquals( 'keep', get_post_meta( $post_id, 'googlesitekit-keep', true ) );
		$this->assertEquals( '', get_post_meta( $post_id, 'googlesitekit_keep', true ) );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_all() {
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertTrue( $context->is_network_mode() );

		$this->run_reset( $context );
	}

	public function test_handle_reset_action_with_bad_nonce() {
		remove_all_actions( 'admin_action_' . Reset::ACTION );
		$reset = new Reset( $this->context_with_mutable_input );
		$reset->register();
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );

		$_GET['nonce'] = 'bad-nonce';
		try {
			do_action( 'admin_action_' . Reset::ACTION );
			$this->fail( 'Expected invalid nonce exception' );
		} catch ( WPDieException $die_exception ) {
			$this->assertContains( $die_exception->getMessage(), array( 'The link you followed has expired.', 'Are you sure you want to do this?' ) );
		}

		$this->assertOptionExists( self::TEST_OPTION );
	}

	public function test_handle_reset_action__with_valid_nonce_and_insufficient_permissions() {
		remove_all_actions( 'admin_action_' . Reset::ACTION );
		$reset = new Reset( $this->context_with_mutable_input );
		$reset->register();
		wp_set_current_user( $this->factory()->user->create() );

		$_GET['nonce'] = wp_create_nonce( Reset::ACTION );
		// Requires Site Kit setup permissions.
		try {
			do_action( 'admin_action_' . Reset::ACTION );
			$this->fail( 'Expected insufficient permissions exception' );
		} catch ( WPDieException $die_exception ) {
			$this->assertStringContainsString( 'permissions to set up Site Kit', $die_exception->getMessage() );
		}
		$this->assertOptionExists( self::TEST_OPTION );
	}

	public function test_handle_reset_action__resets_and_redirects() {
		remove_all_actions( 'admin_action_' . Reset::ACTION );
		$reset = new Reset( $this->context_with_mutable_input );
		$reset->register();
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );
		$this->assertTrue( current_user_can( Permissions::SETUP ), 'failed asserting current user can Permissions::SETUP' );

		$_GET['nonce'] = wp_create_nonce( Reset::ACTION );
		// Expect redirects on success.
		try {
			do_action( 'admin_action_' . Reset::ACTION );
			$this->fail( 'Expected redirection' );
		} catch ( RedirectException $redirect ) {
			$redirect_url = $redirect->get_location();
			$this->assertStringStartsWith( $this->context_with_mutable_input->admin_url( 'splash' ), $redirect_url );
			$this->assertStringContainsString( '&googlesitekit_reset_session=1', $redirect_url );
			$this->assertStringContainsString( '&notification=reset_success', $redirect_url );

		}
		// Reset ran and option no longer exists.
		$this->assertOptionNotExists( self::TEST_OPTION );
	}

	public function test_hard_reset() {
		add_filter( 'googlesitekit_hard_reset_enabled', '__return_true' );

		$user_id         = $this->factory()->user->create();
		$context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$is_network_mode = $context->is_network_mode();

		$option_name   = 'googlesitekitpersistent_option';
		$transient_key = 'googlesitekitpersistent_transient';

		if ( $is_network_mode ) {
			update_network_option( null, $option_name, "test-{$option_name}-value" );
			update_user_meta( $user_id, $option_name, "test-{$option_name}-value" );
			set_site_transient( $transient_key, "test-{$transient_key}-value" );
		} else {
			update_option( $option_name, 'test-foo-value' );
			update_user_option( $user_id, $option_name, "test-{$option_name}-value" );
			set_transient( $transient_key, "test-{$transient_key}-value" );
		}

		$this->test_handle_reset_action__resets_and_redirects();

		if ( $is_network_mode ) {
			remove_all_filters( "default_site_option_{$option_name}" );
			$this->assertFalse( get_network_option( null, $option_name ) );
			$this->assertFalse( metadata_exists( 'user', $user_id, $option_name ) );
			$this->assertFalse( get_site_transient( $transient_key ) );
		} else {
			remove_all_filters( "default_option_{$option_name}" );
			$this->assertFalse( get_option( $option_name ) );
			$this->assertFalse( get_user_option( $option_name, $user_id ) );
			$this->assertFalse( get_transient( $transient_key ) );
		}
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
