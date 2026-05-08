<?php
/**
 * REST_Email_Reporting_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\User
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Email_Reporting\Email_Log;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Scheduler;
use Google\Site_Kit\Core\Email_Reporting\Frequency_Planner;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use Google\Site_Kit\Core\User\REST_Email_Reporting_Controller;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;

class REST_Email_Reporting_ControllerTest extends TestCase {

	use Fake_Site_Connection_Trait;
	use RestTestTrait;

	/**
	 * Email_Reporting_Settings instance.
	 *
	 * @var Email_Reporting_Settings
	 */
	private $settings;

	/**
	 * REST_Email_Reporting_Controller instance.
	 *
	 * @var REST_Email_Reporting_Controller
	 */
	private $controller;

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Created post IDs.
	 *
	 * @var array
	 */
	private $created_post_ids = array();

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$this->context     = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options           = new Options( $this->context );
		$user_options      = new User_Options( $this->context );
		$this->settings    = new Email_Reporting_Settings( $user_options );
		$frequency_planner = new Frequency_Planner();
		$scheduler         = new Email_Reporting_Scheduler( $frequency_planner );
		$this->controller  = new REST_Email_Reporting_Controller(
			$this->settings,
			$scheduler
		);
		$this->grant_view_dashboard_permission( $options, $user_options );

		$this->register_email_log_dependencies();
	}

	public function tear_down() {
		foreach ( $this->created_post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}

		if ( post_type_exists( Email_Log::POST_TYPE ) && function_exists( 'unregister_post_type' ) ) {
			unregister_post_type( Email_Log::POST_TYPE );
		}

		foreach ( array( Email_Log::STATUS_SENT, Email_Log::STATUS_FAILED, Email_Log::STATUS_SCHEDULED ) as $status ) {
			if ( isset( $GLOBALS['wp_post_statuses'][ $status ] ) ) {
				unset( $GLOBALS['wp_post_statuses'][ $status ] );
			}
		}

		foreach (
			array(
				Email_Log::META_REPORT_FREQUENCY,
				Email_Log::META_BATCH_ID,
				Email_Log::META_SEND_ATTEMPTS,
				Email_Log::META_ERROR_DETAILS,
				Email_Log::META_REPORT_REFERENCE_DATES,
				Email_Log::META_SITE_ID,
				Email_Log::META_TEMPLATE_TYPE,
			) as $meta_key
		) {
			if ( function_exists( 'unregister_meta_key' ) ) {
				unregister_meta_key( 'post', Email_Log::POST_TYPE, $meta_key );
			}
		}

		parent::tear_down();
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
			'/' . REST_Routes::REST_ROOT . '/core/user/data/email-reporting-settings',
		);
		$get_routes = array_intersect( $routes, array_keys( $server->get_routes() ) );

		$this->assertEqualSets( $routes, $get_routes, 'Expected route for user email reporting settings to be registered' );
	}

	public function test_set_settings_subscribe_schedules_subscription_confirmation_batch() {
		$this->controller->register();
		$this->register_rest_routes();

		$request = new \WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/email-reporting-settings' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => array(
						'subscribed' => true,
						'frequency'  => Email_Reporting_Settings::FREQUENCY_MONTHLY,
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 200, $response->get_status(), 'Subscribing should return success response.' );
		$this->assertTrue( (bool) $response->get_data()['subscribed'], 'Response should return subscribed state as true.' );
		$this->assertSame( Email_Reporting_Settings::FREQUENCY_MONTHLY, $response->get_data()['frequency'], 'Response should return updated frequency.' );

		$logs = get_posts(
			array(
				'post_type'   => Email_Log::POST_TYPE,
				'post_status' => Email_Log::STATUS_SCHEDULED,
				'numberposts' => -1,
			)
		);

		$this->assertCount( 1, $logs, 'Subscribing should create one scheduled confirmation email log.' );
		$log                      = $logs[0];
		$this->created_post_ids[] = $log->ID;

		$this->assertSame( get_current_user_id(), (int) $log->post_author, 'Confirmation log should be created for the current user.' );
		$this->assertSame( Email_Reporting_Settings::FREQUENCY_MONTHLY, get_post_meta( $log->ID, Email_Log::META_REPORT_FREQUENCY, true ), 'Confirmation log should store the selected frequency.' );
		$this->assertSame( Email_Log::TEMPLATE_TYPE_SUBSCRIBE_SUCCESS, get_post_meta( $log->ID, Email_Log::META_TEMPLATE_TYPE, true ), 'Confirmation log should use subscribe-success template type.' );
		$this->assertSame( 0, (int) get_post_meta( $log->ID, Email_Log::META_SEND_ATTEMPTS, true ), 'Confirmation log should start with zero attempts.' );

		$batch_id           = get_post_meta( $log->ID, Email_Log::META_BATCH_ID, true );
		$worker_timestamp   = $this->get_scheduled_timestamp_for_batch(
			Email_Reporting_Scheduler::ACTION_WORKER,
			$batch_id,
			Email_Reporting_Settings::FREQUENCY_MONTHLY
		);
		$fallback_timestamp = $this->get_scheduled_timestamp_for_batch(
			Email_Reporting_Scheduler::ACTION_FALLBACK,
			$batch_id,
			Email_Reporting_Settings::FREQUENCY_MONTHLY
		);

		$this->assertNotEmpty( $batch_id, 'Confirmation log should include a batch ID.' );
		$this->assertNotFalse( $worker_timestamp, 'Worker event should be scheduled for the confirmation batch.' );
		$this->assertNotFalse( $fallback_timestamp, 'Fallback event should be scheduled for the confirmation batch.' );
		$this->assertSame( $worker_timestamp, $fallback_timestamp, 'Worker and fallback should use the same immediate timestamp.' );
	}

	/**
	 * Finds scheduled cron timestamp for a batch/hook pair.
	 *
	 * @param string $hook      Cron hook name.
	 * @param string $batch_id  Batch ID.
	 * @param string $frequency Frequency slug.
	 * @return int|false
	 */
	private function get_scheduled_timestamp_for_batch( $hook, $batch_id, $frequency ) {
		$cron_array = _get_cron_array();

		if ( empty( $cron_array ) ) {
			return false;
		}

		foreach ( $cron_array as $timestamp => $hooks ) {
			if ( empty( $hooks[ $hook ] ) || ! is_array( $hooks[ $hook ] ) ) {
				continue;
			}

			foreach ( $hooks[ $hook ] as $event ) {
				$args = isset( $event['args'] ) ? $event['args'] : array();
				if ( ! is_array( $args ) || count( $args ) < 3 ) {
					continue;
				}

				if ( $batch_id === $args[0] && $frequency === $args[1] ) {
					return (int) $timestamp;
				}
			}
		}

		return false;
	}

	private function register_email_log_dependencies() {
		if ( post_type_exists( Email_Log::POST_TYPE ) ) {
			return;
		}

		$email_log = new Email_Log( $this->context );
		$email_log->register();
		do_action( 'init' );
	}

	/**
	 * Grants current user dashboard access requirements in tests.
	 *
	 * @param Options      $options      Options instance.
	 * @param User_Options $user_options User_Options instance.
	 */
	private function grant_view_dashboard_permission( Options $options, User_Options $user_options ) {
		$this->fake_proxy_site_connection();
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		$authentication = new Authentication( $this->context, $options, $user_options );
		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_token(
			array(
				'access_token' => 'valid-auth-token',
			)
		);
	}
}
