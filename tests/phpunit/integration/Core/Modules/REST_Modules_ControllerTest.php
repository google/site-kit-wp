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
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\FakeHttpClient;
use WP_REST_Request;

class REST_Modules_ControllerTest extends TestCase {

	public function set_up() {
		parent::set_up();

		$this->user         = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$this->context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options      = new Options( $this->context );
		$this->user_options = new User_Options( $this->context, $this->user->ID );
		$this->modules      = new Modules( $this->context, $this->options, $this->user_options );

		wp_set_current_user( $this->user->ID );

		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
		remove_all_filters( 'googlesitekit_rest_routes' );
	}

	private function setup_fake_module() {
		$fake_module = new FakeModule( $this->context );
		$fake_module->set_force_active( true );

		$this->force_set_property( $this->modules, 'modules', array( 'fake-module' => $fake_module ) );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_apifetch_preload_paths' );
		$this->modules->register();

		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ) );
		$this->assertTrue( has_filter( 'googlesitekit_features_request_data' ) );
		$this->assertContains(
			'/' . REST_Routes::REST_ROOT . '/core/modules/data/list',
			apply_filters( 'googlesitekit_apifetch_preload_paths', array() )
		);
	}

	public function test_list_rest_endpoint__get_method() {
		$this->modules->register();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/list' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertNotEmpty( $response->get_data() );
	}

	public function test_list_rest_endpoint__no_post_method() {
		$this->modules->register();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/list' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 404, $response->get_status() );
	}

	public function test_list_rest_endpoint__shape() {
		$this->modules->register();

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

		foreach ( $response->get_data() as $data ) {
			foreach ( $module_data_keys as $module_data_key ) {
				$this->assertArrayHasKey( $module_data_key, $data );
			}
		}
	}

	public function test_activation_rest_endpoint__no_get_method() {
		$this->modules->register();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/activation' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 404, $response->get_status() );
	}

	public function test_activation_rest_endpoint__requires_module_slug() {
		$this->modules->register();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/activation' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'rest_missing_callback_param', $response->get_data()['code'] );
		$this->assertEquals( 400, $response->get_status() );
	}

	public function test_activation_rest_endpoint__requires_valid_module_slug() {
		$this->modules->register();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/activation' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'fake-module',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['code'] );
		$this->assertEquals( 500, $response->get_status() );
	}

	public function test_activation_rest_endpoint__prevent_inactive_dependencies_activation() {
		$this->modules->register();
		$this->modules->deactivate_module( 'analytics' );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/activation' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug'   => 'optimize',
					'active' => true,
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'inactive_dependencies', $response->get_data()['code'] );
		$this->assertEquals( 500, $response->get_status() );
	}

	public function test_activation_rest_endpoint__activate_module() {
		$this->modules->register();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/activation' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug'   => 'analytics',
					'active' => true,
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertTrue( $response->get_data()['success'] );
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_activation_rest_endpoint__deactivate_module() {
		$this->modules->register();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/activation' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug'   => 'analytics',
					'active' => false,
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertTrue( $response->get_data()['success'] );
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_activation_rest_endpoint__deactivate_dependant_module() {
		$this->modules->register();
		$this->modules->activate_module( 'analytics' );
		$this->modules->activate_module( 'optimize' );

		$this->assertTrue( $this->modules->is_module_active( 'optimize' ) );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/activation' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug'   => 'analytics',
					'active' => false,
				),
			)
		);
		rest_get_server()->dispatch( $request );

		$this->assertNotTrue( $this->modules->is_module_active( 'optimize' ) );
	}

	public function test_info_rest_endpoint__no_post_method() {
		$this->modules->register();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/info' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 404, $response->get_status() );
	}

	public function test_info_rest_endpoint__require_module_slug() {
		$this->modules->register();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/info' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['code'] );
		$this->assertEquals( 500, $response->get_status() );
	}

	public function test_info_rest_endpoint__require_valid_module_slug() {
		$this->modules->register();

		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/info' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'fake-module',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['code'] );
		$this->assertEquals( 500, $response->get_status() );
	}

	public function test_info_rest_endpoint__valid_module_slug() {
		$this->modules->register();

		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/info' );
		$request->set_query_params( array( 'slug' => 'analytics' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertNotEmpty( $response->get_data() );
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_check_access_rest_endpoint__no_get_method() {
		$this->modules->register();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'rest_no_route', $response->get_data()['code'] );
	}

	public function test_check_access_rest_endpoint__requires_module_slug() {
		$this->modules->register();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['code'] );
		$this->assertEquals( 404, $response->get_status() );
	}

	public function test_check_access_rest_endpoint__requires_module_connected() {
		$this->modules->register();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'analytics',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'module_not_connected', $response->get_data()['code'] );
		$this->assertEquals( 400, $response->get_status() );
	}

	public function test_check_access_rest_endpoint__shareable_module_does_not_have_service_entity() {
		$this->modules->register();
		$this->enable_feature( 'dashboardSharing' );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'pagespeed-insights',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( true, $response->get_data()['access'] );
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_check_access_rest_endpoint__unshareable_module_does_not_have_service_entity() {
		$this->modules->register();

		$optimize = $this->modules->get_module( 'optimize' );
		$optimize->get_settings()->merge( array( 'optimizeID' => 'GTM-XXXXX' ) );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'optimize',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module', $response->get_data()['code'] );
		$this->assertEquals( 400, $response->get_status() );
	}

	public function test_check_access_rest_endpoint__success() {
		$this->modules->register();

		$analytics = $this->modules->get_module( 'analytics' );
		$analytics->get_client()->setHttpClient( new FakeHttpClient() );
		$analytics->get_settings()->merge(
			array(
				'accountID'             => '12345678',
				'profileID'             => '12345678',
				'propertyID'            => '987654321',
				'internalWebPropertyID' => '1234567890',
			)
		);

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/check-access' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'analytics',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertArrayIntersection(
			array(
				'access' => true,
			),
			$response->get_data()
		);
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_notifications_rest_endpoint__no_post_method() {
		$this->setup_fake_module();
		$this->modules->register();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/notifications' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 400, $response->get_status() );
	}

	public function test_notifications_rest_endpoint__require_valid_slug() {
		$this->modules->register();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/non-existent-module/data/notifications' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 404, $response->get_status() );
	}

	public function test_settings_rest_endpoint__get_method() {
		$this->setup_fake_module();
		$this->modules->register();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_settings_rest_endpoint__get_invalid_slug() {
		$this->modules->register();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/non-existent-module/data/settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 404, $response->get_status() );
	}

	public function test_settings_rest_endpoint__post_method() {
		$this->setup_fake_module();
		$this->modules->register();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_settings_rest_endpoint__post_invalid_slug() {
		$this->modules->register();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/non-existent-module/data/settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 404, $response->get_status() );
	}

	public function test_datapoint_rest_endpoint__get_method() {
		$this->setup_fake_module();
		$this->modules->register();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'test-request', $response->get_data()->datapoint );
	}

	public function test_datapoint_rest_endpoint__get_invalid_slug() {
		$this->modules->register();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/non-existent-module/data/test-request' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['code'] );
	}

	public function test_datapoint_rest_endpoint__get_invalid_datapoint() {
		$this->setup_fake_module();
		$this->modules->register();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/fake-datapoint' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_datapoint', $response->get_data()['code'] );
	}

	public function test_datapoint_rest_endpoint__post_method() {
		$this->setup_fake_module();
		$this->modules->register();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'test-request', $response->get_data()->datapoint );
	}

	public function test_datapoint_rest_endpoint__post_invalid_slug() {
		$this->modules->register();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/non-existent-module/data/accounts-properties-profiles' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['code'] );
	}

	public function test_datapoint_rest_endpoint__post_invalid_datapoint() {
		$this->setup_fake_module();
		$this->modules->register();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/fake-datapoint' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_datapoint', $response->get_data()['code'] );
	}

	public function test_recover_module_rest_endpoint__no_get_method() {
		$this->modules->register();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-module' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'rest_no_route', $response->get_data()['code'] );
	}

	public function test_recover_module_rest_endpoint__requires_module_slug() {
		$this->modules->register();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-module' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['code'] );
		$this->assertEquals( 404, $response->get_status() );
	}

	public function test_recover_module_rest_endpoint__invalid_module_slug() {
		$this->modules->register();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-module' );
		$response = rest_get_server()->dispatch( $request );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'non-existent-module',
				),
			)
		);

		$this->assertEquals( 'invalid_module_slug', $response->get_data()['code'] );
		$this->assertEquals( 404, $response->get_status() );
	}

	public function test_recover_module_rest_endpoint__requires_shareable_module() {
		$this->modules->register();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-module' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'search-console',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'module_not_shareable', $response->get_data()['code'] );
		$this->assertEquals( 404, $response->get_status() );
	}

	public function test_recover_module_rest_endpoint__requires_recoverable_module() {
		$this->modules->register();
		$this->enable_feature( 'dashboardSharing' );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-module' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'search-console',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'module_not_recoverable', $response->get_data()['code'] );
		$this->assertEquals( 403, $response->get_status() );
	}

	public function test_recover_module_rest_endpoint__requires_accessible_module() {
		$this->modules->register();
		$this->enable_feature( 'dashboardSharing' );

		// Make search-console a recoverable module
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

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-module' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'search-console',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 'module_not_accessible', $response->get_data()['code'] );
		$this->assertEquals( 403, $response->get_status() );
	}

	public function test_recover_module_rest_endpoint__success() {
		$this->modules->register();
		$this->enable_feature( 'dashboardSharing' );

		// Make search-console a recoverable module
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

		// Make search-console service requests accessible
		$search_console->get_client()->setHttpClient( new FakeHttpClient() );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/modules/data/recover-module' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'search-console',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$current_user = wp_get_current_user();
		$this->assertEquals(
			array(
				'ownerID' => $current_user->ID,
			),
			$response->get_data()
		);
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_data_rest_endpoint__requires_active_module() {
		$this->setup_fake_module();

		delete_option( Modules::OPTION_ACTIVE_MODULES );
		$this->assertFalse( $modules->is_module_active( 'fake-module' ) );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'module_not_active', $response->get_data()['code'] );
		$this->assertEquals( 'Module must be active to request data.', $response->get_data()['message'] );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$request->set_body_params(
			array(
				'data' => array(
					'foo' => 'bar',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'module_not_active', $response->get_data()['code'] );
		$this->assertEquals( 'Module must be active to request data.', $response->get_data()['message'] );
	}

	public function test_data_rest_endpoint__success() {
		$this->setup_fake_module();

		update_option( Modules::OPTION_ACTIVE_MODULES, array( 'fake-module' ) );
		$this->assertTrue( $modules->is_module_active( 'fake-module' ) );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertIsObject( $data );
		$this->assertEquals( 'GET', $data->method );
		$this->assertEquals( 'test-request', $data->datapoint );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/modules/fake-module/data/test-request' );
		$request->set_body_params(
			array(
				'data' => array(
					'foo' => 'bar',
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertIsObject( $data );
		$this->assertEquals( 'POST', $data->method );
		$this->assertEquals( 'test-request', $data->datapoint );
	}
}
