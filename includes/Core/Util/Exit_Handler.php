<?php
/**
 * Exit_Handler
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Exit_Handler class.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Exit_Handler {
	/**
	 * Invokes the handler.
	 *
	 * @since n.e.x.t
	 */
	public function invoke() {
		$callback = static function () {
			exit;
		};

		if ( defined( 'GOOGLESITEKIT_TESTS' ) ) {
			/**
			 * Allows the callback to be filtered during tests.
			 *
			 * @since n.e.x.t
			 * @param \Closure $callback Exit handler callback.
			 */
			$callback = apply_filters( 'googlesitekit_exit_handler', $callback );
		}

		if ( $callback instanceof \Closure ) {
			$callback();
		}
	}
}
