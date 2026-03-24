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
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking_Settings;
use Google\Site_Kit\Core\Email\Email;
use Google\Site_Kit\Core\Email_Reporting\Notices\Analytics_Setup_Email_Notice;
use Google\Site_Kit\Core\Email_Reporting\Notices\Enable_Conversion_Events_Email_Notice;
use Google\Site_Kit\Core\Golinks\Golinks;
use Google\Site_Kit\Core\Golinks\Settings_Golink_Handler;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tracking\Feature_Metrics_Trait;
use Google\Site_Kit\Core\Tracking\Provides_Feature_Metrics;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;

/**
 * Base class for Email Reporting feature.
 *
 * @since 1.162.0
 * @access private
 * @ignore
 */
class Email_Reporting implements Provides_Feature_Metrics {

	use Feature_Metrics_Trait;

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
	 * Authentication instance.
	 *
	 * @since 1.168.0
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * Golinks instance.
	 *
	 * @since 1.174.0
	 * @var Golinks
	 */
	protected $golinks;

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
	 * Email notices resolver.
	 *
	 * @since 1.175.0
	 * @var Email_Notices
	 */
	protected $email_notices;

	/**
	 * Email log batch query instance.
	 *
	 * @since 1.173.0
	 * @var Email_Log_Batch_Query
	 */
	protected $email_log_batch_query;

	/**
	 * Subscribed users query instance.
	 *
	 * @since 1.173.0
	 * @var Subscribed_Users_Query
	 */
	protected $subscribed_users_query;

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
	 * Fallback task instance.
	 *
	 * @since 1.168.0
	 * @var Fallback_Task
	 */
	protected $fallback_task;

	/**
	 * Email reporting data requests instance.
	 *
	 * @since 1.168.0
	 * @var Email_Reporting_Data_Requests
	 */
	protected $data_requests;

	/**
	 * Constructor.
	 *
	 * @since 1.162.0
	 * @since 1.168.0 Added authentication dependency.
	 * @since 1.174.0 Added golinks dependency.
	 *
	 * @param Context                       $context       Plugin context.
	 * @param Modules                       $modules       Modules instance.
	 * @param Email_Reporting_Data_Requests $data_requests Email reporting data requests.
	 * @param Golinks                       $golinks       Golinks instance.
	 * @param Authentication                $authentication Authentication instance.
	 * @param Options|null                  $options       Optional. Options instance. Default is a new instance.
	 * @param User_Options|null             $user_options  Optional. User options instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Modules $modules,
		Email_Reporting_Data_Requests $data_requests,
		Golinks $golinks,
		Authentication $authentication,
		?Options $options = null,
		?User_Options $user_options = null
	) {
		$this->context                = $context;
		$this->modules                = $modules;
		$this->data_requests          = $data_requests;
		$this->golinks                = $golinks;
		$this->authentication         = $authentication;
		$this->options                = $options ?: new Options( $this->context );
		$this->user_options           = $user_options ?: new User_Options( $this->context );
		$this->settings               = new Email_Reporting_Settings( $this->options );
		$this->user_settings          = new User_Email_Reporting_Settings( $this->user_options );
		$conversion_tracking_settings = new Conversion_Tracking_Settings( $this->options );
		$conversion_tracking          = new Conversion_Tracking( $this->context, $this->options );
		$frequency_planner            = new Frequency_Planner();
		$this->scheduler              = new Email_Reporting_Scheduler( $frequency_planner );
		$this->email_notices          = new Email_Notices(
			$this->context,
			$this->golinks,
			array(
				new Analytics_Setup_Email_Notice( $this->context, $this->modules, $this->golinks ),
				new Enable_Conversion_Events_Email_Notice( $this->context, $this->modules, $this->golinks, $conversion_tracking_settings, $conversion_tracking ),
			)
		);

		$this->subscribed_users_query = new Subscribed_Users_Query( $this->user_settings, $this->modules );
		$eligible_subscribers_query   = new Eligible_Subscribers_Query( $this->modules, $this->user_options );
		$max_execution_limiter        = new Max_Execution_Limiter( (int) ini_get( 'max_execution_time' ) );
		$this->email_log_batch_query  = new Email_Log_Batch_Query();
		$health_check                 = new Cron_Health_Check( $this->email_log_batch_query, $this->scheduler );
		$email_sender                 = new Email();
		$section_builder              = new Email_Report_Section_Builder( $this->context );
		$template_formatter           = new Email_Template_Formatter( $this->context, $section_builder, $this->golinks, $this->email_notices );
		$template_renderer_factory    = new Email_Template_Renderer_Factory( $this->context, $this->golinks );
		$report_sender                = new Email_Report_Sender( $template_renderer_factory, $email_sender );
		$log_processor                = new Email_Log_Processor( $this->email_log_batch_query, $this->data_requests, $template_formatter, $report_sender );

		$this->rest_controller   = new REST_Email_Reporting_Controller(
			$this->settings,
			$this->modules,
			$this->user_settings,
			$eligible_subscribers_query,
			$email_sender,
			$this->golinks,
			$health_check
		);
		$this->email_log         = new Email_Log();
		$this->initiator_task    = new Initiator_Task( $this->scheduler, $this->subscribed_users_query );
		$notifier                = new Batch_Error_Notifier( $this->email_log_batch_query, $email_sender, $this->context, $this->golinks );
		$this->worker_task       = new Worker_Task(
			$max_execution_limiter,
			$this->email_log_batch_query,
			$this->scheduler,
			$log_processor,
			$this->data_requests,
			$notifier,
			$health_check
		);
		$this->fallback_task     = new Fallback_Task( $this->email_log_batch_query, $this->scheduler, $this->worker_task, $notifier );
		$this->monitor_task      = new Monitor_Task( $this->scheduler, $this->settings );
		$this->email_log_cleanup = new Email_Log_Cleanup( $this->settings );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.162.0
	 */
	public function register() {
		$this->golinks->register_handler( 'manage-subscription-email-reporting', new Email_Reporting_Golink_Handler() );
		$this->golinks->register_handler( 'settings', new Settings_Golink_Handler() );
		$this->golinks->register_handler( Email_Notices::GOLINK_NOTICE, new Email_Notice_Golink_Handler( $this->email_notices, $this->modules, $this->authentication ) );
		$this->settings->register();
		$this->rest_controller->register();
		$this->register_feature_metrics();

		// Register WP admin pointer for Email Reporting onboarding.
		( new Email_Reporting_Pointer( $this->context, $this->user_options, $this->user_settings ) )->register();
		$this->email_log->register();
		$this->scheduler->register();

		// Schedule events only if authentication is completed and email reporting is enabled.
		// Otherwise events are being scheduled as soon as the plugin is activated.
		if ( $this->authentication->is_setup_completed() && $this->settings->is_email_reporting_enabled() ) {
			$this->scheduler->schedule_initiator_events();
			$this->scheduler->schedule_monitor();
			$this->scheduler->schedule_cleanup();

			add_action( Email_Reporting_Scheduler::ACTION_INITIATOR, array( $this->initiator_task, 'handle_callback_action' ), 10, 2 );
			add_action( Email_Reporting_Scheduler::ACTION_MONITOR, array( $this->monitor_task, 'handle_monitor_action' ) );
			add_action( Email_Reporting_Scheduler::ACTION_WORKER, array( $this->worker_task, 'handle_callback_action' ), 10, 3 );
			add_action( Email_Reporting_Scheduler::ACTION_FALLBACK, array( $this->fallback_task, 'handle_fallback_action' ), 10, 3 );
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

	/**
	 * Gets feature metrics for email reporting.
	 *
	 * @since 1.173.0
	 *
	 * @return array
	 */
	public function get_feature_metrics() {
		$latest_batch_ids = $this->email_log_batch_query->get_latest_batch_post_ids();
		$batch_counts     = $this->email_log_batch_query->get_batch_counts( $latest_batch_ids );

		return array(
			'email_reporting_total_sent'        => $this->email_log_batch_query->get_total_count_by_status( Email_Log::STATUS_SENT ),
			'email_reporting_total_failed'      => $this->email_log_batch_query->get_total_count_by_status( Email_Log::STATUS_FAILED ),
			'email_reporting_last_batch_sent'   => $batch_counts['sent'],
			'email_reporting_last_batch_failed' => $batch_counts['failed'],
			'email_reporting_subscribers'       => $this->subscribed_users_query->get_subscriber_count(),
		);
	}
}
