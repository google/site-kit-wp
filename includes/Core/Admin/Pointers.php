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
	 * @since 1.166.0 Updated to support buttons and header dismiss icon.
	 *
	 * @param Pointer $pointer Pointer to print.
	 */
	private function print_pointer_script( $pointer ) {
		$content = $pointer->get_content();
		if ( empty( $content ) ) {
			return;
		}

		$buttons = $pointer->get_buttons();
		if ( $buttons ) {
			// Content including buttons escaped below in the inline script with wp_kses.
			$content .= '<div class="googlesitekit-pointer-buttons">' . $buttons . '</div>';
		}

		$class = array( 'wp-pointer' );
		if ( $pointer->get_class() ) {
			$class[] = $pointer->get_class();
		}

		$kses_title = array(
			'span'   => array( 'class' => array() ),
			'button' => array(
				'class'       => array(),
				'type'        => array(),
				'data-action' => array(),
			),
		);

		$kses_content = array(
			'a'      => array(
				'href'        => array(),
				'class'       => array(),
				'target'      => array(),
				'rel'         => array(),
				'data-action' => array(),
			),
			'h4'     => array(),
			'p'      => array( 'class' => array() ),
			'br'     => array(),
			'strong' => array(),
			'em'     => array(),
			'button' => array(
				'class'       => array(),
				'type'        => array(),
				'data-action' => array(),
			),
			'div'    => array( 'class' => array() ),
		);

		BC_Functions::wp_print_inline_script_tag(
			<<<'JS'
			(
				function ( $, wp, config ) {
					function initPointer() {
						const options = {
							content: '<h3>' + config.title + '</h3>' + config.content,
							position: JSON.parse( config.position ),
							pointerWidth: 420,
							pointerClass: config.class,
							close: function() {
								wp.ajax.post( 'dismiss-wp-pointer', { pointer: config.slug } );
							},
							buttons: function( event, container ) {
								container.pointer.on( 'click', '[data-action="dismiss"]', function() {
									container.element.pointer( 'close' );
								} );
							}
						};

						$( '#' + config.targetId ).pointer( options ).pointer( 'open' );
					}

					$( initPointer );
				}
			)( window.jQuery, window.wp, { ...document.currentScript.dataset } );
			JS
			,
			array(
				'data-slug'      => $pointer->get_slug(),
				'data-class'     => implode( ' ', $class ),
				'data-target-id' => $pointer->get_target_id(),
				'data-title'     => wp_kses( $pointer->get_title(), $kses_title ),
				'data-content'   => wp_kses( $content, $kses_content ),
				'data-position'  => wp_json_encode( $pointer->get_position() ),
			)
		);
	}
}
