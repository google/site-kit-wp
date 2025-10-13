<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks\Conflicting_Plugins_Check
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks;

/**
 * Compatibility check for conflicting plugins.
 *
 * @since n.e.x.t
 */
class Conflicting_Plugins_Check extends Compatibility_Check {

	/**
	 * Gets the unique slug for this compatibility check.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The unique slug for this compatibility check.
	 */
	public function get_slug() {
		return 'conflicting_plugins';
	}

	/**
	 * Runs the compatibility check.
	 *
	 * @since n.e.x.t
	 *
	 * @return array|false Array of conflicting plugins data if found, false otherwise.
	 */
	public function run() {
		$active_plugins   = get_option( 'active_plugins', array() );
		$security_plugins = array(
			'better-wp-security/better-wp-security.php',
			'security-malware-firewall/security-malware-firewall.php',
			'sg-security/sg-security.php',
			'hide-my-wp/index.php',
			'hide-wp-login/hide-wp-login.php',
			'all-in-one-wp-security-and-firewall/wp-security.php',
			'sucuri-scanner/sucuri.php',
			'wordfence/wordfence.php',
			'wps-hide-login/wps-hide-login.php',
		);

		$conflicting_plugins = array();
		foreach ( $active_plugins as $plugin_slug ) {

			if ( in_array( $plugin_slug, $security_plugins, true ) ) {
				$plugin_data = get_plugin_data( WP_PLUGIN_DIR . '/' . $plugin_slug );
				$plugin_name = $plugin_data['Name'];

				$conflicting_plugins[ $plugin_slug ] = array(
					'pluginName'      => $plugin_name,
					'conflictMessage' => sprintf(
						/* translators: %s: plugin name */
						__( '%s may prevent Sign in with Google from working properly.', 'google-site-kit' ),
						$plugin_name
					),
				);
			}
		}

		return ! empty( $conflicting_plugins ) ? $conflicting_plugins : false;
	}
}
