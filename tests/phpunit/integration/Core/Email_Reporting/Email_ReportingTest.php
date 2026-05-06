<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Email_ReportingTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Email_Log;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Scheduler;
use Google\Site_Kit\Core\Email_Reporting\Frequency_Planner;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Settings;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Data_Requests;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Golinks\Dashboard_Golink_Handler;
use Google\Site_Kit\Core\Golinks\Golinks;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tracking\Provides_Feature_Metrics;
use Google\Site_Kit\Plugin;
use Google\Site_Kit\Tests\TestCase;

class Email_ReportingTest extends TestCase {

	private $context;
	private $options;
	private $user_options;
	private $authentication;
	private $modules;
	private $reset_feature_flag;

	public function set_up() {
		parent::set_up();

		$this->context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options        = new Options( $this->context );
		$this->user_options   = new User_Options( $this->context );
		$this->authentication = new Authentication( $this->context, $this->options, $this->user_options );
		$this->modules        = new Modules( $this->context, $this->options, $this->user_options, $this->authentication );

		$this->set_site_kit_credentials();
		$this->clear_scheduled_events();
		$this->reset_feature_flag = $this->enable_feature( 'proactiveUserEngagement' );

		delete_option( Email_Reporting_Settings::OPTION );

		( new Email_Reporting_Settings( $this->options ) )->register();
	}

	public function tear_down() {
		$this->clear_scheduled_events();
		$this->delete_email_logs();
		delete_option( Email_Reporting_Settings::OPTION );
		delete_option( Credentials::OPTION );
		remove_filter( 'googlesitekit_setup_complete', '__return_true' );
		remove_filter( 'googlesitekit_oauth_secret', array( $this, 'filter_oauth_secret' ) );

		if ( is_callable( $this->reset_feature_flag ) ) {
			call_user_func( $this->reset_feature_flag );
		}

		parent::tear_down();
	}

	public function test_it_implements_provides_feature_metrics_interface() {
		$email_reporting = $this->create_email_reporting();

		$this->assertInstanceOf( Provides_Feature_Metrics::class, $email_reporting, 'Email Reporting should implement Provides_Feature_Metrics.' );
	}

	public function test_get_feature_metrics__returns_expected_keys() {
		$email_reporting = $this->create_email_reporting();
		$metrics         = $email_reporting->get_feature_metrics();

		$expected_keys = array(
			'email_reporting_enabled',
			'email_reporting_total_sent',
			'email_reporting_total_failed',
			'email_reporting_last_batch_sent',
			'email_reporting_last_batch_failed',
			'email_reporting_subscribers',
		);

		foreach ( $expected_keys as $key ) {
			$this->assertArrayHasKey( $key, $metrics, sprintf( 'Expected feature metrics to include %s.', $key ) );
		}
	}

	public function test_get_feature_metrics__returns_integers() {
		$email_reporting = $this->create_email_reporting();
		$metrics         = $email_reporting->get_feature_metrics();

		foreach ( $metrics as $key => $value ) {
			if ( 'email_reporting_enabled' === $key ) {
				continue;
			}

			$this->assertIsInt( $value, sprintf( 'Metric %s should be an integer.', $key ) );
		}
	}

	public function test_get_feature_metrics__counts_completed_batch_correctly() {
		$this->register_email_log();
		$this->delete_email_logs();

		$batch_id = 'batch-complete';

		$this->create_email_log_with_batch( Email_Log::STATUS_SENT, $batch_id );
		$this->create_email_log_with_batch( Email_Log::STATUS_SENT, $batch_id );
		$this->create_email_log_with_batch( Email_Log::STATUS_FAILED, $batch_id );

		$email_reporting = $this->create_email_reporting();
		$metrics         = $email_reporting->get_feature_metrics();

		$this->assertSame( 2, $metrics['email_reporting_total_sent'], 'Expected total sent count to match created logs.' );
		$this->assertSame( 1, $metrics['email_reporting_total_failed'], 'Expected total failed count to match created logs.' );
		$this->assertSame( 2, $metrics['email_reporting_last_batch_sent'], 'Expected last batch sent count to match batch logs.' );
		$this->assertSame( 1, $metrics['email_reporting_last_batch_failed'], 'Expected last batch failed count to match batch logs.' );
	}

	public function test_get_feature_metrics__returns_zero_for_incomplete_batch() {
		$this->register_email_log();
		$this->delete_email_logs();

		$batch_id = 'batch-incomplete';

		$this->create_email_log_with_batch( Email_Log::STATUS_SENT, $batch_id );
		$this->create_email_log_with_batch( Email_Log::STATUS_SCHEDULED, $batch_id );

		$email_reporting = $this->create_email_reporting();
		$metrics         = $email_reporting->get_feature_metrics();

		$this->assertSame( 1, $metrics['email_reporting_total_sent'], 'Expected total sent count to match created logs.' );
		$this->assertSame( 0, $metrics['email_reporting_total_failed'], 'Expected total failed count to match created logs.' );
		$this->assertSame( 0, $metrics['email_reporting_last_batch_sent'], 'Expected last batch sent count to be zero for incomplete batch.' );
		$this->assertSame( 0, $metrics['email_reporting_last_batch_failed'], 'Expected last batch failed count to be zero for incomplete batch.' );
	}

	public function test_register__adds_email_reporting_feature_metrics() {
		$email_reporting = $this->create_email_reporting();
		$email_reporting->register();

		$metrics = apply_filters( 'googlesitekit_feature_metrics', array() );

		$this->assertArrayHasKey( 'email_reporting_enabled', $metrics, 'Feature metrics should include email reporting enabled.' );
		$this->assertArrayHasKey( 'email_reporting_total_sent', $metrics, 'Feature metrics should include email reporting total sent.' );
		$this->assertArrayHasKey( 'email_reporting_total_failed', $metrics, 'Feature metrics should include email reporting total failed.' );
		$this->assertArrayHasKey( 'email_reporting_last_batch_sent', $metrics, 'Feature metrics should include email reporting last batch sent.' );
		$this->assertArrayHasKey( 'email_reporting_last_batch_failed', $metrics, 'Feature metrics should include email reporting last batch failed.' );
		$this->assertArrayHasKey( 'email_reporting_subscribers', $metrics, 'Feature metrics should include email reporting subscribers.' );
	}

	public function test_register_schedules_initiators_when_enabled() {
		$email_reporting = $this->create_email_reporting();
		$email_reporting->register();

		foreach ( array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY, User_Email_Reporting_Settings::FREQUENCY_MONTHLY, User_Email_Reporting_Settings::FREQUENCY_QUARTERLY ) as $frequency ) {
			$this->assertNotFalse(
				$this->get_initiator_scheduled_timestamp( $frequency ),
				sprintf( 'Expected initiator to be scheduled for frequency %s.', $frequency )
			);
		}

		$this->assertNotFalse(
			wp_next_scheduled( Email_Reporting_Scheduler::ACTION_MONITOR ),
			'Expected monitor event to be scheduled daily.'
		);
		$this->assertNotFalse(
			wp_next_scheduled( Email_Reporting_Scheduler::ACTION_CLEANUP ),
			'Cleanup event should be scheduled when email reporting is enabled.'
		);
	}

	public function test_disabling_unschedules_all_events() {
		$email_reporting = $this->create_email_reporting();
		$email_reporting->register();

		$settings = new Email_Reporting_Settings( $this->options );
		$settings->set( array( 'enabled' => false ) );

		foreach ( array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY, User_Email_Reporting_Settings::FREQUENCY_MONTHLY, User_Email_Reporting_Settings::FREQUENCY_QUARTERLY ) as $frequency ) {
			$this->assertFalse(
				$this->get_initiator_scheduled_timestamp( $frequency ),
				sprintf( 'Initiator should be unscheduled for frequency %s when reporting disabled.', $frequency )
			);
		}

		$this->assertFalse(
			wp_next_scheduled( Email_Reporting_Scheduler::ACTION_MONITOR ),
			'Monitor event should be unscheduled when reporting is disabled.'
		);
		$this->assertFalse(
			wp_next_scheduled( Email_Reporting_Scheduler::ACTION_CLEANUP ),
			'Cleanup should be unscheduled when reporting is disabled.'
		);
	}

	public function test_register_clears_existing_events_when_disabled() {
		$settings = new Email_Reporting_Settings( $this->options );
		$settings->set( array( 'enabled' => false ) );

		$initiator_timestamp = time() + 50;
		wp_schedule_single_event( $initiator_timestamp, Email_Reporting_Scheduler::ACTION_INITIATOR, array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY, $initiator_timestamp ) );
		$worker_timestamp = time();
		wp_schedule_single_event( time() + 50, Email_Reporting_Scheduler::ACTION_WORKER, array( 'batch', User_Email_Reporting_Settings::FREQUENCY_WEEKLY, $worker_timestamp ) );
		$fallback_timestamp = time();
		wp_schedule_single_event( time() + 50, Email_Reporting_Scheduler::ACTION_FALLBACK, array( 'batch', User_Email_Reporting_Settings::FREQUENCY_WEEKLY, $fallback_timestamp ) );
		wp_schedule_event( time() + 50, 'daily', Email_Reporting_Scheduler::ACTION_MONITOR );
		wp_schedule_event( time(), 'daily', Email_Reporting_Scheduler::ACTION_CLEANUP );

		$email_reporting = $this->create_email_reporting();
		$email_reporting->register();

		$this->assertFalse( $this->get_initiator_scheduled_timestamp( User_Email_Reporting_Settings::FREQUENCY_WEEKLY ), 'Initiator event should be cleared when reporting is disabled.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_WORKER, array( 'batch', User_Email_Reporting_Settings::FREQUENCY_WEEKLY, $worker_timestamp ) ), 'Worker event should be cleared when reporting is disabled.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_FALLBACK, array( 'batch', User_Email_Reporting_Settings::FREQUENCY_WEEKLY, $fallback_timestamp ) ), 'Fallback event should be cleared when reporting is disabled.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_MONITOR ), 'Monitor event should be cleared when reporting is disabled.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_CLEANUP ), 'Cleanup event should be cleared when reporting is disabled.' );
	}

	public function test_register_unschedules_when_setup_incomplete() {
		remove_filter( 'googlesitekit_oauth_secret', array( $this, 'filter_oauth_secret' ) );
		remove_filter( 'googlesitekit_setup_complete', '__return_true' );
		delete_option( Credentials::OPTION );

		$initiator_timestamp = time() + 50;
		wp_schedule_single_event( $initiator_timestamp, Email_Reporting_Scheduler::ACTION_INITIATOR, array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY, $initiator_timestamp ) );
		wp_schedule_event( time() + 50, 'daily', Email_Reporting_Scheduler::ACTION_MONITOR );
		wp_schedule_event( time() + 50, 'daily', Email_Reporting_Scheduler::ACTION_CLEANUP );

		$email_reporting = $this->create_email_reporting();
		$email_reporting->register();

		$this->assertFalse( $this->get_initiator_scheduled_timestamp( User_Email_Reporting_Settings::FREQUENCY_WEEKLY ), 'Initiator should be unscheduled when setup is incomplete.' );
		$this->assertFalse( $this->get_initiator_scheduled_timestamp( User_Email_Reporting_Settings::FREQUENCY_MONTHLY ), 'Monthly initiator should not be scheduled when setup is incomplete.' );
		$this->assertFalse( $this->get_initiator_scheduled_timestamp( User_Email_Reporting_Settings::FREQUENCY_QUARTERLY ), 'Quarterly initiator should not be scheduled when setup is incomplete.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_MONITOR ), 'Monitor should not be scheduled when setup is incomplete.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_CLEANUP ), 'Cleanup should not be scheduled when setup is incomplete.' );
	}

	private function create_email_reporting() {
		$data_requests = new Email_Reporting_Data_Requests(
			$this->context,
			$this->modules,
			new Transients( $this->context ),
			$this->user_options
		);
		$golinks       = new Golinks( $this->context );
		$golinks->register_handler( 'dashboard', new Dashboard_Golink_Handler() );

		return new Email_Reporting(
			$this->context,
			$this->modules,
			$data_requests,
			$golinks,
			$this->authentication,
			$this->options,
			$this->user_options
		);
	}

	private function get_initiator_scheduled_timestamp( $frequency ) {
		$scheduler = new Email_Reporting_Scheduler( new Frequency_Planner() );
		return $scheduler->get_initiator_timestamp_for_frequency( $frequency );
	}

	private function clear_scheduled_events() {
		foreach ( array( Email_Reporting_Scheduler::ACTION_INITIATOR, Email_Reporting_Scheduler::ACTION_WORKER, Email_Reporting_Scheduler::ACTION_FALLBACK, Email_Reporting_Scheduler::ACTION_MONITOR, Email_Reporting_Scheduler::ACTION_CLEANUP ) as $hook ) {
			wp_unschedule_hook( $hook );
		}
	}

	private function register_email_log() {
		$email_log = new Email_Log( $this->context );

		$register_method = new \ReflectionMethod( Email_Log::class, 'register_email_log' );
		$register_method->setAccessible( true );
		$register_method->invoke( $email_log );
	}

	private function create_email_log_with_batch( $status, $batch_id ) {
		$post_id = $this->factory()->post->create(
			array(
				'post_type'   => Email_Log::POST_TYPE,
				'post_status' => $status,
			)
		);

		update_post_meta( $post_id, Email_Log::META_BATCH_ID, $batch_id );

		return $post_id;
	}

	private function delete_email_logs() {
		$post_ids = get_posts(
			array(
				'post_type'     => Email_Log::POST_TYPE,
				'post_status'   => array(
					Email_Log::STATUS_SENT,
					Email_Log::STATUS_FAILED,
					Email_Log::STATUS_SCHEDULED,
				),
				'numberposts'   => -1,
				'fields'        => 'ids',
				'no_found_rows' => true,
			)
		);

		foreach ( $post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}
	}

	private function set_site_kit_credentials() {
		$this->authentication->credentials()->set(
			array(
				'oauth2_client_id'     => 'test-client-id',
				'oauth2_client_secret' => 'test-client-secret',
			)
		);

		add_filter( 'googlesitekit_setup_complete', '__return_true' );
		add_filter( 'googlesitekit_oauth_secret', array( $this, 'filter_oauth_secret' ) );
	}

	public function filter_oauth_secret() {
		return wp_json_encode(
			array(
				'web' => array(
					'client_id'     => 'test-client-id',
					'client_secret' => 'test-client-secret',
				),
			)
		);
	}
}
