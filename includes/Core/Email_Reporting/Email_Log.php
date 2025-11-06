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
	 * Maximum length for stored log strings (MySQL utf8mb4 index safety).
	 */
	const META_STRING_MAX_LENGTH = 191;

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
	 * Extracts a normalized date range array from an email log post.
	 *
	 * @param mixed $email_log Potential email log post.
	 * @return array|null
	 */
	public static function get_date_range_from_log( $email_log ) {
		$decoded = self::validate_and_decode_email_log( $email_log );
		if ( null === $decoded ) {
			return null;
		}

		$normalized = array();
		$start      = isset( $decoded['startDate'] ) ? self::format_reference_date( $decoded['startDate'] ) : null;
		if ( $start ) {
			$normalized['startDate'] = $start;
		}

		$send = isset( $decoded['sendDate'] ) ? self::format_reference_date( $decoded['sendDate'] ) : null;
		if ( $send ) {
			$normalized['endDate'] = $send;
		}

		$compare_start = isset( $decoded['compareStartDate'] ) ? self::format_reference_date( $decoded['compareStartDate'] ) : null;
		if ( $compare_start ) {
			$normalized['compareStartDate'] = $compare_start;
		}

		$compare_end = isset( $decoded['compareEndDate'] ) ? self::format_reference_date( $decoded['compareEndDate'] ) : null;
		if ( $compare_end ) {
			$normalized['compareEndDate'] = $compare_end;
		}

		if ( empty( $normalized['startDate'] ) || empty( $normalized['endDate'] ) ) {
			return null;
		}

		return $normalized;
	}

	/**
	 * Validates an email log and returns decoded reference date metadata.
	 *
	 * @param mixed $email_log Potential email log post.
	 * @return array|null Decoded reference date metadata, or null on failure.
	 */
	protected static function validate_and_decode_email_log( $email_log ) {
		if ( ! ( $email_log instanceof \WP_Post ) ) {
			return null;
		}

		if ( self::POST_TYPE !== $email_log->post_type ) {
			return null;
		}

		$raw = get_post_meta( $email_log->ID, self::META_REPORT_REFERENCE_DATES, true );
		if ( empty( $raw ) ) {
			return null;
		}

		if ( is_string( $raw ) ) {
			$decoded = json_decode( $raw, true );
			if ( JSON_ERROR_NONE !== json_last_error() ) {
				return null;
			}
		} elseif ( is_array( $raw ) ) {
			$decoded = $raw;
		} else {
			return null;
		}

		return $decoded;
	}

	/**
	 * Formats a timestamp or date string stored in reference date meta.
	 *
	 * @param mixed $value Date value.
	 * @return string|null
	 */
	protected static function format_reference_date( $value ) {
		if ( '' === $value || null === $value ) {
			return null;
		}

		if ( is_numeric( $value ) ) {
			$timestamp = (int) $value;
			if ( $timestamp <= 0 ) {
				return null;
			}
		} else {
			$timestamp = strtotime( (string) $value );
		}

		if ( false === $timestamp ) {
			return null;
		}

		if ( function_exists( 'wp_timezone' ) && function_exists( 'wp_date' ) ) {
			$timezone = wp_timezone();
			if ( $timezone ) {
				return wp_date( 'Y-m-d', $timestamp, $timezone );
			}
		}

		return gmdate( 'Y-m-d', $timestamp );
	}

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
			self::STATUS_SENT,
			self::STATUS_FAILED,
			self::STATUS_SCHEDULED,
		);

		foreach ( $statuses as $key => $status ) {
			register_post_status(
				$status,
				array(
					'public'                    => false,
					'internal'                  => true,
					'exclude_from_search'       => true,
					'show_in_admin_all_list'    => false,
					'show_in_admin_status_list' => false,
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
	 * Allows only known scheduling frequencies, normalizing strings to lowercase.
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
	 * Strips unsafe characters and clamps identifiers so they remain index-safe.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value Meta value.
	 * @return string Sanitized value.
	 */
	public static function sanitize_batch_id( $value ) {
		$value = sanitize_text_field( (string) $value );

		return substr( $value, 0, self::META_STRING_MAX_LENGTH );
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
	 * Converts WP_Error instances and other payloads into JSON for storage.
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
	 * Extracts known timestamps, coercing them to integers before encoding.
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

		$keys      = array( 'startDate', 'sendDate', 'compareStartDate', 'compareEndDate' );
		$raw_dates = (array) $value;
		// Pre-seed ( 'startDate', 'sendDate', 'compareStartDate', 'compareEndDate' ) keys
		// so missing timestamps normalize to 0 and consumers always see a full schema.
		$normalized = array_fill_keys( $keys, 0 );

		foreach ( $keys as $key ) {
			if ( isset( $raw_dates[ $key ] ) ) {
				$normalized[ $key ] = absint( $raw_dates[ $key ] );
			}
		}

		$encoded = wp_json_encode( $normalized, JSON_UNESCAPED_UNICODE );

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
