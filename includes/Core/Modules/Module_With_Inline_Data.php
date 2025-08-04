<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Module_With_Inline_Data
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Interface for a module that sets inline data.
 *
 * @since 1.158.0
 * @access private
 * @ignore
 */
interface Module_With_Inline_Data {
	/**
	 * Gets required inline data for the module.
	 *
	 * @since 1.158.0
	 *
	 * @return array An array of the module's inline data.
	 */
	public function get_inline_data();
}
