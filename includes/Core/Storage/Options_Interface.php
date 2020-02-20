<?php
/**
 * Interface Google\Site_Kit\Core\Storage\Options_Interface
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

/**
 * Interface for Options implementations.
 *
 * @since 1.2.0
 * @access private
 * @ignore
 */
interface Options_Interface {

	/**
	 * Checks whether or not a value is set for the given option.
	 *
	 * @since 1.3.0
	 *
	 * @param string $option Option name.
	 * @return bool True if value set, false otherwise.
	 */
	public function has( $option );

	/**
	 * Gets the value of the given option.
	 *
	 * @since 1.2.0
	 *
	 * @param string $option Option name.
	 * @return mixed Value set for the option, or false if not set.
	 */
	public function get( $option );

	/**
	 * Sets the value for a option.
	 *
	 * @since 1.2.0
	 *
	 * @param string $option    Option name.
	 * @param mixed  $value     Option value. Must be serializable if non-scalar.
	 * @return bool True on success, false on failure.
	 */
	public function set( $option, $value );

	/**
	 * Deletes the given option.
	 *
	 * @since 1.2.0
	 *
	 * @param string $option Option name.
	 * @return bool True on success, false on failure.
	 */
	public function delete( $option );
}
