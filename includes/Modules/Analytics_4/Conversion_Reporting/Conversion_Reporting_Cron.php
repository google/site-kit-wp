<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting\Conversion_Reporting_Cron
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting;

/**
 * Class providing cron implementation for conversion reporting.
 *
 * @since 1.135.0
 * @access private
 * @ignore
 */
class Conversion_Reporting_Cron {

	const CRON_ACTION = 'googlesitekit_cron_conversion_reporting_events';

	/**
	 * Cron callback reference.
	 *
	 * @var callable
	 */
	private $cron_callback;

	/**
	 * Constructor.
	 *
	 * @since 1.135.0
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
	 * @since 1.135.0
	 */
	public function maybe_schedule_cron() {
		if ( ! wp_next_scheduled( self::CRON_ACTION ) && ! wp_installing() ) {
			wp_schedule_single_event( time() + DAY_IN_SECONDS, self::CRON_ACTION );
		}
	}
}
