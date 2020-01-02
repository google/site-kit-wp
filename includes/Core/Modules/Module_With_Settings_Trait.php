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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Module_With_Settings_Trait {

	/**
	 * Settings instance.
	 *
	 * @since n.e.x.t
	 *
	 * @var Module_Settings
	 */
	protected $settings;

	/**
	 * Gets the module-specific settings instance.
	 *
	 * @since n.e.x.t
	 *
	 * @return Module_Settings
	 */
	abstract protected function get_settings_instance();

	/**
	 * Gets the module's Settings instance.
	 *
	 * @since n.e.x.t
	 *
	 * @return Module_Settings Module_Settings instance.
	 */
	public function get_settings() {
		if ( ! $this->settings instanceof Module_Settings ) {
			$this->settings = $this->get_settings_instance();
		}

		return $this->settings;
	}
}
