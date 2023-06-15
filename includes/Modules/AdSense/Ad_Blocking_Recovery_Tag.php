<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Tag
 *
 * @package   Google\Site_Kit\Modules\AdSense
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\AdSense;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class for AdSense Ad Blocker Recovery Tag.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Ad_Blocking_Recovery_Tag extends Setting {
	const OPTION = 'googlesitekit_adsense_ad_blocking_recovery_tag';

	/**
	 * Gets ad blocking recovery tag.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Array with tag and error protection code.
	 */
	public function get() {
		$option = parent::get();

		$tag                   = base64_decode( $option['tag'], true );
		$error_protection_code = base64_decode( $option['error_protection_code'], true );

		if ( false === $tag || false === $error_protection_code ) {
			return $this->get_default();
		}

		$option['tag']                   = $tag;
		$option['error_protection_code'] = $error_protection_code;

		return $option;
	}

	/**
	 * Sets ad blocking recovery tag.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $value Array with tag and error protection code.
	 *
	 * @return bool True on success, false on failure.
	 */
	public function set( $value ) {
		$tag                   = base64_encode( $value['tag'] );
		$error_protection_code = base64_encode( $value['error_protection_code'] );

		return parent::set(
			array(
				'tag'                   => $tag,
				'error_protection_code' => $error_protection_code,
			)
		);
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	protected function get_default() {
		return array(
			'tag'                   => '',
			'error_protection_code' => '',
		);
	}

	/**
	 * Gets the callback for sanitizing the ad blocking recovery tag before saving.
	 *
	 * @since 1.6.0
	 *
	 * @return callable|null
	 */
	protected function get_sanitize_callback() {
		return function( $option ) {
			if ( ! is_array( $option ) || ! isset( $option['tag'] ) || ! isset( $option['error_protection_code'] ) || ! is_string( $option['tag'] ) || ! is_string( $option['error_protection_code'] ) ) {
				return $this->get_default();
			}

			return $option;
		};
	}
}
