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

use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class representing a single pointer.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Pointer {

	use Method_Proxy_Trait;

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

	/**
	 * Enqueues the pointer script.
	 *
	 * @since n.e.x.t
	 */
	public function enqueue_script() {
		add_action( 'admin_print_footer_scripts', $this->get_method_proxy( 'print_script' ) );
	}

	/**
	 * Prints the pointer script.
	 *
	 * @since n.e.x.t
	 */
	private function print_script() {

		if ( is_callable( $this->args['content'] ) ) {
			$content = call_user_func( $this->args['content'] );
			if ( empty( $content ) ) {
				return;
			}
		} else {
			$content = '<p>' . wp_kses( $this->args['content'], 'googlesitekit_admin_pointer' ) . '</p>';
		}

		BC_Functions::wp_print_inline_script_tag(
			sprintf(
				'
				jQuery( function() {
					var options = {
						content: "<h3>%s</h3>%s",
						position: {
							edge:  "left",
							align: "right",
						},
						pointerClass: "wp-pointer arrow-top",
						pointerWidth: 420,
						close: function() {
							jQuery.post(
								window.ajaxurl,
								{
									pointer: "%s",
									action:  "dismiss-wp-pointer",
								}
							);
						}
					};
		
					jQuery( "#%s" ).pointer( options ).pointer( "open" );
				} );
				',
				esc_js( $this->args['title'] ),
				esc_js( $content ),
				esc_js( $this->slug ),
				esc_js( $this->args['target_id'] )
			),
			array(
				'id' => $this->slug,
			)
		);
	}
}
