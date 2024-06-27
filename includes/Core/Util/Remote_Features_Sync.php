<?php

namespace Google\Site_Kit\Core\Util;

use Closure;

class Remote_Features_Sync {

	const CRON_ACTION = 'googlesitekit_cron_update_remote_features';

	/**
	 * @var Remote_Features
	 */
	private $remote_features;

	/**
	 * @var Closure
	 */
	private $fetch_features;

	public function __construct(
		Remote_Features $remote_features,
		Closure $fetch_features
	) {
		$this->remote_features = $remote_features;
		$this->fetch_features  = $fetch_features;
	}

	public function register() {
		add_action( self::CRON_ACTION, array( $this, 'pull_remote_features' ) );
	}

	public function maybe_schedule_cron() {
		if ( ! wp_next_scheduled( self::CRON_ACTION ) && ! wp_installing() ) {
			wp_schedule_event( time(), 'twicedaily', self::CRON_ACTION );
		}
	}

	/**
	 * Action that is run by a cron twice daily to fetch and cache remotely-enabled features
	 * from the Google Proxy server, if Site Kit has been setup.
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
