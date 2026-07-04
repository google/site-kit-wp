<?php
/**
 * Class Google\Site_Kit\Core\Remote_Features\Remote_Features_Provider
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Remote_Features;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Guards\Site_Connected_Guard;
use Google\Site_Kit\Core\Authentication\Guards\Using_Proxy_Connection_Guard;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;

/**
 * Class providing the integration of remote features.
 *
 * @since 1.133.0
 * @access private
 * @ignore
 */
class Remote_Features_Provider {

	/**
	 * Credentials instance.
	 *
	 * @var Credentials
	 */
	private Credentials $credentials;

	/**
	 * Remote_Features instance.
	 *
	 * @var Remote_Features
	 */
	private Remote_Features $setting;

	/**
	 * Remote_Features_Activation instance.
	 *
	 * @var Remote_Features_Activation
	 */
	private Remote_Features_Activation $activation;

	/**
	 * Remote_Features_Syncer instance.
	 *
	 * @var Remote_Features_Syncer
	 */
	private Remote_Features_Syncer $syncer;

	/**
	 * Remote_Features_Cron instance.
	 *
	 * @var Remote_Features_Cron
	 */
	private Remote_Features_Cron $cron;

	/**
	 * Remote_Features_Fallback instance.
	 *
	 * @var Remote_Features_Fallback
	 */
	private Remote_Features_Fallback $fallback;

	/**
	 * Constructor.
	 *
	 * @since 1.133.0
	 *
	 * @param Context $context Context instance.
	 * @param Options $options Options instance.
	 */
	public function __construct( Context $context, Options $options ) {
		$this->credentials = new Credentials( new Encrypted_Options( $options ) );
		$this->setting     = new Remote_Features( $options );
		$this->activation  = new Remote_Features_Activation( $this->setting );
		$this->syncer      = new Remote_Features_Syncer(
			$this->setting,
			fn() => ( new Google_Proxy( $context ) )->get_features( $this->credentials ),
			new Site_Connected_Guard( $this->credentials ),
			new Using_Proxy_Connection_Guard( $this->credentials )
		);
		$this->cron        = new Remote_Features_Cron( array( $this->syncer, 'pull_remote_features' ) );
		$this->fallback    = new Remote_Features_Fallback( $this->setting, $this->syncer );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.133.0
	 */
	public function register() {
		$this->setting->register();
		$this->activation->register();
		$this->cron->register();

		add_action( 'admin_init', fn () => $this->on_admin_init() );
		add_action(
			'heartbeat_tick',
			fn ( $response, $screen_id ) => $this->on_heartbeat_tick( $screen_id ),
			10,
			2
		);
	}

	/**
	 * Handles the heartbeat AJAX callback.
	 *
	 * @param string $screen_id The screen ID.
	 */
	protected function on_heartbeat_tick( $screen_id ) {
		if ( 'toplevel_page_googlesitekit-dashboard' !== $screen_id ) {
			return;
		}

		$this->fallback->remote_features_sync_fallback();
	}

	/**
	 * Handles delayed registration on admin_init.
	 */
	protected function on_admin_init() {
		if ( ! $this->credentials->using_proxy() ) {
			return;
		}

		$this->cron->maybe_schedule_cron();
		// Sync remote features when credentials change (e.g. during setup).
		$this->credentials->on_change( array( $this->syncer, 'pull_remote_features' ) );
	}
}
