<?php
/**
 * Class Google\Site_Kit\Core\Remote_Features\Remote_Features_Sync
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Remote_Features;

use Closure;

/**
 * Class handling the synchronization of remote features with local storage.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Remote_Features_Sync {

	const CRON_ACTION = 'googlesitekit_cron_update_remote_features';

	/**
	 * Remote_Features instance.
	 *
	 * @var Remote_Features
	 */
	private $remote_features;

	/**
	 * Function which fetches features.
	 *
	 * @var Closure
	 */
	private $fetch_features;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Remote_Features $remote_features Remote_Features instance.
	 * @param Closure         $fetch_features  Function which fetches features.
	 */
	public function __construct(
		Remote_Features $remote_features,
		Closure $fetch_features
	) {
		$this->remote_features = $remote_features;
		$this->fetch_features  = $fetch_features;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( self::CRON_ACTION, array( $this, 'pull_remote_features' ) );
	}

	/**
	 * Schedules cron if not already set.
	 *
	 * @since n.e.x.t
	 */
	public function maybe_schedule_cron() {
		if ( ! wp_next_scheduled( self::CRON_ACTION ) && ! wp_installing() ) {
			wp_schedule_event( time(), 'twicedaily', self::CRON_ACTION );
		}
	}

	/**
	 * Fetches the latest remote features and sets them in storage.
	 *
	 * @since n.e.x.t
	 */
	public function pull_remote_features() {
		$features = call_user_func( $this->fetch_features );

		if ( ! is_wp_error( $features ) && is_array( $features ) ) {
			$this->remote_features->set( $features );
		}
	}
}
