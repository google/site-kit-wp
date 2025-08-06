<?php
/**
 * Class Google\Site_Kit\Modules\Ads\Enhanced_Conversions
 *
 * @package   Google\Site_Kit\Modules\Ads
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Ads;

/**
 * Class Enhanced_Conversions.
 *
 * @since 1.159.0
 * @access private
 * @ignore
 */
class Enhanced_Conversions {

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.159.0
	 */
	public function register() {
	}

	/**
	 * Gets the user data for Enhanced Conversions.
	 *
	 * @since 1.159.0
	 *
	 * @return array User data.
	 */
	public function get_user_data() {
		return array();
	}

	/**
	 * Conditionally enqueues the necessary script for Enhanced Conversions.
	 *
	 * @since 1.159.0
	 */
	public function maybe_enqueue_gtag_user_data() {
	}
}
