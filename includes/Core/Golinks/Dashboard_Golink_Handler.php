<?php
/**
 * Class Google\Site_Kit\Core\Golinks\Dashboard_Golink_Handler
 *
 * @package   Google\Site_Kit\Core\Golinks
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Golinks;

use Google\Site_Kit\Context;

/**
 * Golink handler for the Site Kit dashboard URL.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Dashboard_Golink_Handler implements Golink_Handler_Interface {

	/**
	 * Builds the dashboard destination URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 * @return string Destination URL.
	 */
	public function handle( Context $context ) {
		$dashboard_url = $context->admin_url( 'dashboard' );
		$permalink     = $context->input()->filter( INPUT_GET, 'permaLink', FILTER_DEFAULT );

		if ( empty( $permalink ) ) {
			return $dashboard_url;
		}

		$permalink = esc_url_raw( wp_unslash( $permalink ) );

		if ( empty( $permalink ) ) {
			return $dashboard_url;
		}

		return add_query_arg(
			array(
				'permaLink' => $permalink,
			),
			$dashboard_url
		);
	}
}
