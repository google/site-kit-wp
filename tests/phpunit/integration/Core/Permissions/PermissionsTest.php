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
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Core\Permissions\Permissions;
use WP_User;

/**
 * @group Permissions
 */
class PermissionsTest extends TestCase {
	use Fake_Site_Connection_Trait;

	public function tearDown() {
		// Make sure if the current user is logged in, logs out.
		wp_logout();
		parent::tearDown();
	}

	public function test_register__without_dynamic_capabilities() {
		$filters = array(
			'map_meta_cap',
			'googlesitekit_user_data',
			'user_has_cap',
		);

		foreach ( $filters as $filter ) {
			remove_all_filters( $filter );
		}

		$permissions_instance = new Permissions( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$permissions_instance->register();

		foreach ( $filters as $filter ) {
			$this->assertTrue( has_filter( $filter ) );
		}
	}

	/**
	 * @processIsolation
	 */
	public function test_register_with__dynamic_capabilities_enabled() {
		$filters = array(
			'map_meta_cap',
			'googlesitekit_user_data',
			'user_has_cap',
		);

		foreach ( $filters as $filter ) {
			remove_all_filters( $filter );
		}

		define( 'GOOGLESITEKIT_DISABLE_DYNAMIC_CAPABILITIES', true );

		$permissions_instance = new Permissions( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$permissions_instance->register();

		$this->assertTrue( has_filter( 'map_meta_cap' ) );
		$this->assertTrue( has_filter( 'googlesitekit_user_data' ) );
		$this->assertFalse( has_filter( 'user_has_cap' ) );
	}

	/**
	 * @dataProvider data_role_without_permissions
	 */
	public function test_all_roles__without_setup_does_not_have_any_capability_attached_to_it( $role ) {
		$user = self::factory()->user->create_and_get( array( 'role' => $role ) );
		$this->set_current_user( $user );

		$permissions_instance = new Permissions( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$permissions_instance->register();

		$this->assertTrue( has_filter( 'map_meta_cap' ) );
		$this->assertTrue( has_filter( 'googlesitekit_user_data' ) );
		$this->assertTrue( has_filter( 'user_has_cap' ) );

		foreach ( Permissions::get_capabilities() as $capability ) {
			$this->assertFalse( $user->has_cap( $capability ), "{$role} can {$capability}" );
		}
	}

	public function data_role_without_permissions() {
		yield 'user with `subscriber` role' => array( 'subscriber' );
		yield 'user with `contributor` role' => array( 'contributor' );
		yield 'user with `author` role' => array( 'author' );
		yield 'user with `editor` role' => array( 'editor' );
	}

	/**
	 * @dataProvider data_users_without_permissions_by_role
	 */
	public function test_users__without_permissions( $role ) {
		$this->set_current_user( self::factory()->user->create_and_get( array( 'role' => $role ) ) );
		$permissions = array(
			Permissions::AUTHENTICATE        => false,
			Permissions::SETUP               => false,
			Permissions::VIEW_POSTS_INSIGHTS => false,
			Permissions::VIEW_DASHBOARD      => false,
			Permissions::VIEW_MODULE_DETAILS => false,
			Permissions::MANAGE_OPTIONS      => false,
		);

		$permissions_instance = new Permissions( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->assertEqualSets( array_values( $permissions ), $permissions_instance->check_all_for_current_user() );
	}

	public function data_users_without_permissions_by_role() {
		yield '`subscriber` role' => array( 'subscriber' );
		yield '`contributor` role' => array( 'contributor' );
		yield '`author` role' => array( 'author' );
		yield '`editor` role' => array( 'editor' );
	}

	public function test_user__with_permissions_and_incomplete_setup() {
		$this->set_current_user( self::factory()->user->create_and_get( array( 'role' => 'administrator' ) ) );
		$permissions = array(
			Permissions::AUTHENTICATE        => false,
			Permissions::SETUP               => false,
			Permissions::VIEW_POSTS_INSIGHTS => false,
			Permissions::VIEW_DASHBOARD      => false,
			Permissions::VIEW_MODULE_DETAILS => true,
			Permissions::MANAGE_OPTIONS      => true,
		);

		$permissions_instance = new Permissions( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->assertEqualSets( array_values( $permissions ), $permissions_instance->check_all_for_current_user() );
	}

	public function test_user__with_permissions_and_setup_complete() {
		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );

		$this->set_current_user( $user );

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$auth    = new Authentication(
			$context,
			new Options( $context ),
			new User_Options( $context, $user->ID )
		);

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

		$permissions = array(
			Permissions::AUTHENTICATE        => true,
			Permissions::SETUP               => true,
			Permissions::VIEW_POSTS_INSIGHTS => true,
			Permissions::VIEW_DASHBOARD      => true,
			Permissions::VIEW_MODULE_DETAILS => true,
			Permissions::MANAGE_OPTIONS      => true,
		);

		$permissions_instance = new Permissions( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->assertEqualSets( array_values( $permissions ), $permissions_instance->check_all_for_current_user() );
	}

	public function test_unauthenticated_administrator__without_setup() {
		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$this->set_current_user( $user );

		$permissions_instance = new Permissions( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$permissions_instance->register();

		$this->assertTrue( $user->has_cap( Permissions::SETUP ) );
		$this->assertTrue( $user->has_cap( Permissions::AUTHENTICATE ) );
		$this->assertFalse( $user->has_cap( Permissions::MANAGE_OPTIONS ) );
		$this->assertFalse( $user->has_cap( Permissions::VIEW_POSTS_INSIGHTS ) );
		$this->assertFalse( $user->has_cap( Permissions::VIEW_DASHBOARD ) );
		$this->assertFalse( $user->has_cap( Permissions::VIEW_MODULE_DETAILS ) );
	}

	public function test_authenticated_user__with_administrator_role() {
		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$this->set_current_user( $user );

		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertFalse( $auth->is_authenticated() );

		// Fake a valid authentication token on the client.
		$auth->get_oauth_client()->set_token( array( 'access_token' => 'valid-auth-token' ) );

		$this->assertTrue( $auth->is_authenticated() );

		$permissions_instance = new Permissions( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $auth );
		$permissions_instance->register();

		$this->assertTrue( $user->has_cap( Permissions::SETUP ) );
		$this->assertTrue( $user->has_cap( Permissions::AUTHENTICATE ) );
		$this->assertFalse( $user->has_cap( Permissions::MANAGE_OPTIONS ) );
		$this->assertFalse( $user->has_cap( Permissions::VIEW_POSTS_INSIGHTS ) );
		$this->assertFalse( $user->has_cap( Permissions::VIEW_DASHBOARD ) );
		$this->assertFalse( $user->has_cap( Permissions::VIEW_MODULE_DETAILS ) );
	}

	public function test_authenticated_user__with_administrator_role_and_setup_complete() {
		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$this->set_current_user( $user );

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$auth    = new Authentication(
			$context,
			new Options( $context ),
			new User_Options( $context, $user->ID )
		);

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

		$permissions_instance = new Permissions( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $auth );
		$permissions_instance->register();

		$this->assertTrue( has_filter( 'map_meta_cap' ) );
		$this->assertTrue( has_filter( 'googlesitekit_user_data' ) );
		$this->assertTrue( has_filter( 'user_has_cap' ) );

		$this->assertTrue( $user->has_cap( Permissions::SETUP ) );
		$this->assertTrue( $user->has_cap( Permissions::AUTHENTICATE ) );
		$this->assertTrue( $user->has_cap( Permissions::VIEW_POSTS_INSIGHTS ) );
		$this->assertTrue( $user->has_cap( Permissions::MANAGE_OPTIONS ) );
		$this->assertTrue( $user->has_cap( Permissions::VIEW_DASHBOARD ) );
		$this->assertTrue( $user->has_cap( Permissions::VIEW_MODULE_DETAILS ) );
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
