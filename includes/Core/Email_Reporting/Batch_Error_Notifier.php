<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Batch_Error_Notifier
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email\Email;
use Google\Site_Kit\Core\Golinks\Golinks;

/**
 * Sends admin error notification emails when a batch fails completely.
 *
 * @since 1.175.0
 * @access private
 * @ignore
 */
class Batch_Error_Notifier {

	/**
	 * Non-sendable error categories.
	 *
	 * These categories indicate the mail system itself is broken or the error
	 * type does not warrant an admin email notification.
	 *
	 * @since 1.175.0
	 * @var string[]
	 */
	const NON_SENDABLE_CATEGORIES = array(
		'sending_error',
		'cron_scheduler_error',
	);

	/**
	 * Category ID to Content_Map key mapping.
	 *
	 * @since 1.175.0
	 * @var array
	 */
	const CATEGORY_CONTENT_MAP = array(
		'permissions_error' => 'permissions',
		'report_error'      => 'report',
		'server_error'      => 'server',
	);

	/**
	 * Batch query helper.
	 *
	 * @since 1.175.0
	 * @var Email_Log_Batch_Query
	 */
	private $batch_query;

	/**
	 * Email sender instance.
	 *
	 * @since 1.175.0
	 * @var Email
	 */
	private $email_sender;

	/**
	 * Plugin context instance.
	 *
	 * @since 1.175.0
	 * @var Context
	 */
	private $context;

	/**
	 * Golinks instance.
	 *
	 * @since 1.175.0
	 * @var Golinks
	 */
	private $golinks;

	/**
	 * Constructor.
	 *
	 * @since 1.175.0
	 *
	 * @param Email_Log_Batch_Query $batch_query  Batch query helper.
	 * @param Email                 $email_sender Email sender instance.
	 * @param Context               $context      Plugin context.
	 * @param Golinks               $golinks      Golinks instance.
	 */
	public function __construct(
		Email_Log_Batch_Query $batch_query,
		Email $email_sender,
		Context $context,
		Golinks $golinks
	) {
		$this->batch_query  = $batch_query;
		$this->email_sender = $email_sender;
		$this->context      = $context;
		$this->golinks      = $golinks;
	}

	/**
	 * Sends admin error notification if the batch has completely failed.
	 *
	 * Checks whether the batch has exhausted all retry attempts, the error
	 * category is sendable, and no notification has been sent yet. Sends
	 * to all WordPress administrators with manage_options capability.
	 *
	 * @since 1.175.0
	 *
	 * @param string $batch_id Batch identifier.
	 */
	public function maybe_notify( $batch_id ) {
		if ( ! $this->batch_query->is_batch_all_failed( $batch_id ) ) {
			return;
		}

		if ( $this->batch_query->is_batch_admin_notified( $batch_id ) ) {
			return;
		}

		$error_info  = $this->extract_error_info( $batch_id );
		$category_id = $error_info['category_id'];

		if ( in_array( $category_id, self::NON_SENDABLE_CATEGORIES, true ) ) {
			return;
		}

		$content_key = $this->resolve_content_key( $category_id, $error_info['module_slug'] );

		$admin_emails = $this->get_admin_emails();

		if ( empty( $admin_emails ) ) {
			return;
		}

		// Mark notified before sending (optimistic lock) to prevent
		// duplicate sends from concurrent Worker/Fallback execution.
		$this->batch_query->mark_batch_admin_notified( $batch_id );

		$template_data = $this->build_template_data( $content_key );

		$renderer     = new Email_Template_Renderer();
		$html_content = $renderer->render( 'simple-email', $template_data );
		$text_content = $renderer->render_text( 'simple-email', $template_data );

		if ( is_wp_error( $html_content ) || is_wp_error( $text_content ) ) {
			return;
		}

		$headers = $this->email_sender->build_headers();
		$subject = $template_data['subject'];

		foreach ( $admin_emails as $email ) {
			$this->email_sender->send( $email, $subject, $html_content, $headers, $text_content );
		}
	}

	/**
	 * Resolves the Content_Map key for the given category and module.
	 *
	 * Tries a module-specific key first (e.g. error-email-permissions-analytics-4),
	 * checking for body content existence, then falls back to the generic
	 * error-email key.
	 *
	 * @since 1.175.0
	 *
	 * @param string|null $category_id Error category ID.
	 * @param string|null $module_slug Module slug (e.g. analytics-4, search-console).
	 * @return string Content_Map key.
	 */
	private function resolve_content_key( $category_id, $module_slug ) {
		$category_suffix = self::CATEGORY_CONTENT_MAP[ $category_id ] ?? null;

		if ( $category_suffix && ! empty( $module_slug ) ) {
			$module_key = 'error-email-' . $category_suffix . '-' . $module_slug;

			if ( Content_Map::get_body( $module_key ) ) {
				return $module_key;
			}
		}

		return 'error-email';
	}

	/**
	 * Extracts error info from the first failed log in a batch.
	 *
	 * Handles all storage formats produced by Email_Log::sanitize_error_details():
	 * WP_Error JSON, plain string JSON, raw JSON, and empty string.
	 *
	 * @since 1.175.0
	 *
	 * @param string $batch_id Batch identifier.
	 * @return array Associative array with 'category_id' and 'module_slug' (both nullable).
	 */
	private function extract_error_info( $batch_id ) {
		$default = array(
			'category_id' => null,
			'module_slug' => null,
		);

		$error_details = $this->batch_query->get_batch_error_details( $batch_id );

		if ( empty( $error_details ) || ! is_string( $error_details ) ) {
			return $default;
		}

		$decoded = json_decode( $error_details, true );

		if ( ! is_array( $decoded ) ) {
			return $default;
		}

		// Standard WP_Error JSON structure: { errors: { code: [...] }, error_data: { code: { category_id: '...', module_slug: '...' } } }.
		if ( empty( $decoded['errors'] ) || empty( $decoded['error_data'] ) || ! is_array( $decoded['error_data'] ) ) {
			return $default;
		}

		$first_error_code = array_key_first( $decoded['errors'] );

		if ( null === $first_error_code ) {
			return $default;
		}

		$error_data = $decoded['error_data'][ $first_error_code ] ?? array();

		return array(
			'category_id' => $error_data['category_id'] ?? null,
			'module_slug' => $error_data['module_slug'] ?? null,
		);
	}

	/**
	 * Gets deduplicated admin email addresses.
	 *
	 * @since 1.175.0
	 *
	 * @return string[] Admin email addresses.
	 */
	private function get_admin_emails() {
		$users  = get_users( array( 'capability' => 'manage_options' ) );
		$emails = array();

		foreach ( $users as $user ) {
			if ( ! empty( $user->user_email ) ) {
				$emails[ $user->user_email ] = $user->user_email;
			}
		}

		return array_values( $emails );
	}

	/**
	 * Builds template data for the error-email template.
	 *
	 * @since 1.175.0
	 *
	 * @param string $content_key Content_Map key for title and body.
	 * @return array Template data matching the error-email contract.
	 */
	private function build_template_data( $content_key ) {
		$title = Content_Map::get_title( $content_key );
		if ( empty( $title ) ) {
			$title = Content_Map::get_title( 'error-email' );
		}

		$body_args = Content_Map::get_body_args( $content_key, $this->golinks );
		$body      = Content_Map::get_body_with_args( $content_key, $body_args );
		$domain    = $this->get_site_domain();

		$email_settings_url = $this->golinks->get_url( 'manage-subscription-email-reporting' );

		return array(
			'subject'                => $title,
			'preheader'              => $title,
			'site'                   => array(
				'domain' => $domain,
				'url'    => $this->context->get_reference_site_url(),
			),
			'title'                  => $title,
			'body'                   => $body,
			'primary_call_to_action' => array(
				'url'   => $this->golinks->get_url( 'dashboard' ),
				'label' => __( 'Go to dashboard', 'google-site-kit' ),
			),
			'footer'                 => array(
				'copy'            => __( 'You received this email because you signed up to receive email reports from Site Kit. If you do not want to receive these emails in the future you can unsubscribe', 'google-site-kit' ),
				'unsubscribe_url' => $email_settings_url,
			),
			'graphic'                => Content_Map::get_graphic_config( 'error-email' ),
			'footer_type'            => 'standard',
		);
	}

	/**
	 * Gets the site domain including subdirectory context.
	 *
	 * @since 1.175.0
	 *
	 * @return string Site domain string.
	 */
	private function get_site_domain() {
		$site_url = $this->context->get_reference_site_url();
		$parsed   = wp_parse_url( $site_url );

		if ( empty( $parsed['host'] ) ) {
			return $site_url;
		}

		$domain = $parsed['host'];

		if ( ! empty( $parsed['path'] ) && '/' !== $parsed['path'] ) {
			$domain .= untrailingslashit( $parsed['path'] );
		}

		return $domain;
	}
}
