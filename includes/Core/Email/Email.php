<?php
/**
 * Class Google\Site_Kit\Core\Email\Email
 *
 * @package   Google\Site_Kit\Core\Email
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email;

use WP_Error;

/**
 * Class for sending emails with Site Kit branding.
 *
 * @since 1.168.0
 * @access private
 * @ignore
 */
class Email {

	/**
	 * Stores the last error from wp_mail.
	 *
	 * @since 1.168.0
	 * @var WP_Error|null
	 */
	protected $last_error = null;

	/**
	 * Builds email headers with Site Kit branding.
	 *
	 * Fetches the filtered From email via wp_mail_from filter,
	 * overrides the From name to "Site Kit", and merges with
	 * caller-supplied headers.
	 *
	 * @since 1.168.0
	 *
	 * @param array $headers Optional. Additional headers to merge. Default empty array.
	 * @return array Final header array with Site Kit branding.
	 */
	public function build_headers( $headers = array() ) {
		$from_email = apply_filters( 'wp_mail_from', '' );

		if ( empty( $from_email ) || ! is_email( $from_email ) ) {
			$from_email = get_option( 'admin_email' );
		}

		$from_header = sprintf( 'From: Site Kit <%s>', $from_email );

		if ( ! is_array( $headers ) ) {
			$headers = array();
		}

		// Merge the From header with caller-supplied headers.
		// Place the From header first.
		$final_headers = array_merge( array( $from_header ), $headers );

		return $final_headers;
	}

	/**
	 * Sends an email using wp_mail with error tracking.
	 *
	 * Wraps wp_mail with a scoped listener for wp_mail_failed hook
	 * to capture any errors during sending.
	 *
	 * @since 1.168.0
	 *
	 * @param string|array $to      Array or comma-separated list of email addresses to send message.
	 * @param string       $subject Email subject.
	 * @param string       $content Message contents.
	 * @param array        $headers Optional. Additional headers. Default empty array.
	 * @return bool|WP_Error True if the email was sent successfully, WP_Error on failure.
	 */
	public function send( $to, $subject, $content, $headers = array() ) {
		$this->last_error = null;

		$result = $this->send_email_and_catch_errors( $to, $subject, $content, $headers );

		if ( false === $result || $this->last_error instanceof WP_Error ) {
			if ( $this->last_error instanceof WP_Error ) {
				return $this->last_error;
			}

			$this->set_last_error( new WP_Error( 'wp_mail_failed', __( 'Failed to send email.', 'google-site-kit' ) ) );
			return $this->last_error;
		}

		return true;
	}

	/**
	 * Sends an email via wp_mail while capturing any errors.
	 *
	 * Attaches a temporary listener to the wp_mail_failed hook to capture
	 * any errors that occur during sending.
	 *
	 * @since 1.168.0
	 *
	 * @param string|array $to      Array or comma-separated list of email addresses to send message.
	 * @param string       $subject Email subject.
	 * @param string       $content Message contents.
	 * @param array        $headers Additional headers.
	 * @return bool Whether the email was sent successfully.
	 */
	protected function send_email_and_catch_errors( $to, $subject, $content, $headers ) {
		add_action( 'wp_mail_failed', array( $this, 'set_last_error' ) );

		$result = wp_mail( $to, $subject, $content, $headers ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_mail_wp_mail

		remove_action( 'wp_mail_failed', array( $this, 'set_last_error' ) );

		return $result;
	}

	/**
	 * Sets the last error from a failed email attempt.
	 *
	 * This method is public because it is used as a callback for the
	 * wp_mail_failed hook which requires public accessibility.
	 *
	 * @since 1.168.0
	 *
	 * @param WP_Error $error The error from wp_mail_failed hook.
	 */
	public function set_last_error( WP_Error $error ) {
		$this->last_error = $error;
	}

	/**
	 * Gets the last error from the most recent send attempt.
	 *
	 * @since 1.168.0
	 *
	 * @return WP_Error|null The last error if one occurred, null otherwise.
	 */
	public function get_last_error() {
		return $this->last_error;
	}
}
