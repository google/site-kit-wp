<?php
/**
 * Class Google\Site_Kit\Core\Golinks\Settings_Golink_Handler
 *
 * @package   Google\Site_Kit\Core\Golinks
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Golinks;

use Google\Site_Kit\Context;

/**
 * Golink handler for the Site Kit settings URL.
 *
 * Supports an optional `module` query parameter to deep-link
 * to a specific module's connected services panel.
 *
 * @since 1.175.0
 * @access private
 * @ignore
 */
class Settings_Golink_Handler implements Golink_Handler_Interface {

	/**
	 * Builds the settings destination URL.
	 *
	 * @since 1.175.0
	 *
	 * @param Context $context Plugin context.
	 * @return string Destination URL.
	 */
	public function handle( Context $context ) {
		$settings_url = $context->admin_url( 'settings' );

		$module = sanitize_key(
			(string) $context->input()->filter( INPUT_GET, 'module', FILTER_DEFAULT )
		);

		if ( ! empty( $module ) ) {
			$settings_url .= '#connected-services/' . $module;
		}

		return $settings_url;
	}
}
