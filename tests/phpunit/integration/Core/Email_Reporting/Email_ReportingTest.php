<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Email_ReportingTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Scheduler;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Settings;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Data_Requests;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
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
	}

	public function tear_down() {
		$this->clear_scheduled_events();
		delete_option( Email_Reporting_Settings::OPTION );
		delete_option( Credentials::OPTION );
		remove_filter( 'googlesitekit_setup_complete', '__return_true' );
		remove_filter( 'googlesitekit_oauth_secret', array( $this, 'filter_oauth_secret' ) );

		if ( is_callable( $this->reset_feature_flag ) ) {
			call_user_func( $this->reset_feature_flag );
		}

		parent::tear_down();
	}

	public function test_register_schedules_initiators_when_enabled() {
		$email_reporting = $this->create_email_reporting();
		$email_reporting->register();

		foreach ( array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY, User_Email_Reporting_Settings::FREQUENCY_MONTHLY, User_Email_Reporting_Settings::FREQUENCY_QUARTERLY ) as $frequency ) {
			$this->assertNotFalse(
				wp_next_scheduled( Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency ) ),
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
				wp_next_scheduled( Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency ) ),
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

		wp_schedule_single_event( time() + 50, Email_Reporting_Scheduler::ACTION_INITIATOR, array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY ) );
		$worker_timestamp = time();
		wp_schedule_single_event( time() + 50, Email_Reporting_Scheduler::ACTION_WORKER, array( 'batch', User_Email_Reporting_Settings::FREQUENCY_WEEKLY, $worker_timestamp ) );
		wp_schedule_single_event( time() + 50, Email_Reporting_Scheduler::ACTION_FALLBACK, array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY ) );
		wp_schedule_event( time() + 50, 'daily', Email_Reporting_Scheduler::ACTION_MONITOR );
		wp_schedule_event( time(), 'daily', Email_Reporting_Scheduler::ACTION_CLEANUP );

		$email_reporting = $this->create_email_reporting();
		$email_reporting->register();

		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_INITIATOR, array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY ) ), 'Initiator event should be cleared when reporting is disabled.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_WORKER, array( 'batch', User_Email_Reporting_Settings::FREQUENCY_WEEKLY, $worker_timestamp ) ), 'Worker event should be cleared when reporting is disabled.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_FALLBACK, array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY ) ), 'Fallback event should be cleared when reporting is disabled.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_MONITOR ), 'Monitor event should be cleared when reporting is disabled.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_CLEANUP ), 'Cleanup event should be cleared when reporting is disabled.' );
	}

	public function test_register_unschedules_when_setup_incomplete() {
		remove_filter( 'googlesitekit_oauth_secret', array( $this, 'filter_oauth_secret' ) );
		remove_filter( 'googlesitekit_setup_complete', '__return_true' );
		delete_option( Credentials::OPTION );

		wp_schedule_single_event( time() + 50, Email_Reporting_Scheduler::ACTION_INITIATOR, array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY ) );
		wp_schedule_event( time() + 50, 'daily', Email_Reporting_Scheduler::ACTION_MONITOR );
		wp_schedule_event( time() + 50, 'daily', Email_Reporting_Scheduler::ACTION_CLEANUP );

		$email_reporting = $this->create_email_reporting();
		$email_reporting->register();

		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_INITIATOR, array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY ) ), 'Initiator should be unscheduled when setup is incomplete.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_INITIATOR, array( User_Email_Reporting_Settings::FREQUENCY_MONTHLY ) ), 'Monthly initiator should not be scheduled when setup is incomplete.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_INITIATOR, array( User_Email_Reporting_Settings::FREQUENCY_QUARTERLY ) ), 'Quarterly initiator should not be scheduled when setup is incomplete.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_MONITOR ), 'Monitor should not be scheduled when setup is incomplete.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_CLEANUP ), 'Cleanup should not be scheduled when setup is incomplete.' );
	}

	public function test_feature_flag_disabled_unschedules_events() {
		$worker_timestamp = time();

		wp_schedule_single_event( time() + 50, Email_Reporting_Scheduler::ACTION_INITIATOR, array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY ) );
		wp_schedule_single_event( time() + 50, Email_Reporting_Scheduler::ACTION_WORKER, array( 'batch', User_Email_Reporting_Settings::FREQUENCY_WEEKLY, $worker_timestamp ) );
		wp_schedule_single_event( time() + 50, Email_Reporting_Scheduler::ACTION_FALLBACK, array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY ) );
		wp_schedule_event( time() + 50, 'daily', Email_Reporting_Scheduler::ACTION_MONITOR );
		wp_schedule_event( time() + 50, 'daily', Email_Reporting_Scheduler::ACTION_CLEANUP );

		if ( is_callable( $this->reset_feature_flag ) ) {
			call_user_func( $this->reset_feature_flag );
		}

		remove_all_actions( 'init' );
		remove_all_actions( 'googlesitekit_init' );
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'login_head' );

		$plugin = new Plugin( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$plugin->register();
		do_action( 'init' );

		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_INITIATOR, array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY ) ), 'Initiator should be unscheduled when the feature flag is disabled.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_INITIATOR, array( User_Email_Reporting_Settings::FREQUENCY_MONTHLY ) ), 'Monthly initiator should not be scheduled when the feature flag is disabled.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_INITIATOR, array( User_Email_Reporting_Settings::FREQUENCY_QUARTERLY ) ), 'Quarterly initiator should not be scheduled when the feature flag is disabled.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_WORKER, array( 'batch', User_Email_Reporting_Settings::FREQUENCY_WEEKLY, $worker_timestamp ) ), 'Worker should be unscheduled when the feature flag is disabled.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_FALLBACK, array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY ) ), 'Fallback should be unscheduled when the feature flag is disabled.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_MONITOR ), 'Monitor should be unscheduled when the feature flag is disabled.' );
		$this->assertFalse( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_CLEANUP ), 'Cleanup should be unscheduled when the feature flag is disabled.' );
	}

	private function create_email_reporting() {
		$conversion_tracking = new Conversion_Tracking( $this->context, $this->options );
		$data_requests       = new Email_Reporting_Data_Requests(
			$this->context,
			$this->modules,
			$conversion_tracking,
			new Transients( $this->context ),
			$this->user_options
		);

		return new Email_Reporting(
			$this->context,
			$this->modules,
			$data_requests,
			$this->authentication,
			$this->options,
			$this->user_options
		);
	}

	private function clear_scheduled_events() {
		foreach ( array( Email_Reporting_Scheduler::ACTION_INITIATOR, Email_Reporting_Scheduler::ACTION_WORKER, Email_Reporting_Scheduler::ACTION_FALLBACK, Email_Reporting_Scheduler::ACTION_MONITOR, Email_Reporting_Scheduler::ACTION_CLEANUP ) as $hook ) {
			wp_unschedule_hook( $hook );
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
