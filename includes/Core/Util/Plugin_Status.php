<?php
/**
 * Class Google\Site_Kit\Core\Util\Plugin_Status
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Utility class for checking the status of plugins.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Plugin_Status {

	/**
	 * Determines whether a plugin is active.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $plugin Path to the plugin file relative to the plugins directory.
	 * @return bool
	 */
	public static function is_plugin_active( $plugin ) {
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		return is_plugin_active( $plugin );
	}

	/**
	 * Determines whether a plugin is installed.
	 *
	 * @since n.e.x.t
	 *
	 * @param string|callable $plugin_or_predicate String plugin file to check or
	 *                                a function that accepts plugin header data and plugin file name to test.
	 *
	 * @return bool|string Boolean if checking by plugin file or plugin not found,
	 *                     String plugin file if checking using a predicate function.
	 */
	public static function is_plugin_installed( $plugin_or_predicate ) {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		if ( is_string( $plugin_or_predicate ) ) {
			return array_key_exists( $plugin_or_predicate, get_plugins() );
		}
		if ( ! is_callable( $plugin_or_predicate ) ) {
			return false;
		}
		foreach ( get_plugins() as $plugin_file => $data ) {
			if ( $plugin_or_predicate( $data, $plugin_file ) ) {
				return $plugin_file;
			}
		}
		return false;
	}
}
