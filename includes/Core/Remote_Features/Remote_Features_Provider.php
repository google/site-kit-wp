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
use Google\Site_Kit\Core\Storage\Transients;

/**
 * Class providing the integration of remote features.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Remote_Features_Provider {

	const RETRY_GUARD_TRANSIENT = 'googlesitekit_remote_features_retry_guard';

	/**
	 * Credentials instance.
	 *
	 * @var Credentials
	 */
	private Credentials $credentials;

	/**
	 * Transients instance.
	 *
	 * @var Transients
	 */
	protected $transients;

	/**
	 * Remote_Features instance.
	 *
	 * @var Remote_Features
	 */
	private Remote_Features $setting;

	/**
	 * Remote_Features_Last_Sync instance.
	 *
	 * @var Remote_Features_Last_Sync
	 */
	private Remote_Features_Last_Sync $last_sync_setting;

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
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Context instance.
	 * @param Options $options Options instance.
	 */
	public function __construct( Context $context, Options $options ) {
		$this->credentials       = new Credentials( new Encrypted_Options( $options ) );
		$this->transients        = new Transients( $context );
		$this->setting           = new Remote_Features( $options );
		$this->last_sync_setting = new Remote_Features_Last_Sync( $options );
		$this->activation        = new Remote_Features_Activation( $this->setting );
		$this->syncer            = new Remote_Features_Syncer(
			$this->setting,
			$this->last_sync_setting,
			fn() => ( new Google_Proxy( $context ) )->get_features( $this->credentials ),
			new Site_Connected_Guard( $this->credentials ),
			new Using_Proxy_Connection_Guard( $this->credentials )
		);
		$this->cron              = new Remote_Features_Cron( array( $this->syncer, 'pull_remote_features' ) );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->setting->register();
		$this->activation->register();
		$this->cron->register();

		add_action( 'wp_ajax_nopriv_pull_remote_features_fallback', array( $this->syncer, 'pull_remote_features_fallback' ) );
		add_action( 'admin_init', fn () => $this->on_admin_init() );
	}

	/**
	 * Handles delayed registration on admin_init.
	 */
	protected function on_admin_init() {
		if ( ! $this->credentials->using_proxy() ) {
			return;
		}

		$this->cron->maybe_schedule_cron();
		$this->remote_features_sync_fallback();
		// Sync remote features when credentials change (e.g. during setup).
		$this->credentials->on_change( array( $this->syncer, 'pull_remote_features' ) );
	}

	/**
	 * Fallback for syncing the remote features if CRON did not run.
	 *
	 * @since n.e.x.t
	 */
	protected function remote_features_sync_fallback() {
		$last_sync_at = $this->last_sync_setting->get();
		// Check if 24 hours have passed since the last cron execution.
		$more_than_24_hours = ( time() - $last_sync_at ) > 24 * HOUR_IN_SECONDS;
		// If last sync was never updated, it has default 0 value, it means cron is either disabled
		// or not able to run for whatever reasons, and sync never happened (and most likelly never will).
		$cron_never_executed = 0 === $last_sync_at;
		// Ensure this request is not executed more than once.
		$retry_guard = $this->transients->get( self::RETRY_GUARD_TRANSIENT );

		if ( ( $more_than_24_hours || $cron_never_executed ) && ! $retry_guard ) {
			$nonce = wp_create_nonce( 'remote_features_fallback' );
			// Make a non-blocking request from the server, which will trigger
			// the CRON action for syncing the remote features.
			// We have to use AJAX endpoint instead of REST, since this is called from the server
			// and REST endpoint will fail unless we include cookies - nonce isn't enough.
			wp_remote_post(
				admin_url( 'admin-ajax.php' ),
				array(
					'blocking' => false,
					'body'     => array(
						'action'      => 'pull_remote_features_fallback',
						'_ajax_nonce' => $nonce,
					),
				)
			);

			$this->transients->set( self::RETRY_GUARD_TRANSIENT, true, HOUR_IN_SECONDS * 6 );
		}
	}
}
