<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Worker_Task
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Core\Permissions\Permissions;
use WP_Post;

/**
 * Handles worker cron callbacks for email reporting.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Worker_Task {

	/**
	 * Email log batch query helper.
	 *
	 * @since 1.167.0
	 *
	 * @var Email_Log_Batch_Query
	 */
	private $batch_query;

	/**
	 * Scheduler instance.
	 *
	 * @since 1.167.0
	 *
	 * @var Email_Reporting_Scheduler
	 */
	private $scheduler;

	/**
	 * Email log processor.
	 *
	 * @since 1.170.0
	 *
	 * @var Email_Log_Processor
	 */
	private $log_processor;

	/**
	 * Email reporting data requests service.
	 *
	 * @since 1.172.0
	 *
	 * @var Email_Reporting_Data_Requests
	 */
	private $data_requests;

	/**
	 * Max execution limiter.
	 *
	 * @since 1.167.0
	 *
	 * @var Max_Execution_Limiter
	 */
	private $max_execution_limiter;

	/**
	 * Constructor.
	 *
	 * @since 1.167.0
	 *
	 * @param Max_Execution_Limiter         $max_execution_limiter Execution limiter instance.
	 * @param Email_Log_Batch_Query         $batch_query           Batch query helper.
	 * @param Email_Reporting_Scheduler     $scheduler             Scheduler instance.
	 * @param Email_Log_Processor           $log_processor         Log processor instance.
	 * @param Email_Reporting_Data_Requests $data_requests         Data requests helper.
	 */
	public function __construct(
		Max_Execution_Limiter $max_execution_limiter,
		Email_Log_Batch_Query $batch_query,
		Email_Reporting_Scheduler $scheduler,
		Email_Log_Processor $log_processor,
		Email_Reporting_Data_Requests $data_requests
	) {
		$this->max_execution_limiter = $max_execution_limiter;
		$this->batch_query           = $batch_query;
		$this->scheduler             = $scheduler;
		$this->log_processor         = $log_processor;
		$this->data_requests         = $data_requests;
	}

	/**
	 * Handles worker cron executions for email reporting.
	 *
	 * @since 1.167.0
	 *
	 * @param string $batch_id            Batch identifier.
	 * @param string $frequency           Frequency slug.
	 * @param int    $initiator_timestamp Initiator timestamp.
	 */
	public function handle_callback_action( $batch_id, $frequency, $initiator_timestamp ) {
		$lock_handle = $this->acquire_lock( $frequency );
		if ( ! $lock_handle ) {
			return;
		}

		$switched = false;

		try {
			if ( $this->should_abort( $initiator_timestamp ) ) {
				return;
			}

			if ( $this->batch_query->is_complete( $batch_id ) ) {
				return;
			}

			$pending_ids = $this->batch_query->get_pending_ids( $batch_id );

			if ( empty( $pending_ids ) ) {
				return;
			}

			$site_id = (int) get_post_meta( $pending_ids[0], Email_Log::META_SITE_ID, true );
			if ( 0 !== $site_id && get_current_blog_id() !== $site_id ) {
				// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.switch_to_blog_switch_to_blog -- Needed to process the log in its site context.
				switch_to_blog( $site_id );
				$switched = true;
			}

			$this->schedule_follow_up( $batch_id, $frequency, $initiator_timestamp );

			if ( $this->should_abort( $initiator_timestamp ) ) {
				return;
			}

			$this->process_pending_logs( $pending_ids, $frequency, $initiator_timestamp );
		} finally {
			if ( $switched ) {
				restore_current_blog();
			}
			delete_transient( $lock_handle );
		}
	}

	/**
	 * Processes a list of pending email log IDs.
	 *
	 * @since 1.170.0
	 *
	 * @param array  $pending_ids         Pending post IDs.
	 * @param string $frequency           Frequency slug.
	 * @param int    $initiator_timestamp Initiator timestamp.
	 */
	private function process_pending_logs( array $pending_ids, $frequency, $initiator_timestamp ) {
		$shared_payloads = $this->get_shared_payloads_for_pending_ids( $pending_ids );

		foreach ( $pending_ids as $post_id ) {
			if ( $this->should_abort( $initiator_timestamp ) ) {
				return;
			}

			$email_log = get_post( $post_id );
			$user      = null;

			if ( $email_log instanceof WP_Post ) {
				$user = get_user_by( 'id', (int) $email_log->post_author );
			}

			$shared_payloads_for_user = array();

			if ( ! empty( $shared_payloads ) && $user instanceof \WP_User ) {
				foreach ( $shared_payloads as $slug => $module_payload ) {
					if (
						user_can( $user, Permissions::MANAGE_OPTIONS ) ||
						user_can( $user, Permissions::READ_SHARED_MODULE_DATA, $slug )
					) {
						$shared_payloads_for_user[ $slug ] = $module_payload;
					}
				}
			}

			if ( empty( $shared_payloads_for_user ) ) {
				$this->log_processor->process( $post_id, $frequency );
			} else {
				$this->log_processor->process( $post_id, $frequency, $shared_payloads_for_user );
			}
		}
	}

	/**
	 * Attempts to acquire a frequency-scoped worker lock.
	 *
	 * @since 1.167.0
	 *
	 * @param string $frequency Frequency slug.
	 * @return string|false Transient name on success, false if lock already held.
	 */
	private function acquire_lock( $frequency ) {
		$transient_name = sprintf( 'googlesitekit_email_reporting_worker_lock_%s', $frequency );

		if ( get_transient( $transient_name ) ) {
			return false;
		}

		set_transient( $transient_name, time(), MINUTE_IN_SECONDS );

		return $transient_name;
	}

	/**
	 * Determines if the current worker run should abort.
	 *
	 * @since 1.167.0
	 *
	 * @param int $initiator_timestamp Initiator timestamp.
	 * @return bool True if processing should stop immediately.
	 */
	private function should_abort( $initiator_timestamp ) {
		return $this->max_execution_limiter->should_abort( $initiator_timestamp );
	}

	/**
	 * Schedules the follow-up worker event.
	 *
	 * @since 1.167.0
	 *
	 * @param string $batch_id            Batch identifier.
	 * @param string $frequency           Frequency slug.
	 * @param int    $initiator_timestamp Initiator timestamp.
	 */
	private function schedule_follow_up( $batch_id, $frequency, $initiator_timestamp ) {
		$target_time = time() + ( 11 * MINUTE_IN_SECONDS );
		$delay       = max( 0, $target_time - (int) $initiator_timestamp );

		$this->scheduler->schedule_worker( $batch_id, $frequency, $initiator_timestamp, $delay );
	}

	/**
	 * Builds shared payloads per module for view-only recipients.
	 *
	 * @since 1.172.0
	 *
	 * @param array $pending_ids Pending post IDs.
	 * @return array Shared payloads keyed by module slug.
	 */
	private function get_shared_payloads_for_pending_ids( array $pending_ids ) {
		$module_slugs = $this->data_requests->get_active_module_slugs();
		if ( empty( $module_slugs ) ) {
			return array();
		}

		list( $date_range, $module_recipients ) = $this->collect_date_range_and_recipients( $pending_ids, $module_slugs );

		if ( empty( $date_range ) ) {
			return array();
		}

		return $this->build_shared_payloads( $module_recipients, $date_range );
	}

	/**
	 * Collects the date range and module recipients from pending logs.
	 *
	 * @since 1.172.0
	 *
	 * @param array    $pending_ids  Pending post IDs.
	 * @param string[] $module_slugs Active module slugs.
	 * @return array{0: array, 1: array} Date range and module recipients.
	 */
	private function collect_date_range_and_recipients( array $pending_ids, array $module_slugs ) {
		$module_recipients = array();
		$date_range        = array();

		foreach ( $pending_ids as $post_id ) {
			$email_log = get_post( $post_id );

			if ( ! $email_log instanceof WP_Post || Email_Log::POST_TYPE !== $email_log->post_type ) {
				continue;
			}

			if ( empty( $date_range ) ) {
				$date_range = Email_Log::get_date_range_from_log( $email_log );
			}

			$user_id = (int) $email_log->post_author;
			if ( $user_id <= 0 ) {
				continue;
			}

			$user = get_user_by( 'id', $user_id );
			if ( ! $user instanceof \WP_User ) {
				continue;
			}

			foreach ( $module_slugs as $slug ) {
				// Ensure the module still has an owner at send time, since the
				// owner could have been removed after we initially collected
				// modules.
				if ( 0 === $this->data_requests->get_module_owner_id( $slug ) ) {
					// If there's no module owner, skip this module.
					continue;
				}

				// Only add this user to the receipt list if they have
				// permission to view the module data.
				if (
					user_can( $user, Permissions::MANAGE_OPTIONS ) ||
					user_can( $user, Permissions::READ_SHARED_MODULE_DATA, $slug )
				) {
					$module_recipients[ $slug ][ $user_id ] = true;
				}
			}
		}

		return array( $date_range, $module_recipients );
	}

	/**
	 * Builds shared module payloads based on a recipient map.
	 *
	 * @since 1.172.0
	 *
	 * @param array $module_recipients Module recipients keyed by slug.
	 * @param array $date_range        Date range for the report.
	 * @return array Shared payloads keyed by module slug.
	 */
	private function build_shared_payloads( array $module_recipients, array $date_range ) {
		$shared_payloads = array();

		foreach ( $module_recipients as $slug => $user_ids ) {
			if ( empty( $user_ids ) ) {
				continue;
			}

			$shared_user_id = $this->data_requests->get_module_owner_id( $slug );
			if ( $shared_user_id <= 0 ) {
				continue;
			}

			$payload = $this->data_requests->get_user_payload( $shared_user_id, $date_range, array(), array( $slug ) );

			if ( is_wp_error( $payload ) || empty( $payload ) ) {
				continue;
			}

			if ( ! empty( $payload[ $slug ] ) ) {
				$shared_payloads[ $slug ] = $payload[ $slug ];
			}
		}

		return $shared_payloads;
	}
}
