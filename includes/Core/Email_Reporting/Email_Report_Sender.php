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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Email_Report_Sender {

	/**
	 * Template renderer factory.
	 *
	 * @since n.e.x.t
	 * @var Email_Template_Renderer_Factory
	 */
	private $template_renderer_factory;

	/**
	 * Email sender instance.
	 *
	 * @since n.e.x.t
	 * @var Email
	 */
	private $email_sender;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @param WP_User $user             Recipient user.
	 * @param array   $sections_payload Sections payload.
	 * @param array   $template_data    Template data.
	 * @return true|WP_Error True on success, WP_Error on failure.
	 */
	public function send( WP_User $user, $sections_payload, $template_data ) {
		$email_content = $this->render_template( $sections_payload, $template_data );

		if ( is_wp_error( $email_content ) ) {
			return $email_content;
		}

		$send_result = $this->email_sender->send(
			$user->user_email,
			$template_data['subject'] ?? '',
			$email_content
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
	 * @since n.e.x.t
	 *
	 * @param array $sections_payload Sections payload.
	 * @param array $template_data    Template data.
	 * @return string|WP_Error Rendered HTML or WP_Error.
	 */
	private function render_template( $sections_payload, $template_data ) {
		$renderer = $this->template_renderer_factory->create( $sections_payload );

		if ( ! $renderer instanceof Email_Template_Renderer ) {
			return new WP_Error( 'email_report_renderer_missing', __( 'Unable to render email template.', 'google-site-kit' ) );
		}

		$rendered = $renderer->render( 'email-report', $template_data );

		if ( is_wp_error( $rendered ) || '' === trim( $rendered ) ) {
			return new WP_Error( 'email_report_render_failed', __( 'Unable to render email template.', 'google-site-kit' ) );
		}

		return $rendered;
	}
}
