<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Connected_Proxy_URL
 *
 * @package   Google\Site_Kit\Core\Authentication
 * @copyright 2021 Google LLC
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
	 * @since n.e.x.t Compares the given URL against the decoded stored URL.
	 *
	 * @param string $url URL to match against the current one in the settings.
	 * @return bool TRUE if URL matches the current one, otherwise FALSE.
	 */
	public function matches_url( $url ) {
		return trailingslashit( $url ) === $this->get();
	}

	/**
	 * Gets the connected proxy URL, base64-decoded from the value the option stores.
	 *
	 * A stored value that fails to decode reads as no value at all, so
	 * `matches_url()` reports no match and the site goes back through the
	 * connection flow rather than through a comparison against an unreadable
	 * URL.
	 *
	 * @since n.e.x.t
	 *
	 * @return string|bool Connected proxy URL, or FALSE when the option holds
	 *                     no value or one that fails to decode.
	 */
	public function get() {
		$stored_url = parent::get();

		if ( ! is_string( $stored_url ) ) {
			return false;
		}

		return base64_decode( $stored_url, true );
	}

	/**
	 * Sets the connected proxy URL, base64-encoded and with a trailing slash.
	 *
	 * We encode the URL to prevent database-wide search-and-replace tasks
	 * from changing the URL used to connect to the Site Kit Proxy service.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $value Connected proxy URL.
	 * @return bool TRUE on success, FALSE on failure.
	 */
	public function set( $value ) {
		return parent::set( base64_encode( trailingslashit( $value ) ) );
	}
}
