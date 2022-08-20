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

use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for managing pointers.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Pointers {

	use Method_Proxy_Trait;

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'admin_enqueue_scripts', $this->get_method_proxy( 'enqueue_pointers' ) );
	}

	/**
	 * Enqueues pointer scripts.
	 *
	 * @since n.e.x.t
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
			function( Pointer $pointer ) use ( $hook_suffix ) {
				return $pointer->is_active( $hook_suffix );
			}
		);

		if ( empty( $active_pointers ) ) {
			return;
		}

		wp_enqueue_style( 'wp-pointer' );
		wp_enqueue_script( 'wp-pointer' );

		foreach ( $active_pointers as $pointer ) {
			$pointer->enqueue_script();
		}
	}

	/**
	 * Gets pointers.
	 *
	 * @since n.e.x.t
	 *
	 * @return Pointer[] Array of pointers.
	 */
	private function get_pointers() {
		/**
		 * Filters the list of available pointers.
		 *
		 * @since n.e.x.t
		 *
		 * @param array $pointers List of Pointer instances.
		 */
		$pointers = apply_filters( 'googlesitekit_admin_pointers', array() );

		return array_filter(
			$pointers,
			function( $pointer ) {
				return $pointer instanceof Pointer;
			}
		);
	}
}
