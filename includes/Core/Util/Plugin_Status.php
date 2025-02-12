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
 * Plugin_Status class.
 */
class Plugin_Status {

	/**
	 * Plugin installed identifier.
	 */
	const PLUGIN_STATUS_INSTALLED = 'installed';

	/**
	 * Plugin not active identifier.
	 */
	const PLUGIN_STATUS_ACTIVE = 'active';

	/**
	 * Plugin not installed identifier.
	 */
	const PLUGIN_STATUS_NOT_INSTALLED = 'not-installed';

	/**
	 * Helper method to retrieve plugin installation/activation status.
	 *
	 * @param string $plugin_path The plugin path.
	 * @param string $plugin_url  The plugin URL.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The status of the plugin.
	 */
	public static function get_plugin_status( $plugin_path = '', $plugin_url = '' ) {
		if ( empty( $plugin_path ) && empty( $plugin_url ) ) {
			return static::PLUGIN_STATUS_NOT_INSTALLED;
		}

		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		if ( true === is_plugin_active( $plugin_path ) ) {
			return static::PLUGIN_STATUS_ACTIVE;
		}

		$plugins = get_plugins();

		if ( array_key_exists( $plugin_path, $plugins ) ) {
			return static::PLUGIN_STATUS_INSTALLED;
		} else {
			foreach ( $plugins as $plugin_file => $installed_plugin ) {
				if ( $installed_plugin['PluginURI'] === $plugin_url ) {
					return static::PLUGIN_STATUS_INSTALLED;
				}
			}
		}

		return static::PLUGIN_STATUS_NOT_INSTALLED;
	}
}
