<?php
/**
 * Class Google\Site_Kit\Tests\Core\Permissions\PermissionsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Permissions
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Permissions;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @group Permissions
 */
class PermissionsTest extends TestCase {
	use Fake_Site_Connection_Trait;

	/**
	 * @var Context
	 */
	private $context;

	/**
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * @var Modules
	 */
	private $modules;

	/**
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * @var Dismissed_Items
	 */
	private $dismissed_items;

	public function set_up() {
		parent::set_up();

		// Unhook all actions and filters added during Permissions::register
		// to avoid interference with "main" instance setup during plugin bootstrap.
		remove_all_filters( 'map_meta_cap' );
		remove_all_filters( 'googlesitekit_rest_routes' );
		remove_all_filters( 'googlesitekit_user_data' );
		remove_all_filters( 'user_has_cap' );

		$this->context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options    = new User_Options( $this->context );
		$this->authentication  = new Authentication( $this->context, null, $this->user_options );
		$this->modules         = new Modules( $this->context, null, $this->user_options, $this->authentication );
		$this->dismissed_items = new Dismissed_Items( $this->user_options );
	}

	public function tear_down() {
		parent::tear_down();
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
	}

	public function test_register() {
		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		$this->assertTrue( has_filter( 'map_meta_cap' ), 'map_meta_cap filter should be registered.' );
		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ), 'REST routes filter should be registered.' );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ), 'Preload paths filter should be registered.' );
		$this->assertTrue( has_filter( 'user_has_cap' ), 'user_has_cap filter should be registered when dynamic capabilities enabled.' );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_register__without_dynamic_capabilities() {
		define( 'GOOGLESITEKIT_DISABLE_DYNAMIC_CAPABILITIES', true );

		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		$this->assertTrue( has_filter( 'map_meta_cap' ), 'map_meta_cap filter should be registered without dynamic capabilities.' );
		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ), 'REST routes filter should be registered without dynamic capabilities.' );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ), 'Preload paths filter should be registered without dynamic capabilities.' );
		$this->assertFalse( has_filter( 'user_has_cap' ), 'user_has_cap filter should not be registered when dynamic capabilities disabled.' );
	}

	public function data_non_admin_roles() {
		yield '`subscriber` role' => array( 'subscriber' );
		yield '`contributor` role' => array( 'contributor' );
		yield '`author` role' => array( 'author' );
		yield '`editor` role' => array( 'editor' );
	}

	public function test_get_capabilities() {
		$capabilities = array(
			Permissions::AUTHENTICATE,
			Permissions::SETUP,
			Permissions::VIEW_POSTS_INSIGHTS,
			Permissions::VIEW_DASHBOARD,
			Permissions::MANAGE_OPTIONS,
			Permissions::UPDATE_PLUGINS,
			Permissions::VIEW_SPLASH,
			Permissions::VIEW_SHARED_DASHBOARD,
			Permissions::VIEW_AUTHENTICATED_DASHBOARD,
			Permissions::VIEW_WP_DASHBOARD_WIDGET,
			Permissions::VIEW_ADMIN_BAR_MENU,
		);
		$this->assertEqualSets( $capabilities, Permissions::get_capabilities(), 'get_capabilities should return all expected caps.' );
	}

	public function test_dashboard_sharing_capabilities() {
		$contributor = self::factory()->user->create_and_get( array( 'role' => 'contributor' ) );
		$author      = self::factory()->user->create_and_get( array( 'role' => 'author' ) );

		$settings              = new Module_Sharing_Settings( new Options( $this->context ) );
		$test_sharing_settings = array(
			'analytics-4'    => array(
				'sharedRoles' => array( 'contributor' ),
				'management'  => 'all_admins',
			),
			'search-console' => array(
				'management' => 'owner',
			),
		);
		$settings->set( $test_sharing_settings );

		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		// Make sure SiteKit is setup.
		$this->fake_proxy_site_connection();
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );
		$this->assertTrue( $this->authentication->is_setup_completed(), 'Setup should be marked complete for capability checks.' );

		$this->verify_view_shared_dashboard_capability( $author, $contributor );

		$this->verify_view_wp_dashboard_widget_and_admin_bar_capability( $author, $contributor );

		$this->verify_read_shared_module_data_capability( $author, $contributor );

		$administrator = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );

		$this->verify_module_sharing_admin_capabilities_before_admin_auth( $contributor, $administrator );
		// Authenticate the administrator user.
		$restore_user = $this->user_options->switch_user( $administrator->ID );
		$this->authentication->get_oauth_client()->set_token(
			array(
				'access_token' => 'valid-auth-token',
			)
		);
		$restore_user();
		$this->verify_module_sharing_admin_capabilities_after_admin_auth( $administrator );
	}

	private function verify_view_shared_dashboard_capability( $author, $contributor ) {
		// Test user should have at least one sharedRole and the shared_dashboard_splash
		// item dismissed to VIEW_SHARED_DASHBOARD.
		$this->assertFalse( user_can( $author, Permissions::VIEW_SHARED_DASHBOARD ), 'Author should not view shared dashboard before dismissal set.' );
		$this->assertFalse( user_can( $contributor, Permissions::VIEW_SHARED_DASHBOARD ), 'Contributor should not view shared dashboard before dismissal set.' );
		$this->assertFalse( user_can( $contributor, Permissions::VIEW_DASHBOARD ), 'Contributor should not view dashboard before access granted.' );
		$this->assertFalse( user_can( $contributor, Permissions::VIEW_POSTS_INSIGHTS ), 'Contributor should not view posts insights before access granted.' );

		$contributor_user_options = new User_Options( $this->context, $contributor->ID );
		$dismissed_items          = new Dismissed_Items( $contributor_user_options );
		$dismissed_items->add( 'shared_dashboard_splash', 0 );
		$this->assertTrue( user_can( $contributor, Permissions::VIEW_SHARED_DASHBOARD ), 'Contributor should view shared dashboard after dismissal set.' );
		// User should also be able to access VIEW_DASHBOARD as they have the VIEW_SHARED_DASHBOARD access.
		$this->assertTrue( user_can( $contributor, Permissions::VIEW_DASHBOARD ), 'Contributor should view dashboard when shared dashboard allowed.' );
		$this->assertTrue( user_can( $contributor, Permissions::VIEW_POSTS_INSIGHTS ), 'Contributor should view posts insights when shared dashboard allowed.' );

		$author_user_options = new User_Options( $this->context, $author->ID );
		$dismissed_items     = new Dismissed_Items( $author_user_options );
		$dismissed_items->add( 'shared_dashboard_splash', 0 );
		$this->assertFalse( user_can( $author, Permissions::VIEW_SHARED_DASHBOARD ), 'Author should still not view shared dashboard with no shared role.' );
	}

	private function verify_view_wp_dashboard_widget_and_admin_bar_capability( $author, $contributor ) {
		$this->assertFalse( user_can( $author, Permissions::VIEW_WP_DASHBOARD_WIDGET ), 'Author should not view WP dashboard widget.' );
		$this->assertFalse( user_can( $author, Permissions::VIEW_ADMIN_BAR_MENU ), 'Author should not view admin bar menu.' );
		$this->assertTrue( user_can( $contributor, Permissions::VIEW_WP_DASHBOARD_WIDGET ), 'Contributor should view WP dashboard widget.' );
		$this->assertTrue( user_can( $contributor, Permissions::VIEW_ADMIN_BAR_MENU ), 'Contributor should view admin bar menu.' );
	}

	private function verify_read_shared_module_data_capability( $author, $contributor ) {
		// Test user should have the sharedRole that is set for the module being checked
		// to READ_SHARED_MODULE_DATA.
		$this->assertFalse( user_can( $author, Permissions::READ_SHARED_MODULE_DATA, 'analytics-4' ), 'Author should not read shared module data for analytics-4.' );
		$this->assertFalse( user_can( $contributor, Permissions::READ_SHARED_MODULE_DATA, 'search-console' ), 'Contributor should not read shared data for unshared module search-console.' );
		$this->assertFalse( user_can( $contributor, Permissions::READ_SHARED_MODULE_DATA, 'adsense' ), 'Contributor should not read shared data for unshared module adsense.' );
		$this->assertTrue( user_can( $contributor, Permissions::READ_SHARED_MODULE_DATA, 'analytics-4' ), 'Contributor should read shared data for analytics-4.' );
	}

	private function verify_module_sharing_admin_capabilities_before_admin_auth( $contributor, $administrator ) {
		// Test user should be an authenticated admin to MANAGE_MODULE_SHARING_OPTIONS and
		// DELEGATE_MODULE_SHARING_MANAGEMENT.
		$this->assertFalse( user_can( $contributor, Permissions::MANAGE_MODULE_SHARING_OPTIONS, 'analytics-4' ), 'Contributor should not manage sharing options before admin auth.' );
		$this->assertFalse( user_can( $contributor, Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT, 'analytics-4' ), 'Contributor should not delegate sharing management before admin auth.' );
		$this->assertFalse( user_can( $administrator, Permissions::MANAGE_MODULE_SHARING_OPTIONS, 'analytics-4' ), 'Admin should not manage sharing options before authenticating.' );
		$this->assertFalse( user_can( $administrator, Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT, 'analytics-4' ), 'Admin should not delegate sharing management before authenticating.' );
	}

	private function verify_module_sharing_admin_capabilities_after_admin_auth( $administrator ) {
		// Test authenticated admin can MANAGE_MODULE_SHARING_OPTIONS (not DELEGATE_MODULE_SHARING_MANAGEMENT)
		// if management setting for the module is set to 'all_admins' and not 'owner'.
		$this->assertTrue( user_can( $administrator, Permissions::MANAGE_MODULE_SHARING_OPTIONS, 'analytics-4' ), 'Authenticated admin should manage sharing options for analytics-4 when management is all_admins.' );
		$this->assertFalse( user_can( $administrator, Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT, 'analytics-4' ), 'Authenticated admin should not delegate sharing management for analytics-4 when not owner.' );
		$this->assertFalse( user_can( $administrator, Permissions::MANAGE_MODULE_SHARING_OPTIONS, 'search-console' ), 'Admin should not manage sharing options for search-console before being owner.' );
		$this->assertFalse( user_can( $administrator, Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT, 'search-console' ), 'Admin should not delegate sharing management for search-console before being owner.' );

		// Make administrator owner of search-console.
		$options = new Options( $this->context );
		$options->set( 'googlesitekit_search-console_settings', array( 'ownerID' => $administrator->ID ) );

		// Test owner of module can MANAGE_MODULE_SHARING_OPTIONS and DELEGATE_MODULE_SHARING_MANAGEMENT.
		$this->assertTrue( user_can( $administrator, Permissions::MANAGE_MODULE_SHARING_OPTIONS, 'search-console' ), 'Module owner should manage sharing options for search-console.' );
		$this->assertTrue( user_can( $administrator, Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT, 'search-console' ), 'Module owner should delegate sharing management for search-console.' );

		// Test authenticated admin cannot MANAGE_MODULE_SHARING_OPTIONS and DELEGATE_MODULE_SHARING_MANAGEMENT
		// if module cannot have an owner.
		$this->assertFalse( user_can( $administrator, Permissions::MANAGE_MODULE_SHARING_OPTIONS, 'site-verification' ), 'Admin should not manage sharing for module without owner.' );
		$this->assertFalse( user_can( $administrator, Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT, 'site-verification' ), 'Admin should not delegate sharing for module without owner.' );

		// Test a user cannot have a capability for a non-existent module.
		$this->assertFalse( user_can( $administrator, Permissions::MANAGE_MODULE_SHARING_OPTIONS, 'non-existent-module' ), 'Admin should not have capabilities for non-existent module.' );
		$this->assertFalse( user_can( $administrator, Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT, 'non-existent-module' ), 'Admin should not delegate management for non-existent module.' );
	}

	/**
	 * @dataProvider data_non_admin_roles
	 */
	public function test_check_all_for_current_user__non_admins( $role ) {
		$user = self::factory()->user->create_and_get( array( 'role' => $role ) );
		wp_set_current_user( $user->ID );
		$this->user_options->switch_user( $user->ID );
		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		$this->assertEqualSetsWithIndex(
			array(
				Permissions::AUTHENTICATE                 => false,
				Permissions::SETUP                        => false,
				Permissions::VIEW_POSTS_INSIGHTS          => false,
				Permissions::VIEW_DASHBOARD               => false,
				Permissions::MANAGE_OPTIONS               => false,
				Permissions::UPDATE_PLUGINS               => false,
				Permissions::VIEW_SPLASH                  => false,
				Permissions::VIEW_SHARED_DASHBOARD        => false,
				Permissions::VIEW_AUTHENTICATED_DASHBOARD => false,
				Permissions::VIEW_WP_DASHBOARD_WIDGET     => false,
				Permissions::VIEW_ADMIN_BAR_MENU          => false,
				Permissions::READ_SHARED_MODULE_DATA . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::READ_SHARED_MODULE_DATA . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
				Permissions::MANAGE_MODULE_SHARING_OPTIONS . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::MANAGE_MODULE_SHARING_OPTIONS . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
				Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
			),
			$permissions->check_all_for_current_user(),
			'Permissions map should reflect no access for non-admin roles.'
		);
	}

	public function test_check_all_for_current_user__unauthenticated_admin() {
		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		$this->user_options->switch_user( $user->ID );

		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		$this->assertEqualSetsWithIndex(
			array(
				Permissions::AUTHENTICATE                 => true,
				Permissions::SETUP                        => true,
				Permissions::VIEW_POSTS_INSIGHTS          => false,
				Permissions::VIEW_DASHBOARD               => false,
				Permissions::MANAGE_OPTIONS               => false,
				Permissions::UPDATE_PLUGINS               => false,
				Permissions::VIEW_SPLASH                  => true,
				Permissions::VIEW_SHARED_DASHBOARD        => false,
				Permissions::VIEW_AUTHENTICATED_DASHBOARD => false,
				Permissions::VIEW_WP_DASHBOARD_WIDGET     => false,
				Permissions::VIEW_ADMIN_BAR_MENU          => false,
				Permissions::READ_SHARED_MODULE_DATA . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::READ_SHARED_MODULE_DATA . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
				Permissions::MANAGE_MODULE_SHARING_OPTIONS . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::MANAGE_MODULE_SHARING_OPTIONS . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
				Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
			),
			$permissions->check_all_for_current_user(),
			'Permissions map should reflect limited access for unauthenticated admin.'
		);
	}

	public function test_check_all_for_current_user__authenticated_admin() {
		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		$this->user_options->switch_user( $user->ID );

		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		$this->assertFalse( $this->authentication->is_authenticated(), 'Admin should not be authenticated before token and verification.' );
		$this->assertFalse( $this->authentication->is_setup_completed(), 'Setup should not be completed before proxy connection is set.' );
		$this->assertFalse( $this->authentication->verification()->has(), 'Verification should not be present before being set.' );

		// Setup the verification on the current user.
		$this->authentication->verification()->set( true );
		// Fake a valid authentication token on the client.
		$this->authentication->get_oauth_client()->set_token(
			array(
				'access_token' => 'valid-auth-token',
			)
		);

		$this->fake_proxy_site_connection();

		// Override any existing filter to make sure the setup is marked as complete all the time.
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		$this->assertTrue( $this->authentication->is_authenticated(), 'Admin should be authenticated after token and verification.' );
		$this->assertTrue( $this->authentication->is_setup_completed(), 'Setup should be completed after proxy connection and filter override.' );
		$this->assertTrue( $this->authentication->verification()->has(), 'Verification should be present after being set.' );

		$this->assertEqualSetsWithIndex(
			array(
				Permissions::AUTHENTICATE                 => true,
				Permissions::SETUP                        => true,
				Permissions::VIEW_POSTS_INSIGHTS          => true,
				Permissions::VIEW_DASHBOARD               => true,
				Permissions::MANAGE_OPTIONS               => true,
				Permissions::UPDATE_PLUGINS               => true,
				Permissions::VIEW_SPLASH                  => true,
				Permissions::VIEW_SHARED_DASHBOARD        => false,
				Permissions::VIEW_AUTHENTICATED_DASHBOARD => true,
				Permissions::VIEW_WP_DASHBOARD_WIDGET     => true,
				Permissions::VIEW_ADMIN_BAR_MENU          => true,
				Permissions::READ_SHARED_MODULE_DATA . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::READ_SHARED_MODULE_DATA . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
				Permissions::MANAGE_MODULE_SHARING_OPTIONS . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::MANAGE_MODULE_SHARING_OPTIONS . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => true,
				Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
			),
			$permissions->check_all_for_current_user(),
			'Permissions map should reflect full access for authenticated admin.'
		);
	}

	public function test_check_all_for_current_user__authenticated_admin_with_incomplete_setup() {
		// Note this scenario is very unlikely to happen but here for completeness.
		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		$this->user_options->switch_user( $user->ID );

		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		// Fake a valid authentication token on the client.
		$this->authentication->get_oauth_client()->set_token( array( 'access_token' => 'valid-auth-token' ) );

		$this->assertTrue( $this->authentication->is_authenticated(), 'Admin should be authenticated with valid token.' );
		$this->assertFalse( $this->authentication->is_setup_completed(), 'Setup should be incomplete without setup completion flag.' );

		$this->assertEqualSetsWithIndex(
			array(
				Permissions::AUTHENTICATE                 => true,
				Permissions::SETUP                        => true,
				Permissions::VIEW_POSTS_INSIGHTS          => false,
				Permissions::VIEW_DASHBOARD               => false,
				Permissions::MANAGE_OPTIONS               => false,
				Permissions::UPDATE_PLUGINS               => false,
				Permissions::VIEW_SPLASH                  => true,
				Permissions::VIEW_SHARED_DASHBOARD        => false,
				Permissions::VIEW_AUTHENTICATED_DASHBOARD => false,
				Permissions::VIEW_WP_DASHBOARD_WIDGET     => false,
				Permissions::VIEW_ADMIN_BAR_MENU          => false,
				Permissions::READ_SHARED_MODULE_DATA . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::READ_SHARED_MODULE_DATA . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
				Permissions::MANAGE_MODULE_SHARING_OPTIONS . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::MANAGE_MODULE_SHARING_OPTIONS . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => true,
				Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
			),
			$permissions->check_all_for_current_user(),
			'Permissions map should reflect incomplete setup for authenticated admin.'
		);
	}

	/**
	 * @param string $shared_with_role
	 * @dataProvider data_default_shareable_non_admin_roles
	 */
	public function test_view_splash__non_admin_dashboard_sharing( $shared_with_role ) {
		$user = self::factory()->user->create_and_get( array( 'role' => $shared_with_role ) );
		$this->user_options->switch_user( $user->ID );

		$sharing_settings = new Module_Sharing_Settings( new Options( $this->context ) );
		$permissions      = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		$this->assertFalse( user_can( $user, Permissions::VIEW_SPLASH ), 'Non-admin should not view splash by default.' );

		$sharing_settings->set(
			array(
				'pagespeed-insights' => array( 'sharedRoles' => array( $shared_with_role ) ),
			)
		);

		$this->assertTrue( user_can( $user, Permissions::VIEW_SPLASH ), 'Non-admin shared role should view splash.' );

		// Once the shared_dashboard_splash item is dismissed, the splash cannot be viewed again.
		$this->dismissed_items->add( 'shared_dashboard_splash' );
		$this->assertFalse( user_can( $user, Permissions::VIEW_SPLASH ), 'After dismissal, non-admin should not view splash.' );
	}

	public function data_default_shareable_non_admin_roles() {
		yield '`contributor` role' => array( 'contributor' );
		yield '`author` role' => array( 'author' );
		yield '`editor` role' => array( 'editor' );
	}

	public function test_view_splash__admin() {
		$user        = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();
		$this->user_options->switch_user( $user->ID );

		$this->assertTrue( user_can( $user, Permissions::VIEW_SPLASH ), 'Admin should always view splash even if dismissed.' );

		// An admin can still see the splash even when this dismissal is present because they can authenticate.
		$this->dismissed_items->add( 'shared_dashboard_splash' );
		$this->assertTrue( user_can( $user, Permissions::VIEW_SPLASH ), 'Admin should always view splash even if dismissal is present.' );
	}

	public function test_permissions_route__unauthorized_request() {
		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/user/data/permissions' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertNotEquals( 200, $response->get_status(), 'Unauthorized request should not return 200.' );
		$this->assertArrayHasKey( 'code', $data, 'Error response should contain code key.' );
		$this->assertEquals( 'rest_forbidden', $data['code'], 'Unauthorized request should return rest_forbidden.' );
	}

	public function test_permissions_route__non_admin() {
		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		$user_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/user/data/permissions' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertNotEquals( 200, $response->get_status(), 'Non-admin request should not return 200.' );
		$this->assertArrayHasKey( 'code', $data, 'Error response should contain code key.' );
		$this->assertEquals( 'rest_forbidden', $data['code'], 'Non-admin request should return rest_forbidden.' );
	}

	public function test_permissions_route__success() {
		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/user/data/permissions' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status(), 'Admin request should return 200.' );
		$this->assertEqualSetsWithIndex( $data, $permissions->check_all_for_current_user(), 'Permissions route output should match check_all_for_current_user().' );
	}

	public function test_permissions_route__dashboard_sharing() {
		$user_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $user_id );

		$sharing_settings = new Module_Sharing_Settings( new Options( $this->context ) );
		$permissions      = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		$sharing_settings->set(
			array(
				'pagespeed-insights' => array( 'sharedRoles' => array( 'editor' ) ),
			)
		);

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/user/data/permissions' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status(), 'Dashboard sharing permissions route should return 200.' );
		$this->assertEqualSetsWithIndex( $data, $permissions->check_all_for_current_user(), 'Dashboard sharing route output should match check_all_for_current_user().' );
	}
}
