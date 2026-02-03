<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Report_Sender
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Core\Email\Email;
use WP_Error;
use WP_User;

/**
 * Renders and sends email reports.
 *
 * @since 1.170.0
 * @access private
 * @ignore
 */
class Email_Report_Sender {

	/**
	 * Template renderer factory.
	 *
	 * @since 1.170.0
	 * @var Email_Template_Renderer_Factory
	 */
	private $template_renderer_factory;

	/**
	 * Email sender instance.
	 *
	 * @since 1.170.0
	 * @var Email
	 */
	private $email_sender;

	/**
	 * Constructor.
	 *
	 * @since 1.170.0
	 *
	 * @param Email_Template_Renderer_Factory $template_renderer_factory Template renderer factory.
	 * @param Email                           $email_sender              Email sender instance.
	 */
	public function __construct( Email_Template_Renderer_Factory $template_renderer_factory, Email $email_sender ) {
		$this->template_renderer_factory = $template_renderer_factory;
		$this->email_sender              = $email_sender;
	}

	/**
	 * Renders and sends the report email.
	 *
	 * Renders both HTML and plain text versions of the email and sends
	 * them as a multipart/alternative MIME email.
	 *
	 * @since 1.170.0
	 *
	 * @param WP_User $user             Recipient user.
	 * @param array   $sections_payload Sections payload.
	 * @param array   $template_data    Template data.
	 * @return true|WP_Error True on success, WP_Error on failure.
	 */
	public function send( WP_User $user, $sections_payload, $template_data ) {
		$renderer = $this->template_renderer_factory->create( $sections_payload );

		if ( ! $renderer instanceof Email_Template_Renderer ) {
			return new WP_Error( 'email_report_renderer_missing', __( 'Unable to render email template.', 'google-site-kit' ) );
		}

		$html_content = $this->render_template( $renderer, $template_data );

		if ( is_wp_error( $html_content ) ) {
			return $html_content;
		}

		$text_content = $this->render_text_template( $renderer, $template_data );

		if ( is_wp_error( $text_content ) ) {
			return $text_content;
		}

		$send_result = $this->email_sender->send(
			$user->user_email,
			$template_data['subject'] ?? '',
			$html_content,
			array(),
			$text_content
		);

		if ( is_wp_error( $send_result ) || false === $send_result ) {
			return is_wp_error( $send_result )
				? $send_result
				: new WP_Error( 'email_report_send_failed', __( 'Failed to send email report.', 'google-site-kit' ) );
		}

		return true;
	}

	/**
	 * Renders the email HTML.
	 *
	 * @since 1.170.0
	 *
	 * @param Email_Template_Renderer $renderer      Template renderer instance.
	 * @param array                   $template_data Template data.
	 * @return string|WP_Error Rendered HTML or WP_Error.
	 */
	private function render_template( Email_Template_Renderer $renderer, $template_data ) {
		$rendered = $renderer->render( 'email-report', $template_data );

		if ( is_wp_error( $rendered ) ) {
			return $rendered;
		}

		if ( '' === trim( $rendered ) ) {
			return new WP_Error( 'email_report_render_failed', __( 'Unable to render email template.', 'google-site-kit' ) );
		}

		return $rendered;
	}

	/**
	 * Renders the email plain text.
	 *
	 * @since 1.170.0
	 *
	 * @param Email_Template_Renderer $renderer      Template renderer instance.
	 * @param array                   $template_data Template data.
	 * @return string|WP_Error Rendered plain text or WP_Error.
	 */
	private function render_text_template( Email_Template_Renderer $renderer, $template_data ) {
		$rendered = $renderer->render_text( 'email-report', $template_data );

		if ( is_wp_error( $rendered ) ) {
			return $rendered;
		}

		if ( '' === trim( $rendered ) ) {
			return new WP_Error( 'email_report_text_render_failed', __( 'Unable to render plain text email template.', 'google-site-kit' ) );
		}

		return $rendered;
	}
}
