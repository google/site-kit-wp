<?php
/**
 * Class Google\Site_Kit\Core\Storage\Options
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

use Google\Site_Kit\Context;

/**
 * Class providing access to options.
 *
 * It uses regular options or network options, depending on in which mode the plugin is running.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Options {

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Gets the value of the given option.
	 *
	 * @since 1.0.0
	 *
	 * @param string $option Option name.
	 * @return mixed Value set for the option, or false if not set.
	 */
	public function get( $option ) {
		if ( $this->context->is_network_mode() ) {
			return get_network_option( null, $option );
		}

		return get_option( $option );
	}

	/**
	 * Sets the value for a option.
	 *
	 * @since 1.0.0
	 *
	 * @param string $option    Option name.
	 * @param mixed  $value     Option value. Must be serializable if non-scalar.
	 * @param mixed  $autoload  Autoload. False or 'no' to prevent autoloading on page load.
	 * @return bool True on success, false on failure.
	 */
	public function set( $option, $value, $autoload = true ) {
		if ( $this->context->is_network_mode() ) {
			return update_network_option( null, $option, $value );
		}

		return update_option( $option, $value, $autoload );
	}

	/**
	 * Deletes the given option.
	 *
	 * @since 1.0.0
	 *
	 * @param string $option Option name.
	 * @return bool True on success, false on failure.
	 */
	public function delete( $option ) {
		if ( $this->context->is_network_mode() ) {
			return delete_network_option( null, $option );
		}

		return delete_option( $option );
	}
}

