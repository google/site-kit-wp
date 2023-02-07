<?php
/**
 * Trait Google\Site_Kit\Core\Modules\Module_With_Data_Available_State_Trait
 *
 * @package   Google\Site_Kit
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Trait for a module that have data available state.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Module_With_Data_Available_State_Trait {

	/**
	 * Gets data available transient name of the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Data available transient name.
	 */
	protected function get_data_available_transient_name() {
		return 'googlesitekit_' . $this->slug . '_data_available';
	}

	/**
	 * Checks whether the data is available for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if data is available, false otherwise.
	 */
	public function is_data_available() {
		return $this->transients->get( $this->get_data_available_transient_name() );
	}

	/**
	 * Sets the data available state for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True on success, false otherwise.
	 */
	public function set_data_available() {
		return $this->transients->set( $this->get_data_available_transient_name(), true );
	}

	/**
	 * Resets the data available state for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True on success, false otherwise.
	 */
	public function reset_data_available() {
		return $this->transients->delete( $this->get_data_available_transient_name() );
	}
}
