<?php
/**
 * Class Google\Site_Kit\Core\Dashboard_Sharing\View_Only_Pointer
 *
 * @package   Google\Site_Kit
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Dashboard_Sharing;

use Google\Site_Kit\Core\Admin\Pointer;
use Google\Site_Kit\Core\Permissions\Permissions;

/**
 * Class for view-only pointer.
 *
 * @since 1.83.0.
 * @access private
 * @ignore
 */
// phpcs:ignoreFile
final class View_Only_Pointer {

	const SLUG = 'googlesitekit-view-only-pointer';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.83.0
	 */
	public function register() {
		add_filter(
			'googlesitekit_admin_pointers',
			function ( $pointers ) {
				$pointers[] = $this->get_view_only_pointer();
				return $pointers;
			}
		);
	}

	/**
	 * Gets the view-only pointer.
	 *
	 * @since 1.83.0.
	 * @since n.e.x.t Updated to work with extended Pointer class.
	 *
	 * @return Pointer Admin notice instance.
	 */
	private function get_view_only_pointer() {
		return new Pointer(
			self::SLUG,
			array(
				'title'           => sprintf( '%s %s',
					__( 'You now have access to Site Kit', 'google-site-kit' ),
					"<button type='button-link' class='googlesitekit-pointer-cta--dismiss dashicons dashicons-no'> \
						<span class='screen-reader-text'>Dismiss this notice.</span> \
					</button>"
				),
				'content'         => __( 'Check Site Kit’s dashboard to find out how much traffic your site is getting, your most popular pages, top keywords people use to find your site on Search, and more.', 'google-site-kit' ),
				'target_id'       => 'toplevel_page_googlesitekit-dashboard',
				'active_callback' => function ( $hook_suffix ) {
					if ( 'index.php' !== $hook_suffix
						|| current_user_can( Permissions::AUTHENTICATE )
						|| ! current_user_can( Permissions::VIEW_SPLASH )

					) {
						return false;
					}

					$dismissed_wp_pointers = get_user_meta( get_current_user_id(), 'dismissed_wp_pointers', true );
					if ( ! $dismissed_wp_pointers ) {
						return true;
					}

					$dismissed_wp_pointers = explode( ',', $dismissed_wp_pointers );
					if ( in_array( self::SLUG, $dismissed_wp_pointers, true ) ) {
						return false;
					}

					return true;
				},
				'with_title_icon' => true,
				'class'           => 'googlesitekit-view-only-pointer',
				'buttons'         =>
					sprintf('
					 function(event, container) {
						jQuery("body").on("click", ".googlesitekit-pointer-cta--dismiss", function() {
							 container.element.pointer("close");
						});
						jQuery("body").on("click", ".googlesitekit-pointer-cta", function() {
							container.element.pointer("close");

							window.location = "admin.php?page=googlesitekit-dashboard";
						});

						return jQuery(\'<button class="googlesitekit-pointer-cta button-primary">Setup</button>\');
					}
					', self::SLUG),
			)
		);
	}
}
