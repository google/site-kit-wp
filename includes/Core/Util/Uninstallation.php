<?php
/**
 * Class Google\Site_Kit\Core\Util\Uninstallation
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;

/**
 * Class handling plugin uninstallation.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Uninstallation {

	/**
	 * Reset object.
	 *
	 * @since 1.0.0
	 * @var Reset
	 */
	private $reset;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Reset $reset Optional. Reset instance. Default is a new instance.
	 */
	public function __construct( Reset $reset = null ) {
		if ( ! $reset ) {
			$reset = new Reset( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		}
		$this->reset = $reset;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		add_action(
			'googlesitekit_uninstall',
			function () {
				$this->reset->all();
			}
		);
	}
}
