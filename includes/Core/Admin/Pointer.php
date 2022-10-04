<?php
/**
 * Class Google\Site_Kit\Core\Admin\Pointer
 *
 * @package   Google\Site_Kit
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

/**
 * Class representing a single pointer.
 *
 * @since 1.83.0
 * @access private
 * @ignore
 */
final class Pointer {

	/**
	 * Unique pointer slug.
	 *
	 * @since 1.83.0
	 * @var string
	 */
	private $slug;

	/**
	 * Pointer arguments.
	 *
	 * @since 1.83.0
	 * @var array
	 */
	private $args = array();

	/**
	 * Constructor.
	 *
	 * @since 1.83.0
	 *
	 * @param string $slug Unique pointer slug.
	 * @param array  $args {
	 *     Associative array of pointer arguments.
	 *
	 *     @type string       $title           Required. Pointer title.
	 *     @type string       $content         Required. Pointer content. May contain inline HTML tags.
	 *     @type string       $target_id       Required. ID of the element the pointer should be attached to.
	 *     @type string|array $position        Optional. Position of the pointer. Can be 'top', 'bottom', 'left', 'right',
	 *                                         or an array of `edge` and `align`. Default 'top'.
	 *     @type callable     $active_callback Optional. Callback function to determine whether the pointer is active in
	 *                                         the current context. The current admin screen's hook suffix is passed to
	 *                                         the callback. Default is that the pointer is active unconditionally.
	 * }
	 */
	public function __construct( $slug, array $args ) {
		$this->slug = $slug;
		$this->args = wp_parse_args(
			$args,
			array(
				'title'           => '',
				'content'         => '',
				'target_id'       => '',
				'position'        => 'top',
				'active_callback' => null,
			)
		);
	}

	/**
	 * Gets the pointer slug.
	 *
	 * @since 1.83.0
	 *
	 * @return string Unique pointer slug.
	 */
	public function get_slug() {
		return $this->slug;
	}

	/**
	 * Gets the pointer title.
	 *
	 * @since 1.83.0
	 *
	 * @return string Pointer title.
	 */
	public function get_title() {
		return $this->args['title'];
	}

	/**
	 * Gets the pointer content.
	 *
	 * @since 1.83.0
	 *
	 * @return string Pointer content.
	 */
	public function get_content() {
		if ( is_callable( $this->args['content'] ) ) {
			return call_user_func( $this->args['content'] );
		} else {
			return '<p>' . wp_kses( $this->args['content'], 'googlesitekit_admin_pointer' ) . '</p>';
		}
	}

	/**
	 * Gets the pointer target ID.
	 *
	 * @since 1.83.0
	 *
	 * @return string Pointer target ID.
	 */
	public function get_target_id() {
		return $this->args['target_id'];
	}

	/**
	 * Gets the pointer position.
	 *
	 * @since 1.83.0
	 *
	 * @return string|array Pointer position.
	 */
	public function get_position() {
		return $this->args['position'];
	}

	/**
	 * Checks whether the pointer is active.
	 *
	 * This method executes the active callback in order to determine whether the pointer should be active or not.
	 *
	 * @since 1.83.0
	 *
	 * @param string $hook_suffix The current admin screen hook suffix.
	 * @return bool True if the pointer is active, false otherwise.
	 */
	public function is_active( $hook_suffix ) {
		if ( empty( $this->args['title'] ) || empty( $this->args['content'] ) || empty( $this->args['target_id'] ) ) {
			return false;
		}

		if ( ! is_callable( $this->args['active_callback'] ) ) {
			return true;
		}

		return (bool) call_user_func( $this->args['active_callback'], $hook_suffix );
	}
}
