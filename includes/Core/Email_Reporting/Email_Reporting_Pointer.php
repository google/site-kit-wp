<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Pointer
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Pointer;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;

/**
 * Admin pointer for Email Reporting onboarding.
 *
 * @since 1.166.0
 * @access private
 * @ignore
 */
final class Email_Reporting_Pointer {

	const SLUG = 'googlesitekit-email-reporting-pointer';

	/**
	 * Plugin context.
	 *
	 * @since 1.166.0
	 * @var Context
	 */
	private $context;

	/**
	 * User_Email_Reporting_Settings instance.
	 *
	 * @since 1.166.0
	 * @var User_Email_Reporting_Settings
	 */
	protected $user_settings;

	/**
	 * Dismissed_Items instance.
	 *
	 * @since 1.166.0
	 * @var Dismissed_Items
	 */
	protected $dismissed_items;

	/**
	 * Constructor.
	 *
	 * @since 1.166.0
	 *
	 * @param Context                       $context Plugin context.
	 * @param User_Options                  $user_options User options instance.
	 * @param User_Email_Reporting_Settings $user_settings User email reporting settings instance.
	 */
	public function __construct( Context $context, User_Options $user_options, User_Email_Reporting_Settings $user_settings ) {
		$this->context         = $context;
		$this->user_settings   = $user_settings;
		$this->dismissed_items = new Dismissed_Items( $user_options );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.166.0
	 */
	public function register() {
		add_filter(
			'googlesitekit_admin_pointers',
			function ( $pointers ) {
				$pointers[] = $this->get_email_reporting_pointer();
				return $pointers;
			}
		);
	}

	/**
	 * Builds the Email Reporting pointer.
	 *
	 * @since 1.166.0
	 *
	 * @return Pointer
	 */
	private function get_email_reporting_pointer() {
		return new Pointer(
			self::SLUG,
			array(
				// Title allows limited markup (button/span) sanitized via wp_kses in Pointers::print_pointer_script.
				'title'           => sprintf(
					'%s %s',
					__( 'Get site insights in your inbox', 'google-site-kit' ),
					'<button type="button" class="googlesitekit-pointer-cta--dismiss dashicons dashicons-no" data-action="dismiss">' .
					'<span class="screen-reader-text">' . esc_html__( 'Dismiss this notice.', 'google-site-kit' ) . '</span>' .
					'</button>'
				),
				// Return subtitle and content as HTML with safe tags.
				'content'         => function () {
					return sprintf(
						'<h4>%s</h4><p>%s</p>',
						__( 'Keep track of your site with Site Kit', 'google-site-kit' ),
						__( 'Receive the most important insights about your site’s performance, key trends, and tailored metrics directly in your inbox', 'google-site-kit' )
					);
				},
				// Site Kit menu in WP Admin.
				'target_id'       => 'toplevel_page_googlesitekit-dashboard',
				'position'        => 'top',
				'active_callback' => function ( $hook_suffix ) {
					// Only on the main WP Dashboard screen.
					if ( 'index.php' !== $hook_suffix ) {
						return false;
					}

					// User must have Site Kit access: either admin (can authenticate) or view-only (can view splash).
					if ( ! current_user_can( Permissions::VIEW_DASHBOARD ) ) {
						return false;
					}

					// Do not show if this pointer was already dismissed via core 'dismiss-wp-pointer'.
					$user_id               = get_current_user_id();
					$dismissed_wp_pointers = get_user_meta( $user_id, 'dismissed_wp_pointers', true );
					if ( $dismissed_wp_pointers ) {
						$dismissed_wp_pointers = explode( ',', $dismissed_wp_pointers );
						if ( in_array( self::SLUG, $dismissed_wp_pointers, true ) ) {
							return false;
						}
					}

					// If user is already subscribed to email reporting, bail early.
					if ( $this->user_settings->is_user_subscribed() ) {
						return false;
					}

					// If the overlay notification has already been dismissed, bail early.
					if ( $this->dismissed_items->is_dismissed( 'email-reporting-overlay-notification' ) ) {
						return false;
					}

					return true;
				},
				'class'           => 'googlesitekit-email-pointer',
				// Inline JS function to render CTA button and add delegated handlers for CTA and dismiss.
				'buttons'         => sprintf(
					'<a class="googlesitekit-pointer-cta button-primary" data-action="dismiss" href="%s">%s</a>',
					$this->context->admin_url( 'dashboard', array( 'email-reporting-panel' => 1 ) ),
					esc_html__( 'Set up', 'google-site-kit' )
				),
			),
		);
	}
}
