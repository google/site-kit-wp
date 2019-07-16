<?php
/**
 * Class Google\Site_Kit\Core\Util\Deactivation
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Class handling plugin deactivation.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Deactivation {

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		add_action(
			'googlesitekit_deactivation',
			function() {
				// Unschedule site kit cron events as Core\Util\Cron has been removed. Lines to be removed on future release.
				wp_clear_scheduled_hook( 'googlesitekit_cron_daily', array( 'interval' => 'daily' ) );
				wp_clear_scheduled_hook( 'googlesitekit_cron_hourly', array( 'interval' => 'hourly' ) );
			}
		);
	}
}
