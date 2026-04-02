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
use Google\Site_Kit\Core\Email\Email;
use Google\Site_Kit\Core\Email_Reporting\Cron_Health_Check;
use Google\Site_Kit\Core\Email_Reporting\Email_Log_Batch_Query;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Golink_Handler;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Settings;
use Google\Site_Kit\Core\Email_Reporting\Eligible_Subscribers_Query;
use Google\Site_Kit\Core\Email_Reporting\REST_Email_Reporting_Controller;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Golinks\Golinks;
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

		$golinks = new Golinks( $this->context );
		$golinks->register_handler( 'manage-subscription-email-reporting', new Email_Reporting_Golink_Handler() );
		$health_check = $this->createMock( Cron_Health_Check::class );

		$this->controller              = new REST_Email_Reporting_Controller(
			$this->settings,
			$this->modules,
			$this->user_settings,
			new Eligible_Subscribers_Query( $this->modules, $this->user_options ),
			new Email(),
			$golinks,
			$health_check
		);
		$this->original_sharing_option = get_option( Module_Sharing_Settings::OPTION );
	}

	public function tear_down() {
		foreach ( $this->created_user_ids as $user_id ) {
			( new User_Options( $this->context, $user_id ) )->delete( OAuth_Client::OPTION_ACCESS_TOKEN );
			$user = get_user_by( 'id', $user_id );
			if ( $user ) {
				$user->remove_cap( Permissions::MANAGE_OPTIONS );
			}
			delete_transient( REST_Email_Reporting_Controller::INVITE_RATE_LIMIT_TRANSIENT_KEY_PREFIX . $user_id );
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
			'/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-errors',
			'/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-invite-user',
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

	public function test_get_eligible_subscribers_default_response_is_paginated() {
		$current_admin = $this->create_admin_with_token( 'admin-current' );
		$user_ids      = array();

		for ( $i = 1; $i <= 25; $i++ ) {
			$user_ids[] = $this->create_admin_with_token( sprintf( 'admin-%02d', $i ) );
		}

		$this->unset_user_access_token( $this->primary_admin_id );
		wp_set_current_user( $current_admin );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new \WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-eligible-subscribers' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status(), 'Eligible subscribers request should succeed for admins.' );
		$this->assertArrayHasKey( 'users', $data, 'Eligible subscribers response should include a users field.' );
		$this->assertArrayHasKey( 'total', $data, 'Eligible subscribers response should include a total field.' );
		$this->assertArrayHasKey( 'totalPages', $data, 'Eligible subscribers response should include a totalPages field.' );
		$this->assertSame( 25, $data['total'], 'Total should include all matching eligible users.' );
		$this->assertSame( 2, $data['totalPages'], 'Total pages should be calculated from total and per-page values.' );
		$this->assertCount( Eligible_Subscribers_Query::PER_PAGE, $data['users'], 'Default response should be limited to the first page size.' );
		$this->assertSame( array_slice( $user_ids, 0, Eligible_Subscribers_Query::PER_PAGE ), wp_list_pluck( $data['users'], 'id' ), 'Default response should return first-page user IDs.' );
	}

	public function test_get_eligible_subscribers_respects_page_param() {
		$current_admin = $this->create_admin_with_token( 'admin-current' );
		$user_ids      = array();

		for ( $i = 1; $i <= 25; $i++ ) {
			$user_ids[] = $this->create_admin_with_token( sprintf( 'admin-%02d', $i ) );
		}

		$this->unset_user_access_token( $this->primary_admin_id );
		wp_set_current_user( $current_admin );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new \WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-eligible-subscribers' );
		$request->set_param( 'page', 2 );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertCount( 5, $data['users'], 'Second page should include only remaining users.' );
		$this->assertSame( array_slice( $user_ids, Eligible_Subscribers_Query::PER_PAGE ), wp_list_pluck( $data['users'], 'id' ), 'Second page should include expected user IDs.' );
		$this->assertSame( 25, $data['total'], 'Total should remain unchanged across pages.' );
		$this->assertSame( 2, $data['totalPages'], 'Total pages should remain unchanged across pages.' );
	}

	public function test_get_eligible_subscribers_search_filters_results() {
		$current_admin = $this->create_admin_with_token( 'admin-current' );
		$alpha_user    = $this->create_admin_with_token( 'alpha-user', 'Alpha Name', 'alpha@example.com' );
		$mail_user     = $this->create_admin_with_token( 'mail-user', 'No Match Name', 'alpha-mail@example.com' );

		$this->create_admin_with_token( 'beta-user', 'Beta Name', 'beta@example.com' );

		$this->unset_user_access_token( $this->primary_admin_id );
		wp_set_current_user( $current_admin );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new \WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-eligible-subscribers' );
		$request->set_param( 'search', 'alpha' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 2, $data['total'], 'Search should return only matching users in total.' );
		$this->assertSame( 1, $data['totalPages'], 'Search results should report expected total pages.' );
		$this->assertEqualSets( array( $alpha_user, $mail_user ), wp_list_pluck( $data['users'], 'id' ), 'Search should match display names and emails.' );
	}

	public function test_get_eligible_subscribers_search_filters_by_shared_role_slug() {
		$current_admin = $this->create_admin_with_token( 'admin-current' );
		$editor_user   = self::factory()->user->create(
			array(
				'role'         => 'editor',
				'user_login'   => 'shared-role-user',
				'display_name' => 'Shared Role User',
				'user_email'   => 'shared-role-user@example.com',
			)
		);

		$this->modules->get_module_sharing_settings()->set(
			array(
				'analytics-4' => array(
					'sharedRoles' => array( 'editor' ),
				),
			)
		);

		$this->unset_user_access_token( $this->primary_admin_id );
		wp_set_current_user( $current_admin );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new \WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-eligible-subscribers' );
		$request->set_param( 'search', 'editor' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 1, $data['total'], 'Role slug search should return matching shared-role users in total.' );
		$this->assertSame( 1, $data['totalPages'], 'Role slug search should report expected total pages.' );
		$this->assertSame( array( $editor_user ), wp_list_pluck( $data['users'], 'id' ), 'Role slug search should return matching shared-role users.' );
	}

	public function test_get_eligible_subscribers_search_filters_by_administrator_role_slug() {
		$current_admin = $this->create_admin_with_token( 'admin-current' );
		$admin_user    = $this->create_admin_with_token( 'manager-user', 'Manager User', 'manager-user@example.com' );

		$this->unset_user_access_token( $this->primary_admin_id );
		wp_set_current_user( $current_admin );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new \WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-eligible-subscribers' );
		$request->set_param( 'search', 'administrator' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 1, $data['total'], 'Administrator role slug search should return matching admins in total.' );
		$this->assertSame( 1, $data['totalPages'], 'Administrator role slug search should report expected total pages.' );
		$this->assertSame( array( $admin_user ), wp_list_pluck( $data['users'], 'id' ), 'Administrator role slug search should return matching admins.' );
	}

	public function test_get_eligible_subscribers_response_has_expected_shape() {
		$current_admin = $this->create_admin_with_token( 'admin-current' );
		$this->create_admin_with_token( 'admin-other' );

		$this->unset_user_access_token( $this->primary_admin_id );
		wp_set_current_user( $current_admin );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		// Without rate limit transient, invited should be false.
		$request  = new \WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-eligible-subscribers' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'users', $data, 'Response should include users key.' );
		$this->assertArrayHasKey( 'total', $data, 'Response should include total key.' );
		$this->assertArrayHasKey( 'totalPages', $data, 'Response should include totalPages key.' );
		$this->assertIsArray( $data['users'], 'Users field should be an array.' );
		$this->assertIsInt( $data['total'], 'Total field should be an integer.' );
		$this->assertIsInt( $data['totalPages'], 'TotalPages field should be an integer.' );
	}

	public function test_get_eligible_subscribers_non_matching_search_returns_empty_result() {
		$current_admin = $this->create_admin_with_token( 'admin-current' );
		$this->create_admin_with_token( 'admin-other' );
		$this->unset_user_access_token( $this->primary_admin_id );
		wp_set_current_user( $current_admin );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new \WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-eligible-subscribers' );
		$request->set_param( 'search', 'this-will-not-match' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( array(), $data['users'], 'Non-matching search should return no users.' );
		$this->assertSame( 0, $data['total'], 'Non-matching search should return total of zero.' );
		$this->assertSame( 0, $data['totalPages'], 'Non-matching search should return zero total pages.' );
	}

	public function test_get_email_reporting_errors_runs_health_check_before_reading_latest_batch_error() {
		remove_all_filters( 'googlesitekit_rest_routes' );

		$call_order = array();

		$health_check = $this->createMock( Cron_Health_Check::class );
		$health_check->expects( $this->once() )
			->method( 'check_stale_tasks' )
			->willReturnCallback(
				function () use ( &$call_order ) {
					$call_order[] = 'health_check';
				}
			);

		$controller = new REST_Email_Reporting_Controller(
			$this->settings,
			$this->modules,
			$this->user_settings,
			new Eligible_Subscribers_Query( $this->modules, $this->user_options ),
			new Email(),
			new Golinks( $this->context ),
			$health_check
		);

		$batch_query = $this->createMock( Email_Log_Batch_Query::class );
		$batch_query->expects( $this->once() )
			->method( 'get_latest_batch_error' )
			->willReturnCallback(
				function () use ( &$call_order ) {
					$call_order[] = 'latest_batch_error';
					return '{"errors":{"cron_scheduler_error":["Cron issue"]},"error_data":{"cron_scheduler_error":{"category_id":"cron_scheduler_error"}}}';
				}
			);

		$reflection = new \ReflectionProperty( REST_Email_Reporting_Controller::class, 'email_log_batch_query' );
		$reflection->setAccessible( true );
		$reflection->setValue( $controller, $batch_query );

		$controller->register();
		$this->register_rest_routes();

		$request  = new \WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-errors' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'Email reporting errors endpoint should return 200.' );
		$this->assertSame(
			array( 'health_check', 'latest_batch_error' ),
			$call_order,
			'Cron health check should run before reading latest batch error.'
		);
	}

	public function test_get_eligible_subscribers_includes_invited_field() {
		$current_admin = $this->create_admin_with_token( 'admin-current' );
		$other_admin   = $this->create_admin_with_token( 'admin-other' );

		$this->unset_user_access_token( $this->primary_admin_id );
		wp_set_current_user( $current_admin );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request  = new \WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-eligible-subscribers' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$other_admin_data = current(
			array_filter(
				$data['users'],
				function ( $user ) use ( $other_admin ) {
					return (int) $user['id'] === $other_admin;
				}
			)
		);

		$this->assertFalse( $other_admin_data['invited'], 'User without rate limit transient should have invited=false.' );

		// Set the rate limit transient for the other admin.
		set_transient( REST_Email_Reporting_Controller::INVITE_RATE_LIMIT_TRANSIENT_KEY_PREFIX . $other_admin, time(), HOUR_IN_SECONDS );

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$other_admin_data = current(
			array_filter(
				$data['users'],
				function ( $user ) use ( $other_admin ) {
					return (int) $user['id'] === $other_admin;
				}
			)
		);

		$this->assertTrue( $other_admin_data['invited'], 'User with rate limit transient should have invited=true.' );
	}

	public function test_invite_user__permission_denied_for_non_admin() {
		$non_admin = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $non_admin );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new \WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-invite-user' );
		$request->set_body_params(
			array(
				'data' => array(
					'userID' => $this->primary_admin_id,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 403, $response->get_status(), 'Non-admin should receive 403 when inviting a user.' );
	}

	public function test_invite_user__succeeds_for_eligible_user() {
		// The pre_wp_mail filter was introduced in WordPress 5.7.
		if ( version_compare( $GLOBALS['wp_version'], '5.7', '<' ) ) {
			$this->markTestSkipped( 'This test requires WordPress 5.7 or higher for the pre_wp_mail filter.' );
		}

		$invitee_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_user_access_token( $invitee_id );
		wp_set_current_user( $this->primary_admin_id );

		$captured_atts        = null;
		$pre_wp_mail_callback = function ( $short_circuit, $atts ) use ( &$captured_atts ) {
			$captured_atts = $atts;
			return true;
		};
		add_filter( 'pre_wp_mail', $pre_wp_mail_callback, 10, 2 );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new \WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-invite-user' );
		$request->set_body_params(
			array(
				'data' => array(
					'userID' => $invitee_id,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );

		remove_filter( 'pre_wp_mail', $pre_wp_mail_callback, 10 );

		$this->assertEquals( 200, $response->get_status(), 'Eligible invitee should return 200.' );
		$this->assertTrue( $response->get_data()['success'], 'Eligible invitee should return success true.' );
		$this->assertNotNull( $captured_atts, 'Invitation should call wp_mail.' );
		$this->assertEquals( get_userdata( $invitee_id )->user_email, $captured_atts['to'], 'Invitation email should be sent to the invited user.' );
		$this->assertStringContainsString( 'invited you to receive periodic performance reports', $captured_atts['message'], 'Invitation email body should contain invitation copy.' );
	}

	public function test_invite_user__returns_error_for_ineligible_user() {
		$ineligible_user_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $this->primary_admin_id );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new \WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-invite-user' );
		$request->set_body_params(
			array(
				'data' => array(
					'userID' => $ineligible_user_id,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 400, $response->get_status(), 'Ineligible user should return 400.' );
		$this->assertEquals( 'email_reporting_ineligible_user', $response->get_data()['code'], 'Ineligible user should return expected error code.' );
	}

	public function test_invite_user__returns_error_for_invalid_user_id() {
		wp_set_current_user( $this->primary_admin_id );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new \WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-invite-user' );
		$request->set_body_params(
			array(
				'data' => array(
					'userID' => 999999,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 400, $response->get_status(), 'Invalid user ID should return 400.' );
		$this->assertEquals( 'email_reporting_invalid_user_id', $response->get_data()['code'], 'Invalid user ID should return expected error code.' );
	}

	public function test_invite_user__returns_error_for_already_subscribed_user() {
		$invitee_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_user_access_token( $invitee_id );
		$user_settings = new User_Email_Reporting_Settings( new User_Options( $this->context, $invitee_id ) );
		$user_settings->merge( array( 'subscribed' => true ) );

		wp_set_current_user( $this->primary_admin_id );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new \WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-invite-user' );
		$request->set_body_params(
			array(
				'data' => array(
					'userID' => $invitee_id,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 400, $response->get_status(), 'Already subscribed user should return 400.' );
		$this->assertEquals( 'email_reporting_user_already_subscribed', $response->get_data()['code'], 'Already subscribed user should return expected error code.' );
	}

	public function test_invite_user__rate_limit_is_enforced() {
		$invitee_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_user_access_token( $invitee_id );
		set_transient( REST_Email_Reporting_Controller::INVITE_RATE_LIMIT_TRANSIENT_KEY_PREFIX . $invitee_id, time(), DAY_IN_SECONDS );

		wp_set_current_user( $this->primary_admin_id );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new \WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-invite-user' );
		$request->set_body_params(
			array(
				'data' => array(
					'userID' => $invitee_id,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 429, $response->get_status(), 'Rate-limited invite should return 429.' );
		$this->assertEquals( 'email_reporting_invite_rate_limited', $response->get_data()['code'], 'Rate-limited invite should return expected error code.' );
	}

	public function provider_wrong_data() {
		return array(
			'wrong data type'     => array( '{}' ),
			'invalid property'    => array( array( 'some-invalid-property' => 'value' ) ),
			'non-boolean enabled' => array( array( 'enabled' => 123 ) ),
		);
	}

	private function create_admin_with_token( $login = null, $display_name = null, $email = null ) {
		$user_id = $this->factory()->user->create(
			array_filter(
				array(
					'role'         => 'administrator',
					'user_login'   => $login,
					'display_name' => $display_name,
					'user_email'   => $email,
				)
			)
		);

		$this->set_user_access_token( $user_id );

		return $user_id;
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
