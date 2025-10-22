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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Email_Reporting_Pointer {

	const SLUG = 'googlesitekit-email-reporting-pointer';

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
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
					'<button type=\'button\' class=\'googlesitekit-pointer-cta--dismiss dashicons dashicons-no\'>' .
						'<span class=\'screen-reader-text\'>' . esc_html__( 'Dismiss this notice.', 'google-site-kit' ) . '</span>' .
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
					if ( ! current_user_can( Permissions::AUTHENTICATE ) && ! current_user_can( Permissions::VIEW_SPLASH ) ) {
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

					// Create user-level storage to check subscription and dismissed items.
					$user_options  = new User_Options( $this->context, $user_id );
					$user_settings = new User_Email_Reporting_Settings( $user_options );

					// If user is already subscribed to email reporting, bail early.
					if ( $user_settings->is_user_subscribed() ) {
						return false;
					}

					// If the overlay notification has already been dismissed, bail early.
					$dismissed_items = new Dismissed_Items( $user_options );
					if ( $dismissed_items->is_dismissed( 'email-reporting-overlay-notification' ) ) {
						return false;
					}

					return true;
				},
				// Add dashicon before title and special className hook.
				'with_title_icon' => true,
				'class'           => 'googlesitekit-email-pointer',
				// Inline JS function to render CTA button and add delegated handlers for CTA and dismiss.
				'buttons'         => sprintf(
					'function(event, container) {
						jQuery("body").on("click", ".googlesitekit-pointer-cta--dismiss", function() {
							container.element.pointer("close");
						});
						jQuery("body").on("click", ".googlesitekit-pointer-cta", function() {
							container.element.pointer("close");
							window.location = "admin.php?page=googlesitekit-dashboard&email-reporting-panel-opened=1";
						});
						return jQuery("<button class=\"googlesitekit-pointer-cta button-primary\">%s</button>");
					}',
					esc_js( __( 'Set up', 'google-site-kit' ) )
				),
			)
		);
	}
}
