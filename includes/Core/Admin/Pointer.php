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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Pointer {

	/**
	 * Unique pointer slug.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $slug;

	/**
	 * Pointer arguments.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $args = array();

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $slug Unique pointer slug.
	 * @param array  $args {
	 *     Associative array of pointer arguments.
	 *
	 *     @type string   $title           Required pointer title.
	 *     @type string   $content         Required pointer content. May contain inline HTML tags.
	 *     @type string   $target_id       ID of the element the pointer should be attached to.
	 *     @type callable $active_callback Callback function to determine whether the pointer is active in the
	 *                                     current context. The current admin screen's hook suffix is passed to
	 *                                     the callback. Default is that the pointer is active unconditionally.
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
				'active_callback' => null,
			)
		);
	}

	/**
	 * Gets the pointer slug.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Unique pointer slug.
	 */
	public function get_slug() {
		return $this->slug;
	}

	/**
	 * Gets the pointer title.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Pointer title.
	 */
	public function get_title() {
		return $this->args['title'];
	}

	/**
	 * Gets the pointer content.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @return string Pointer target ID.
	 */
	public function get_target_id() {
		return $this->args['target_id'];
	}

	/**
	 * Checks whether the pointer is active.
	 *
	 * This method executes the active callback in order to determine whether the pointer should be active or not.
	 *
	 * @since n.e.x.t
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
