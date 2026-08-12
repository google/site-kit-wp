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
	 * Captures wp_mail_failed errors during sending. Adds a default
	 * Content-Type: text/html; charset=UTF-8 header when no caller header is
	 * supplied, so wp_mail replacements that bypass PHPMailer still deliver
	 * HTML. When text_content is provided, it's set as the AltBody for
	 * multipart/alternative MIME emails.
	 *
	 * @since 1.168.0
	 * @since 1.170.0 Added $text_content parameter for plain text alternative.
	 * @since 1.180.0 Inject default text/html Content-Type when none is supplied.
	 *
	 * @param string|array $to           Array or comma-separated list of email addresses to send message.
	 * @param string       $subject      Email subject.
	 * @param string       $content      Message contents (HTML).
	 * @param array        $headers      Optional. Additional headers. A default text/html Content-Type is added when none is supplied. Default empty array.
	 * @param string       $text_content Optional. Plain text alternative content. Default empty string.
	 * @return bool|WP_Error True if the email was sent successfully, WP_Error on failure.
	 */
	public function send( $to, $subject, $content, $headers = array(), $text_content = '' ) {
		$this->last_error = null;

		$result = $this->send_email_and_catch_errors( $to, $subject, $content, $headers, $text_content );

		if ( null !== $this->last_error ) {
			return $this->last_error;
		}

		if ( false === $result ) {
			$this->set_last_error();
			return $this->last_error;
		}

		return true;
	}

	/**
	 * Sends an email via wp_mail while capturing any errors.
	 *
	 * Attaches a temporary listener to wp_mail_failed to capture errors during
	 * sending. Injects a default Content-Type: text/html header when no caller
	 * Content-Type is present, so wp_mail replacements that respect the headers
	 * argument deliver HTML. When text_content is set, uses phpmailer_init to
	 * attach it as AltBody. PHPMailer then upgrades the content type to
	 * multipart/alternative.
	 *
	 * @since 1.168.0
	 * @since 1.170.0 Added $text_content parameter for plain text alternative.
	 * @since 1.180.0 Inject default text/html Content-Type when none is supplied.
	 *
	 * @param string|array $to           Array or comma-separated list of email addresses to send message.
	 * @param string       $subject      Email subject.
	 * @param string       $content      Message contents (HTML).
	 * @param array        $headers      Additional headers.
	 * @param string       $text_content Optional. Plain text alternative content. Default empty string.
	 * @return bool Whether the email was sent successfully.
	 */
	protected function send_email_and_catch_errors( $to, $subject, $content, $headers = array(), $text_content = '' ) {
		add_action( 'wp_mail_failed', array( $this, 'set_last_error' ) );

		if ( ! is_array( $headers ) ) {
			$headers = array();
		}

		// Default to text/html so wp_mail replacements that don't fire
		// phpmailer_init still deliver as HTML.
		if ( ! $this->headers_contain_content_type( $headers ) ) {
			$headers[] = 'Content-Type: text/html; charset=UTF-8';
		}

		// Set up AltBody for multipart MIME email if text content is provided.
		$alt_body_callback = null;
		if ( ! empty( $text_content ) ) {
			$alt_body_callback = function ( $phpmailer ) use ( $text_content ) {
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- PHPMailer property.
				$phpmailer->AltBody = $text_content;
			};
			add_action( 'phpmailer_init', $alt_body_callback );
		}

		$result = wp_mail( $to, $subject, $content, $headers ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_mail_wp_mail

		// Clean up hooks.
		remove_action( 'wp_mail_failed', array( $this, 'set_last_error' ) );
		if ( null !== $alt_body_callback ) {
			remove_action( 'phpmailer_init', $alt_body_callback );
		}

		return $result;
	}

	/**
	 * Checks whether the headers array already contains a Content-Type header.
	 *
	 * Detection is case-insensitive and skips non-string entries.
	 *
	 * @since 1.180.0
	 *
	 * @param array $headers Headers array passed to wp_mail.
	 * @return bool True if a Content-Type header is present, false otherwise.
	 */
	private function headers_contain_content_type( array $headers ): bool {
		foreach ( $headers as $header ) {
			if ( ! is_string( $header ) ) {
				continue;
			}

			if ( 0 === stripos( ltrim( $header ), 'Content-Type:' ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Sets the last error from a failed email attempt.
	 *
	 * This method is public because it is used as a callback for the
	 * wp_mail_failed hook which requires public accessibility.
	 *
	 * @since 1.168.0
	 *
	 * @param WP_Error|object|null $error The error from wp_mail_failed hook. We don't assume this to be
	 *                             WP_Error. Some plugins that implement `wp_mail()` might not
	 *                             always pass a `WP_Error` when doing the `wp_mail_failed` action.
	 */
	public function set_last_error( $error = null ) {
		if ( $error instanceof WP_Error ) {
			$this->last_error = $error;
			return;
		}

		$this->last_error = new WP_Error( 'wp_mail_failed', __( 'Failed to send email.', 'google-site-kit' ) );
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
