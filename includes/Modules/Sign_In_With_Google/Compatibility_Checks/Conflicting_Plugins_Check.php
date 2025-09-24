<?php
/**
 * Conflicting plugins compatibility check.
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
class Conflicting_Plugins_Check extends Compatibility_Checker {

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
		$active_plugins = get_option( 'active_plugins', array() );

		$security_plugins = array(
			'better-wp-security/better-wp-security.php' => array(
				'pluginName'      => 'Solid Security',
				'conflictMessage' => 'Solid Security may prevent Google Sign-In from working. Common issues: blocked authentication cookies, restricted popups/iframes, hidden login URLs, or blocked Google API requests.',
			),
			'security-malware-firewall/security-malware-firewall.php' => array(
				'pluginName'      => 'Login Security, FireWall, Malware removal by CleanTalk',
				'conflictMessage' => 'Login Security, FireWall, Malware removal by CleanTalk may prevent Google Sign-In from working. Common issues: blocked authentication cookies, restricted popups/iframes, hidden login URLs, or blocked Google API requests.',
			),
			'sg-security/sg-security.php'               => array(
				'pluginName'      => 'SiteGround Security',
				'conflictMessage' => 'SiteGround Security may prevent Google Sign-In from working. Common issues: blocked authentication cookies, restricted popups/iframes, hidden login URLs, or blocked Google API requests.',
			),
			'hide-my-wp/index.php'                      => array(
				'pluginName'      => 'WP Ghost Light',
				'conflictMessage' => 'WP Ghost Light may prevent Google Sign-In from working. Common issues: blocked authentication cookies, restricted popups/iframes, hidden login URLs, or blocked Google API requests.',
			),
			'hide-wp-login/hide-wp-login.php'           => array(
				'pluginName'      => 'Hide My WP',
				'conflictMessage' => 'Hide My WP may prevent Google Sign-In from working. Common issues: blocked authentication cookies, restricted popups/iframes, hidden login URLs, or blocked Google API requests.',
			),
			'all-in-one-wp-security-and-firewall/wp-security.php' => array(
				'pluginName'      => 'All-In-One Security (AIOS) – Security and Firewall',
				'conflictMessage' => 'All-In-One Security (AIOS) – Security and Firewall may prevent Google Sign-In from working. Common issues: blocked authentication cookies, restricted popups/iframes, hidden login URLs, or blocked Google API requests.',
			),
			'sucuri-scanner/sucuri.php'                 => array(
				'pluginName'      => 'Sucuri Security – Auditing, Malware Scanner and Security Hardening',
				'conflictMessage' => 'Sucuri Security – Auditing, Malware Scanner and Security Hardening may prevent Google Sign-In from working. Common issues: blocked authentication cookies, restricted popups/iframes, hidden login URLs, or blocked Google API requests.',
			),
			'wordfence/wordfence.php'                   => array(
				'pluginName'      => 'Wordfence',
				'conflictMessage' => 'Wordfence may prevent Google Sign-In from working. Common issues: blocked authentication cookies, restricted popups/iframes, hidden login URLs, or blocked Google API requests.',
			),
			'wps-hide-login/wps-hide-login.php'         => array(
				'pluginName'      => 'WPS Hide Login',
				'conflictMessage' => 'WPS Hide Login may prevent Google Sign-In from working. Common issues: blocked authentication cookies, restricted popups/iframes, hidden login URLs, or blocked Google API requests.',
			),
		);

		$conflicting_plugins = array();

		foreach ( $active_plugins as $plugin_slug ) {
			if ( isset( $security_plugins[ $plugin_slug ] ) ) {
				$plugin_data = get_plugin_data( WP_PLUGIN_DIR . '/' . $plugin_slug );
				$plugin_name = $plugin_data['Name'];

				$conflicting_plugins[ $plugin_slug ] = array(
					'pluginName'      => $plugin_name,
					'conflictMessage' => $security_plugins[ $plugin_slug ]['conflictMessage'],
				);
			}
		}

		return ! empty( $conflicting_plugins ) ? $conflicting_plugins : false;
	}
}
