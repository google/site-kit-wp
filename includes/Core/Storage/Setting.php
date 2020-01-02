<?php
/**
 * Class Google\Site_Kit\Core\Storage
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

/**
 * Base class for a single setting.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
abstract class Setting {

	/**
	 * The option_name for this setting.
	 * Override in a sub-class.
	 */
	const OPTION = '';

	/**
	 * Options instance implementing Options_Interface.
	 *
	 * @since n.e.x.t
	 * @var Options_Interface
	 */
	protected $options;

	/**
	 * Setting constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Options_Interface $options Options_Interface instance.
	 */
	public function __construct( Options_Interface $options ) {
		$this->options = $options;
	}

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since n.e.x.t
	 */
	abstract public function register();

	/**
	 * Checks whether or not the option is set with a valid value.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True on success, false on failure.
	 */
	public function has() {
		return (bool) $this->get();
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since n.e.x.t
	 *
	 * @return mixed Value set for the option, or registered default if not set.
	 */
	public function get() {
		return $this->options->get( static::OPTION );
	}

	/**
	 * Sets the value of the setting with the given value.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value Setting value. Must be serializable if non-scalar.
	 *
	 * @return bool True on success, false on failure.
	 */
	public function set( $value ) {
		return $this->options->set( static::OPTION, $value );
	}

	/**
	 * Deletes the setting.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True on success, false on failure.
	 */
	public function delete() {
		return $this->options->delete( static::OPTION );
	}

	/**
	 * Gets the expected value type.
	 *
	 * Returns 'string' by default for consistency with register_setting.
	 * Override in a sub-class if different.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'string';
	}

	/**
	 * Gets the default value.
	 *
	 * For use with register_setting and fetching the default directly.
	 * Returns false by default for consistency with get_option.
	 * Override in a sub-class if different.
	 *
	 * @since n.e.x.t
	 *
	 * @return mixed The default value.
	 */
	protected function get_default() {
		return false;
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * For use internally with register_setting.
	 * Returns `null` for consistency with the default in register_setting.
	 * Override in a sub-class.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable|null
	 */
	protected function get_sanitize_callback() {
		return null;
	}
}
