<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Connected_Proxy_URL
 *
 * @package   Google\Site_Kit\Core\Authentication
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Connected_Proxy_URL class.
 *
 * @since 1.17.0
 * @access private
 * @ignore
 */
class Connected_Proxy_URL extends Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_connected_proxy_url';

	/**
	 * Matches provided URL with the current proxy URL in the settings.
	 *
	 * @since 1.17.0
	 *
	 * @param string $url URL to match against the current one in the settings.
	 * @return bool TRUE if URL matches the current one, otherwise FALSE.
	 */
	public function matches_url( $url ) {
		$sanitize   = $this->get_sanitize_callback();
		$normalized = $sanitize( $url );
		return $normalized === $this->get();
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.17.0
	 *
	 * @return callable A sanitizing function.
	 */
	protected function get_sanitize_callback() {
		return 'trailingslashit';
	}

}
