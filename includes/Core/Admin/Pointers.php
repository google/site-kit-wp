<?php
/**
 * Class Google\Site_Kit\Core\Admin\Pointers
 *
 * @package   Google\Site_Kit\Core\Admin
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for managing pointers.
 *
 * @since 1.83.0
 * @access private
 * @ignore
 */
class Pointers {

	use Method_Proxy_Trait;

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.83.0
	 */
	public function register() {
		add_action( 'admin_enqueue_scripts', $this->get_method_proxy( 'enqueue_pointers' ) );
	}

	/**
	 * Enqueues pointer scripts.
	 *
	 * @since 1.83.0
	 *
	 * @param string $hook_suffix The current admin page.
	 */
	private function enqueue_pointers( $hook_suffix ) {
		if ( empty( $hook_suffix ) ) {
			return;
		}

		$pointers = $this->get_pointers();
		if ( empty( $pointers ) ) {
			return;
		}

		$active_pointers = array_filter(
			$pointers,
			function ( Pointer $pointer ) use ( $hook_suffix ) {
				return $pointer->is_active( $hook_suffix );
			}
		);

		if ( empty( $active_pointers ) ) {
			return;
		}

		wp_enqueue_style( 'wp-pointer' );
		// Dashboard styles are required where pointers are used to ensure proper styling.
		wp_enqueue_style( 'googlesitekit-wp-dashboard-css' );
		wp_enqueue_script( 'wp-pointer' );

		add_action(
			'admin_print_footer_scripts',
			function () use ( $active_pointers ) {
				foreach ( $active_pointers as $pointer ) {
					$this->print_pointer_script( $pointer );
				}
			}
		);
	}

	/**
	 * Gets pointers.
	 *
	 * @since 1.83.0
	 *
	 * @return Pointer[] Array of pointers.
	 */
	private function get_pointers() {
		/**
		 * Filters the list of available pointers.
		 *
		 * @since 1.83.0
		 *
		 * @param array $pointers List of Pointer instances.
		 */
		$pointers = apply_filters( 'googlesitekit_admin_pointers', array() );

		return array_filter(
			$pointers,
			function ( $pointer ) {
				return $pointer instanceof Pointer;
			}
		);
	}

	/**
	 * Prints script for a given pointer.
	 *
	 * @since 1.83.0
	 * @since n.e.x.t Updated to support buttons and header dismiss icon.
	 *
	 * @param Pointer $pointer Pointer to print.
	 */
	private function print_pointer_script( $pointer ) {
		$content = $pointer->get_content();
		if ( empty( $content ) ) {
			return;
		}

		$slug    = $pointer->get_slug();
		$buttons = $pointer->get_buttons();
		if ( $buttons ) {
			// Content including buttons escaped below in the inline script with wp_kses.
			$content .= "<div class='googlesitekit-pointer-buttons'>" . $buttons . '</div>';
		}

		$class = array( 'wp-pointer' );
		if ( $pointer->get_class() ) {
			$class[] = $pointer->get_class();
		}

		BC_Functions::wp_print_inline_script_tag(
			sprintf(
				'
				jQuery( function() {
					var options = {
						content: "<h3>%s</h3>%s",
						position: %s,
						pointerWidth: 420,
						close: function() {
							jQuery.post(
								window.ajaxurl,
								{
									pointer: "%s",
									action:  "dismiss-wp-pointer",
								}
							);
						},
						pointerClass: "%s",
						buttons: function( event, container ) {
							return jQuery("<div></div>");
						}
					};

					jQuery( "#%6$s" ).pointer( options ).pointer( "open" );

					jQuery("body").on("click", ".googlesitekit-pointer-cta--dismiss", function() {
						jQuery( "#%6$s" ).pointer("close");
					});
					jQuery("body").on("click", ".googlesitekit-pointer-cta", function(event) {
						// We must prevent default link navigation in order to dismiss the pointer first
						// to prevent it showing again.
						event.preventDefault();
						jQuery( "#%6$s" ).pointer("close");
						window.location = jQuery(this).attr("href");
						// TODO: add trackEvent in #11168
					});
				} );
				',
				wp_kses(
					$pointer->get_title(),
					array(
						'span'   => array( 'class' => array() ),
						'button' => array(
							'class' => array(),
							'type'  => array(),
						),
					)
				),
				wp_kses(
					$content,
					array(
						'a'      => array(
							'href'   => array(),
							'class'  => array(),
							'target' => array(),
							'rel'    => array(),
						),
						'h4'     => array(),
						'p'      => array( 'class' => array() ),
						'br'     => array(),
						'strong' => array(),
						'em'     => array(),
						'button' => array(
							'class'    => array(),
							'type'     => array(),
							'data-url' => array(),
						),
						'div'    => array( 'class' => array() ),
					)
				),
				wp_json_encode( $pointer->get_position() ),
				esc_js( $slug ),
				implode( ' ', $class ),
				esc_js( $pointer->get_target_id() ),
			),
			array(
				'id' => $slug,
			)
		);
	}
}
