<?php
/**
 * Trait Google\Site_Kit\Core\Modules\Module_With_Data_Available_State_Trait
 *
 * @package   Google\Site_Kit
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Trait for a module that has data available state.
 *
 * @since 1.96.0
 * @access private
 * @ignore
 */
trait Module_With_Data_Available_State_Trait {

	/**
	 * Gets data available transient name of the module.
	 *
	 * @since 1.96.0
	 *
	 * @return string Data available transient name.
	 */
	protected function get_data_available_transient_name() {
		return "googlesitekit_{$this->slug}_data_available";
	}

	/**
	 * Checks whether the data is available for the module.
	 *
	 * @since 1.96.0
	 *
	 * @return bool True if data is available, false otherwise.
	 */
	public function is_data_available() {
		return (bool) $this->transients->get( $this->get_data_available_transient_name() );
	}

	/**
	 * Sets the data available state for the module.
	 *
	 * @since 1.96.0
	 *
	 * @return bool True on success, false otherwise.
	 */
	public function set_data_available() {
		// TODO: Remove the expiration time once the gathering data state on error is sorted out.
		// See: https://github.com/google/site-kit-wp/issues/6698 for more details.
		return $this->transients->set( $this->get_data_available_transient_name(), true, 3600 );
	}

	/**
	 * Resets the data available state for the module.
	 *
	 * @since 1.96.0
	 *
	 * @return bool True on success, false otherwise.
	 */
	public function reset_data_available() {
		return $this->transients->delete( $this->get_data_available_transient_name() );
	}
}
