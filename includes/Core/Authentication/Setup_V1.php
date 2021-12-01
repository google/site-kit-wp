<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Setup_V1
 *
 * @package   Google\Site_Kit\Core\Authentication
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Permissions\Permissions;

/**
 * Class for v1 authentication setup.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Setup_V1 extends Setup {

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'admin_action_' . Google_Proxy::ACTION_SETUP_START, array( $this, 'handle_action_setup_start' ) );
		add_action( 'admin_action_' . Google_Proxy::ACTION_SETUP, array( $this, 'handle_action_setup' ) );
	}

	/**
	 * Handles the setup start action, taking the user to the proxy setup screen.
	 *
	 * @since n.e.x.t
	 */
	public function handle_action_setup_start() {
		$nonce = $this->context->input()->filter( INPUT_GET, 'nonce', FILTER_SANITIZE_STRING );

		$this->verify_nonce( $nonce, Google_Proxy::ACTION_SETUP_START );

		if ( ! current_user_can( Permissions::SETUP ) ) {
			wp_die( esc_html__( 'You have insufficient permissions to connect Site Kit.', 'google-site-kit' ) );
		}

		if ( ! $this->credentials->using_proxy() ) {
			wp_die( esc_html__( 'Site Kit is not configured to use the authentication proxy.', 'google-site-kit' ) );
		}

		$this->redirect_to_proxy();
	}

	/**
	 * Handles the setup action.
	 *
	 * @since n.e.x.t
	 */
	public function handle_action_setup() {
		$input        = $this->context->input();
		$nonce        = $input->filter( INPUT_GET, 'nonce', FILTER_SANITIZE_STRING );
		$code         = $input->filter( INPUT_GET, 'googlesitekit_code', FILTER_SANITIZE_STRING );
		$site_code    = $input->filter( INPUT_GET, 'googlesitekit_site_code', FILTER_SANITIZE_STRING );
		$redirect_url = $input->filter( INPUT_GET, 'redirect', FILTER_SANITIZE_URL );

		$this->verify_nonce( $nonce );

		$this->handle_verification();

		if ( $code && $site_code ) {
			$this->handle_site_code( $code, $site_code );
		}

		if ( ! $code && false === $this->google_proxy->are_site_fields_synced( $this->credentials ) ) {
			$this->google_proxy->sync_site_fields( $this->credentials, 'sync' );
		}

		if ( $redirect_url ) {
			$this->user_options->set( OAuth_Client::OPTION_REDIRECT_URL, $redirect_url );
		}

		$this->redirect_to_proxy( $code );
	}
}
