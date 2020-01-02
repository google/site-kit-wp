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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
abstract class Module_Settings extends Setting {

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		parent::register();
		$this->add_option_default_filters();
	}

	/**
	 * Registers a filter to ensure default values are present in the saved option.
	 *
	 * @since n.e.x.t
	 */
	protected function add_option_default_filters() {
		add_filter(
			'option_' . static::OPTION,
			function ( $option ) {
				if ( is_array( $option ) ) {
					// Fill in any missing keys with defaults.
					return $option + $this->get_default();
				} else {
					return $this->get_default();
				}
			}
		);
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}
}
