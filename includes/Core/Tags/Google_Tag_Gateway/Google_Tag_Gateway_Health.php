<?php
/**
 * Class Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Health
 *
 * @package   Google\Site_Kit\Core\Tags\Google_Tag_Gateway
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags\Google_Tag_Gateway;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class to store Google tag gateway health state.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Google_Tag_Gateway_Health extends Setting {

	/**
	 * The option name for this setting.
	 */
	const OPTION = 'googlesitekit_google_tag_gateway_health';

	public function register() {
		parent::register();

		$this->proxy_default();
	}

	protected function proxy_default() {
		add_filter(
			'default_option_' . self::OPTION,
			function ( $default ) {
				// If this filter runs, this option is not set in the DB yet.
				if ( ! $this->options->has( Google_Tag_Gateway_Settings::OPTION ) ) {
					return $default;
				}
				// Proxy the health state from the old setting, if present.
				$old = $this->options->get( Google_Tag_Gateway_Settings::OPTION );
				if ( ! is_array( $old ) ) {
					return $default;
				}

				// Merge old value with defaults.
				$old_health = array_intersect_key( $old, $this->get_default() );
				return array_merge( $this->get_default(), $old_health );
			},
			1
		);
	}

	public function is_healthy() {
		$health = $this->get();

		return $health['isGTGHealthy'] && $health['isScriptAccessEnabled'];
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

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'isGTGHealthy'          => null,
			'isScriptAccessEnabled' => null,
		);
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $value ) {
			$new_value = $this->get();

			if ( isset( $value['isGTGHealthy'] ) ) {
				$new_value['isGTGHealthy'] = (bool) $value['isGTGHealthy'];
			}

			if ( isset( $value['isScriptAccessEnabled'] ) ) {
				$new_value['isScriptAccessEnabled'] = (bool) $value['isScriptAccessEnabled'];
			}

			return $new_value;
		};
	}

	/**
	 * Merges an array of settings to update.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $partial Partial settings array to save.
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

		$updated = array_intersect_key( $partial, $this->get_default() );

		return $this->set( array_merge( $settings, $updated ) );
	}

}
