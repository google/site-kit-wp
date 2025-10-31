<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Log
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Core\User\Email_Reporting_Settings as Reporting_Settings;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Registers the internal Email Reporting log storage.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Email_Log {

	use Method_Proxy_Trait;

	/**
	 * Post type slug.
	 */
	const POST_TYPE = 'gsk_email_log';

	/**
	 * Report frequency meta key.
	 */
	const META_REPORT_FREQUENCY = '_report_frequency';

	/**
	 * Batch ID meta key.
	 */
	const META_BATCH_ID = '_batch_id';

	/**
	 * Send attempts meta key.
	 */
	const META_SEND_ATTEMPTS = '_send_attempts';

	/**
	 * Error details meta key.
	 */
	const META_ERROR_DETAILS = '_error_details';

	/**
	 * Report reference dates meta key.
	 */
	const META_REPORT_REFERENCE_DATES = '_report_reference_dates';

	/**
	 * Email log post statuses.
	 *
	 * Slugs must stay within the posts table varchar(20) limit.
	 */
	const STATUS_SENT      = 'gsk_email_sent';
	const STATUS_FAILED    = 'gsk_email_failed';
	const STATUS_SCHEDULED = 'gsk_email_scheduled';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'init', $this->get_method_proxy_once( 'register_email_log' ) );
	}

	/**
	 * Registers the email log post type, statuses, and meta.
	 *
	 * @since n.e.x.t
	 */
	protected function register_email_log() {
		$this->register_post_type();
		$this->register_post_statuses();
		$this->register_post_meta();
	}

	/**
	 * Registers the internal email log post type.
	 *
	 * @since n.e.x.t
	 */
	protected function register_post_type() {
		if ( post_type_exists( self::POST_TYPE ) ) {
			return;
		}

		register_post_type(
			self::POST_TYPE,
			array(
				'public'       => false,
				'map_meta_cap' => true,
				'rewrite'      => false,
				'query_var'    => false,
			)
		);
	}

	/**
	 * Registers internal delivery statuses.
	 *
	 * @since n.e.x.t
	 */
	protected function register_post_statuses() {
		$statuses = array(
			self::STATUS_SENT      => array(
				'label'       => __( 'Sent', 'google-site-kit' ),
				/* translators: %s: Number of sent email reports. */
				'label_count' => _n_noop(
					'Sent <span class="count">(%s)</span>',
					'Sent <span class="count">(%s)</span>',
					'google-site-kit'
				),
			),
			self::STATUS_FAILED    => array(
				'label'       => __( 'Failed', 'google-site-kit' ),
				/* translators: %s: Number of failed email reports. */
				'label_count' => _n_noop(
					'Failed <span class="count">(%s)</span>',
					'Failed <span class="count">(%s)</span>',
					'google-site-kit'
				),
			),
			self::STATUS_SCHEDULED => array(
				'label'       => __( 'Scheduled', 'google-site-kit' ),
				/* translators: %s: Number of scheduled email reports. */
				'label_count' => _n_noop(
					'Scheduled <span class="count">(%s)</span>',
					'Scheduled <span class="count">(%s)</span>',
					'google-site-kit'
				),
			),
		);

		foreach ( $statuses as $slug => $status ) {
			register_post_status(
				$slug,
				array(
					'label'                     => $status['label'],
					'public'                    => false,
					'internal'                  => true,
					'exclude_from_search'       => true,
					'show_in_admin_all_list'    => false,
					'show_in_admin_status_list' => false,
					'label_count'               => $status['label_count'],
				)
			);
		}
	}

	/**
	 * Registers meta data for the email log post type.
	 *
	 * @since n.e.x.t
	 */
	protected function register_post_meta() {
		$auth_callback = array( __CLASS__, 'meta_auth_callback' );

		register_post_meta(
			self::POST_TYPE,
			self::META_REPORT_FREQUENCY,
			array(
				'type'              => 'string',
				'single'            => true,
				'auth_callback'     => $auth_callback,
				'sanitize_callback' => array( __CLASS__, 'sanitize_frequency' ),
			)
		);

		register_post_meta(
			self::POST_TYPE,
			self::META_BATCH_ID,
			array(
				'type'              => 'string',
				'single'            => true,
				'auth_callback'     => $auth_callback,
				'sanitize_callback' => array( __CLASS__, 'sanitize_batch_id' ),
			)
		);

		register_post_meta(
			self::POST_TYPE,
			self::META_SEND_ATTEMPTS,
			array(
				'type'              => 'integer',
				'single'            => true,
				'auth_callback'     => $auth_callback,
				'sanitize_callback' => array( __CLASS__, 'sanitize_attempts' ),
			)
		);

		register_post_meta(
			self::POST_TYPE,
			self::META_ERROR_DETAILS,
			array(
				'type'              => 'string',
				'single'            => true,
				'auth_callback'     => $auth_callback,
				'sanitize_callback' => array( __CLASS__, 'sanitize_error_details' ),
			)
		);

		register_post_meta(
			self::POST_TYPE,
			self::META_REPORT_REFERENCE_DATES,
			array(
				'type'              => 'string',
				'single'            => true,
				'auth_callback'     => $auth_callback,
				'sanitize_callback' => array( __CLASS__, 'sanitize_reference_dates' ),
			)
		);
	}

	/**
	 * Sanitizes the report frequency meta value.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value Meta value.
	 * @return string Sanitized value.
	 */
	public static function sanitize_frequency( $value ) {
		$allowed = array(
			Reporting_Settings::FREQUENCY_WEEKLY,
			Reporting_Settings::FREQUENCY_MONTHLY,
			Reporting_Settings::FREQUENCY_QUARTERLY,
		);
		$value   = is_string( $value ) ? strtolower( $value ) : '';

		return in_array( $value, $allowed, true ) ? $value : '';
	}

	/**
	 * Sanitizes the batch ID meta value.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value Meta value.
	 * @return string Sanitized value.
	 */
	public static function sanitize_batch_id( $value ) {
		$value = sanitize_text_field( (string) $value );

		return function_exists( 'mb_substr' ) ? mb_substr( $value, 0, 191 ) : substr( $value, 0, 191 );
	}

	/**
	 * Sanitizes the send attempts meta value.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value Meta value.
	 * @return int Sanitized value.
	 */
	public static function sanitize_attempts( $value ) {
		if ( (int) $value < 0 ) {
			return 0;
		}

		return absint( $value );
	}

	/**
	 * Sanitizes the error details meta value.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value Meta value.
	 * @return string Sanitized value.
	 */
	public static function sanitize_error_details( $value ) {
		if ( is_wp_error( $value ) ) {
			$value = array(
				'errors'     => $value->errors,
				'error_data' => $value->error_data,
			);
		}

		if ( is_array( $value ) || is_object( $value ) ) {
			$encoded = wp_json_encode( $value, JSON_UNESCAPED_UNICODE );
			return is_string( $encoded ) ? $encoded : '';
		}

		if ( is_string( $value ) ) {
			// Treat existing JSON strings as-is by checking decode status instead of rebuilding them.
			json_decode( $value, true );
			if ( json_last_error() === JSON_ERROR_NONE ) {
				return $value;
			}

			$encoded = wp_json_encode(
				array(
					'message' => $value,
				),
				JSON_UNESCAPED_UNICODE
			);

			return is_string( $encoded ) ? $encoded : '';
		}

		return '';
	}

	/**
	 * Sanitizes the report reference dates meta value.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value Meta value.
	 * @return string Sanitized value.
	 */
	public static function sanitize_reference_dates( $value ) {
		if ( ! is_array( $value ) && ! is_object( $value ) ) {
			return '';
		}

		$keys = array( 'startDate', 'sendDate', 'compareStartDate', 'compareEndDate' );
		$in   = (array) $value;
		$out  = array_fill_keys( $keys, 0 );

		foreach ( $keys as $key ) {
			if ( isset( $in[ $key ] ) ) {
				$out[ $key ] = absint( $in[ $key ] );
			}
		}

		$encoded = wp_json_encode( $out, JSON_UNESCAPED_UNICODE );

		return is_string( $encoded ) ? $encoded : '';
	}

	/**
	 * Authorization callback for protected log meta.
	 *
	 * Ensures only internal workflows (cron/init) or administrators touch the
	 * private log metadata so the CPT stays non-public.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool
	 */
	public static function meta_auth_callback() {
		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		if ( wp_doing_cron() ) {
			return true;
		}

		if ( doing_action( 'init' ) ) {
			return true;
		}

		return false;
	}
}
