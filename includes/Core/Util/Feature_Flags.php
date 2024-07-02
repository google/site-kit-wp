<?php
/**
 * Class Google\Site_Kit\Core\Util\Feature_Flags
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use ArrayAccess;

/**
 * Class for interacting with feature flag configuration.
 *
 * @since 1.22.0
 * @access private
 * @ignore
 */
class Feature_Flags {

	/**
	 * Feature flag definitions.
	 *
	 * @since 1.22.0
	 * @var array|ArrayAccess
	 */
	private static $features = array();

	/**
	 * Checks if the given feature is enabled.
	 *
	 * @since 1.22.0
	 *
	 * @param string $feature Feature key path to check.
	 * @return bool
	 */
	public static function enabled( $feature ) {
		if ( ! $feature || ! is_string( $feature ) || empty( static::$features ) ) {
			return false;
		}

		/**
		 * Filters a feature flag's status (on or off).
		 *
		 * Mainly this is used by E2E tests to allow certain features to be disabled or
		 * enabled for testing, but is also useful to switch features on/off on-the-fly.
		 *
		 * @since 1.25.0
		 *
		 * @param bool   $feature_enabled The current status of this feature flag (`true` or `false`).
		 * @param string $feature         The feature name.
		 */
		return apply_filters( 'googlesitekit_is_feature_enabled', false, $feature );
	}

	/**
	 * Gets all enabled feature flags.
	 *
	 * @since 1.25.0
	 *
	 * @return string[] An array of all enabled features.
	 */
	public static function get_enabled_features() {
		$enabled_features = array();

		foreach ( static::$features as $feature_name ) {
			if ( static::enabled( $feature_name ) ) {
				$enabled_features[] = $feature_name;
			}
		}

		return $enabled_features;
	}

	/**
	 * Sets the feature configuration.
	 *
	 * @since 1.22.0
	 *
	 * @param array|ArrayAccess $features Feature configuration.
	 */
	public static function set_features( $features ) {
		if ( is_array( $features ) || $features instanceof ArrayAccess ) {
			static::$features = $features;
		}
	}

	/**
	 * Gets all available feature flags.
	 *
	 * @since 1.26.0
	 *
	 * @return array An array of all available features.
	 */
	public static function get_available_features() {
		return static::$features;
	}
}
