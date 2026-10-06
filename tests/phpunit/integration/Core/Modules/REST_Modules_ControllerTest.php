<?php
/**
 * REST_Modules_ControllerTest
 *
 * @package   Google\Site_Kit
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Modules\REST_Modules_Controller;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

class REST_Modules_ControllerTest extends TestCase {

	use RestTestTrait;

	/**
	 * Authentication object.
	 *
	 * @since 1.159.0
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Plugin context.
	 *
	 * @since 1.92.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Options instance.
	 *
	 * @since 1.92.0
	 * @var Options
	 */
	protected $options;

	/**
	 * User_Options instance.
	 *
	 * @since 1.92.0
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * Modules instance.
	 *
	 * @since 1.92.0
	 * @var Modules
	 */
	protected $modules;

	/**
	 * REST_Modules_Controller instance.
	 *
	 * @since 1.92.0
	 * @var REST_Modules_Controller
	 */
	protected $controller;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$this->context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options        = new Options( $this->context );
		$this->user_options   = new User_Options( $this->context, $user_id );
		$this->authentication = new Authentication( $this->context, $this->options, $this->user_options );
		$this->modules        = new Modules( $this->context, $this->options, $this->user_options );
		$this->controller     = new REST_Modules_Controller( $this->modules );

		wp_set_current_user( $user_id );
	}

	public function tear_down() {
		parent::tear_down();
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
	}

	private function set_available_modules( $modules ) {
		$map = array();

		foreach ( $modules as $module ) {
			$map[ $module->slug ] = $module;
		}

		$this->force_set_property( $this->modules, 'modules', $map );
	}

	private function setup_fake_module( $force_active = true ) {
		$fake_module = new FakeModule( $this->context );
		$fake_module->set_force_active( $force_active );

		$fake_module_settings = new FakeModuleSettings( $this->options );
		$fake_module_settings->register();

		$this->set_available_modules( array( $fake_module ) );
	}

	private function setup_fake_module_with_view_only_settings( $force_active = true ) {
		$fake_module = new FakeModule_WithViewOnlySettings( $this->context );
		$fake_module->set_force_active( $force_active );

		$fake_module_settings = new FakeModuleSettings_WithViewOnlyKeys( $this->options );
		$fake_module_settings->register();

		$this->set_available_modules( array( $fake_module ) );
	}

	private function share_modules_with_user_role( $shared_with_role, $shared_modules = array( 'fake-module' ) ) {
		$sharing_settings = new Module_Sharing_Settings( new Options( $this->context ) );

		$shared_modules = array_combine(
			$shared_modules,
			array_fill(
				0,
				count( $shared_modules ),
				array( 'sharedRoles' => array( $shared_with_role ) )
			)
		);

		$sharing_settings->set( $shared_modules );
	}

	private function set_current_active_user_role( $role ) {
		$user = self::factory()->user->create_and_get( array( 'role' => $role ) );

		wp_set_current_user( $user->ID );
	}

	/**
	 * Sets the current user to an author who can view post insights, but cannot manage options.
	 *
	 * @since n.e.x.t
	 */
	private function set_current_author_who_can_view_posts_insights() {
		$this->set_current_active_user_role( 'author' );

		add_filter(
			'map_meta_cap',
			function ( $caps, $cap ) {
				if ( Permissions::VIEW_POSTS_INSIGHTS === $cap ) {
					return array();
				}

				return $caps;
			},
			20,
			2
		);
	}

	private function request_get_module_setings( $module = 'fake-module' ) {
		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/' . $module . '/data/settings' );
		$response = rest_get_server()->dispatch( $request );

		return $response;
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		remove_all_filters( 'googlesitekit_apifetch_preload_paths' );

		$this->controller->register();

		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ), 'Preload paths filter should be registered.' );
		$this->assertTrue( has_filter( 'googlesitekit_features_request_data' ), 'Features request data filter should be registered.' );
		$this->assertContains(
			'/' . REST_Routes::REST_ROOT . '/core/modules/data/list',
			apply_filters( 'googlesitekit_apifetch_preload_paths', array() ),
			'Preload paths should include core/modules/data/list route.'
		);
	}

	public function test_list_rest_endpoint__get_method() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/list' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'List endpoint should return HTTP 200.' );
		$this->assertNotEmpty( $response->get_data(), 'List endpoint should return module data.' );
	}

	public function test_list_rest_endpoint__no_post_method() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/list' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 404, $response->get_status(), 'POST to list endpoint should be not found.' );
	}

	public function test_list_rest_endpoint__shape() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request          = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/list' );
		$response         = rest_get_server()->dispatch( $request );
		$module_data_keys = array(
			'slug',
			'name',
			'description',
			'homepage',
			'internal',
			'order',
			'forceActive',
			'shareable',
			'recoverable',
			'active',
			'connected',
			'dependencies',
			'dependants',
			'owner',
		);
		$this->assertNotEmpty( $response->get_data(), 'List response should contain modules.' );

		foreach ( $response->get_data() as $data ) {
			foreach ( $module_data_keys as $module_data_key ) {
				$this->assertArrayHasKey( $module_data_key, $data, 'Module data should include required key.' );
			}
		}
	}

	public function test_activation_rest_endpoint__no_get_method() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/activation' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 404, $response->get_status(), 'GET should not be allowed for activation endpoint.' );
	}

	public function test_activation_rest_endpoint__requires_module_slug() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/activation' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'rest_missing_callback_param', $response->get_data()['code'], 'Activation should require module slug param.' );
		$this->assertEquals( 400, $response->get_status(), 'Missing module slug should return 400.' );
	}

	public function test_activation_rest_endpoint__requires_valid_module_slug() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/activation' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'fake-module',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['code'], 'Invalid module slug should be rejected.' );
		$this->assertEquals( 500, $response->get_status(), 'Invalid module slug should return 500.' );
	}

	public function test_activation_rest_endpoint__prevent_inactive_dependencies_activation() {
		// TODO: As Site Kit doesn't have any dependent modules at this moment,
		// update this test case so that a dependency relationship can be
		// mocked without referencing an actual module, e.g. using FakeModule.
		$this->markTestSkipped( 'TODO' );
	}

	public function test_activation_rest_endpoint__activate_module() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/activation' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug'   => 'analytics-4',
					'active' => true,
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertTrue( $response->get_data()['success'], 'Activation response should indicate success.' );
		$this->assertEquals( 200, $response->get_status(), 'Activation should return HTTP 200.' );
	}

	public function test_activation_rest_endpoint__deactivate_module() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/activation' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug'   => 'analytics-4',
					'active' => false,
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertTrue( $response->get_data()['success'], 'Deactivation response should indicate success.' );
		$this->assertEquals( 200, $response->get_status(), 'Deactivation should return HTTP 200.' );
	}

	public function test_activation_rest_endpoint__deactivate_dependant_module() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->modules->activate_module( 'analytics-4' );

		$this->assertTrue( $this->modules->is_module_active( 'analytics-4' ), 'Module should be active before deactivation.' );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/activation' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug'   => 'analytics-4',
					'active' => false,
				),
			)
		);
		rest_get_server()->dispatch( $request );

		$this->assertFalse( $this->modules->is_module_active( 'analytics-4' ), 'Module should be deactivated after request.' );
	}

	public function test_info_rest_endpoint__no_post_method() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/info' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 404, $response->get_status(), 'GET should be required for info endpoint.' );
	}

	public function test_info_rest_endpoint__require_module_slug() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/info' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['code'], 'Response code should indicate invalid module slug when module_slug is missing.' );
		$this->assertEquals( 500, $response->get_status(), 'Invalid slug should return 500.' );
	}

	public function test_info_rest_endpoint__require_valid_module_slug() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/info' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'fake-module',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['code'], 'Response code should indicate invalid module slug when unknown module slug is requested' );
		$this->assertEquals( 500, $response->get_status(), 'Invalid module slug should return 500.' );
	}

	public function test_info_rest_endpoint__valid_module_slug() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/info' );
		$request->set_query_params( array( 'slug' => 'analytics-4' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertNotEmpty( $response->get_data(), 'Info endpoint should return module info.' );
		$this->assertEquals( 200, $response->get_status(), 'Info endpoint should return HTTP 200.' );
	}

	public function test_check_access_rest_endpoint__no_get_method() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'rest_no_route', $response->get_data()['code'], 'GET should not be allowed for check-access endpoint.' );
	}

	public function test_check_access_rest_endpoint__requires_module_slug() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['code'], 'Missing slug should be invalid for check-access.' );
		$this->assertEquals( 404, $response->get_status(), 'Missing slug should return 404 for check-access.' );
	}

	public function test_check_access_rest_endpoint__requires_module_connected() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'analytics-4',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'module_not_connected', $response->get_data()['code'], 'Response code should be "module_not_connected" when module is not connected.' );
		$this->assertEquals( 500, $response->get_status(), 'Not connected should return 500.' );
	}

	public function test_check_access_rest_endpoint__shareable_module_does_not_have_service_entity() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'pagespeed-insights',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( true, $response->get_data()['access'], 'Shareable module should have access.' );
		$this->assertEquals( 200, $response->get_status(), 'Check-access should return HTTP 200 for success.' );
	}

	public function test_check_access_rest_endpoint__success() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$analytics = $this->modules->get_module( 'analytics-4' );

		FakeHttp::fake_google_http_handler( $analytics->get_client() );

		$analytics->get_settings()->merge(
			array(
				'accountID'       => '12345678',
				'propertyID'      => '12345678',
				'webDataStreamID' => '987654321',
				'measurementID'   => 'G-123',
			)
		);

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$analytics->get_scopes()
		);

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'analytics-4',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertArrayIntersection(
			array(
				'access' => true,
			),
			$response->get_data(),
			'Access check should report access true for connected module.'
		);
		$this->assertEquals( 200, $response->get_status(), 'Check-access should return HTTP 200 for success.' );
	}

	public function test_notifications_rest_endpoint__no_post_method() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/notifications' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 400, $response->get_status(), 'Notifications endpoint should reject POST method.' );
	}

	public function test_notifications_rest_endpoint__require_valid_slug() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/non-existent-module/data/notifications' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 404, $response->get_status(), 'Notifications endpoint should return 404 for invalid slug.' );
	}

	public function test_settings_rest_endpoint__get_method() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'Settings GET should return HTTP 200.' );
	}

	public function test_settings_rest_endpoint__get_invalid_slug() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/non-existent-module/data/settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 404, $response->get_status(), 'Settings GET should 404 for invalid slug.' );
	}

	public function test_settings_rest_endpoint__post_method() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/settings' );
		$request->set_body_params(
			array(
				'data' => array(
					'defaultKey' => 'updated-settings',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'Settings POST should return HTTP 200.' );
	}

	public function test_settings_rest_endpoint__post_invalid_slug() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$response = $this->request_get_module_setings( 'non-existent-module' );

		$this->assertEquals( 404, $response->get_status(), 'Settings POST should 404 for invalid slug.' );
	}

	public function test_settings_rest_endpoint__admins_with_no_view_only_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module();

		$response = $this->request_get_module_setings();

		$this->assertEqualSetsWithIndex(
			array(
				'defaultKey' => 'default-value',
			),
			$response->get_data(),
			'Admin settings endpoint should return writable defaults only.'
		);
	}

	public function test_settings_rest_endpoint__shared_roles_with_no_view_only_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module();

		$shared_with_roles = array( 'editor', 'author', 'contributor' );
		foreach ( $shared_with_roles as $shared_with_role ) {
			$this->set_current_active_user_role( $shared_with_role );
			$this->share_modules_with_user_role( $shared_with_role );

			$response = $this->request_get_module_setings();

			$this->assertEquals( '500', $response->get_status(), 'Response status should return 500 for shared roles without view-only settings.' );
			$this->assertEquals( 'no_view_only_settings', $response->get_data()['code'], 'Error code should indicate no view-only settings.' );
		}
	}

	public function test_settings_rest_endpoint__admins_with_view_only_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module_with_view_only_settings();

		$response = $this->request_get_module_setings();

		$this->assertEqualSetsWithIndex(
			array(
				'defaultKey'  => 'default-value',
				'viewOnlyKey' => 'default-value',
			),
			$response->get_data(),
			'Admin settings endpoint should include view-only defaults.'
		);
	}

	public function test_settings_rest_endpoint__non_admins_require_view_only_access() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module_with_view_only_settings();

		$roles = array( 'editor', 'author', 'contributor' );
		foreach ( $roles as $role ) {
			$this->set_current_active_user_role( $role );

			$response = $this->request_get_module_setings();

			$this->assertEquals( '403', $response->get_status(), 'Response status should return 403 Forbidden when a non-admin user attempts access without view-only permissions.' );
		}
	}

	public function test_settings_rest_endpoint__shared_role_with_view_only_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module_with_view_only_settings();

		$shared_with_roles = array( 'editor', 'author', 'contributor' );
		foreach ( $shared_with_roles as $shared_with_role ) {
			$this->set_current_active_user_role( $shared_with_role );
			$this->share_modules_with_user_role( $shared_with_role );

			$response = $this->request_get_module_setings();

			$this->assertEquals( '200', $response->get_status(), 'Shared roles with view-only settings should succeed.' );
			$this->assertEqualSetsWithIndex(
				array(
					'viewOnlyKey' => 'default-value',
				),
				$response->get_data(),
				'Shared role settings endpoint should return view-only fields.'
			);
		}
	}

	public function test_data_available_rest_endpoint__valid_method__non_implementing_module() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->setup_fake_module();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/data-available' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['code'], 'Non-implementing module should return invalid slug for data-available.' );
	}

	public function test_data_available_rest_endpoint__valid_method__implementing_module() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$fake_module_with_data_available = new FakeModule_WithDataAvailable( $this->context );

		// A module being active is a pre-requisite for it to be connected.
		update_option( Modules::OPTION_ACTIVE_MODULES, array( 'fake-module' ) );

		$this->set_available_modules( array( $fake_module_with_data_available ) );
		$this->assertEmpty( $fake_module_with_data_available->is_data_available(), 'data-available should not be set initially.' );

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/data-available' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'data-available should return HTTP 200.' );
		$this->assertTrue( $fake_module_with_data_available->is_data_available(), 'data-available should set data availability.' );
	}

	public function test_datapoint_rest_endpoint__get_method() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->setup_fake_module();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'test-request', $response->get_data()->datapoint, 'GET datapoint should echo datapoint name.' );
	}

	public function test_datapoint_rest_endpoint__get_invalid_slug() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/non-existent-module/data/test-request' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['code'], 'GET datapoint should return invalid slug for bad module.' );
	}

	public function test_datapoint_rest_endpoint__get_invalid_datapoint() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/fake-datapoint' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_datapoint', $response->get_data()['code'], 'GET datapoint should report invalid datapoint.' );
	}

	public function test_datapoint_rest_endpoint__post_method() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'test-request', $response->get_data()->datapoint, 'POST datapoint should echo datapoint name.' );
	}

	public function test_datapoint_rest_endpoint__uses_default_permission_for_request_method() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module();

		$this->set_current_author_who_can_view_posts_insights();

		$get_response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' )
		);
		$this->assertEquals( 200, $get_response->get_status(), 'A user who can view post insights should be allowed to get data from a default datapoint.' );

		$post_response = rest_get_server()->dispatch(
			new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' )
		);
		$this->assertEquals( 403, $post_response->get_status(), 'A user who cannot manage options should be forbidden from setting data on a default datapoint.' );
		$this->assertEquals( 'rest_forbidden', $post_response->get_data()['code'], 'Setting data on a default datapoint should fail the permission check for a user who cannot manage options.' );
	}

	public function test_datapoint_rest_endpoint__permission_aware_datapoint_overrides_default() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module();

		// An author has `edit_posts` but not `manage_options`.
		$author_id = $this->factory()->user->create( array( 'role' => 'author' ) );
		wp_set_current_user( $author_id );

		// A default editable datapoint still requires `manage_options`.
		$default_response = rest_get_server()->dispatch(
			new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' )
		);
		$this->assertEquals( 403, $default_response->get_status(), 'A non-admin user should be forbidden from a default editable datapoint.' );

		// The permission-aware datapoint uses its own (edit_posts) check instead.
		$aware_response = rest_get_server()->dispatch(
			new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/permission-aware-request' )
		);
		$this->assertEquals(
			'permission-aware-request',
			$aware_response->get_data()->datapoint,
			'A permission-aware datapoint should allow the request via its own permission check.'
		);
	}

	public function test_datapoint_rest_endpoint__permission_aware_datapoint_denies_without_capability() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module();

		// A subscriber has neither `edit_posts` nor `manage_options`.
		$subscriber_id = $this->factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $subscriber_id );

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/permission-aware-request' )
		);

		$this->assertEquals( 403, $response->get_status(), 'A user failing the datapoint permission check should be forbidden.' );
	}

	public function test_datapoint_rest_endpoint__permission_aware_datapoint_denies_when_callback_throws() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module();

		// The current user is an administrator, who would satisfy the default
		// `manage_options` permission. A datapoint whose own permission check
		// throws must deny access rather than fall back to that default.
		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/throwing-permission-aware-request' )
		);

		$this->assertEquals( 403, $response->get_status(), 'A permission-aware datapoint whose permission check throws should deny access instead of reverting to the default permission.' );
	}

	public function test_datapoint_rest_endpoint__permission_aware_datapoint_checks_put_request_with_post_definition() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module();

		// The current user is an administrator, who would satisfy the default
		// `manage_options` permission, so only the datapoint's own check can deny the request.
		$throwing_response = rest_get_server()->dispatch(
			new WP_REST_Request( 'PUT', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/throwing-permission-aware-request' )
		);
		$this->assertEquals( 403, $throwing_response->get_status(), 'A PUT request should be checked by the own permission check of the `POST` definition it executes.' );

		// An author has `edit_posts` but not `manage_options`.
		$this->set_current_active_user_role( 'author' );

		$aware_response = rest_get_server()->dispatch(
			new WP_REST_Request( 'PUT', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/permission-aware-request' )
		);
		$this->assertEquals( 200, $aware_response->get_status(), 'A PUT request should be allowed by the own permission check of the `POST` definition it executes.' );
		$this->assertEquals( 'POST', $aware_response->get_data()->method, 'A PUT request should execute the `POST:permission-aware-request` definition.' );
	}

	public function test_datapoint_rest_endpoint__post_invalid_slug() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/non-existent-module/data/settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['code'], 'POST datapoint should return invalid slug for bad module.' );
	}

	public function test_datapoint_rest_endpoint__post_invalid_datapoint() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/fake-datapoint' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_datapoint', $response->get_data()['code'], 'POST datapoint should report invalid datapoint.' );
	}

	public function test_datapoint_rest_endpoint__schema_aware_datapoint_served_by_own_route() {
		$this->setup_fake_module();
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/schema-aware-request' );
		$request->set_query_params(
			array(
				'propertyID' => '123456789',
				'limit'      => '10',
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'A valid request to a schema-aware datapoint should return HTTP 200.' );
		$this->assertEquals( '/google-site-kit/v1/modules/fake-module/data/schema-aware-request', $response->get_matched_route(), 'A schema-aware datapoint should be served by its own route.' );
		$this->assertEquals(
			(object) array(
				'method'    => 'GET',
				'datapoint' => 'schema-aware-request',
				'data'      => (object) array(
					'propertyID' => '123456789',
					'limit'      => 10,
				),
			),
			$response->get_data(),
			'A schema-aware datapoint should return its data, with the arguments sanitized according to its argument schema.'
		);
	}

	public function test_datapoint_rest_endpoint__schema_aware_route_takes_precedence_over_catch_all_route() {
		$this->setup_fake_module();
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/schema-aware-request' );
		$request->set_query_params( array( 'propertyID' => '123456789' ) );
		$response = rest_get_server()->dispatch( $request );

		$registered_routes = array_keys( rest_get_server()->get_routes() );

		$this->assertLessThan(
			array_search( '/google-site-kit/v1/modules/(?P<slug>[a-z0-9\-]+)/data/(?P<datapoint>[a-z\-]+)', $registered_routes, true ),
			array_search( '/google-site-kit/v1/modules/fake-module/data/schema-aware-request', $registered_routes, true ),
			'The schema-aware datapoint route should be registered before the catch-all data route.'
		);
		$this->assertEquals( '/google-site-kit/v1/modules/fake-module/data/schema-aware-request', $response->get_matched_route(), 'The schema-aware datapoint route should be matched instead of the catch-all data route.' );
	}

	public function test_datapoint_rest_endpoint__schema_aware_datapoint_requires_param() {
		$this->setup_fake_module();
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$data_requests_before = did_action( 'googlesitekit_fake_module_data_request' );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/schema-aware-request' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 400, $response->get_status(), 'A request missing a required argument of a schema-aware datapoint should return HTTP 400.' );
		$this->assertEquals( 'rest_missing_callback_param', $response->get_data()['code'], 'The error code should indicate the missing required argument.' );
		$this->assertEquals( array( 'propertyID' ), $response->get_data()['data']['params'], 'The error should name the missing `propertyID` argument.' );
		$this->assertEquals( $data_requests_before, did_action( 'googlesitekit_fake_module_data_request' ), 'The schema-aware datapoint should not be executed when a required argument is missing.' );
	}

	public function test_datapoint_rest_endpoint__schema_aware_datapoint_rejects_invalid_param_type() {
		$this->setup_fake_module();
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$data_requests_before = did_action( 'googlesitekit_fake_module_data_request' );

		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/schema-aware-request' );
		$request->set_query_params(
			array(
				'propertyID' => '123456789',
				'limit'      => 'all',
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 400, $response->get_status(), 'A request with an argument of the wrong type should return HTTP 400.' );
		$this->assertEquals( 'rest_invalid_param', $response->get_data()['code'], 'The error code should indicate the invalid argument.' );
		$this->assertEquals( array( 'limit' ), array_keys( $response->get_data()['data']['params'] ), 'The error should name the invalid `limit` argument.' );
		$this->assertEquals( $data_requests_before, did_action( 'googlesitekit_fake_module_data_request' ), 'The schema-aware datapoint should not be executed when an argument has the wrong type.' );
	}

	public function test_datapoint_rest_endpoint__schema_aware_editable_datapoint_requires_data_property() {
		if ( version_compare( $GLOBALS['wp_version'], '5.5', '<' ) ) {
			$this->markTestSkipped( 'This test requires WordPress 5.5 or higher, which validates the required properties of an object argument.' );
		}

		$this->setup_fake_module();
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$data_requests_before = did_action( 'googlesitekit_fake_module_data_request' );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/schema-aware-request' );
		$request->set_body_params( array( 'data' => array( 'limit' => 10 ) ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( '/google-site-kit/v1/modules/fake-module/data/schema-aware-request', $response->get_matched_route(), 'A POST request with an invalid `data` argument should be served by the schema-aware datapoint route.' );
		$this->assertEquals( 400, $response->get_status(), 'A POST request whose `data` misses a required property should return HTTP 400.' );
		$this->assertEquals( 'rest_invalid_param', $response->get_data()['code'], 'The error code should indicate the invalid `data` argument.' );
		$this->assertEquals( array( 'data' ), array_keys( $response->get_data()['data']['params'] ), 'The error should name the `data` argument.' );
		$this->assertEquals( $data_requests_before, did_action( 'googlesitekit_fake_module_data_request' ), 'The schema-aware editable datapoint should not be executed when its `data` argument is invalid.' );
	}

	public function test_datapoint_rest_endpoint__non_schema_aware_datapoint_served_by_catch_all_route() {
		$this->setup_fake_module();
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( '/google-site-kit/v1/modules/(?P<slug>[a-z0-9\-]+)/data/(?P<datapoint>[a-z\-]+)', $response->get_matched_route(), 'A datapoint that does not implement `Schema_Aware_Datapoint` should be served by the catch-all data route.' );
		$this->assertEquals( 'test-request', $response->get_data()->datapoint, 'The catch-all data route should return the data of the `test-request` datapoint.' );
	}

	public function test_datapoint_rest_endpoint__schema_aware_datapoint_without_schema_aware_get_definition_falls_back_to_catch_all_route() {
		$this->setup_fake_module();
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		// Only the `POST` definition of `permission-aware-schema-request` implements `Schema_Aware_Datapoint`.
		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/permission-aware-schema-request' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( '/google-site-kit/v1/modules/(?P<slug>[a-z0-9\-]+)/data/(?P<datapoint>[a-z\-]+)', $response->get_matched_route(), 'A GET request should be served by the catch-all data route when only the POST definition of the datapoint is schema-aware.' );
		$this->assertEquals( 'GET', $response->get_data()->method, 'The catch-all data route should execute the `GET:permission-aware-schema-request` definition.' );
	}

	public function test_datapoint_rest_endpoint__schema_aware_datapoint_requires_active_module() {
		$this->setup_fake_module( false );
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		delete_option( Modules::OPTION_ACTIVE_MODULES );
		$this->assertFalse( $this->modules->is_module_active( 'fake-module' ), 'The fake module should be inactive before its schema-aware datapoint is requested.' );

		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/schema-aware-request' );
		$request->set_query_params( array( 'propertyID' => '123456789' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( '/google-site-kit/v1/modules/fake-module/data/schema-aware-request', $response->get_matched_route(), 'A schema-aware datapoint of an inactive module should be served by its own route.' );
		$this->assertEquals( 403, $response->get_status(), 'A schema-aware datapoint should return HTTP 403 when its module is inactive.' );
		$this->assertEquals( 'module_not_active', $response->get_data()['code'], 'The error code should indicate the module is not active.' );
		$this->assertEquals( 'Module must be active to request data.', $response->get_data()['message'], 'The error message should indicate an active module is required.' );
	}

	public function test_datapoint_rest_endpoint__schema_aware_datapoint_uses_default_permission() {
		$this->setup_fake_module();
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$subscriber_id = $this->factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $subscriber_id );

		$subscriber_request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/schema-aware-request' );
		$subscriber_request->set_query_params( array( 'propertyID' => '123456789' ) );
		$subscriber_response = rest_get_server()->dispatch( $subscriber_request );

		$this->assertEquals( 403, $subscriber_response->get_status(), 'A user who cannot view post insights should be forbidden from the readable schema-aware datapoint.' );
		$this->assertEquals( 'rest_forbidden', $subscriber_response->get_data()['code'], 'Getting data from the readable schema-aware datapoint should fail the permission check for a user who cannot view post insights.' );

		$this->set_current_author_who_can_view_posts_insights();

		$get_request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/schema-aware-request' );
		$get_request->set_query_params( array( 'propertyID' => '123456789' ) );
		$get_response = rest_get_server()->dispatch( $get_request );

		$this->assertEquals( 200, $get_response->get_status(), 'A user who can view post insights should be allowed to get data from the readable schema-aware datapoint.' );

		$post_request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/schema-aware-request' );
		$post_request->set_body_params( array( 'data' => array( 'propertyID' => '123456789' ) ) );
		$post_response = rest_get_server()->dispatch( $post_request );

		$this->assertEquals( 403, $post_response->get_status(), 'A user who cannot manage options should be forbidden from the editable schema-aware datapoint.' );
		$this->assertEquals( 'rest_forbidden', $post_response->get_data()['code'], 'Setting data on the editable schema-aware datapoint should fail the permission check for a user who cannot manage options.' );
	}

	public function test_datapoint_rest_endpoint__permission_aware_schema_aware_datapoint_overrides_default() {
		$this->setup_fake_module();
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		// An author has `edit_posts` but not `manage_options`.
		$author_id = $this->factory()->user->create( array( 'role' => 'author' ) );
		wp_set_current_user( $author_id );

		// A schema-aware editable datapoint without its own permission check still requires `manage_options`.
		$default_request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/schema-aware-request' );
		$default_request->set_body_params( array( 'data' => array( 'propertyID' => '123456789' ) ) );
		$default_response = rest_get_server()->dispatch( $default_request );

		$this->assertEquals( '/google-site-kit/v1/modules/fake-module/data/schema-aware-request', $default_response->get_matched_route(), 'A POST request from an author should be served by the schema-aware datapoint route.' );
		$this->assertEquals( 403, $default_response->get_status(), 'An author should be forbidden from a schema-aware editable datapoint without its own permission check.' );
		$this->assertEquals( 'rest_forbidden', $default_response->get_data()['code'], 'The schema-aware editable datapoint should fail the default permission check for an author.' );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/permission-aware-schema-request' );
		$request->set_body_params( array( 'data' => array( 'propertyID' => '123456789' ) ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( '/google-site-kit/v1/modules/fake-module/data/permission-aware-schema-request', $response->get_matched_route(), 'A permission-aware, schema-aware datapoint should be served by its own route.' );
		$this->assertEquals( 200, $response->get_status(), 'A permission-aware, schema-aware datapoint should allow an author via its own permission check.' );
		$this->assertEquals( 'POST', $response->get_data()->method, 'The `POST:permission-aware-schema-request` definition should be executed for an author.' );
		$this->assertEquals( 'permission-aware-schema-request', $response->get_data()->datapoint, 'The response should come from the `permission-aware-schema-request` datapoint.' );
		$this->assertEquals( (object) array( 'propertyID' => '123456789' ), $response->get_data()->data, 'The `data` argument of the request should be passed to the datapoint.' );

		// A subscriber has neither `edit_posts` nor `manage_options`.
		$this->set_current_active_user_role( 'subscriber' );

		$subscriber_request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/permission-aware-schema-request' );
		$subscriber_request->set_body_params( array( 'data' => array( 'propertyID' => '123456789' ) ) );
		$subscriber_response = rest_get_server()->dispatch( $subscriber_request );

		$this->assertEquals( 403, $subscriber_response->get_status(), 'A permission-aware, schema-aware datapoint should forbid a user who fails its own permission check.' );
		$this->assertEquals( 'rest_forbidden', $subscriber_response->get_data()['code'], 'The permission-aware, schema-aware datapoint should fail its own permission check for a subscriber.' );
	}

	public function test_datapoint_rest_endpoint__permission_aware_schema_aware_datapoint_checks_put_request_with_post_definition() {
		$this->setup_fake_module();
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		// An author has `edit_posts` but not `manage_options`.
		$this->set_current_active_user_role( 'author' );

		$request = new WP_REST_Request( 'PUT', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/permission-aware-schema-request' );
		$request->set_body_params( array( 'data' => array( 'propertyID' => '123456789' ) ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( '/google-site-kit/v1/modules/fake-module/data/permission-aware-schema-request', $response->get_matched_route(), 'A PUT request should be served by the schema-aware datapoint route.' );
		$this->assertEquals( 200, $response->get_status(), 'A PUT request should be allowed by the own permission check of the `POST:permission-aware-schema-request` definition.' );
		$this->assertEquals( 'POST', $response->get_data()->method, 'A PUT request should execute the `POST:permission-aware-schema-request` definition.' );
	}

	public function test_datapoint_rest_endpoint__schema_aware_datapoint_listed_in_rest_index() {
		$this->setup_fake_module();
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT );
		$request->set_query_params( array( 'context' => 'help' ) );
		$routes = rest_get_server()->dispatch( $request )->get_data()['routes'];

		$this->assertArrayHasKey( '/google-site-kit/v1/modules/fake-module/data/schema-aware-request', $routes, 'The schema-aware datapoint route should be listed in the REST index.' );

		$route = $routes['/google-site-kit/v1/modules/fake-module/data/schema-aware-request'];

		$this->assertEquals( array( 'GET' ), $route['endpoints'][0]['methods'], 'The first endpoint of the schema-aware datapoint route should handle GET requests.' );
		$this->assertEquals( array( 'POST', 'PUT', 'PATCH' ), $route['endpoints'][1]['methods'], 'The second endpoint of the schema-aware datapoint route should handle editable requests.' );
		// WordPress lists more schema keywords in the index from version 5.6, so only
		// the keywords every supported version lists are compared.
		$listed_keywords = fn ( array $args ) => array_map(
			fn ( array $arg ) => array_intersect_key( $arg, array_flip( array( 'type', 'description', 'required' ) ) ),
			$args
		);

		$this->assertEquals(
			array(
				'propertyID' => array(
					'type'        => 'string',
					'description' => 'Property to request data for.',
					'required'    => true,
				),
				'limit'      => array(
					'type'        => 'integer',
					'description' => 'Maximum number of rows to return.',
					'required'    => false,
				),
			),
			$listed_keywords( $route['endpoints'][0]['args'] ),
			'The REST index should list the argument schema of the GET definition for the GET endpoint.'
		);
		$this->assertEquals(
			array(
				'data' => array(
					'type'        => 'object',
					'description' => 'Settings to save.',
					'required'    => true,
				),
			),
			$listed_keywords( $route['endpoints'][1]['args'] ),
			'The REST index should list the argument schema of the POST definition for the editable endpoint.'
		);
		$this->assertEquals(
			array(
				'$schema'    => 'http://json-schema.org/draft-04/schema#',
				'title'      => 'fake-module-schema-aware-request',
				'type'       => 'object',
				'properties' => array(
					'method'    => array(
						'type' => 'string',
					),
					'datapoint' => array(
						'type' => 'string',
					),
					'data'      => array(
						'type' => 'object',
					),
				),
			),
			$route['schema'],
			'The REST index should list the resource schema of the GET definition when both definitions are schema-aware.'
		);
	}

	public function test_recover_modules_rest_endpoint__no_get_method() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-modules' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'rest_no_route', $response->get_data()['code'], 'GET should not be allowed for recover-modules endpoint.' );
	}

	public function test_recover_modules_rest_endpoint__requires_module_slugs() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-modules' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_param', $response->get_data()['code'], 'Recover-modules should require slugs param.' );
		$this->assertEquals( 400, $response->get_status(), 'Missing slugs should return 400.' );
	}

	public function test_recover_modules_rest_endpoint__invalid_module_slug() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-modules' );
		$request->set_body_params(
			array(
				'data' => array(
					'slugs' => array( 'non-existent-module' ),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['error']['non-existent-module']['code'], 'Invalid module slug should be reported in errors.' );
		$this->assertEquals( 200, $response->get_status(), 'Recover-modules should return 200 with per-module errors.' );
	}

	public function test_recover_modules_rest_endpoint__requires_shareable_module() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-modules' );
		$request->set_body_params(
			array(
				'data' => array(
					'slugs' => array( 'adsense' ),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'module_not_shareable', $response->get_data()['error']['adsense']['code'], 'Non-shareable module should be reported.' );
		$this->assertEquals( 200, $response->get_status(), 'Recover-modules should return 200 even for non-shareable module.' );
	}

	public function test_recover_modules_rest_endpoint__requires_recoverable_module() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-modules' );
		$request->set_body_params(
			array(
				'data' => array(
					'slugs' => array( 'search-console' ),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'module_not_recoverable', $response->get_data()['error']['search-console']['code'], 'Non-recoverable module should be reported.' );
		$this->assertEquals( 200, $response->get_status(), 'Recover-modules should return 200 even for non-recoverable module.' );
	}

	public function test_recover_modules_rest_endpoint__requires_accessible_module() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		// Make search-console a recoverable module.
		$search_console = $this->modules->get_module( 'search-console' );
		$search_console->get_settings()->merge(
			array(
				'propertyID' => '123456789',
			)
		);
		$test_sharing_settings = array(
			'search-console' => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'owner',
			),
		);
		add_option( 'googlesitekit_dashboard_sharing', $test_sharing_settings );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-modules' );
		$request->set_body_params(
			array(
				'data' => array(
					'slugs' => array( 'search-console' ),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'module_not_accessible', $response->get_data()['error']['search-console']['code'], 'Not accessible module should be reported.' );
		$this->assertEquals( 200, $response->get_status(), 'Recover-modules should return 200 for not accessible module.' );
	}

	public function test_recover_modules_rest_endpoint__success() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		// Make search-console a recoverable module.
		$search_console = $this->modules->get_module( 'search-console' );
		$search_console->get_settings()->merge(
			array(
				'propertyID' => '123456789',
			)
		);
		$test_sharing_settings = array(
			'search-console' => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'owner',
			),
		);
		add_option( 'googlesitekit_dashboard_sharing', $test_sharing_settings );

		// Make search-console service requests accessible.
		FakeHttp::fake_google_http_handler( $search_console->get_client() );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-modules' );
		$request->set_body_params(
			array(
				'data' => array(
					'slugs' => array( 'search-console' ),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals(
			array(
				'success' => array(
					'search-console' => true,
				),
				'error'   => (object) array(),
			),
			$response->get_data(),
			'Recover-modules success response should include module success map.'
		);
		$this->assertEquals( 200, $response->get_status(), 'Recover-modules success should return HTTP 200.' );
	}

	public function test_recover_modules_rest_endpoint__analytics_4_exception() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		// Make analytics-4 a recoverable module.
		$analytics_4 = $this->modules->get_module( 'analytics-4' );
		$analytics_4->get_settings()->merge(
			array(
				'accountID'       => '123456789',
				'propertyID'      => '123456789',
				'measurementID'   => 'G-1234567',
				'webDataStreamID' => '123456789',
			)
		);
		$test_sharing_settings = array(
			'analytics-4' => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'owner',
			),
		);
		add_option( 'googlesitekit_dashboard_sharing', $test_sharing_settings );

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$analytics_4->get_scopes()
		);

		// Make analytics-4 service requests accessible.
		FakeHttp::fake_google_http_handler( $analytics_4->get_client() );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-modules' );
		$request->set_body_params(
			array(
				'data' => array(
					'slugs' => array( 'analytics-4' ),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals(
			array(
				'success' => array(
					'analytics-4' => true,
				),
				'error'   => (object) array(),
			),
			$response->get_data(),
			'Recover-modules success response should include analytics-4.'
		);
		$this->assertEquals( 200, $response->get_status(), 'Recover-modules success should return HTTP 200.' );
	}

	public function test_data_rest_endpoint__requires_active_module() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module( false );

		delete_option( Modules::OPTION_ACTIVE_MODULES );
		$this->assertFalse( $this->modules->is_module_active( 'fake-module' ), 'Module should be inactive before requesting data.' );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 403, $response->get_status(), 'GET on module data should return 403 when module is inactive.' );
		$this->assertEquals( 'module_not_active', $response->get_data()['code'], 'Error code should indicate the module is not active.' );
		$this->assertEquals( 'Module must be active to request data.', $response->get_data()['message'], 'Error message should indicate active module required.' );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$request->set_body_params(
			array(
				'data' => array(
					'foo' => 'bar',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 403, $response->get_status(), 'POST request to module data endpoint should return 403 when module is inactive.' );
		$this->assertEquals( 'module_not_active', $response->get_data()['code'], 'Error code should indicate module not active.' );
		$this->assertEquals( 'Module must be active to request data.', $response->get_data()['message'], 'Error message should indicate active module required.' );
	}

	public function test_data_rest_endpoint__success() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
		$this->setup_fake_module( false );

		update_option( Modules::OPTION_ACTIVE_MODULES, array( 'fake-module' ) );
		$this->assertTrue( $this->modules->is_module_active( 'fake-module' ), 'Module should be active after update option.' );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'GET data should return HTTP 200 for active module.' );
		$data = $response->get_data();
		$this->assertIsObject( $data, 'GET data response should be an object.' );
		$this->assertEquals( 'GET', $data->method, 'GET data response should indicate GET method.' );
		$this->assertEquals( 'test-request', $data->datapoint, 'GET data response should echo datapoint name.' );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$request->set_body_params(
			array(
				'data' => array(
					'foo' => 'bar',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'POST data should return HTTP 200 for active module.' );
		$data = $response->get_data();
		$this->assertIsObject( $data, 'POST data response should be an object.' );
		$this->assertEquals( 'POST', $data->method, 'POST data response should indicate POST method.' );
		$this->assertEquals( 'test-request', $data->datapoint, 'POST data response should echo datapoint name.' );
	}
}
