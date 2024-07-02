<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Module_With_Persistent_Registration
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Interface for a module that requires persistent registration.
 *
 * @since 1.38.0
 * @access private
 * @ignore
 */
interface Module_With_Persistent_Registration {

	/**
	 * The registration method that is called even if the module is not activated.
	 *
	 * @since 1.38.0
	 */
	public function register_persistent();
}
