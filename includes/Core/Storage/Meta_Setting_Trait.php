<?php
/**
 * Class Google\Site_Kit\Core\Storage\Meta_Setting_Trait
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

/**
 * Base class for a single object meta setting.
 *
 * @since 1.33.0
 * @since 1.146.0 Changed from Post_Meta_Setting to Meta_Setting_Trait.
 *
 * @access private
 * @ignore
 */
trait Meta_Setting_Trait {
	/**
	 * Meta_Interface implementation.
	 *
	 * @since 1.33.0
	 * @var Meta_Interface
	 */
	protected $meta;

	/**
	 * Gets the meta key for the setting.
	 *
	 * @since 1.145.0
	 *
	 * @return string Meta key.
	 */
	abstract protected function get_meta_key(): string;

	/**
	 * Gets the object type like `post`, `term`, etc.
	 *
	 * @since 1.146.0
	 *
	 * @return string Object type.
	 */
	abstract protected function get_object_type(): string;

	/**
	 * Registers the object setting in WordPress.
	 *
	 * @since 1.33.0
	 */
	public function register() {
		register_meta(
			$this->get_object_type(),
			$this->get_meta_key(),
			array(
				'type'              => $this->get_type(),
				'sanitize_callback' => $this->get_sanitize_callback(),
				'single'            => true,
				'show_in_rest'      => $this->get_show_in_rest(),
			)
		);
	}

	/**
	 * Gets the expected value type.
	 *
	 * Returns 'string' by default for consistency with register_meta.
	 * Override in a sub-class if different.
	 *
	 * Valid values are 'string', 'boolean', 'integer', 'number', 'array', and 'object'.
	 *
	 * @since 1.33.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'string';
	}

	/**
	 * Gets the default value.
	 *
	 * Returns an empty string by default.
	 * Override in a sub-class if different.
	 *
	 * @since 1.33.0
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
	 * @since 1.33.0
	 *
	 * @return callable|null Sanitize callback function.
	 */
	protected function get_sanitize_callback() {
		return null;
	}

	/**
	 * Gets the `show_in_rest` value for this meta setting value.
	 *
	 * @since 1.37.0
	 *
	 * @return bool|Array Any valid value for the `show_in_rest`
	 */
	protected function get_show_in_rest() {
		return false;
	}

	/**
	 * Checks whether meta exists for a given object or not.
	 *
	 * @since 1.33.0
	 * @since 1.146.0 Changed `$post_id` parameter to `$object_id`.
	 *
	 * @param int $object_id Object ID.
	 * @return bool True if the meta key exists, otherwise false.
	 */
	public function has( $object_id ) {
		return metadata_exists( $this->get_object_type(), $object_id, $this->get_meta_key() );
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since 1.33.0
	 * @since 1.146.0 Changed `$post_id` parameter to `$object_id`.
	 *
	 * @param int $object_id Object ID.
	 * @return mixed Value set for the setting, or default if not set.
	 */
	public function get( $object_id ) {
		if ( ! $this->has( $object_id ) ) {
			return $this->get_default();
		}

		return $this->meta->get( $object_id, $this->get_meta_key(), true );
	}

	/**
	 * Updates the setting for the given object ID.
	 *
	 * @since 1.33.0
	 * @since 1.146.0 Changed `$post_id` parameter to `$object_id`.
	 *
	 * @param int   $object_id Object ID.
	 * @param mixed $value     Metadata value.
	 * @return bool TRUE on success, otherwise FALSE.
	 */
	public function set( $object_id, $value ) {
		return $this->meta->update( $object_id, $this->get_meta_key(), $value );
	}

	/**
	 * Deletes the setting for the given object ID.
	 *
	 * @since 1.33.0
	 * @since 1.146.0 Changed `$post_id` parameter to `$object_id`.
	 *
	 * @param int $object_id Object ID.
	 * @return bool TRUE on success, otherwise FALSE.
	 */
	public function delete( $object_id ) {
		return $this->meta->delete( $object_id, $this->get_meta_key() );
	}
}
