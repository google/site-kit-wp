<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Module_With_Service_Entity
 *
 * @package   Google\Site_Kit
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use WP_Error;

/**
 * Interface for a module that includes a service entity.
 *
 * @since 1.70.0
 * @access private
 * @ignore
 */
interface Module_With_Service_Entity {

	/**
	 * Checks if the current user has access to the current configured service entity.
	 *
	 * @since 1.70.0
	 *
	 * @return boolean|WP_Error
	 */
	public function check_service_entity_access();
}
