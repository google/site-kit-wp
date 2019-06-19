<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Module_With_Scopes
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Interface for a module that requires Google OAuth scopes.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
interface Module_With_Scopes {

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since 1.0.0
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes();
}
