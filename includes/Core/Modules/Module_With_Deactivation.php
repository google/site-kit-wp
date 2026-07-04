<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Module_With_Deactivation
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Interface for a module that has additional behavior when deactivated.
 *
 * @since 1.36.0
 * @access private
 * @ignore
 */
interface Module_With_Deactivation {
	/**
	 * Handles module deactivation.
	 *
	 * @since 1.36.0
	 */
	public function on_deactivation();
}
