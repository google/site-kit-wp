<?php
/**
 * Class Google\Site_Kit\Core\Proactive_User_Engagement\Proactive_User_Engagement_Settings
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Proactive_User_Engagement;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class for Proactive User Engagement settings.
 *
 * @since 1.161.0
 * @access private
 * @ignore
 */
class Proactive_User_Engagement_Settings extends Setting {

	/**
	 * The option name for this setting.
	 */
	const OPTION = 'googlesitekit_proactive_user_engagement';

	/**
	 * Returns the expected value type.
	 *
	 * @since 1.161.0
	 *
	 * @return string The type of the setting.
	 */
	public function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.161.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'enabled' => true,
		);
	}

	/**
	 * Gets the sanitize callback.
	 *
	 * @since 1.161.0
	 *
	 * @return callable The sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $value ) {
			$new_value = $this->get();

			if ( isset( $value['enabled'] ) ) {
				$new_value['enabled'] = (bool) $value['enabled'];
			}

			return $new_value;
		};
	}

	/**
	 * Checks if proactive user engagement is enabled.
	 *
	 * @since 1.161.0
	 *
	 * @return bool True if proactive user engagement is enabled, false otherwise.
	 */
	public function is_proactive_user_engagement_enabled() {
		$settings = $this->get();
		return $settings['enabled'];
	}
}
