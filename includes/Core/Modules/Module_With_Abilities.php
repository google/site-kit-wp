<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Module_With_Abilities
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Core\Abilities\Ability;

/**
 * Interface for a module that provides abilities.
 *
 * @since n.e.x.t
 */
interface Module_With_Abilities {

	/**
	 * Gets the abilities to register for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return Ability[] List of ability definitions.
	 */
	public function get_abilities();
}
