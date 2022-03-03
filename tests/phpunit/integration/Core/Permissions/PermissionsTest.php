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
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;

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
		remove_all_filters( 'googlesitekit_user_data' );
		remove_all_filters( 'user_has_cap' );

		$this->context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options    = new User_Options( $this->context );
		$this->authentication  = new Authentication( $this->context, null, $this->user_options );
		$this->modules         = new Modules( $this->context, null, $this->user_options, $this->authentication );
		$this->dismissed_items = new Dismissed_Items( $this->user_options );
	}

	public function test_register() {
		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		$this->assertTrue( has_filter( 'map_meta_cap' ) );
		$this->assertTrue( has_filter( 'googlesitekit_user_data' ) );
		$this->assertTrue( has_filter( 'user_has_cap' ) );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_register__without_dynamic_capabilities() {
		define( 'GOOGLESITEKIT_DISABLE_DYNAMIC_CAPABILITIES', true );

		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		$this->assertTrue( has_filter( 'map_meta_cap' ) );
		$this->assertTrue( has_filter( 'googlesitekit_user_data' ) );
		$this->assertFalse( has_filter( 'user_has_cap' ) );
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
		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		$this->user_options->switch_user( $user->ID );

		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
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
		wp_set_current_user( $user->ID );
		$this->user_options->switch_user( $user->ID );

		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		$this->assertFalse( $this->authentication->is_authenticated() );
		$this->assertFalse( $this->authentication->is_setup_completed() );
		$this->assertFalse( $this->authentication->verification()->has() );

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

		$this->assertTrue( $this->authentication->is_authenticated() );
		$this->assertTrue( $this->authentication->is_setup_completed() );
		$this->assertTrue( $this->authentication->verification()->has() );

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
		wp_set_current_user( $user->ID );
		$this->user_options->switch_user( $user->ID );

		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		// Fake a valid authentication token on the client.
		$this->authentication->get_oauth_client()->set_token( array( 'access_token' => 'valid-auth-token' ) );

		$this->assertTrue( $this->authentication->is_authenticated() );
		$this->assertFalse( $this->authentication->is_setup_completed() );

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

		$this->enable_feature( 'dashboardSharing' );

		$capabilities = array(
			Permissions::AUTHENTICATE,
			Permissions::SETUP,
			Permissions::VIEW_POSTS_INSIGHTS,
			Permissions::VIEW_DASHBOARD,
			Permissions::VIEW_MODULE_DETAILS,
			Permissions::MANAGE_OPTIONS,
			Permissions::VIEW_SHARED_DASHBOARD,
		);
		$this->assertEqualSets( $capabilities, Permissions::get_capabilities() );
	}

	public function test_dashboard_sharing_capabilities() {
		$disable_feature = $this->enable_feature( 'dashboardSharing' );

		$contributor = self::factory()->user->create_and_get( array( 'role' => 'contributor' ) );
		$author      = self::factory()->user->create_and_get( array( 'role' => 'author' ) );

		$settings              = new Module_Sharing_Settings( new Options( $this->context ) );
		$test_sharing_settings = array(
			'analytics'      => array(
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
		$this->assertTrue( $this->authentication->is_setup_completed() );

		$this->verify_view_shared_dashboard_capability( $author, $contributor );

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

		// Test dashboard sharing capabilites can only be granted if the feature flag is enabled.
		$disable_feature();
		$this->assertFalse( user_can( $contributor, Permissions::VIEW_SHARED_DASHBOARD ) );
		$this->assertFalse( user_can( $contributor, Permissions::READ_SHARED_MODULE_DATA, 'analytics' ) );
		$this->assertFalse( user_can( $administrator, Permissions::MANAGE_MODULE_SHARING_OPTIONS, 'search-console' ) );
		$this->assertFalse( user_can( $administrator, Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT, 'search-console' ) );
	}

	private function verify_view_shared_dashboard_capability( $author, $contributor ) {
		// Test user should have at least one sharedRole and the shared_dashboard_splash
		// item dismissed to VIEW_SHARED_DASHBOARD.
		$this->assertFalse( user_can( $author, Permissions::VIEW_SHARED_DASHBOARD ) );
		$this->assertFalse( user_can( $contributor, Permissions::VIEW_SHARED_DASHBOARD ) );

		$contributor_user_options = new User_Options( $this->context, $contributor->ID );
		$dismissed_items          = new Dismissed_Items( $contributor_user_options );
		$dismissed_items->add( 'shared_dashboard_splash', 0 );
		$this->assertTrue( user_can( $contributor, Permissions::VIEW_SHARED_DASHBOARD ) );

		$author_user_options = new User_Options( $this->context, $author->ID );
		$dismissed_items     = new Dismissed_Items( $author_user_options );
		$dismissed_items->add( 'shared_dashboard_splash', 0 );
		$this->assertFalse( user_can( $author, Permissions::VIEW_SHARED_DASHBOARD ) );
	}

	private function verify_read_shared_module_data_capability( $author, $contributor ) {
		// Test user should have the sharedRole that is set for the module being checked
		// to READ_SHARED_MODULE_DATA.
		$this->assertFalse( user_can( $author, Permissions::READ_SHARED_MODULE_DATA, 'analytics' ) );
		$this->assertFalse( user_can( $contributor, Permissions::READ_SHARED_MODULE_DATA, 'search-console' ) );
		$this->assertFalse( user_can( $contributor, Permissions::READ_SHARED_MODULE_DATA, 'adsense' ) );
		$this->assertTrue( user_can( $contributor, Permissions::READ_SHARED_MODULE_DATA, 'analytics' ) );
	}

	private function verify_module_sharing_admin_capabilities_before_admin_auth( $contributor, $administrator ) {
		// Test user should be an authenticated admin to MANAGE_MODULE_SHARING_OPTIONS and
		// DELEGATE_MODULE_SHARING_MANAGEMENT.
		$this->assertFalse( user_can( $contributor, Permissions::MANAGE_MODULE_SHARING_OPTIONS, 'analytics' ) );
		$this->assertFalse( user_can( $contributor, Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT, 'analytics' ) );
		$this->assertFalse( user_can( $administrator, Permissions::MANAGE_MODULE_SHARING_OPTIONS, 'analytics' ) );
		$this->assertFalse( user_can( $administrator, Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT, 'analytics' ) );
	}

	private function verify_module_sharing_admin_capabilities_after_admin_auth( $administrator ) {
		// Test authenticated admin can MANAGE_MODULE_SHARING_OPTIONS (not DELEGATE_MODULE_SHARING_MANAGEMENT)
		// if management setting for the module is set to 'all_admins' and not 'owner'.
		$this->assertTrue( user_can( $administrator, Permissions::MANAGE_MODULE_SHARING_OPTIONS, 'analytics' ) );
		$this->assertFalse( user_can( $administrator, Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT, 'analytics' ) );
		$this->assertFalse( user_can( $administrator, Permissions::MANAGE_MODULE_SHARING_OPTIONS, 'search-console' ) );
		$this->assertFalse( user_can( $administrator, Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT, 'search-console' ) );

		// Make administrator owner of search-console.
		$options = new Options( $this->context );
		$options->set( 'googlesitekit_search-console_settings', array( 'ownerID' => $administrator->ID ) );

		// Test owner of module can MANAGE_MODULE_SHARING_OPTIONS and DELEGATE_MODULE_SHARING_MANAGEMENT.
		$this->assertTrue( user_can( $administrator, Permissions::MANAGE_MODULE_SHARING_OPTIONS, 'search-console' ) );
		$this->assertTrue( user_can( $administrator, Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT, 'search-console' ) );

		// Test authenticated admin cannot MANAGE_MODULE_SHARING_OPTIONS and DELEGATE_MODULE_SHARING_MANAGEMENT
		// if module cannot have an owner.
		$this->assertFalse( user_can( $administrator, Permissions::MANAGE_MODULE_SHARING_OPTIONS, 'site-verification' ) );
		$this->assertFalse( user_can( $administrator, Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT, 'site-verification' ) );

		// Test a user cannot have a capability for a non-existent module.
		$this->assertFalse( user_can( $administrator, Permissions::MANAGE_MODULE_SHARING_OPTIONS, 'non-existent-module' ) );
		$this->assertFalse( user_can( $administrator, Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT, 'non-existent-module' ) );
	}

	/**
	 * @dataProvider data_non_admin_roles
	 */
	public function test_check_all_for_current_user__non_admins_dashboard_sharing( $role ) {
		$this->enable_feature( 'dashboardSharing' );

		$user = self::factory()->user->create_and_get( array( 'role' => $role ) );
		wp_set_current_user( $user->ID );
		$this->user_options->switch_user( $user->ID );
		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		$this->assertEqualSetsWithIndex(
			array(
				Permissions::AUTHENTICATE          => false,
				Permissions::SETUP                 => false,
				Permissions::VIEW_POSTS_INSIGHTS   => false,
				Permissions::VIEW_DASHBOARD        => false,
				Permissions::VIEW_MODULE_DETAILS   => false,
				Permissions::MANAGE_OPTIONS        => false,
				Permissions::VIEW_SHARED_DASHBOARD => false,
				Permissions::READ_SHARED_MODULE_DATA . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::READ_SHARED_MODULE_DATA . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
				Permissions::MANAGE_MODULE_SHARING_OPTIONS . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::MANAGE_MODULE_SHARING_OPTIONS . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
				Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
			),
			$permissions->check_all_for_current_user()
		);
	}

	public function test_check_all_for_current_user__unauthenticated_admin_dashboard_sharing() {
		$this->enable_feature( 'dashboardSharing' );

		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		$this->user_options->switch_user( $user->ID );

		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		$this->assertEqualSetsWithIndex(
			array(
				Permissions::AUTHENTICATE          => true,
				Permissions::SETUP                 => true,
				Permissions::VIEW_POSTS_INSIGHTS   => false,
				Permissions::VIEW_DASHBOARD        => false,
				Permissions::VIEW_MODULE_DETAILS   => false,
				Permissions::MANAGE_OPTIONS        => false,
				Permissions::VIEW_SHARED_DASHBOARD => false,
				Permissions::READ_SHARED_MODULE_DATA . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::READ_SHARED_MODULE_DATA . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
				Permissions::MANAGE_MODULE_SHARING_OPTIONS . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::MANAGE_MODULE_SHARING_OPTIONS . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
				Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
			),
			$permissions->check_all_for_current_user()
		);
	}

	public function test_check_all_for_current_user__authenticated_admin_dashboard_sharing() {
		$this->enable_feature( 'dashboardSharing' );

		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		$this->user_options->switch_user( $user->ID );

		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		$this->assertFalse( $this->authentication->is_authenticated() );
		$this->assertFalse( $this->authentication->is_setup_completed() );
		$this->assertFalse( $this->authentication->verification()->has() );

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

		$this->assertTrue( $this->authentication->is_authenticated() );
		$this->assertTrue( $this->authentication->is_setup_completed() );
		$this->assertTrue( $this->authentication->verification()->has() );

		$this->assertEqualSetsWithIndex(
			array(
				Permissions::AUTHENTICATE          => true,
				Permissions::SETUP                 => true,
				Permissions::VIEW_POSTS_INSIGHTS   => true,
				Permissions::VIEW_DASHBOARD        => true,
				Permissions::VIEW_MODULE_DETAILS   => true,
				Permissions::MANAGE_OPTIONS        => true,
				Permissions::VIEW_SHARED_DASHBOARD => false,
				Permissions::READ_SHARED_MODULE_DATA . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::READ_SHARED_MODULE_DATA . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
				Permissions::MANAGE_MODULE_SHARING_OPTIONS . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::MANAGE_MODULE_SHARING_OPTIONS . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
				Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
			),
			$permissions->check_all_for_current_user()
		);
	}

	public function test_check_all_for_current_user__authenticated_admin_with_incomplete_setup_dashboard_sharing() {
		$this->enable_feature( 'dashboardSharing' );

		// Note this scenario is very unlikely to happen but here for completeness.
		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		$this->user_options->switch_user( $user->ID );

		$permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, $this->dismissed_items );
		$permissions->register();

		// Fake a valid authentication token on the client.
		$this->authentication->get_oauth_client()->set_token( array( 'access_token' => 'valid-auth-token' ) );

		$this->assertTrue( $this->authentication->is_authenticated() );
		$this->assertFalse( $this->authentication->is_setup_completed() );

		$this->assertEqualSetsWithIndex(
			array(
				Permissions::AUTHENTICATE          => true,
				Permissions::SETUP                 => true,
				Permissions::VIEW_POSTS_INSIGHTS   => false,
				Permissions::VIEW_DASHBOARD        => false,
				Permissions::VIEW_MODULE_DETAILS   => false,
				Permissions::MANAGE_OPTIONS        => false,
				Permissions::VIEW_SHARED_DASHBOARD => false,
				Permissions::READ_SHARED_MODULE_DATA . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::READ_SHARED_MODULE_DATA . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
				Permissions::MANAGE_MODULE_SHARING_OPTIONS . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::MANAGE_MODULE_SHARING_OPTIONS . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
				Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT . '::' . wp_json_encode( array( 'search-console' ) ) => false,
				Permissions::DELEGATE_MODULE_SHARING_MANAGEMENT . '::' . wp_json_encode( array( 'pagespeed-insights' ) ) => false,
			),
			$permissions->check_all_for_current_user()
		);
	}
}
