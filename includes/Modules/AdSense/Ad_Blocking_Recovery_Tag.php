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

use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Options_Interface;
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
	 * Ad_Blocking_Recovery_Tag constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Options $options Options_Interface instance.
	 */
	public function __construct( Options $options ) {
		$this->options = new Encrypted_Options( $options );
	}

	/**
	 * Gets ad blocking recovery tag.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Array with tag and error protection code.
	 */
	public function get() {
		$option = parent::get();

		if ( ! is_array( $option ) || ! isset( $option['tag'] ) || ! isset( $option['error_protection_code'] ) || ! is_string( $option['tag'] ) || ! is_string( $option['error_protection_code'] ) ) {
			return $this->get_default();
		}

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
		if ( ! is_array( $value ) || ! isset( $value['tag'] ) || ! isset( $value['error_protection_code'] ) || ! is_string( $value['tag'] ) || ! is_string( $value['error_protection_code'] ) ) {
			return false;
		}

		return parent::set( $value );
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
