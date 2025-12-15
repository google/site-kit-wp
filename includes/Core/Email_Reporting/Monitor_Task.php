<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Monitor_Task
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;

/**
 * Restores missing initiator schedules for email reporting.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Monitor_Task {

	/**
	 * Scheduler instance.
	 *
	 * @since 1.167.0
	 *
	 * @var Email_Reporting_Scheduler
	 */
	private $scheduler;

	/**
	 * Settings instance.
	 *
	 * @since 1.167.0
	 *
	 * @var Email_Reporting_Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since 1.167.0
	 *
	 * @param Email_Reporting_Scheduler $scheduler Scheduler instance.
	 * @param Email_Reporting_Settings  $settings  Email reporting settings.
	 */
	public function __construct( Email_Reporting_Scheduler $scheduler, Email_Reporting_Settings $settings ) {
		$this->scheduler = $scheduler;
		$this->settings  = $settings;
	}

	/**
	 * Handles the monitor cron callback.
	 *
	 * The monitor ensures each initiator schedule exists and recreates any
	 * missing ones without disturbing existing events.
	 *
	 * @since 1.167.0
	 */
	public function handle_monitor_action() {
		if ( ! $this->settings->is_email_reporting_enabled() ) {
			return;
		}

		foreach ( array( User_Email_Reporting_Settings::FREQUENCY_WEEKLY, User_Email_Reporting_Settings::FREQUENCY_MONTHLY, User_Email_Reporting_Settings::FREQUENCY_QUARTERLY ) as $frequency ) {
			if ( wp_next_scheduled( Email_Reporting_Scheduler::ACTION_INITIATOR, array( $frequency ) ) ) {
				continue;
			}

			$this->scheduler->schedule_initiator_once( $frequency );
		}
	}
}
