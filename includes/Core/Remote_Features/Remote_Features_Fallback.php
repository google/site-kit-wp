<?php
/**
 * Class Google\Site_Kit\Core\Remote_Features\Remote_Features_Fallback
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Remote_Features;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\BC_Functions;

/**
 * Class providing the integration of remote features.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Remote_Features_Fallback {

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private Context $context;

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
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context     $context     Context instance.
	 * @param Options     $options     Options instance.
	 * @param Credentials $credentials Credentials instance.
	 */
	public function __construct(
		Context $context,
		Options $options,
		Credentials $credentials
	) {
		$this->context     = $context;
		$this->credentials = $credentials;
		$this->setting     = new Remote_Features( $options );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'wp_ajax_sk_pull_remote_features_fallback', array( $this, 'pull_remote_features_ajax_fallback' ) );
	}

	/**
	 * Calls the CRON action.
	 *
	 * @since n.e.x.t
	 */
	public function pull_remote_features_ajax_fallback() {
		check_ajax_referer( 'remote_features_fallback' );

		do_action( Remote_Features_Cron::CRON_ACTION );
		wp_send_json_success();
	}

	/**
	 * Fallback for syncing the remote features if CRON did not run.
	 *
	 * @since n.e.x.t
	 */
	public function remote_features_sync_fallback() {
		if ( $this->credentials->has() && ! $this->credentials->using_proxy() ) {
			return;
		}

		// Ensure we run the fallback only if user is on the Site Kit dashboard.
		if ( 'googlesitekit-dashboard' !== $this->context->input()->filter( INPUT_GET, 'page' ) ) {
			return;
		}

		$remote_features = $this->setting->get();
		$last_sync_at    = isset( $remote_features['last_updated_at'] ) ? (int) $remote_features['last_updated_at'] : 0;

		// Check if 24 hours have passed since the last cron execution.
		$more_than_24_hours = ( time() - $last_sync_at ) > 24 * HOUR_IN_SECONDS;
		// If last sync was never updated, it has default 0 value, it means cron is either disabled
		// or not able to run for whatever reasons, and sync never happened (and most likelly never will).
		$cron_never_executed = 0 === $last_sync_at;

		if ( $more_than_24_hours || $cron_never_executed ) {
			$nonce         = wp_create_nonce( 'remote_features_fallback' );
			$ajax_fallback = '( function() {
				var xhr = new XMLHttpRequest();
				xhr.open( "POST", "' . admin_url( 'admin-ajax.php' ) . '", true );
				xhr.setRequestHeader( "Content-Type", "application/x-www-form-urlencoded" );
				xhr.send( "action=sk_pull_remote_features_fallback&_ajax_nonce=' . esc_attr( $nonce ) . '" );
			} )();';

			BC_Functions::wp_print_inline_script_tag( $ajax_fallback );
		}
	}
}
