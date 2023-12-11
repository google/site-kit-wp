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
 * Class for AdSense Ad blocking recovery Tag.
 *
 * @since 1.104.0
 * @access private
 * @ignore
 */
class Ad_Blocking_Recovery_Tag extends Setting {

	const OPTION = 'googlesitekit_adsense_ad_blocking_recovery_tag';

	/**
	 * Gets ad blocking recovery tag.
	 *
	 * @since 1.104.0
	 *
	 * @return array Array with tag and error protection code.
	 */
	public function get() {
		$option = parent::get();

		if ( ! $this->is_valid_tag_object( $option ) ) {
			return $this->get_default();
		}

		return $option;
	}

	/**
	 * Sets ad blocking recovery tag.
	 *
	 * @since 1.104.0
	 *
	 * @param array $value Array with tag and error protection code.
	 *
	 * @return bool True on success, false on failure.
	 */
	public function set( $value ) {
		if ( ! $this->is_valid_tag_object( $value ) ) {
			return false;
		}

		return parent::set( $value );
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.104.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.104.0
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
	 * Determines whether the given value is a valid tag object.
	 *
	 * @since 1.104.0
	 *
	 * @param mixed $tag Tag object.
	 *
	 * @return bool TRUE if valid, otherwise FALSE.
	 */
	private function is_valid_tag_object( $tag ) {
		return is_array( $tag ) && isset( $tag['tag'] ) && isset( $tag['error_protection_code'] ) && is_string( $tag['tag'] ) && is_string( $tag['error_protection_code'] );
	}
}
