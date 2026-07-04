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
 * @since 1.174.0
 * @access private
 * @ignore
 */
class Email_Reporting_Golink_Handler implements Golink_Handler_Interface {

	/**
	 * Builds the destination URL for email reporting management.
	 *
	 * @since 1.174.0
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

		return $dashboard_url;
	}
}
