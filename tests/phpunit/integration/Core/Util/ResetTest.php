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
use Google\Site_Kit\Core\Email_Reporting\Email_Log;
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

	/**
	 * Indicates whether the email log post type and metadata were registered.
	 *
	 * @var bool
	 */
	protected $email_log_registered = false;

	public function set_up() {
		parent::set_up();

		// Set up a test option as a way to check if reset ran or not.
		// When the reset runs, this option will no longer exist.
		update_option( self::TEST_OPTION, 'test-value' );

		$this->context_with_mutable_input = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
	}

	public function tear_down() {
		if ( $this->email_log_registered ) {
			$this->unregister_email_log_dependencies();
			$this->email_log_registered = false;
		}

		parent::tear_down();
	}

	public function test_all() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertFalse( $context->is_network_mode(), 'Context should not be in network mode by default.' );
		update_option( 'googlesitekitkeep', 'keep' );
		update_option( 'googlesitekit-keep', 'keep' );

		$post_id = $this->factory()->post->create();
		$term_id = $this->factory()->term->create();
		add_post_meta( $post_id, 'googlesitekitkeep', 'keep' );
		add_post_meta( $post_id, 'googlesitekit-keep', 'keep' );
		add_post_meta( $post_id, 'googlesitekit_keep', 'delete' );

		add_term_meta( $term_id, 'googlesitekitkeep', 'keep' );
		add_term_meta( $term_id, 'googlesitekit-keep', 'keep' );
		add_term_meta( $term_id, 'googlesitekit_keep', 'delete' );

		$this->run_reset( $context );

		// Ensure options that don't start with googlesitekit_ are not deleted.
		$this->assertEquals( 'keep', get_option( 'googlesitekitkeep', 'Option without underscore should be kept.' ), 'Option without underscore should be kept.' );
		$this->assertEquals( 'keep', get_option( 'googlesitekit-keep', 'Option with dash should be kept.' ), 'Option with dash should be kept.' );

		// Ensure post meta that do not start with googlesitekit_ are not deleted.
		$this->assertEquals( 'keep', get_post_meta( $post_id, 'googlesitekitkeep', true ), 'Post meta without underscore should be kept.' );
		$this->assertEquals( 'keep', get_post_meta( $post_id, 'googlesitekit-keep', true ), 'Post meta with dash should be kept.' );
		$this->assertEquals( '', get_post_meta( $post_id, 'googlesitekit_keep', true ), 'Post meta with underscore should be deleted.' );

		// Ensure term meta that do not start with googlesitekit_ are not deleted.
		$this->assertEquals( 'keep', get_term_meta( $term_id, 'googlesitekitkeep', true ), 'Term meta without underscore should be kept.' );
		$this->assertEquals( 'keep', get_term_meta( $term_id, 'googlesitekit-keep', true ), 'Term meta with dash should be kept.' );
		$this->assertEquals( '', get_term_meta( $term_id, 'googlesitekit_keep', true ), 'Term meta with underscore should be deleted.' );
	}

	public function test_all_deletes_email_log_posts() {
		$this->register_email_log_dependencies();

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$first_log = $this->factory()->post->create(
			array(
				'post_type'   => Email_Log::POST_TYPE,
				'post_status' => Email_Log::STATUS_SCHEDULED,
			)
		);
		add_post_meta( $first_log, Email_Log::META_BATCH_ID, 'batch-a' );

		$second_log = $this->factory()->post->create(
			array(
				'post_type'   => Email_Log::POST_TYPE,
				'post_status' => Email_Log::STATUS_FAILED,
			)
		);
		add_post_meta( $second_log, Email_Log::META_SEND_ATTEMPTS, 2 );

		$this->run_reset( $context );

		$this->assertNull( get_post( $first_log ), 'Email log posts should be deleted after reset.' );
		$this->assertNull( get_post( $second_log ), 'Email log posts should be deleted after reset.' );
		$this->assertFalse( metadata_exists( 'post', $first_log, Email_Log::META_BATCH_ID ), 'Email log post meta should be deleted after reset.' );
		$this->assertFalse( metadata_exists( 'post', $second_log, Email_Log::META_SEND_ATTEMPTS ), 'Email log post meta should be deleted after reset.' );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_all() {
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertTrue( $context->is_network_mode(), 'Context should be in network mode when filter is enabled.' );

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
			$this->assertContains( $die_exception->getMessage(), array( 'The link you followed has expired.', 'Are you sure you want to do this?' ), 'Should show appropriate error message for invalid nonce.' );
		}

		$this->assertOptionExists( self::TEST_OPTION, 'Test option should still exist after failed reset.' );
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
			$this->assertStringContainsString( 'permissions to set up Site Kit', $die_exception->getMessage(), 'Should show appropriate error message for insufficient permissions.' );
		}
		$this->assertOptionExists( self::TEST_OPTION, 'Test option should still exist after failed reset.' );
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
			$this->assertStringStartsWith( $this->context_with_mutable_input->admin_url( 'splash' ), $redirect_url, 'Redirect URL should start with splash page.' );
			$this->assertStringContainsString( '&googlesitekit_reset_session=1', $redirect_url, 'Redirect URL should contain reset session parameter.' );
			$this->assertStringContainsString( '&notification=reset_success', $redirect_url, 'Redirect URL should contain success notification parameter.' );

		}
		// Reset ran and option no longer exists.
		$this->assertOptionNotExists( self::TEST_OPTION, 'Test option should be deleted after successful reset.' );
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
			$this->assertFalse( get_network_option( null, $option_name ), 'Network option should be deleted after hard reset.' );
			$this->assertFalse( metadata_exists( 'user', $user_id, $option_name ), 'User meta should be deleted after hard reset.' );
			$this->assertFalse( get_site_transient( $transient_key ), 'Site transient should be deleted after hard reset.' );
		} else {
			remove_all_filters( "default_option_{$option_name}" );
			$this->assertFalse( get_option( $option_name ), 'Option should be deleted after hard reset.' );
			$this->assertFalse( get_user_option( $option_name, $user_id ), 'User option should be deleted after hard reset.' );
			$this->assertFalse( get_transient( $transient_key ), 'Transient should be deleted after hard reset.' );
		}
	}

	protected function run_reset( Context $context ) {
		wp_load_alloptions();
		$this->assertNotFalse( wp_cache_get( 'alloptions', 'options' ), 'Options cache should be loaded.' );

		$user_id         = $this->factory()->user->create();
		$reset           = new Reset( $context );
		$is_network_mode = $context->is_network_mode();

		$this->init_option_values( $is_network_mode );
		$this->init_user_option_values( $user_id, $is_network_mode );
		$this->init_transient_values( $is_network_mode );

		$reset->all();

		// Ensure options cache is flushed (must check before accessing other options as this will re-prime the cache)
		$this->assertFalse( wp_cache_get( 'alloptions', 'options' ), 'Options cache should be flushed after reset.' );
		$this->assertOptionsDeleted( $is_network_mode );
		$this->assertUserOptionsDeleted( $user_id, $is_network_mode );
		$this->assertTransientsDeleted( $is_network_mode );
	}

	private function register_email_log_dependencies() {
		if ( $this->email_log_registered ) {
			return;
		}

		$email_log       = new Email_Log( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$register_method = new \ReflectionMethod( Email_Log::class, 'register_email_log' );
		$register_method->setAccessible( true );
		$register_method->invoke( $email_log );

		$this->email_log_registered = true;
	}

	private function unregister_email_log_dependencies() {
		if ( function_exists( 'unregister_post_type' ) && post_type_exists( Email_Log::POST_TYPE ) ) {
			unregister_post_type( Email_Log::POST_TYPE );
		}

		if ( function_exists( 'unregister_post_status' ) ) {
			foreach ( array( Email_Log::STATUS_SENT, Email_Log::STATUS_FAILED, Email_Log::STATUS_SCHEDULED ) as $status ) {
				unregister_post_status( $status );
			}
		}

		if ( function_exists( 'unregister_meta_key' ) ) {
			foreach (
				array(
					Email_Log::META_REPORT_FREQUENCY,
					Email_Log::META_BATCH_ID,
					Email_Log::META_SEND_ATTEMPTS,
					Email_Log::META_ERROR_DETAILS,
					Email_Log::META_REPORT_REFERENCE_DATES,
				) as $meta_key
			) {
				unregister_meta_key( 'post', Email_Log::POST_TYPE, $meta_key );
			}
		}
	}
}
