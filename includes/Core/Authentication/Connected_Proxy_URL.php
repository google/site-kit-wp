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
	 * Registers the setting in WordPress.
	 *
	 * Decodes the stored value on read, so a caller of the option gets the
	 * plain-text URL.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		parent::register();

		add_filter(
			'option_' . static::OPTION,
			fn ( $value ) => $this->decode( $value )
		);
	}

	/**
	 * Matches provided URL with the current proxy URL in the settings.
	 *
	 * @since 1.17.0
	 * @since n.e.x.t Compares against the decoded setting value.
	 *
	 * @param string $site_url URL to match against the current one in the settings.
	 * @return bool TRUE if URL matches the current one, otherwise FALSE.
	 */
	public function matches_url( $site_url ) {
		return trailingslashit( $site_url ) === $this->get();
	}

	/**
	 * Gets the connected proxy URL in plain text.
	 *
	 * @since n.e.x.t
	 *
	 * @return string|bool Connected proxy URL, or FALSE if not set.
	 */
	public function get() {
		return $this->decode( parent::get() );
	}

	/**
	 * Sets the connected proxy URL, encoding it for storage.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $value Connected proxy URL, either plain text or encoded.
	 * @return bool TRUE on success, FALSE on failure.
	 */
	public function set( $value ) {
		return parent::set( $this->encode( $value ) );
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.17.0
	 * @since n.e.x.t Encodes the value for storage.
	 *
	 * @return callable A sanitizing function.
	 */
	protected function get_sanitize_callback() {
		return fn ( $value ) => $this->encode( $value );
	}

	/**
	 * Encodes the given URL for storage.
	 *
	 * The encoded value holds no readable URL, so a database search and
	 * replace leaves it unchanged. An already encoded value decodes first,
	 * so a re-save never encodes it twice.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $value Connected proxy URL, either plain text or encoded.
	 * @return string Base64-encoded URL with a trailing slash.
	 */
	private function encode( $value ) {
		return base64_encode( trailingslashit( $this->decode( $value ) ) );
	}

	/**
	 * Decodes the given stored value into a plain-text URL.
	 *
	 * Earlier plugin versions stored the value in plain text. A value that
	 * starts with `http`, or one that fails to decode, passes through
	 * unchanged.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value Stored setting value.
	 * @return mixed Decoded URL, or the given value unchanged.
	 */
	private function decode( $value ) {
		if ( ! is_string( $value ) || '' === $value ) {
			return $value;
		}

		if ( 0 === strpos( $value, 'http' ) ) {
			return $value;
		}

		$decoded = base64_decode( $value, true );

		return false === $decoded ? $value : $decoded;
	}
}
