<?php
/**
 * Class Google\Site_Kit\Core\Remote_Features\Remote_Features_Cron
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Remote_Features;

/**
 * Class providing cron implementation for remote features.
 *
 * @since 1.133.0
 * @access private
 * @ignore
 */
class Remote_Features_Cron {

	const CRON_ACTION = 'googlesitekit_cron_update_remote_features';

	/**
	 * Cron callback reference.
	 *
	 * @var callable
	 */
	private $cron_callback;

	/**
	 * Constructor.
	 *
	 * @since 1.133.0
	 *
	 * @param callable $callback Function to call on the cron action.
	 */
	public function __construct( callable $callback ) {
		$this->cron_callback = $callback;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.133.0
	 */
	public function register() {
		add_action( self::CRON_ACTION, $this->cron_callback );
	}

	/**
	 * Schedules cron if not already set.
	 *
	 * @since 1.133.0
	 */
	public function maybe_schedule_cron() {
		if ( ! wp_next_scheduled( self::CRON_ACTION ) && ! wp_installing() ) {
			wp_schedule_event( time(), 'twicedaily', self::CRON_ACTION );
		}
	}
}
