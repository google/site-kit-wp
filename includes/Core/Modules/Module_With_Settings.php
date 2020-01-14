<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Module_With_Settings
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

interface Module_With_Settings {

	/**
	 * Gets the module's Setting instance.
	 *
	 * @since 1.2.0
	 *
	 * @return Module_Settings The Setting instance for the current module.
	 */
	public function get_settings();
}
