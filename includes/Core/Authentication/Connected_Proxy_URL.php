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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Connected_Proxy_URL extends Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_connected_proxy_url';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		parent::register();
		add_action( 'googlesitekit_authorize_user', array( $this, 'delete' ) );
	}

	/**
	 * Matches provided URL with the current proxy URL in the settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $url URL to match against the current one in the settings.
	 * @return bool TRUE if URL matches the current one, otherwise FALSE.
	 */
	public function matches_url( $url ) {
		$sanitize   = $this->get_sanitize_callback();
		$normalized = call_user_func( $sanitize, $url );
		return $normalized === $this->get();
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable A sanitizing function.
	 */
	protected function get_sanitize_callback() {
		return function( $url ) {
			$url = filter_var( $url, FILTER_SANITIZE_URL );
			$url = wp_parse_url( $url );
			if ( ! $url ) {
				return null;
			}

			$normalized = $url['path'] ?: '/';
			if ( ! empty( $url['query'] ) ) {
				$query = array();

				parse_str( $url['query'], $query );
				ksort( $query );

				$normalized .= '?' . http_build_query( $query );
			}

			return $normalized;
		};
	}

}
