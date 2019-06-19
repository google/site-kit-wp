<?php
/**
 * Trait Google\Site_Kit\Core\Util\AMP_Trait
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Trait for a class that needs to check for whether AMP content is being served.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
trait AMP_Trait {

	/**
	 * Checks whether AMP content is being served.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if an AMP request, false otherwise.
	 */
	private function is_amp() {
		return ! is_admin() && function_exists( 'is_amp_endpoint' ) && is_amp_endpoint();
	}
}
