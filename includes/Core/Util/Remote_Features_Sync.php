<?php

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use WP_Error;

class Remote_Features_Sync {
	use Method_Proxy_Trait;

	const CRON_ACTION = 'googlesitekit_cron_update_remote_features';


	/**
	 * @var Remote_Features
	 */
	private $remote_features;
	/**
	 * @var Credentials
	 */
	private $credentials;
	/**
	 * @var Google_Proxy
	 */
	private $google_proxy;

	public function __construct(
		Remote_Features $remote_features,
		Credentials $credentials,
		Google_Proxy $google_proxy
	) {
		$this->remote_features = $remote_features;
		$this->credentials = $credentials;
		$this->google_proxy = $google_proxy;
	}

	public function register() {
		add_action( self::CRON_ACTION, $this->get_method_proxy( 'cron_update_remote_features' ) );
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
	 * @since 1.71.0
	 * @since 1.118.0 Moved here from the Authentication class.
	 */
	private function cron_update_remote_features() {
		if ( ! $this->credentials->has() || ! $this->credentials->using_proxy() ) {
			return;
		}

		$this->pull_remote_features();
	}

	public function pull_remote_features() {
		$features = $this->google_proxy->get_features( $this->credentials );

		if ( ! is_wp_error( $features ) && is_array( $features ) ) {
			$this->remote_features->set( $features );
		}
	}
}
