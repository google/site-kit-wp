<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Permission_Aware_Datapoint
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Interface for a datapoint that provides its own REST permission check.
 *
 * By default every module datapoint inherits the permission check of its HTTP
 * method (readable datapoints require view access, editable datapoints require
 * `manage_options`). A datapoint implementing this interface overrides that
 * default so it can, for example, allow any dashboard-viewing user to persist a
 * per-user setting.
 *
 * @since 1.181.0
 * @access private
 * @ignore
 */
interface Permission_Aware_Datapoint {

	/**
	 * Checks whether the current user is allowed to access the datapoint.
	 *
	 * @since 1.181.0
	 *
	 * @return bool True if the current user is allowed, false otherwise.
	 */
	public function permission_callback();
}
