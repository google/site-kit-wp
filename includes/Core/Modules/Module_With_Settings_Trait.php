<?php
/**
 * Trait Google\Site_Kit\Core\Modules\Module_With_Settings_Trait
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Trait for a module that includes a screen.
 *
 * @since 1.2.0
 * @access private
 * @ignore
 */
trait Module_With_Settings_Trait {

	/**
	 * Settings instance.
	 *
	 * @since 1.2.0
	 *
	 * @var Module_Settings
	 */
	protected $settings;

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.2.0
	 *
	 * @return Module_Settings
	 */
	abstract protected function setup_settings();

	/**
	 * Gets the module's Settings instance.
	 *
	 * @since 1.2.0
	 *
	 * @return Module_Settings Module_Settings instance.
	 */
	public function get_settings() {
		if ( ! $this->settings instanceof Module_Settings ) {
			$this->settings = $this->setup_settings();
		}

		return $this->settings;
	}
}
