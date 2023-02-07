<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Module_With_Data_Available_State
 *
 * @package   Google\Site_Kit
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Interface for a module that have data available state.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
interface Module_With_Data_Available_State {

	/**
	 * Checks whether the data is available for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if data is available, false otherwise.
	 */
	public function is_data_available();

	/**
	 * Sets the data available state for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True on success, false otherwise.
	 */
	public function set_data_available();

	/**
	 * Resets the data available state for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True on success, false otherwise.
	 */
	public function reset_data_available();
}
