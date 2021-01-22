<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Module_With_Owner
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Interface for a module that includes an owner.
 *
 * @since 1.16.0
 * @access private
 * @ignore
 */
interface Module_With_Owner {

	/**
	 * Gets an owner ID for the module.
	 *
	 * @since 1.16.0
	 *
	 * @return int Owner ID.
	 */
	public function get_owner_id();

}
