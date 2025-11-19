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
	 * @since n.e.x.t
	 * @var Options
	 */
	protected $options;

	/**
	 * Modules instance.
	 *
	 * @since n.e.x.t
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
	 * Scheduler instance.
	 *
	 * @since n.e.x.t
	 * @var Email_Reporting_Scheduler
	 */
	protected $scheduler;

	/**
	 * Initiator task instance.
	 *
	 * @since n.e.x.t
	 * @var Initiator_Task
	 */
	protected $initiator_task;

	/**
	 * Monitor task instance.
	 *
	 * @since n.e.x.t
	 * @var Monitor_Task
	 */
	protected $monitor_task;

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

		$this->rest_controller = new REST_Email_Reporting_Controller( $this->settings );
		$this->email_log       = new Email_Log( $this->context );
		$this->scheduler       = new Email_Reporting_Scheduler( $frequency_planner );
		$this->initiator_task  = new Initiator_Task( $this->scheduler, $subscribed_users_query );
		$this->monitor_task    = new Monitor_Task( $this->scheduler, $this->settings );
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

		if ( $this->settings->is_email_reporting_enabled() ) {
			$this->scheduler->schedule_initiator_events();
			$this->scheduler->schedule_monitor();

			add_action( Email_Reporting_Scheduler::ACTION_INITIATOR, array( $this->initiator_task, 'handle_callback_action' ), 10, 1 );
			add_action( Email_Reporting_Scheduler::ACTION_MONITOR, array( $this->monitor_task, 'handle_monitor_action' ) );
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
					return;
				}

				if ( ! $is_enabled && $was_enabled ) {
					$this->scheduler->unschedule_all();
				}
			}
		);
	}
}
