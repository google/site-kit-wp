<?php
/**
 * Interface Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Interface
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

/**
 * Interface for a settings class that includes owned settings.
 *
 * @since 1.16.0
 * @access private
 * @ignore
 */
interface Setting_With_Owned_Keys_Interface {

	/**
	 * Returns keys for owned settings.
	 *
	 * @since 1.16.0
	 *
	 * @return array An array of keys for owned settings.
	 */
	public function get_owned_keys();
}
