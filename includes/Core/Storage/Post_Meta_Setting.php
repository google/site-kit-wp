<?php
/**
 * Class Google\Site_Kit\Core\Storage\Post_Meta_Setting
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

/**
 * Base class for a single post meta setting.
 *
 * @since 1.33.0
 * @access private
 * @ignore
 */
abstract class Post_Meta_Setting {

	/**
	 * The post meta key for this setting.
	 * Override in a sub-class.
	 */
	const META_KEY = '';

	/**
	 * Post_Meta_Interface implementation.
	 *
	 * @since 1.33.0
	 * @var Post_Meta_Interface
	 */
	protected $post_meta;

	/**
	 * Post_Meta_Setting constructor.
	 *
	 * @since 1.33.0
	 *
	 * @param Post_Meta_Interface $post_meta Post_Meta_Interface instance.
	 */
	public function __construct( Post_Meta_Interface $post_meta ) {
		$this->post_meta = $post_meta;
	}

	/**
	 * Registers the post setting in WordPress.
	 *
	 * @since 1.33.0
	 */
	public function register() {
		register_meta(
			'post',
			static::META_KEY,
			array(
				'type'              => $this->get_type(),
				'sanitize_callback' => $this->get_sanitize_callback(),
				'single'            => true,
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
	 * Checks whether a post meta exists or not.
	 *
	 * @since 1.33.0
	 *
	 * @param int $post_id Post ID.
	 * @return bool True if the meta key exists, otherwise false.
	 */
	public function has( $post_id ) {
		return metadata_exists( 'post', $post_id, static::META_KEY );
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since 1.33.0
	 *
	 * @param int $post_id Post ID.
	 * @return mixed Value set for the setting, or default if not set.
	 */
	public function get( $post_id ) {
		if ( ! $this->has( $post_id ) ) {
			return $this->get_default();
		}

		return $this->post_meta->get( $post_id, static::META_KEY, true );
	}

	/**
	 * Updates the post setting for the given post ID.
	 *
	 * @since 1.33.0
	 *
	 * @param int   $post_id Post ID.
	 * @param mixed $value   Metadata value.
	 * @return bool TRUE on success, otherwise FALSE.
	 */
	public function set( $post_id, $value ) {
		return $this->post_meta->update( $post_id, static::META_KEY, $value );
	}

	/**
	 * Deletes the post setting for the given post ID.
	 *
	 * @since 1.33.0
	 *
	 * @param int $post_id Post ID.
	 * @return bool TRUE on success, otherwise FALSE.
	 */
	public function delete( $post_id ) {
		return $this->post_meta->delete( $post_id, static::META_KEY );
	}

}
