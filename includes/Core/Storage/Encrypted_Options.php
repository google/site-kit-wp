<?php
/**
 * Class Google\Site_Kit\Core\Storage\Encrypted_Options
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

/**
 * Class providing access to encrypted options.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Encrypted_Options implements Options_Interface {

	/**
	 * Data Encryption API instance.
	 *
	 * @since 1.0.0
	 * @var Data_Encryption
	 */
	private $encryption;

	/**
	 * Option API instance.
	 *
	 * @since 1.0.0
	 * @var Options
	 */
	private $options;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Options $options Option API instance.
	 */
	public function __construct( Options $options ) {
		$this->encryption = new Data_Encryption();
		$this->options    = $options;
	}

	/**
	 * Checks whether or not a value is set for the given option.
	 *
	 * @since 1.3.0
	 *
	 * @param string $option Option name.
	 * @return bool True if value set, false otherwise.
	 */
	public function has( $option ) {
		return $this->options->has( $option );
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
		$raw_value = $this->options->get( $option );

		// If there is no value stored, return the default which will not be encrypted.
		if ( ! $this->options->has( $option ) ) {
			return $raw_value;
		}

		$data = $this->encryption->decrypt( $raw_value );

		return maybe_unserialize( $data );
	}

	/**
	 * Sets the value for a option.
	 *
	 * @since 1.0.0
	 *
	 * @param string $option Option name.
	 * @param mixed  $value  Option value. Must be serializable if non-scalar.
	 * @return bool True on success, false on failure.
	 */
	public function set( $option, $value ) {
		if ( ! is_scalar( $value ) ) {
			$value = maybe_serialize( $value );
		}
		$raw_value = $this->encryption->encrypt( $value );
		if ( ! $raw_value ) {
			return false;
		}

		return $this->options->set( $option, $raw_value );
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
		return $this->options->delete( $option );
	}
}
