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

use Google\Site_Kit\Core\Storage\Setting;

interface Module_With_Setting {

	/**
	 * Gets the module's setting instance.
	 *
	 * @since n.e.x.t
	 *
	 * @return Setting The Setting instance for the current module.
	 */
	public function get_setting();
}
