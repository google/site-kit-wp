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
 * @since 1.166.0
 * @access private
 * @ignore
 */
final class Email_Log {

	use Method_Proxy_Trait;

	/**
	 * Post type slug.
	 *
	 * @since 1.166.0
	 */
	const POST_TYPE = 'gsk_email_log';

	/**
	 * Report frequency meta key.
	 *
	 * @since 1.166.0
	 */
	const META_REPORT_FREQUENCY = '_report_frequency';

	/**
	 * Batch ID meta key.
	 *
	 * @since 1.166.0
	 */
	const META_BATCH_ID = '_batch_id';

	/**
	 * Maximum length for stored log strings (MySQL utf8mb4 index safety).
	 *
	 * @since 1.166.0
	 */
	const META_STRING_MAX_LENGTH = 191;

	/**
	 * Send attempts meta key.
	 *
	 * @since 1.166.0
	 */
	const META_SEND_ATTEMPTS = '_send_attempts';

	/**
	 * Error details meta key.
	 *
	 * @since 1.166.0
	 */
	const META_ERROR_DETAILS = '_error_details';

	/**
	 * Report reference dates meta key.
	 *
	 * @since 1.166.0
	 */
	const META_REPORT_REFERENCE_DATES = '_report_reference_dates';

	/**
	 * Email log post statuses.
	 *
	 * Slugs must stay within the posts table varchar(20) limit.
	 *
	 * @since 1.166.0
	 */
	const STATUS_SENT      = 'gsk_email_sent';
	const STATUS_FAILED    = 'gsk_email_failed';
	const STATUS_SCHEDULED = 'gsk_email_scheduled';

	/**
	 * Extracts a normalized date range array from an email log post.
	 *
	 * @since 1.167.0
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
		$keys       = array(
			'startDate'        => 'startDate',
			'sendDate'         => 'endDate',
			'compareStartDate' => 'compareStartDate',
			'compareEndDate'   => 'compareEndDate',
		);

		foreach ( $keys as $key => $alias ) {
			if ( ! isset( $decoded[ $key ] ) ) {
				continue;
			}

			$formatted = self::format_reference_date( $decoded[ $key ] );
			if ( null !== $formatted ) {
				$normalized[ $alias ] = $formatted;
			}
		}

		if ( empty( $normalized['startDate'] ) || empty( $normalized['endDate'] ) ) {
			return null;
		}

		return $normalized;
	}

	/**
	 * Validates an email log and returns decoded reference date metadata.
	 *
	 * @since 1.167.0
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
	 * Validates and normalizes a reference date value into a UNIX timestamp.
	 *
	 * @since 1.167.0
	 *
	 * @param mixed $value Date value.
	 * @return int|null UNIX timestamp or null on failure.
	 */
	protected static function validate_reference_date( $value ) {
		if ( '' === $value || null === $value ) {
			return null;
		}

		$timestamp = is_numeric( $value ) ? (int) $value : strtotime( $value );
		if ( empty( $timestamp ) || $timestamp < 0 ) {
			return null;
		}

		return $timestamp;
	}

	/**
	 * Formats a timestamp or date string stored in reference date meta.
	 *
	 * @since 1.167.0
	 *
	 * @param mixed $value Date value.
	 * @return string|null
	 */
	protected static function format_reference_date( $value ) {
		$timestamp = self::validate_reference_date( $value );
		if ( null === $timestamp ) {
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
	 * @since 1.166.0
	 */
	public function register() {
		add_action( 'init', $this->get_method_proxy_once( 'register_email_log' ) );
	}

	/**
	 * Registers the email log post type, statuses, and meta.
	 *
	 * @since 1.166.0
	 */
	protected function register_email_log() {
		$this->register_post_type();
		$this->register_post_statuses();
		$this->register_post_meta();
	}

	/**
	 * Registers the internal email log post type.
	 *
	 * @since 1.166.0
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
	 * @since 1.166.0
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
	 * @since 1.166.0
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
	 * @since 1.166.0
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
	 * Strips unsafe characters and limits identifier string length so IDs
	 * remain index-safe in MySQL databases.
	 *
	 * @since 1.166.0
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
	 * @since 1.166.0
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
	 * @since 1.166.0
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
	 * @since 1.166.0
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
	 * @since 1.166.0
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
