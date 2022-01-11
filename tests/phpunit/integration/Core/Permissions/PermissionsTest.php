<?php

namespace Google\Site_Kit\Tests\Core\Permissions;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Core\Permissions\Permissions;

class PermissionsTest extends TestCase {

	public function test_register__without_dynamic_capabilities() {
		$filters = array(
			'map_meta_cap',
			'googlesitekit_user_data',
			'user_has_cap',
		);

		foreach ( $filters as $filter ) {
			remove_all_filters( $filter );
		}

		$this->get_instance()->register();

		foreach ( $filters as $filter ) {
			$this->assertTrue( has_filter( $filter ) );
		}
	}

	/**
	 * @processIsolation
	 */
	public function test_register_with_dynamic_capabilities_enabled() {
		$filters = array(
			'map_meta_cap',
			'googlesitekit_user_data',
			'user_has_cap',
		);

		foreach ( $filters as $filter ) {
			remove_all_filters( $filter );
		}

		define( 'GOOGLESITEKIT_DISABLE_DYNAMIC_CAPABILITIES', true );
		$this->get_instance()->register();

		$this->assertTrue( has_filter( 'map_meta_cap' ) );
		$this->assertTrue( has_filter( 'googlesitekit_user_data' ) );
		$this->assertFalse( has_filter( 'user_has_cap' ) );
	}

	/**
	 * @dataProvider provider_role_without_permissions
	 */
	public function test_all_roles_without_setup_does_not_have_any_capability_attached_to_it( $role ) {
		$user = self::factory()->user->create_and_get( array( 'role' => $role ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$this->get_instance()->register();

		$this->assertTrue( has_filter( 'map_meta_cap' ) );
		$this->assertTrue( has_filter( 'googlesitekit_user_data' ) );
		$this->assertTrue( has_filter( 'user_has_cap' ) );

		foreach ( Permissions::get_capabilities() as $capability ) {
			$this->assertFalse( $user->has_cap( $capability ), "{$role} can {$capability}" );
		}
	}

	public function provider_role_without_permissions() {
		yield 'user with `subscriber` role' => array( 'subscriber' );
		yield 'user with `contributor` role' => array( 'contributor' );
		yield 'user with `author` role' => array( 'author' );
		yield 'user with `editor` role' => array( 'editor' );
	}

	public function test_unauthenticated_administrator_without_setup() {
		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$this->get_instance()->register();

		$this->assertTrue( has_filter( 'map_meta_cap' ) );
		$this->assertTrue( has_filter( 'googlesitekit_user_data' ) );
		$this->assertTrue( has_filter( 'user_has_cap' ) );

		$this->assertTrue( $user->has_cap( Permissions::SETUP ) );
		$this->assertTrue( $user->has_cap( Permissions::AUTHENTICATE ) );
		$this->assertFalse( $user->has_cap( Permissions::MANAGE_OPTIONS ) );
		$this->assertFalse( $user->has_cap( Permissions::VIEW_POSTS_INSIGHTS ) );
		$this->assertFalse( $user->has_cap( Permissions::VIEW_DASHBOARD ) );
		$this->assertFalse( $user->has_cap( Permissions::VIEW_MODULE_DETAILS ) );
	}

	public function test_authenticated_user_with_administrator_role() {
		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$auth = new Authentication( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertFalse( $auth->is_authenticated() );

		// Fake a valid authentication token on the client.
		$auth->get_oauth_client()->set_token( array( 'access_token' => 'valid-auth-token' ) );

		$this->assertTrue( $auth->is_authenticated() );

		$this->get_instance( $auth )->register();

		$this->assertTrue( has_filter( 'map_meta_cap' ) );
		$this->assertTrue( has_filter( 'googlesitekit_user_data' ) );
		$this->assertTrue( has_filter( 'user_has_cap' ) );

		$this->assertTrue( $user->has_cap( Permissions::SETUP ) );
		$this->assertTrue( $user->has_cap( Permissions::AUTHENTICATE ) );
		$this->assertFalse( $user->has_cap( Permissions::MANAGE_OPTIONS ) );
		$this->assertFalse( $user->has_cap( Permissions::VIEW_POSTS_INSIGHTS ) );
		$this->assertFalse( $user->has_cap( Permissions::VIEW_DASHBOARD ) );
		$this->assertFalse( $user->has_cap( Permissions::VIEW_MODULE_DETAILS ) );
	}

	public function test_authenticated_user_with_administrator_role_and_setup_complete() {
		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

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

		// Mock a valid oauth token.
		add_filter(
			'googlesitekit_oauth_secret',
			function () {
				return array(
					'web' => array(
						'client_id'     => '1234567890-asdfasdfasdfasdfzxcvzxcvzxcvzxcv.apps.sitekit.withgoogle.com',
						'client_secret' => 'x_xxxxxxxxxxxxxxxxxxxxxx',
					),
				);
			}
		);

		// Override any existing filter to make sure the setup is marked as complete all the time.
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		$this->assertTrue( $auth->is_authenticated() );
		$this->assertTrue( $auth->is_setup_completed() );
		$this->assertTrue( $auth->verification()->has() );

		$this->get_instance( $auth )->register();

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
			Permissions::AUTHENTICATE        => true,
			Permissions::SETUP               => true,
			Permissions::VIEW_POSTS_INSIGHTS => true,
			Permissions::VIEW_DASHBOARD      => true,
			Permissions::VIEW_MODULE_DETAILS => true,
			Permissions::MANAGE_OPTIONS      => true,
		);

		foreach ( Permissions::get_capabilities() as $capability ) {
			$this->assertArrayHasKey( $capability, $capabilities );
		}
	}

	protected function get_instance( Authentication $authentication = null ) {
		return new Permissions(
			new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ),
			$authentication
		);
	}
}
