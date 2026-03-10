<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Subscription_Confirmation_Task
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Core\User\Email_Reporting_Settings;

/**
 * Handles subscription confirmation email scheduling.
 *
 * @since 1.174.0
 * @access private
 * @ignore
 */
class Subscription_Confirmation_Task {

	/**
	 * Frequency planner instance.
	 *
	 * @since 1.174.0
	 * @var Frequency_Planner
	 */
	private $frequency_planner;

	/**
	 * Constructor.
	 *
	 * @since 1.174.0
	 *
	 * @param Frequency_Planner $frequency_planner Frequency planner instance.
	 */
	public function __construct( Frequency_Planner $frequency_planner ) {
		$this->frequency_planner = $frequency_planner;
	}

	/**
	 * Schedules a subscription confirmation batch if this request subscribed the user.
	 *
	 * @since 1.174.0
	 *
	 * @param int   $user_id           User ID.
	 * @param array $previous_settings Previous settings.
	 * @param array $updated_settings  Updated settings.
	 * @return array|false|\WP_Error Batch payload on success, false when not needed, WP_Error on failure.
	 */
	public function maybe_schedule( $user_id, array $previous_settings, array $updated_settings ) {
		$was_subscribed = ! empty( $previous_settings['subscribed'] );
		$is_subscribed  = ! empty( $updated_settings['subscribed'] );

		if ( $was_subscribed || ! $is_subscribed ) {
			return false;
		}

		$frequency = $updated_settings['frequency'] ?? Email_Reporting_Settings::FREQUENCY_WEEKLY;

		return $this->schedule( $user_id, $frequency );
	}

	/**
	 * Creates a single-user subscription confirmation batch payload and log.
	 *
	 * @since 1.174.0
	 *
	 * @param int    $user_id   User ID.
	 * @param string $frequency Frequency slug.
	 * @return array|\WP_Error Batch payload on success, WP_Error on failure.
	 */
	public function schedule( $user_id, $frequency ) {
		if ( ! post_type_exists( Email_Log::POST_TYPE ) ) {
			return new \WP_Error(
				'email_reporting_log_post_type_missing',
				__( 'Email reporting log post type is not available.', 'google-site-kit' ),
				array( 'status' => 500 )
			);
		}

		$user_id = (int) $user_id;
		if ( $user_id <= 0 ) {
			return new \WP_Error(
				'email_reporting_invalid_user_id',
				__( 'Invalid user ID for email reporting subscription.', 'google-site-kit' ),
				array( 'status' => 400 )
			);
		}

		$timestamp              = time();
		$batch_id               = wp_generate_uuid4();
		$first_report_timestamp = $this->frequency_planner->next_occurrence(
			$frequency,
			$timestamp,
			wp_timezone()
		);
		$reference_dates        = Initiator_Task::build_reference_dates( $frequency, $first_report_timestamp );

		$post_id = wp_insert_post(
			array(
				'post_type'   => Email_Log::POST_TYPE,
				'post_author' => $user_id,
				'post_status' => Email_Log::STATUS_SCHEDULED,
				'post_title'  => $batch_id,
				'meta_input'  => array(
					Email_Log::META_BATCH_ID               => $batch_id,
					Email_Log::META_REPORT_FREQUENCY       => $frequency,
					Email_Log::META_REPORT_REFERENCE_DATES => $reference_dates,
					Email_Log::META_SEND_ATTEMPTS          => 0,
					Email_Log::META_SITE_ID                => get_current_blog_id(),
					Email_Log::META_TEMPLATE_TYPE          => Email_Log::TEMPLATE_TYPE_SUBSCRIBE_SUCCESS,
				),
			),
			true
		);

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		return array(
			'batch_id'  => $batch_id,
			'frequency' => $frequency,
			'timestamp' => $timestamp,
		);
	}
}
