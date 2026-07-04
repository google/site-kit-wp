<?php
/**
 * Interface Google\Site_Kit\Core\Storage\Setting_With_ViewOnly_Keys_Interface
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

/**
 * Interface for a settings class that includes view-only settings.
 *
 * @since 1.111.0
 * @access private
 * @ignore
 */
interface Setting_With_ViewOnly_Keys_Interface {

	/**
	 * Returns keys for view-only settings.
	 *
	 * @since 1.111.0
	 *
	 * @return array An array of keys for view-only settings.
	 */
	public function get_view_only_keys();
}
