<?php
/**
 * Class Google\Site_Kit\Core\Modules\Module_With_Debug_Fields
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Interface Module_With_Debug_Fields
 *
 * @since 1.5.0
 */
interface Module_With_Debug_Fields {

	/**
	 * Gets an array of debug field definitions.
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	public function get_debug_fields();
}
