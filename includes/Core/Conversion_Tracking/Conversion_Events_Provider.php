<?php
/**
 * Interface Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider
 *
 * @package   Google\Site_Kit\Core\Conversion_Tracking
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking;

/**
 * Interface for a conversion events provider.
 *
 * @since 1.125.0
 * @access private
 * @ignore
 */
interface Conversion_Events_Provider {

	/**
	 * Checks if the provider is active.
	 *
	 * @since 1.125.0
	 *
	 * @return bool True if the provider is active, false otherwise.
	 */
	public function is_active();

	/**
	 * Gets the event names.
	 *
	 * @since 1.125.0
	 *
	 * @return array List of event names.
	 */
	public function get_event_names();

	/**
	 * Registers the script for the provider.
	 *
	 * @since 1.125.0
	 */
	public function register_script();
}
