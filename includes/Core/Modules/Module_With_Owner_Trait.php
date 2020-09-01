<?php
/**
 * Trait Google\Site_Kit\Core\Modules\Module_With_Owner_Trait
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Core\Modules\Module_With_Settings;

/**
 * Trait for a module that includes an owner ID.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Module_With_Owner_Trait {

	/**
	 * Gets an owner ID for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return int Owner ID.
	 */
	public function get_owner_id() {
		if ( ! $this instanceof Module_With_Settings ) {
			return 0;
		}

		$settings = $this->get_settings()->get();
		if ( empty( $settings['ownerID'] ) ) {
			return 0;
		}

		return $settings['ownerID'];
	}

}
