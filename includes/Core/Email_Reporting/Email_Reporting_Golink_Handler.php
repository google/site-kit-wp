<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Golink_Handler
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Golinks\Golink_Handler_Interface;
use Google\Site_Kit\Core\Permissions\Permissions;

/**
 * Golink handler for Email Reporting management links.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Email_Reporting_Golink_Handler implements Golink_Handler_Interface {

	/**
	 * Builds the destination URL for email reporting management.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 * @return string Destination URL.
	 */
	public function handle( Context $context ) {
		$dashboard_url = $context->admin_url(
			'dashboard',
			array(
				'panel' => 'email-reporting',
			)
		);

		// Shared-dashboard users can have splash access before they have dashboard access.
		// Route through splash so dismissal can continue to the dashboard panel via redirect_url.
		if ( current_user_can( Permissions::VIEW_SPLASH ) && ! current_user_can( Permissions::VIEW_DASHBOARD ) ) {
			return $context->admin_url(
				'splash',
				array(
					'redirect_url' => $dashboard_url,
				)
			);
		}

		return $dashboard_url;
	}
}
