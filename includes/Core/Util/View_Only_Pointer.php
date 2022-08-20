<?php
/**
 * Class Google\Site_Kit\Core\Util\View_Only_Pointer
 *
 * @package   Google\Site_Kit
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Core\Admin\Pointer;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Permissions\Permissions;

/**
 * Class for view-only pointer.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class View_Only_Pointer {

	const SLUG = 'googlesitekit-view-only-pointer';

	/**
	 * Dismissed Items.
	 *
	 * @since n.e.x.t.
	 * @var Dismissed_Items
	 */
	private $dismissed_items;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t.
	 * @access public
	 * @param Dismissed_Items $dismissed_items Dismissed Items.
	 */
	public function __construct( Dismissed_Items $dismissed_items ) {
		$this->dismissed_items = $dismissed_items;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_filter(
			'googlesitekit_admin_pointers',
			function( $pointers ) {
				$pointers[] = $this->get_view_only_pointer();
				return $pointers;
			}
		);
	}

	/**
	 * Gets the view-only pointer.
	 *
	 * @since n.e.x.t.
	 *
	 * @return Pointer Admin notice instance.
	 */
	private function get_view_only_pointer() {
		return new Pointer(
			self::SLUG,
			array(
				'title'           => __( 'You now have access to Site Kit', 'google-site-kit' ),
				'content'         => __( 'Check Site Kit’s dashboard to find out how much traffic your site is getting, your most popular pages, top keywords people use to find your site on Search, and more.', 'google-site-kit' ),
				'target_id'       => 'toplevel_page_googlesitekit-dashboard',
				'active_callback' => function( $hook_suffix ) {
					if ( 'index.php' !== $hook_suffix
						|| ! Feature_Flags::enabled( 'dashboardSharing' )
						|| current_user_can( Permissions::AUTHENTICATE )
						|| ! current_user_can( Permissions::VIEW_SPLASH )
						|| $this->dismissed_items->is_dismissed( 'shared_dashboard_splash' )

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
			)
		);
	}
}
