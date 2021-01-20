<?php
/**
 * Class Google\Site_Kit\Core\Modules\Module_With_Admin_Bar
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

interface Module_With_Admin_Bar {

	/**
	 * Checks if the module is active in the admin bar for the given URL.
	 *
	 * @since 1.4.0
	 *
	 * @param string $url URL to determine active state for.
	 * @return bool
	 */
	public function is_active_in_admin_bar( $url );
}
