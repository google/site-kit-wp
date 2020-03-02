<?php
/**
 * Class Google\Site_Kit\Core\Storage\User_Setting
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

/**
 * Base class for a single user setting.
 *
 * @since 1.4.0
 * @access private
 * @ignore
 */
abstract class User_Setting {

	/**
	 * The user option name for this setting.
	 * Override in a sub-class.
	 */
	const OPTION = '';

	/**
	 * User_Options_Interface implementation.
	 *
	 * @since 1.4.0
	 * @var User_Options_Interface
	 */
	protected $user_options;

	/**
	 * User_Setting constructor.
	 *
	 * @since 1.4.0
	 *
	 * @param User_Options_Interface $user_options User_Options_Interface instance.
	 */
	public function __construct( User_Options_Interface $user_options ) {
		$this->user_options = $user_options;
	}

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since 1.4.0
	 */
	public function register() {
		register_meta(
			'user',
			$this->user_options->get_meta_key( static::OPTION ),
			array(
				'type'              => $this->get_type(),
				'sanitize_callback' => $this->get_sanitize_callback(),
				'single'            => true,
			)
		);
	}

	/**
	 * Checks whether or not the setting exists.
	 *
	 * @since 1.4.0
	 *
	 * @return bool True on success, false on failure.
	 */
	public function has() {
		return metadata_exists(
			'user',
			$this->user_options->get_user_id(),
			$this->user_options->get_meta_key( static::OPTION )
		);
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since 1.4.0
	 *
	 * @return mixed Value set for the option, or default if not set.
	 */
	public function get() {
		if ( ! $this->has() ) {
			return $this->get_default();
		}

		return $this->user_options->get( static::OPTION );
	}

	/**
	 * Sets the value of the setting with the given value.
	 *
	 * @since 1.4.0
	 *
	 * @param mixed $value Setting value. Must be serializable if non-scalar.
	 *
	 * @return bool True on success, false on failure.
	 */
	public function set( $value ) {
		return $this->user_options->set( static::OPTION, $value );
	}

	/**
	 * Deletes the setting.
	 *
	 * @since 1.4.0
	 *
	 * @return bool True on success, false on failure.
	 */
	public function delete() {
		return $this->user_options->delete( static::OPTION );
	}

	/**
	 * Gets the expected value type.
	 *
	 * Returns 'string' by default for consistency with register_meta.
	 * Override in a sub-class if different.
	 *
	 * Valid values are 'string', 'boolean', 'integer', 'number', 'array', and 'object'.
	 *
	 * @since 1.4.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'string';
	}

	/**
	 * Gets the default value.
	 *
	 * Returns an empty string by default for consistency with get_user_meta.
	 * Override in a sub-class if different.
	 *
	 * @since 1.4.0
	 *
	 * @return mixed The default value.
	 */
	protected function get_default() {
		return '';
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * For use internally with register_meta.
	 * Returns `null` for consistency with the default in register_meta.
	 * Override in a sub-class.
	 *
	 * @since 1.4.0
	 *
	 * @return callable|null
	 */
	protected function get_sanitize_callback() {
		return null;
	}
}
