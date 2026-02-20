<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Site_Health
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

/**
 * Class responsible for exposing Email Reporting data to Site Health.
 *
 * @since 1.166.0
 * @access private
 * @ignore
 */
class Email_Reporting_Site_Health {

	/**
	 * Email reporting settings instance.
	 *
	 * @since 1.166.0
	 * @var Email_Reporting_Settings
	 */
	private $settings;

	/**
	 * Email log batch query instance.
	 *
	 * @since 1.172.0
	 * @var Email_Log_Batch_Query
	 */
	private $email_log_batch_query;

	/**
	 * Subscribed users query instance.
	 *
	 * @since 1.173.0
	 * @var Subscribed_Users_Query
	 */
	private $subscribed_users_query;

	/**
	 * Constructor.
	 *
	 * @since 1.166.0
	 *
	 * @param Email_Reporting_Settings $settings               Email reporting settings.
	 * @param Subscribed_Users_Query   $subscribed_users_query Subscribed users query instance.
	 */
	public function __construct( Email_Reporting_Settings $settings, Subscribed_Users_Query $subscribed_users_query ) {
		$this->settings               = $settings;
		$this->email_log_batch_query  = new Email_Log_Batch_Query();
		$this->subscribed_users_query = $subscribed_users_query;
	}

	/**
	 * Gets Email Reports debug fields for Site Health.
	 *
	 * @since 1.166.0
	 *
	 * @return array
	 */
	public function get_debug_fields() {
		$not_available = __( 'Not available', 'google-site-kit' );

		$fields = array(
			'email_reports_status'         => array(
				'label' => __( 'Email Reports status', 'google-site-kit' ),
				'value' => $not_available,
				'debug' => 'not-available',
			),
			'email_reports_subscribers'    => array(
				'label' => __( 'Email Reports subscribers', 'google-site-kit' ),
				'value' => $not_available,
				'debug' => 'not-available',
			),
			'email_reports_deliverability' => array(
				'label' => __( 'Email Reports deliverability', 'google-site-kit' ),
				'value' => $not_available,
				'debug' => 'not-available',
			),
			'email_reports_last_sent'      => array(
				'label' => __( 'Email Reports last sent', 'google-site-kit' ),
				'value' => $not_available,
				'debug' => 'not-available',
			),
		);

		$is_enabled                              = $this->settings->is_email_reporting_enabled();
		$fields['email_reports_status']['value'] = $is_enabled ? __( 'Enabled', 'google-site-kit' ) : __( 'Disabled', 'google-site-kit' );
		$fields['email_reports_status']['debug'] = $is_enabled ? 'enabled' : 'disabled';

		if ( ! $is_enabled ) {
			return $fields;
		}

		$subscriber_count                             = $this->subscribed_users_query->get_subscriber_count();
		$fields['email_reports_subscribers']['value'] = $subscriber_count;
		$fields['email_reports_subscribers']['debug'] = $subscriber_count;

		if ( ! post_type_exists( Email_Log::POST_TYPE ) ) {
			return $fields;
		}

		$batch_post_ids = $this->email_log_batch_query->get_latest_batch_post_ids();

		if ( empty( $batch_post_ids ) ) {
			return $fields;
		}

		$fields['email_reports_deliverability'] = array_merge( $fields['email_reports_deliverability'], $this->build_deliverability_field( $batch_post_ids ) );
		$fields['email_reports_last_sent']      = array_merge( $fields['email_reports_last_sent'], $this->build_last_sent_field( $batch_post_ids ) );

		return $fields;
	}

	/**
	 * Builds the deliverability field details.
	 *
	 * @since 1.166.0
	 *
	 * @param array<int> $post_ids Post IDs belonging to the latest batch.
	 * @return array
	 */
	private function build_deliverability_field( array $post_ids ) {
		$statuses = array();

		foreach ( $post_ids as $post_id ) {
			$status     = get_post_status( $post_id );
			$statuses[] = is_string( $status ) ? $status : '';
		}

		$statuses = array_filter( $statuses );

		if ( empty( $statuses ) ) {
			$value = __( 'Not available', 'google-site-kit' );
			return array(
				'value' => $value,
				'debug' => 'not-available',
			);
		}

		$all_sent   = ! array_diff( $statuses, array( Email_Log::STATUS_SENT ) );
		$all_failed = ! array_diff( $statuses, array( Email_Log::STATUS_FAILED ) );

		if ( $all_sent ) {
			return array(
				'value' => __( '✅ all emails in last run sent', 'google-site-kit' ),
				'debug' => 'all-sent',
			);
		}

		if ( $all_failed ) {
			return array(
				'value' => __( '❌ all failed in last run', 'google-site-kit' ),
				'debug' => 'all-failed',
			);
		}

		return array(
			'value' => __( '⚠️ some failed in last run', 'google-site-kit' ),
			'debug' => 'partial-failure',
		);
	}

	/**
	 * Builds the last sent field details.
	 *
	 * @since 1.166.0
	 *
	 * @param array<int> $post_ids Post IDs belonging to the latest batch.
	 * @return array
	 */
	private function build_last_sent_field( array $post_ids ) {
		$latest_timestamp = 0;

		foreach ( $post_ids as $post_id ) {
			$status = get_post_status( $post_id );

			if ( Email_Log::STATUS_SENT !== $status ) {
				continue;
			}

			$post_date = get_post_field( 'post_date_gmt', $post_id );

			if ( ! $post_date ) {
				continue;
			}

			$timestamp = (int) mysql2date( 'U', $post_date, false );

			if ( $timestamp > $latest_timestamp ) {
				$latest_timestamp = $timestamp;
			}
		}

		if ( ! $latest_timestamp ) {
			$value = __( 'Never', 'google-site-kit' );

			return array(
				'value' => $value,
				'debug' => 'never',
			);
		}

		$iso = gmdate( 'c', $latest_timestamp );

		return array(
			'value' => $iso,
			'debug' => $iso,
		);
	}
}
