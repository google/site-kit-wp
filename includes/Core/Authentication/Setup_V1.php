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
use Google\Site_Kit\Core\Authentication\Exception\Exchange_Site_Code_Exception;
use Google\Site_Kit\Core\Authentication\Exception\Missing_Verification_Exception;
use Google\Site_Kit\Core\Permissions\Permissions;

/**
 * Class for v1 authentication setup.
 *
 * @since 1.48.0
 * @access private
 * @ignore
 */
class Setup_V1 extends Setup {

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.48.0
	 */
	public function register() {
		add_action( 'admin_action_' . Google_Proxy::ACTION_SETUP_START, array( $this, 'handle_action_setup_start' ) );
		add_action( 'admin_action_' . Google_Proxy::ACTION_SETUP, array( $this, 'handle_action_setup' ) );
	}

	/**
	 * Handles the setup start action, taking the user to the proxy setup screen.
	 *
	 * @since 1.48.0
	 */
	public function handle_action_setup_start() {
		$nonce        = $this->context->input()->filter( INPUT_GET, 'nonce', FILTER_SANITIZE_STRING );
		$redirect_url = $this->context->input()->filter( INPUT_GET, 'redirect', FILTER_SANITIZE_URL );

		$this->verify_nonce( $nonce, Google_Proxy::ACTION_SETUP_START );

		if ( ! current_user_can( Permissions::SETUP ) ) {
			wp_die( esc_html__( 'You have insufficient permissions to connect Site Kit.', 'google-site-kit' ) );
		}

		if ( ! $this->credentials->using_proxy() ) {
			wp_die( esc_html__( 'Site Kit is not configured to use the authentication proxy.', 'google-site-kit' ) );
		}

		if ( false === $this->google_proxy->are_site_fields_synced( $this->credentials ) ) {
			$this->google_proxy->sync_site_fields( $this->credentials, 'sync' );
		}

		if ( $redirect_url ) {
			$this->user_options->set( OAuth_Client::OPTION_REDIRECT_URL, $redirect_url );
		}

		$this->redirect_to_proxy();
	}

	/**
	 * Handles the setup action, which is used for all intermediate proxy redirect requests.
	 *
	 * @since 1.48.0
	 * @since 1.49.0 Sets the `verify` and `verification_method` query params.
	 */
	public function handle_action_setup() {
		$input               = $this->context->input();
		$nonce               = $input->filter( INPUT_GET, 'nonce', FILTER_SANITIZE_STRING );
		$code                = $input->filter( INPUT_GET, 'googlesitekit_code', FILTER_SANITIZE_STRING );
		$site_code           = $input->filter( INPUT_GET, 'googlesitekit_site_code', FILTER_SANITIZE_STRING );
		$verification_token  = $input->filter( INPUT_GET, 'googlesitekit_verification_token', FILTER_SANITIZE_STRING );
		$verification_method = $input->filter( INPUT_GET, 'googlesitekit_verification_token_type', FILTER_SANITIZE_STRING );

		$this->verify_nonce( $nonce );

		if ( ! current_user_can( Permissions::SETUP ) ) {
			wp_die( esc_html__( 'You don\'t have permissions to set up Site Kit.', 'google-site-kit' ), 403 );
		}

		if ( ! $code ) {
			wp_die( esc_html__( 'Invalid request.', 'google-site-kit' ), 400 );
		}

		$proxy_query_params = array();
		if ( $verification_token && $verification_method ) {
			$this->handle_verification( $verification_token, $verification_method );

			$proxy_query_params = array(
				'verify'              => 'true',
				'verification_method' => $verification_method,
			);
		}

		if ( $site_code ) {
			try {
				$this->handle_site_code( $code, $site_code );
			} catch ( Missing_Verification_Exception $exception ) {
				$proxy_query_params['site_code'] = $site_code;
				$this->redirect_to_proxy( $code, $proxy_query_params );
			} catch ( Exchange_Site_Code_Exception $exception ) {
				$this->redirect_to_splash();
			}
		}

		$this->redirect_to_proxy( $code, $proxy_query_params );
	}
}
