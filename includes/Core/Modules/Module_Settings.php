<?php
/**
 * Class Google\Site_Kit\Core\Modules\Module_Settings
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Base class for module settings.
 *
 * @since 1.2.0
 * @access private
 * @ignore
 */
abstract class Module_Settings extends Setting {

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since 1.2.0
	 */
	public function register() {
		parent::register();
		$this->add_option_default_filters();
	}

	/**
	 * Merges an array of settings to update.
	 *
	 * Only existing keys will be updated.
	 *
	 * @since 1.3.0
	 *
	 * @param array $partial Partial settings array to save.
	 *
	 * @return bool True on success, false on failure.
	 */
	public function merge( array $partial ) {
		$settings = $this->get();
		$partial  = array_filter(
			$partial,
			function ( $value ) {
				return null !== $value;
			}
		);
		$updated  = array_intersect_key( $partial, $settings );

		return $this->set( array_merge( $settings, $updated ) );
	}

	/**
	 * Registers a filter to ensure default values are present in the saved option.
	 *
	 * @since 1.2.0
	 */
	protected function add_option_default_filters() {
		add_filter(
			'option_' . static::OPTION,
			function ( $option ) {
				if ( ! is_array( $option ) ) {
					return $this->get_default();
				}
				return $option;
			},
			0
		);

		// Fill in any missing keys with defaults.
		// Must run later to not conflict with legacy key migration.
		add_filter(
			'option_' . static::OPTION,
			function ( $option ) {
				if ( is_array( $option ) ) {
					return $option + $this->get_default();
				}
				return $option;
			},
			99
		);
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.2.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}
}
