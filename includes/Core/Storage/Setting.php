<?php
/**
 * Class Google\Site_Kit\Core\Storage
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

/**
 * Base class for a single setting.
 *
 * @since 1.2.0
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
	 * @since 1.2.0
	 * @var Options_Interface
	 */
	protected $options;

	/**
	 * Setting constructor.
	 *
	 * @since 1.2.0
	 *
	 * @param Options_Interface $options Options_Interface instance.
	 */
	public function __construct( Options_Interface $options ) {
		$this->options = $options;
	}

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since 1.2.0
	 */
	public function register() {
		register_setting(
			static::OPTION,
			static::OPTION,
			array(
				'type'              => $this->get_type(),
				'sanitize_callback' => $this->get_sanitize_callback(),
				'default'           => $this->get_default(),
			)
		);
	}

	/**
	 * Checks whether or not the option is set with a valid value.
	 *
	 * @since 1.2.0
	 * @since 1.3.0 Now relies on {@see Options_Interface::has()}.
	 *
	 * @return bool True on success, false on failure.
	 */
	public function has() {
		return $this->options->has( static::OPTION );
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since 1.2.0
	 *
	 * @return mixed Value set for the option, or registered default if not set.
	 */
	public function get() {
		return $this->options->get( static::OPTION );
	}

	/**
	 * Sets the value of the setting with the given value.
	 *
	 * @since 1.2.0
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
	 * @since 1.2.0
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
	 * @since 1.2.0
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
	 * @since 1.2.0
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
	 * @since 1.2.0
	 *
	 * @return callable|null
	 */
	protected function get_sanitize_callback() {
		return null;
	}
}
