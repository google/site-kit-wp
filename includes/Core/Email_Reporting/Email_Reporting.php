<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Reporting
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;

/**
 * Base class for Email Reporting feature.
 *
 * @since 1.162.0
 * @access private
 * @ignore
 */
class Email_Reporting {

	/**
	 * Context instance.
	 *
	 * @since 1.162.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Options instance.
	 *
	 * @since 1.167.0
	 * @var Options
	 */
	protected $options;

	/**
	 * Modules instance.
	 *
	 * @since 1.167.0
	 * @var Modules
	 */
	protected $modules;

	/**
	 * Email_Reporting_Settings instance.
	 *
	 * @since 1.162.0
	 * @var Email_Reporting_Settings
	 */
	protected $settings;

	/**
	 * User_Options instance.
	 *
	 * @since 1.166.0
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * User_Email_Reporting_Settings instance.
	 *
	 * @since 1.166.0
	 * @var User_Email_Reporting_Settings
	 */
	protected $user_settings;

	/**
	 * REST_Email_Reporting_Controller instance.
	 *
	 * @since 1.162.0
	 * @var REST_Email_Reporting_Controller
	 */
	protected $rest_controller;

	/**
	 * Email_Log instance.
	 *
	 * @since 1.166.0
	 * @var Email_Log
	 */
	protected $email_log;

	/**
	 * Email_Log_Cleanup instance.
	 *
	 * @since 1.167.0
	 * @var Email_Log_Cleanup
	 */
	protected $email_log_cleanup;

	/**
	 * Scheduler instance.
	 *
	 * @since 1.167.0
	 * @var Email_Reporting_Scheduler
	 */
	protected $scheduler;

	/**
	 * Initiator task instance.
	 *
	 * @since 1.167.0
	 * @var Initiator_Task
	 */
	protected $initiator_task;

	/**
	 * Monitor task instance.
	 *
	 * @since 1.167.0
	 * @var Monitor_Task
	 */
	protected $monitor_task;

	/**
	 * Worker task instance.
	 *
	 * @since 1.167.0
	 * @var Worker_Task
	 */
	protected $worker_task;

	/**
	 * Constructor.
	 *
	 * @since 1.162.0
	 *
	 * @param Context           $context      Plugin context.
	 * @param Modules           $modules      Modules instance.
	 * @param Options|null      $options      Optional. Options instance. Default is a new instance.
	 * @param User_Options|null $user_options Optional. User options instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Modules $modules,
		?Options $options = null,
		?User_Options $user_options = null
	) {
		$this->context       = $context;
		$this->modules       = $modules;
		$this->options       = $options ?: new Options( $this->context );
		$this->user_options  = $user_options ?: new User_Options( $this->context );
		$this->settings      = new Email_Reporting_Settings( $this->options );
		$this->user_settings = new User_Email_Reporting_Settings( $this->user_options );

		$frequency_planner      = new Frequency_Planner();
		$subscribed_users_query = new Subscribed_Users_Query( $this->user_settings, $this->modules );
		$max_execution_limiter  = new Max_Execution_Limiter( (int) ini_get( 'max_execution_time' ) );
		$batch_query            = new Email_Log_Batch_Query();

		$this->rest_controller   = new REST_Email_Reporting_Controller( $this->settings );
		$this->email_log         = new Email_Log( $this->context );
		$this->scheduler         = new Email_Reporting_Scheduler( $frequency_planner );
		$this->initiator_task    = new Initiator_Task( $this->scheduler, $subscribed_users_query );
		$this->worker_task       = new Worker_Task( $max_execution_limiter, $batch_query, $this->scheduler );
		$this->monitor_task      = new Monitor_Task( $this->scheduler, $this->settings );
		$this->email_log_cleanup = new Email_Log_Cleanup( $this->settings );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.162.0
	 */
	public function register() {
		$this->settings->register();
		$this->rest_controller->register();

		// Register WP admin pointer for Email Reporting onboarding.
		( new Email_Reporting_Pointer( $this->context, $this->user_options, $this->user_settings ) )->register();
		$this->email_log->register();
		$this->scheduler->register();

		if ( $this->settings->is_email_reporting_enabled() ) {
			$this->scheduler->schedule_initiator_events();
			$this->scheduler->schedule_monitor();
			$this->scheduler->schedule_cleanup();

			add_action( Email_Reporting_Scheduler::ACTION_INITIATOR, array( $this->initiator_task, 'handle_callback_action' ), 10, 1 );
			add_action( Email_Reporting_Scheduler::ACTION_MONITOR, array( $this->monitor_task, 'handle_monitor_action' ) );
			add_action( Email_Reporting_Scheduler::ACTION_WORKER, array( $this->worker_task, 'handle_callback_action' ), 10, 3 );
			add_action( Email_Reporting_Scheduler::ACTION_CLEANUP, array( $this->email_log_cleanup, 'handle_cleanup_action' ) );

		} else {
			$this->scheduler->unschedule_all();
		}

		$this->settings->on_change(
			function ( $old_value, $new_value ) {
				$was_enabled = (bool) $old_value['enabled'];
				$is_enabled  = (bool) $new_value['enabled'];

				if ( $is_enabled && ! $was_enabled ) {
					$this->scheduler->schedule_initiator_events();
					$this->scheduler->schedule_monitor();
					$this->scheduler->schedule_cleanup();
					return;
				}

				if ( ! $is_enabled && $was_enabled ) {
					$this->scheduler->unschedule_all();
				}
			}
		);
	}
}
