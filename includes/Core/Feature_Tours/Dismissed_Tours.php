<?php
/**
 * Class Google\Site_Kit\Core\Feature_Tours\Dismissed_Tours
 *
 * @package   Google\Site_Kit\Core\Feature_Tours
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Feature_Tours;

use Closure;
use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for representing a user's dismissed feature tours.
 *
 * @since 1.27.0
 * @access private
 * @ignore
 */
class Dismissed_Tours extends User_Setting {

	/**
	 * The user option name for this setting.
	 *
	 * @note This option is prefixed differently
	 * so that it will persist across disconnect/reset.
	 */
	const OPTION = 'googlesitekitpersistent_dismissed_tours';

	/**
	 * Adds one or more tours to the list of dismissed tours.
	 *
	 * @since 1.27.0
	 *
	 * @param string ...$tour_slug The tour identifier to dismiss.
	 */
	public function add( ...$tour_slug ) {
		$value = array_merge( $this->get(), $tour_slug );

		$this->set( $value );
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since 1.27.0
	 *
	 * @return array Value set for the option, or default if not set.
	 */
	public function get() {
		$value = parent::get();

		return is_array( $value ) ? $value : array();
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.27.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'array';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.27.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array();
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.27.0
	 *
	 * @return Closure
	 */
	protected function get_sanitize_callback() {
		return function ( $value ) {
			return is_array( $value )
				? array_values( array_unique( $value ) )
				: $this->get();
		};
	}
}
