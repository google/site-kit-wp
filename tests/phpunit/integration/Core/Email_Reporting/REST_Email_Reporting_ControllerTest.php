<?php
/**
 * REST_Email_Reporting_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Settings;
use Google\Site_Kit\Core\Email_Reporting\REST_Email_Reporting_Controller;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;

class REST_Email_Reporting_ControllerTest extends TestCase {

	use RestTestTrait;

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Email_Reporting_Settings instance.
	 *
	 * @var Email_Reporting_Settings
	 */
	private $settings;

	/**
	 * Modules instance.
	 *
	 * @var Modules
	 */
	private $modules;

	/**
	 * User_Options instance.
	 *
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * User_Email_Reporting_Settings instance.
	 *
	 * @var User_Email_Reporting_Settings
	 */
	private $user_settings;

	/**
	 * Authentication instance.
	 *
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Permissions instance.
	 *
	 * @var Permissions
	 */
	private $permissions;

	/**
	 * REST_Email_Reporting_Controller instance.
	 *
	 * @var REST_Email_Reporting_Controller
	 */
	private $controller;

	private $created_user_ids = array();

	private $original_sharing_option;
	private $primary_admin_id;

	public function set_up() {
		parent::set_up();

		$this->context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options              = new Options( $this->context );
		$this->user_options   = new User_Options( $this->context );
		$this->settings       = new Email_Reporting_Settings( $options );
		$this->authentication = new Authentication( $this->context, $options, $this->user_options );
		$this->modules        = new Modules( $this->context, $options, $this->user_options, $this->authentication );
		$this->user_settings  = new User_Email_Reporting_Settings( $this->user_options );
		$this->authentication->credentials()->set(
			array(
				'oauth2_client_id'     => 'test-client-id',
				'oauth2_client_secret' => 'test-client-secret',
			)
		);
		add_filter( 'googlesitekit_setup_complete', '__return_true' );
		$this->permissions = new Permissions( $this->context, $this->authentication, $this->modules, $this->user_options, new Dismissed_Items( $this->user_options ) );
		$this->permissions->register();

		$this->primary_admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_user_access_token( $this->primary_admin_id );
		wp_set_current_user( $this->primary_admin_id );

		$this->controller              = new REST_Email_Reporting_Controller( $this->settings, $this->modules, $this->user_options, $this->user_settings );
		$this->original_sharing_option = get_option( Module_Sharing_Settings::OPTION );
	}

	public function tear_down() {
		foreach ( $this->created_user_ids as $user_id ) {
			( new User_Options( $this->context, $user_id ) )->delete( OAuth_Client::OPTION_ACCESS_TOKEN );
			$user = get_user_by( 'id', $user_id );
			if ( $user ) {
				$user->remove_cap( Permissions::MANAGE_OPTIONS );
			}
		}
		parent::tear_down();
		if ( false === $this->original_sharing_option ) {
			delete_option( Module_Sharing_Settings::OPTION );
		} else {
			update_option( Module_Sharing_Settings::OPTION, $this->original_sharing_option );
		}
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		remove_all_filters( 'googlesitekit_apifetch_preload_paths' );

		$this->controller->register();

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ), 'Expected REST routes filter to be registered' );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ), 'Expected API fetch preload paths filter to be registered' );
	}

	public function test_get_routes() {
		$this->controller->register();

		$server     = rest_get_server();
		$routes     = array(
			'/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting',
			'/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-eligible-subscribers',
			'/' . REST_Routes::REST_ROOT . '/core/site/data/was-analytics-4-connected',
		);
		$get_routes = array_intersect( $routes, array_keys( $server->get_routes() ) );

		$this->assertEqualSets( $routes, $get_routes, 'Expected route for site email reporting settings to be registered' );
	}

	public function test_get_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$original_settings = array(
			'enabled' => false,
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request  = new \WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEqualSetsWithIndex( $original_settings, $response->get_data(), 'GET should return the current site settings' );
	}

	public function test_set_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new \WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => array(
						'enabled' => false,
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 200, $response->get_status(), 'POST should update and return 200' );
		$this->assertEqualSetsWithIndex( array( 'enabled' => false ), $response->get_data(), 'POST should return updated settings' );
	}

	/**
	 * @dataProvider provider_wrong_data
	 */
	public function test_set_settings__wrong_data( $settings ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new \WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => $settings,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 400, $response->get_status(), 'Invalid payload should return 400' );
		$this->assertEquals( 'rest_invalid_param', $response->get_data()['code'], 'Invalid payload should return rest_invalid_param' );
	}

	public function test_get_eligible_subscribers_permission_denied_for_non_admin() {
		$non_admin = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $non_admin );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new \WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-eligible-subscribers' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 403, $response->get_status(), 'Non-admin should receive 403 when requesting eligible subscribers.' );
	}

	public function test_get_eligible_subscribers_excludes_current_user() {
		$current_admin = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$other_admin   = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		$this->set_user_access_token( $current_admin );
		$this->set_user_access_token( $other_admin );
		$this->unset_user_access_token( $this->primary_admin_id );

		wp_set_current_user( $current_admin );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new \WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-eligible-subscribers' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEqualSets( array( $other_admin ), wp_list_pluck( $response->get_data(), 'id' ), 'Current admin should be excluded from eligible subscribers.' );
	}

	public function test_get_eligible_subscribers_returns_admins_and_shared_roles() {
		$current_admin = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$other_admin   = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$editor        = $this->factory()->user->create( array( 'role' => 'editor' ) );

		$this->set_user_access_token( $current_admin );
		$this->set_user_access_token( $other_admin );
		$this->unset_user_access_token( $this->primary_admin_id );

		wp_set_current_user( $current_admin );

		$this->modules->get_module_sharing_settings()->set(
			array(
				'analytics-4' => array(
					'sharedRoles' => array( 'editor' ),
				),
			)
		);

		$editor_settings = new User_Email_Reporting_Settings( new User_Options( $this->context, $editor ) );
		$editor_settings->merge( array( 'subscribed' => true ) );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new \WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-eligible-subscribers' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEqualSets( array( $other_admin, $editor ), wp_list_pluck( $data, 'id' ) );

		$editor_response = current(
			array_filter(
				$data,
				function ( $user ) use ( $editor ) {
					return (int) $user['id'] === $editor;
				}
			)
		);

		$this->assertTrue( $editor_response['subscribed'], 'Editor should be marked as subscribed.' );
		$this->assertEquals( 'editor', $editor_response['role'], 'Editor role should be returned.' );
	}

	public function test_get_eligible_subscribers_returns_empty_array_when_no_eligible_users() {
		$current_admin = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_user_access_token( $current_admin );
		$this->unset_user_access_token( $this->primary_admin_id );

		wp_set_current_user( $current_admin );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new \WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-eligible-subscribers' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( array(), $response->get_data(), 'No eligible users should return an empty array.' );
	}

	public function provider_wrong_data() {
		return array(
			'wrong data type'     => array( '{}' ),
			'invalid property'    => array( array( 'some-invalid-property' => 'value' ) ),
			'non-boolean enabled' => array( array( 'enabled' => 123 ) ),
		);
	}

	private function set_user_access_token( $user_id ) {
		$this->created_user_ids[] = $user_id;
		$user_options             = new User_Options( $this->context, $user_id );
		$user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN, 'test-token' );
		$current_user = get_current_user_id();
		wp_set_current_user( $user_id );
		$this->user_options->switch_user( $user_id );
		$this->authentication->verification()->set( true );
		$this->authentication->get_oauth_client()->set_token( array( 'access_token' => 'test-token' ) );
		$this->authentication->get_oauth_client()->set_granted_scopes( array( 'test-scope' ) );
		$this->user_options->switch_user( $current_user );
		wp_set_current_user( $current_user );
		$user = get_user_by( 'id', $user_id );
		if ( $user ) {
			$user->add_cap( Permissions::MANAGE_OPTIONS );
		}
	}

	private function unset_user_access_token( $user_id ) {
		$user_options = new User_Options( $this->context, $user_id );
		$user_options->delete( OAuth_Client::OPTION_ACCESS_TOKEN );
		$user = get_user_by( 'id', $user_id );
		if ( $user ) {
			$user->remove_cap( Permissions::MANAGE_OPTIONS );
		}
	}
}
