<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Module_With_Activation
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Interface for a module that has additional behavior when activated.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
interface Module_With_Activation {
	/**
	 * Handles module activation.
	 *
	 * @since n.e.x.t
	 */
	public function on_activation();
}
