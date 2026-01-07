<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Log_Processor
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use WP_Error;
use WP_Post;
use WP_User;

/**
 * Processes individual email log records.
 *
 * @since 1.170.0
 * @access private
 * @ignore
 */
class Email_Log_Processor {

	/**
	 * Email log batch query helper.
	 *
	 * @since 1.170.0
	 * @var Email_Log_Batch_Query
	 */
	private $batch_query;

	/**
	 * Email reporting data requests service.
	 *
	 * @since 1.170.0
	 * @var Email_Reporting_Data_Requests
	 */
	private $data_requests;

	/**
	 * Email template formatter.
	 *
	 * @since 1.170.0
	 * @var Email_Template_Formatter
	 */
	private $template_formatter;

	/**
	 * Email report sender.
	 *
	 * @since 1.170.0
	 * @var Email_Report_Sender
	 */
	private $report_sender;

	/**
	 * Constructor.
	 *
	 * @since 1.170.0
	 *
	 * @param Email_Log_Batch_Query         $batch_query         Batch query helper.
	 * @param Email_Reporting_Data_Requests $data_requests       Data requests helper.
	 * @param Email_Template_Formatter      $template_formatter  Template formatter.
	 * @param Email_Report_Sender           $report_sender       Report sender.
	 */
	public function __construct(
		Email_Log_Batch_Query $batch_query,
		Email_Reporting_Data_Requests $data_requests,
		Email_Template_Formatter $template_formatter,
		Email_Report_Sender $report_sender
	) {
		$this->batch_query        = $batch_query;
		$this->data_requests      = $data_requests;
		$this->template_formatter = $template_formatter;
		$this->report_sender      = $report_sender;
	}

	/**
	 * Processes a single email log record.
	 *
	 * @since 1.170.0
	 *
	 * @param int    $post_id   Email log post ID.
	 * @param string $frequency Frequency slug.
	 */
	public function process( $post_id, $frequency ) {
		$this->batch_query->increment_attempt( $post_id );

		$email_log = $this->get_email_log( $post_id );
		if ( null === $email_log ) {
			return;
		}

		$user = $this->get_user_from_log( $email_log );
		if ( is_wp_error( $user ) ) {
			$this->mark_failed( $post_id, $user );
			return;
		}

		$date_range = $this->get_date_range_for_log( $email_log );
		if ( is_wp_error( $date_range ) ) {
			$this->mark_failed( $post_id, $date_range );
			return;
		}

		$raw_payload = $this->data_requests->get_user_payload( $user->ID, $date_range );
		if ( is_wp_error( $raw_payload ) ) {
			$this->mark_failed( $post_id, $raw_payload );
			return;
		}

		$sections = $this->build_sections_for_log( $email_log, $user, $raw_payload );
		if ( is_wp_error( $sections ) ) {
			$this->mark_failed( $post_id, $sections );
			return;
		}

		$template_payload = $this->build_template_payload_for_log( $sections, $frequency, $date_range );
		if ( is_wp_error( $template_payload ) ) {
			$this->mark_failed( $post_id, $template_payload );
			return;
		}

		$sections_payload = isset( $template_payload['sections_payload'] ) ? $template_payload['sections_payload'] : array();
		$template_data    = isset( $template_payload['template_data'] ) ? $template_payload['template_data'] : array();

		$send_result = $this->report_sender->send( $user, $sections_payload, $template_data );
		if ( is_wp_error( $send_result ) ) {
			$this->mark_failed( $post_id, $send_result );
			return;
		}

		$this->mark_sent( $post_id );
	}

	/**
	 * Retrieves a valid email log post.
	 *
	 * @since 1.170.0
	 *
	 * @param int $post_id Post ID.
	 * @return WP_Post|null Email log post or null when invalid.
	 */
	private function get_email_log( $post_id ) {
		$email_log = get_post( $post_id );

		if ( ! $email_log instanceof WP_Post ) {
			return null;
		}

		if ( Email_Log::POST_TYPE !== $email_log->post_type ) {
			return null;
		}

		return $email_log;
	}

	/**
	 * Resolves a valid report user from the email log.
	 *
	 * @since 1.170.0
	 *
	 * @param WP_Post $email_log Email log post.
	 * @return WP_User|WP_Error User instance or WP_Error.
	 */
	private function get_user_from_log( WP_Post $email_log ) {
		$user = get_user_by( 'id', (int) $email_log->post_author );

		if ( ! $user instanceof WP_User ) {
			return new WP_Error(
				'invalid_email_reporting_user',
				__( 'Invalid user for email reporting data.', 'google-site-kit' )
			);
		}

		return $user;
	}

	/**
	 * Retrieves a valid date range for an email log.
	 *
	 * @since 1.170.0
	 *
	 * @param WP_Post $email_log Email log post.
	 * @return array|WP_Error Date range or error.
	 */
	private function get_date_range_for_log( WP_Post $email_log ) {
		$date_range = Email_Log::get_date_range_from_log( $email_log );

		if ( empty( $date_range ) ) {
			return new WP_Error(
				'email_report_invalid_date_range',
				__( 'Email report date range is invalid.', 'google-site-kit' )
			);
		}

		return $date_range;
	}

	/**
	 * Builds sections for a log payload.
	 *
	 * @since 1.170.0
	 *
	 * @param WP_Post $email_log   Email log post.
	 * @param WP_User $user        User receiving the report.
	 * @param array   $raw_payload Raw payload.
	 * @return array|WP_Error Sections array or WP_Error.
	 */
	private function build_sections_for_log( WP_Post $email_log, WP_User $user, $raw_payload ) {
		$sections = $this->template_formatter->build_sections( $raw_payload, $email_log, $user );

		if ( is_wp_error( $sections ) ) {
			return $sections;
		}

		if ( empty( $sections ) ) {
			return new WP_Error(
				'email_report_no_data',
				__( 'No email report data available.', 'google-site-kit' )
			);
		}

		return $sections;
	}

	/**
	 * Builds template payload for an email log.
	 *
	 * @since 1.170.0
	 *
	 * @param array  $sections   Sections data.
	 * @param string $frequency  Frequency slug.
	 * @param array  $date_range Date range.
	 * @return array|WP_Error Template payload or WP_Error.
	 */
	private function build_template_payload_for_log( $sections, $frequency, $date_range ) {
		return $this->template_formatter->build_template_payload( $sections, $frequency, $date_range );
	}

	/**
	 * Marks a log post as failed.
	 *
	 * @since 1.170.0
	 *
	 * @param int             $post_id Post ID.
	 * @param WP_Error|string $error   Error details.
	 */
	private function mark_failed( $post_id, $error ) {
		$this->batch_query->update_status( $post_id, Email_Log::STATUS_FAILED );
		update_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, $error );
	}

	/**
	 * Marks a log post as sent.
	 *
	 * @since 1.170.0
	 *
	 * @param int $post_id Post ID.
	 */
	private function mark_sent( $post_id ) {
		wp_update_post(
			array(
				'ID'            => $post_id,
				'post_status'   => Email_Log::STATUS_SENT,
				'post_date'     => current_time( 'mysql' ),
				'post_date_gmt' => current_time( 'mysql', 1 ),
			)
		);

		delete_post_meta( $post_id, Email_Log::META_ERROR_DETAILS );
	}
}
