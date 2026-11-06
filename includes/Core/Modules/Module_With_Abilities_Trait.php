<?php
/**
 * Trait Google\Site_Kit\Core\Modules\Module_With_Abilities_Trait
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Core\Abilities\Ability;

/**
 * Trait providing lazy initialization of module abilities.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Module_With_Abilities_Trait {

	/**
	 * Ability definitions to register for the module.
	 *
	 * @since n.e.x.t
	 * @var Ability[]|null
	 */
	private $abilities;

	/**
	 * Gets the abilities to register for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return Ability[] List of ability definitions.
	 */
	public function get_abilities() {
		if ( null === $this->abilities ) {
			$this->abilities = $this->setup_abilities();
		}

		return $this->abilities;
	}

	/**
	 * Sets up ability definitions with their required dependencies.
	 *
	 * @since n.e.x.t
	 *
	 * @return Ability[] List of ability definitions.
	 */
	abstract protected function setup_abilities();
}
