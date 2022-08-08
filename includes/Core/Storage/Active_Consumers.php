<?php
/**
 * Class Google\Site_Kit\Core\Storage\Active_Consumers
 *
 * @package   Google\Site_Kit\Core\Storage\Active_Consumers
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for representing active consumers for an access token.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Active_Consumers extends User_Setting {

	/**
	 * The user option name for this setting.
	 */
	const OPTION = 'googlesitekit_active_consumers';

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.27.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'array';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.27.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array();
	}

	/**
	 * Adds the current user to the list of active consumers
	 *
	 * @since n.e.x.t
	 */
	public function add() {
		$active_consumers = $this->get();

		$user       = wp_get_current_user();
		$user_id    = $user->ID;
		$user_roles = (array) $user->roles;

		// If the user already exists in the list, bail.
		if ( array_key_exists( $user_id, $active_consumers ) ) {
			return;
		}

		$active_consumers[ $user_id ] = $user_roles;

		$this->set( $active_consumers );
	}
}
