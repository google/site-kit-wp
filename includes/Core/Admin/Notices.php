<?php
/**
 * Class Google\Site_Kit\Core\Admin\Notices
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

/**
 * Class managing admin notices.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Notices {

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		$callback = function () {
			global $hook_suffix;

			if ( empty( $hook_suffix ) ) {
				return;
			}

			$this->render_notices( $hook_suffix );
		};

		add_action( 'admin_notices', $callback );
		add_action( 'network_admin_notices', $callback );
	}

	/**
	 * Renders admin notices.
	 *
	 * @since 1.0.0
	 *
	 * @param string $hook_suffix The current admin screen hook suffix.
	 */
	private function render_notices( $hook_suffix ) {
		$notices = $this->get_notices();
		if ( empty( $notices ) ) {
			return;
		}

		/**
		 * Notice object.
		 *
		 * @var Notice $notice Notice object.
		 */
		foreach ( $notices as $notice ) {
			if ( ! $notice->is_active( $hook_suffix ) ) {
				continue;
			}

			$notice->render();
		}
	}

	/**
	 * Gets available admin notices.
	 *
	 * @since 1.0.0
	 *
	 * @return array List of Notice instances.
	 */
	private function get_notices() {
		/**
		 * Filters the list of available admin notices.
		 *
		 * @since 1.0.0
		 *
		 * @param array $notices List of Notice instances.
		 */
		$notices = apply_filters( 'googlesitekit_admin_notices', array() );

		return array_filter(
			$notices,
			function ( $notice ) {
				return $notice instanceof Notice;
			}
		);
	}
}
