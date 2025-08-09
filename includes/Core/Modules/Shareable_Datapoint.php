<?php
/**
 * Class Google\Site_Kit\Core\Modules\Shareable_Datapoint
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Class representing a shareable datapoint definition.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Shareable_Datapoint extends Datapoint {

	/**
	 * Checks if the datapoint is shareable.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool
	 */
	public function is_shareable() {
		return true;
	}
}
