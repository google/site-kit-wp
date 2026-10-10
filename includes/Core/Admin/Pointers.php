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

use Google\Site_Kit\Core\Assets\Script_Data;
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
	 * Pointers that are active on the current admin screen.
	 *
	 * @since n.e.x.t
	 * @var Pointer[]
	 */
	private $active_pointers = array();

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.83.0
	 * @since n.e.x.t Registers the pointers data script.
	 */
	public function register() {
		add_filter( 'googlesitekit_assets', $this->get_method_proxy( 'add_assets' ) );
		// Runs after Assets registers its scripts on the same hook.
		add_action( 'admin_enqueue_scripts', $this->get_method_proxy( 'enqueue_pointers' ), 11 );
	}

	/**
	 * Adds the pointers data script to the list of Site Kit assets.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $assets List of Asset instances.
	 * @return array Filtered list of Asset instances.
	 */
	private function add_assets( $assets ) {
		$assets[] = new Script_Data(
			'googlesitekit-admin-pointers-data',
			array(
				'global'        => '_googlesitekitAdminPointersData',
				'data_callback' => function () {
					return $this->get_active_pointers_data();
				},
			)
		);

		return $assets;
	}

	/**
	 * Enqueues pointer scripts.
	 *
	 * @since 1.83.0
	 * @since n.e.x.t Enqueues the admin pointers script instead of printing inline scripts.
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

		$this->active_pointers = array_filter(
			$pointers,
			function ( Pointer $pointer ) use ( $hook_suffix ) {
				return $pointer->is_active( $hook_suffix );
			}
		);

		if ( empty( $this->active_pointers ) ) {
			return;
		}

		wp_enqueue_style( 'wp-pointer' );
		// Dashboard styles are required where pointers are used to ensure proper styling.
		wp_enqueue_style( 'googlesitekit-wp-dashboard-css' );
		wp_enqueue_script( 'googlesitekit-admin-pointers' );
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
	 * Gets the data for all active pointers that have content.
	 *
	 * @since n.e.x.t
	 *
	 * @return array List of pointer data.
	 */
	private function get_active_pointers_data() {
		$data = array();

		foreach ( $this->active_pointers as $pointer ) {
			$pointer_data = $this->get_pointer_data( $pointer );
			if ( $pointer_data ) {
				$data[] = $pointer_data;
			}
		}

		return $data;
	}

	/**
	 * Gets the data the admin pointers script needs to render a pointer.
	 *
	 * @since n.e.x.t
	 *
	 * @param Pointer $pointer Pointer to get data for.
	 * @return array|null Pointer data, or null if the pointer has no content.
	 */
	private function get_pointer_data( Pointer $pointer ) {
		$content = $pointer->get_content();
		if ( empty( $content ) ) {
			return null;
		}

		$buttons = $pointer->get_buttons();
		if ( $buttons ) {
			// Content including buttons escaped below with wp_kses.
			$content .= '<div class="googlesitekit-pointer-buttons">' . $buttons . '</div>';
		}

		$class = array( 'wp-pointer', sanitize_html_class( $pointer->get_slug() ) );

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

		return array(
			'slug'     => $pointer->get_slug(),
			'class'    => implode( ' ', $class ),
			'targetID' => $pointer->get_target_id(),
			'title'    => wp_kses( $pointer->get_title(), $kses_title ),
			'content'  => wp_kses( $content, $kses_content ),
			'position' => $pointer->get_position(),
			'tracking' => $pointer->get_tracking() ?: null,
		);
	}
}
