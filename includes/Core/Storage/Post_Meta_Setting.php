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
 * @since n.e.x.t
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
	 * @since n.e.x.t
	 * @var Post_Meta_Interface
	 */
	protected $post_meta;

	/**
	 * Post_Meta_Setting constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Post_Meta_Interface $post_meta Post_Meta_Interface instance.
	 */
	public function __construct( Post_Meta_Interface $post_meta ) {
		$this->post_meta = $post_meta;
	}

	/**
	 * Registers the post setting in WordPress.
	 *
	 * @since n.e.x.t
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
	 * Returns an empty string by default.
	 * Override in a sub-class if different.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @return callable|null Sanitize callback function.
	 */
	protected function get_sanitize_callback() {
		return null;
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $post_id Post ID.
	 * @return mixed Value set for the setting, or default if not set.
	 */
	public function get( $post_id ) {
		$value = $this->post_meta->get( $post_id, static::META_KEY, true );
		if ( false === $value ) {
			$value = $this->get_default();
		}

		return $value;
	}

	/**
	 * Updates the post setting for the given post ID.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @param int $post_id Post ID.
	 * @return bool TRUE on success, otherwise FALSE.
	 */
	public function delete( $post_id ) {
		return $this->post_meta->delete( $post_id, static::META_KEY );
	}

}
