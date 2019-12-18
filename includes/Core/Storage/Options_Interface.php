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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
interface Options_Interface {

	/**
	 * Gets the value of the given option.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $option Option name.
	 * @return mixed Value set for the option, or false if not set.
	 */
	public function get( $option );

	/**
	 * Sets the value for a option.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $option    Option name.
	 * @param mixed  $value     Option value. Must be serializable if non-scalar.
	 * @param mixed  $autoload  Autoload. False or 'no' to prevent autoloading on page load.
	 * @return bool True on success, false on failure.
	 */
	public function set( $option, $value, $autoload = true );

	/**
	 * Deletes the given option.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $option Option name.
	 * @return bool True on success, false on failure.
	 */
	public function delete( $option );
}
