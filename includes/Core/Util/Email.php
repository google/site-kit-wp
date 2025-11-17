<?php
/**
 * Class Google\Site_Kit\Core\Util\Email
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use WP_Error;

/**
 * Class for sending emails with Site Kit branding.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Email {

	/**
	 * Stores the last error from wp_mail.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @param array $headers Optional. Additional headers to merge. Default empty array.
	 * @return array Final header array with Site Kit branding.
	 */
	public function build_headers( $headers = array() ) {
		// Get the filtered From email address.
		$from_email = apply_filters( 'wp_mail_from', '' );

		// Build the From header with Site Kit name.
		$from_header = sprintf( 'From: Site Kit <%s>', $from_email );

		// Ensure headers is an array.
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
	 * @since n.e.x.t
	 *
	 * @param string|array $to      Array or comma-separated list of email addresses to send message.
	 * @param string       $subject Email subject.
	 * @param string       $content Message contents.
	 * @param array        $headers Optional. Additional headers. Default empty array.
	 * @return bool|WP_Error True if the email was sent successfully, WP_Error on failure.
	 */
	public function send( $to, $subject, $content, $headers = array() ) {
		// Reset last error.
		$this->last_error = null;

		// Define a closure to capture wp_mail_failed errors.
		$listener = function ( WP_Error $error ) {
			$this->last_error = $error;
		};

		// Add the listener before sending, attempt to send the email and remove
		// the listener immediately after wp_mail returns.
		add_action( 'wp_mail_failed', $listener );
		$result = wp_mail( $to, $subject, $content, $headers ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_mail_wp_mail
		remove_action( 'wp_mail_failed', $listener );

		// If wp_mail returned false or we captured an error, return the error.
		if ( false === $result || $this->last_error instanceof WP_Error ) {
			// If we have a captured error, return it.
			if ( $this->last_error instanceof WP_Error ) {
				return $this->last_error;
			}

			// Otherwise, create a generic error.
			$this->last_error = new WP_Error( 'wp_mail_failed', __( 'Failed to send email.', 'google-site-kit' ) );
			return $this->last_error;
		}

		return true;
	}

	/**
	 * Gets the last error from the most recent send attempt.
	 *
	 * @since n.e.x.t
	 *
	 * @return WP_Error|null The last error if one occurred, null otherwise.
	 */
	public function get_last_error() {
		return $this->last_error;
	}
}
