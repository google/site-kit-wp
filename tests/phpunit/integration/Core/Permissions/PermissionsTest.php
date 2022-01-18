<?php
/**
 * Class Google\Site_Kit\Tests\Core\Permissions\PermissionsTest
 *
 * @package   Google\Site_Kit
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Permissions;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;
use WP_User;

/**
 * @group Permissions
 */
class PermissionsTest extends TestCase {
	use Fake_Site_Connection_Trait;

	public function setUp() {
		parent::setUp();

		// Use a snapshot of hooks from before Site Kit's `init` ran during
		// the plugin bootstrap. This ensures the local instance of Permissions is tested.
		$GLOBALS['wp_filter'] = tests_snapshot_hooks( $GLOBALS['wp_filter__pre_sk_init'] );
	}

	public function test_register() {
		remove_all_filters( 'map_meta_cap' );
		remove_all_filters( 'googlesitekit_user_data' );
		remove_all_filters( 'user_has_cap' );

		$permissions = new Permissions( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$permissions->register();

		$this->assertTrue( has_filter( 'map_meta_cap' ) );
		$this->assertTrue( has_filter( 'googlesitekit_user_data' ) );
		$this->assertTrue( has_filter( 'user_has_cap' ) );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_register__without_dynamic_capabilities() {
		remove_all_filters( 'map_meta_cap' );
		remove_all_filters( 'googlesitekit_user_data' );
		remove_all_filters( 'user_has_cap' );

		define( 'GOOGLESITEKIT_DISABLE_DYNAMIC_CAPABILITIES', true );

		$permissions = new Permissions( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$permissions->register();

		$this->assertTrue( has_filter( 'map_meta_cap' ) );
		$this->assertTrue( has_filter( 'googlesitekit_user_data' ) );
		$this->assertFalse( has_filter( 'user_has_cap' ) );
	}

	/**
	 * @dataProvider data_non_admin_roles
	 */
	public function test_check_all_for_current_user__non_admins( $role ) {
		$this->set_current_user(
			self::factory()->user->create_and_get( array( 'role' => $role ) )
		);

		$permissions = new Permissions( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$permissions->register();

		$this->assertEqualSetsWithIndex(
			array(
				Permissions::AUTHENTICATE        => false,
				Permissions::SETUP               => false,
				Permissions::VIEW_POSTS_INSIGHTS => false,
				Permissions::VIEW_DASHBOARD      => false,
				Permissions::VIEW_MODULE_DETAILS => false,
				Permissions::MANAGE_OPTIONS      => false,
			),
			$permissions->check_all_for_current_user()
		);
	}

	public function data_non_admin_roles() {
		yield '`subscriber` role' => array( 'subscriber' );
		yield '`contributor` role' => array( 'contributor' );
		yield '`author` role' => array( 'author' );
		yield '`editor` role' => array( 'editor' );
	}

	public function test_check_all_for_current_user__unauthenticated_admin() {
		$this->set_current_user(
			self::factory()->user->create_and_get( array( 'role' => 'administrator' ) )
		);

		$permissions = new Permissions( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$permissions->register();

		$this->assertEqualSetsWithIndex(
			array(
				Permissions::AUTHENTICATE        => true,
				Permissions::SETUP               => true,
				Permissions::VIEW_POSTS_INSIGHTS => false,
				Permissions::VIEW_DASHBOARD      => false,
				Permissions::VIEW_MODULE_DETAILS => false,
				Permissions::MANAGE_OPTIONS      => false,
			),
			$permissions->check_all_for_current_user()
		);
	}

	public function test_check_all_for_current_user__authenticated_admin() {
		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );

		$this->set_current_user( $user );

		$context     = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$auth        = new Authentication(
			$context,
			new Options( $context ),
			new User_Options( $context, $user->ID )
		);
		$permissions = new Permissions( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$permissions->register();

		$this->assertFalse( $auth->is_authenticated() );
		$this->assertFalse( $auth->is_setup_completed() );
		$this->assertFalse( $auth->verification()->has() );

		// Setup the verification on the current user.
		$auth->verification()->set( true );
		// Fake a valid authentication token on the client.
		$auth->get_oauth_client()->set_token(
			array(
				'access_token' => 'valid-auth-token',
			)
		);

		$this->fake_proxy_site_connection();

		// Override any existing filter to make sure the setup is marked as complete all the time.
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		$this->assertTrue( $auth->is_authenticated() );
		$this->assertTrue( $auth->is_setup_completed() );
		$this->assertTrue( $auth->verification()->has() );

		$this->assertEqualSetsWithIndex(
			array(
				Permissions::AUTHENTICATE        => true,
				Permissions::SETUP               => true,
				Permissions::VIEW_POSTS_INSIGHTS => true,
				Permissions::VIEW_DASHBOARD      => true,
				Permissions::VIEW_MODULE_DETAILS => true,
				Permissions::MANAGE_OPTIONS      => true,
			),
			$permissions->check_all_for_current_user()
		);
	}

	public function test_check_all_for_current_user__authenticated_admin_with_incomplete_setup() {
		// Note this scenario is very unlikely to happen but here for completeness.
		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$this->set_current_user( $user );

		$context     = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$auth        = new Authentication( $context );
		$permissions = new Permissions( $context, $auth );
		$permissions->register();

		// Fake a valid authentication token on the client.
		$auth->get_oauth_client()->set_token( array( 'access_token' => 'valid-auth-token' ) );
		$this->fake_proxy_site_connection();

		$this->assertTrue( $auth->is_authenticated() );
		$this->assertFalse( $auth->is_setup_completed() );

		$this->assertEqualSetsWithIndex(
			array(
				Permissions::AUTHENTICATE        => true,
				Permissions::SETUP               => true,
				Permissions::VIEW_POSTS_INSIGHTS => false,
				Permissions::VIEW_DASHBOARD      => false,
				Permissions::VIEW_MODULE_DETAILS => false,
				Permissions::MANAGE_OPTIONS      => false,
			),
			$permissions->check_all_for_current_user()
		);
	}

	public function test_get_capabilities() {
		$capabilities = array(
			Permissions::AUTHENTICATE,
			Permissions::SETUP,
			Permissions::VIEW_POSTS_INSIGHTS,
			Permissions::VIEW_DASHBOARD,
			Permissions::VIEW_MODULE_DETAILS,
			Permissions::MANAGE_OPTIONS,
		);

		$this->assertEqualSets( $capabilities, Permissions::get_capabilities() );
	}

	/**
	 * Set the current user in order to review capabilities and permissions for the
	 * current session.
	 *
	 * @param WP_User $user The user to be set into the current session.
	 *
	 * @return void
	 */
	private function set_current_user( WP_User $user ) {
		wp_set_current_user( $user->ID );
		// The only way to change the current user in bootstrapped Site Kit class instances (e.g. Permissions)
		do_action( 'wp_login', $user->user_login, $user );
	}
}
