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
	 * to capture any errors during sending. When text_content is provided,
	 * the message is sent as a multipart/alternative MIME email containing
	 * both the HTML body and the plain text alternative; otherwise it is
	 * sent as a single-part text/html message.
	 *
	 * @since 1.168.0
	 * @since 1.170.0 Added $text_content parameter for plain text alternative.
	 * @since n.e.x.t Composes a real multipart/alternative body and signals HTML content explicitly so HTML survives pluggable wp_mail() replacements (e.g. Post SMTP).
	 *
	 * @param string|array $to           Array or comma-separated list of email addresses to send message.
	 * @param string       $subject      Email subject.
	 * @param string       $content      Message contents (HTML).
	 * @param array        $headers      Optional. Additional headers. Default empty array.
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
	 * Attaches a temporary listener to the wp_mail_failed hook to capture
	 * any errors that occur during sending. When text_content is provided,
	 * composes a real RFC 2046 multipart/alternative body and signals it via
	 * the matching Content-Type header. The body and the header are passed
	 * to wp_mail() through its public contract, so any compliant mailer —
	 * WP core (PHPMailer), WP Mail SMTP, FluentSMTP, Post SMTP, and any
	 * other drop-in replacement — sees both parts. No PHPMailer-specific
	 * hooks are used; the message is self-describing on the wp_mail() API.
	 *
	 * @since 1.168.0
	 * @since 1.170.0 Added $text_content parameter for plain text alternative.
	 * @since n.e.x.t Composes a multipart/alternative body so HTML and plain text survive any pluggable wp_mail() replacement.
	 *
	 * @param string|array $to           Array or comma-separated list of email addresses to send message.
	 * @param string       $subject      Email subject.
	 * @param string       $content      Message contents (HTML).
	 * @param array        $headers      Additional headers.
	 * @param string       $text_content Optional. Plain text alternative content. Default empty string.
	 * @return bool Whether the email was sent successfully.
	 */
	protected function send_email_and_catch_errors( $to, $subject, $content, $headers, $text_content = '' ) {
		add_action( 'wp_mail_failed', array( $this, 'set_last_error' ) );

		if ( ! is_array( $headers ) ) {
			$headers = array();
		}

		$message = $content;

		// When the caller supplied a Content-Type, respect it verbatim and
		// skip both multipart composition and the default text/html injection
		// so the caller's intent (e.g. plain text only) is preserved
		// end-to-end.
		if ( ! $this->headers_contain_content_type( $headers ) ) {
			if ( '' !== $text_content ) {
				// Compose a real multipart/alternative body and the matching
				// Content-Type header. wp_mail() (and any drop-in replacement)
				// forwards both onto the underlying mailer, which sees a
				// self-describing message and emits both parts to the recipient.
				$boundary  = '----=_SiteKit_' . wp_generate_password( 24, false );
				$message   = $this->compose_multipart_body( $content, $text_content, $boundary );
				$headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';
			} else {
				$headers[] = 'Content-Type: text/html; charset=UTF-8';
			}
		}

		$result = wp_mail( $to, $subject, $message, $headers ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_mail_wp_mail

		remove_action( 'wp_mail_failed', array( $this, 'set_last_error' ) );

		return $result;
	}

	/**
	 * Checks whether a headers array already contains a Content-Type header.
	 *
	 * Performs a case-insensitive match on the header name only so that
	 * caller-supplied Content-Type values (any media type) are preserved
	 * verbatim and never duplicated.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $headers Headers array as accepted by wp_mail().
	 * @return bool True if a Content-Type header is present, false otherwise.
	 */
	private function headers_contain_content_type( array $headers ) {
		foreach ( $headers as $header ) {
			if ( is_string( $header ) && 0 === stripos( ltrim( $header ), 'content-type:' ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Composes an RFC 2046 multipart/alternative body.
	 *
	 * Plain text is emitted first and HTML second per the multipart/alternative
	 * convention (simplest to most complex). Lines use CRLF line endings and
	 * 8bit transfer encoding so UTF-8 content passes through verbatim on
	 * 8BITMIME-capable transports.
	 *
	 * Both parts are normalised to CRLF before embedding. Some downstream
	 * mailers (notably Post SMTP) re-parse the multipart body line by line
	 * via `explode(PHP_EOL, $body)` and concatenate captured lines without
	 * re-inserting any delimiter; with CRLF normalisation each line keeps a
	 * trailing CR through that parser, which preserves visible line breaks
	 * in the recipient's plain-text view.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $html_content HTML body.
	 * @param string $text_content Plain text alternative.
	 * @param string $boundary     Boundary delimiter (without leading dashes).
	 * @return string The composed multipart body.
	 */
	private function compose_multipart_body( $html_content, $text_content, $boundary ) {
		$crlf = "\r\n";

		$text_content = $this->normalize_line_endings( $text_content );
		$html_content = $this->normalize_line_endings( $html_content );

		$body  = 'This is a multi-part message in MIME format.' . $crlf . $crlf;
		$body .= '--' . $boundary . $crlf;
		$body .= 'Content-Type: text/plain; charset=UTF-8' . $crlf;
		$body .= 'Content-Transfer-Encoding: 8bit' . $crlf . $crlf;
		$body .= $text_content . $crlf;
		$body .= '--' . $boundary . $crlf;
		$body .= 'Content-Type: text/html; charset=UTF-8' . $crlf;
		$body .= 'Content-Transfer-Encoding: 8bit' . $crlf . $crlf;
		$body .= $html_content . $crlf;
		$body .= '--' . $boundary . '--' . $crlf;

		return $body;
	}

	/**
	 * Normalises line endings to CRLF (RFC 2046).
	 *
	 * Replaces any combination of `\r\n`, `\r`, or `\n` with a single CRLF.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $content Content to normalise.
	 * @return string The content with CRLF line endings.
	 */
	private function normalize_line_endings( $content ) {
		return preg_replace( "/\r\n|\r|\n/", "\r\n", $content );
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
