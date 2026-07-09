<?php
/**
 * Plugin Name: E2E Tests PDF Generation View-Only Plugin
 * Description: Sets up a view-only shared dashboard for the PDF generation E2E. Search Console is connected and shared with the editor role, so a non-authenticated editor viewing the dashboard sees a view-only dashboard whose export panel lists only the shared module's sections.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Modules\Search_Console\Settings as Search_Console_Settings;

/**
 * The module owner. The viewing editor is never authenticated, so the dashboard
 * stays view-only.
 */
if ( ! defined( 'PDF_E2E_OWNER_ID' ) ) {
	define( 'PDF_E2E_OWNER_ID', 1 );
}

// Provide the site-level proxy credentials so Site Kit reports setup as
// completed. Without completed setup every capability additionally requires the
// `googlesitekit_setup` capability, which the viewing editor lacks, so the editor
// would be denied dashboard access. These credentials are site-wide and do not
// authenticate any user, so the editor stays unauthenticated (view-only).
require_once __DIR__ . '/proxy-credentials.php';

/**
 * Share Search Console with the editor role. Forcing the value on read (via
 * `pre_option_`, which short-circuits `get_option`) bypasses the sharing settings'
 * save-time sanitize, which drops a module unless it is recognized as shareable at
 * that instant. PageSpeed is left unshared and is not `Module_With_Owner`, so it is
 * never shareable — a view-only editor therefore sees the Search Console sections
 * but not the Speed section.
 */
add_filter(
	'pre_option_' . Module_Sharing_Settings::OPTION,
	function () {
		return array(
			'search-console' => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',
			),
		);
	}
);

add_action(
	'init',
	function () {
		// Connect Search Console, owned by the admin. Being connected makes it a
		// shareable module; no owner authentication is needed for the panel to list
		// its sections in view-only mode.
		$settings               = get_option( Search_Console_Settings::OPTION );
		$settings               = is_array( $settings ) ? $settings : array();
		$settings['propertyID'] = 'http://localhost:9002';
		$settings['ownerID']    = PDF_E2E_OWNER_ID;
		update_option( Search_Console_Settings::OPTION, $settings );

		// Mark the dashboard-sharing splash as dismissed for the viewer, so the
		// editor gets `VIEW_DASHBOARD` and lands on the view-only dashboard
		// directly instead of the splash interstitial.
		$user_id = get_current_user_id();
		if ( $user_id && PDF_E2E_OWNER_ID !== $user_id ) {
			$items = get_user_option(
				'googlesitekitpersistent_dismissed_items',
				$user_id
			);
			$items = is_array( $items ) ? $items : array();

			if ( ! isset( $items['shared_dashboard_splash'] ) ) {
				$items['shared_dashboard_splash'] = 0;
				update_user_option(
					$user_id,
					'googlesitekitpersistent_dismissed_items',
					$items
				);
			}
		}
	}
);
