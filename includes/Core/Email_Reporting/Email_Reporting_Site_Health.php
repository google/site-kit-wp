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

use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;

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
	 * User options instance.
	 *
	 * @since 1.166.0
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Constructor.
	 *
	 * @since 1.166.0
	 *
	 * @param Email_Reporting_Settings $settings     Email reporting settings.
	 * @param User_Options             $user_options User options instance.
	 */
	public function __construct( Email_Reporting_Settings $settings, User_Options $user_options ) {
		$this->settings     = $settings;
		$this->user_options = $user_options;
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

		$subscriber_count                             = $this->get_subscriber_count();
		$fields['email_reports_subscribers']['value'] = $subscriber_count;
		$fields['email_reports_subscribers']['debug'] = $subscriber_count;

		if ( ! post_type_exists( Email_Log::POST_TYPE ) ) {
			return $fields;
		}

		$batch_post_ids = $this->get_latest_batch_post_ids();

		if ( empty( $batch_post_ids ) ) {
			return $fields;
		}

		$fields['email_reports_deliverability'] = $this->build_deliverability_field( $batch_post_ids );
		$fields['email_reports_last_sent']      = $this->build_last_sent_field( $batch_post_ids );

		return $fields;
	}

	/**
	 * Gets the number of subscribed users.
	 *
	 * @since 1.166.0
	 *
	 * @return int
	 */
	private function get_subscriber_count() {
		$meta_key = $this->user_options->get_meta_key( User_Email_Reporting_Settings::OPTION );

		$user_query = new \WP_User_Query(
			array(
				'fields'   => 'ids',
				'meta_key' => $meta_key, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'compare'  => 'EXISTS',
			)
		);

		$subscribers = 0;

		foreach ( $user_query->get_results() as $user_id ) {
			$settings = get_user_meta( $user_id, $meta_key, true );

			if ( is_array( $settings ) && ! empty( $settings['subscribed'] ) ) {
				++$subscribers;
			}
		}

		return $subscribers;
	}

	/**
	 * Gets the post IDs for the latest email log batch.
	 *
	 * @since 1.166.0
	 *
	 * @return array<int>
	 */
	private function get_latest_batch_post_ids() {
		$latest_post = new \WP_Query(
			array(
				'post_type'      => Email_Log::POST_TYPE,
				'post_status'    => $this->get_relevant_log_statuses(),
				'posts_per_page' => 1,
				'fields'         => 'ids',
				'orderby'        => 'date',
				'order'          => 'DESC',
				'no_found_rows'  => true,
			)
		);

		if ( empty( $latest_post->posts ) ) {
			return array();
		}

		$latest_post_id = (int) $latest_post->posts[0];
		$batch_id       = get_post_meta( $latest_post_id, Email_Log::META_BATCH_ID, true );

		if ( empty( $batch_id ) ) {
			return array();
		}

		$batch_query = new \WP_Query(
			array(
				'post_type'      => Email_Log::POST_TYPE,
				'post_status'    => $this->get_relevant_log_statuses(),
				// phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page
				'posts_per_page' => 10000,
				'fields'         => 'ids',
				'orderby'        => 'date',
				'order'          => 'DESC',
				'no_found_rows'  => true,
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				'meta_query'     => array(
					array(
						'key'   => Email_Log::META_BATCH_ID,
						'value' => $batch_id,
					),
				),
			)
		);

		return array_map( 'intval', $batch_query->posts );
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

	/**
	 * Gets the list of email log statuses considered for Site Health summaries.
	 *
	 * @since 1.166.0
	 *
	 * @return string[]
	 */
	private function get_relevant_log_statuses() {
		return array(
			Email_Log::STATUS_SENT,
			Email_Log::STATUS_FAILED,
			Email_Log::STATUS_SCHEDULED,
		);
	}
}
