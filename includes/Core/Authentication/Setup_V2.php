<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Setup_V2
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
 * Class for v2 authentication setup.
 *
 * @since 1.48.0
 * @access private
 * @ignore
 */
class Setup_V2 extends Setup {

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.48.0
	 */
	public function register() {
		add_action( 'admin_action_' . Google_Proxy::ACTION_SETUP_START, array( $this, 'handle_action_setup_start' ) );
		add_action( 'admin_action_' . Google_Proxy::ACTION_VERIFY, array( $this, 'handle_action_verify' ) );
		add_action( 'admin_action_' . Google_Proxy::ACTION_EXCHANGE_SITE_CODE, array( $this, 'handle_action_exchange_site_code' ) );
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

		if ( $this->credentials->has() ) {
			$this->google_proxy->sync_site_fields( $this->credentials, 'sync' );
		}

		if ( $redirect_url ) {
			$this->user_options->set( OAuth_Client::OPTION_REDIRECT_URL, $redirect_url );
		}

		$this->redirect_to_proxy();
	}

	/**
	 * Handles the action for verifying site ownership.
	 *
	 * @since 1.48.0
	 */
	public function handle_action_verify() {
		$input               = $this->context->input();
		$step                = $input->filter( INPUT_GET, 'step', FILTER_SANITIZE_STRING );
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

		if ( ! $verification_token || ! $verification_method ) {
			wp_die( esc_html__( 'Verifying site ownership requires a token and verification method.', 'google-site-kit' ), 400 );
		}

		$this->handle_verification( $verification_token, $verification_method );

		// If the site does not have a site ID yet, a site code will be passed.
		// Handling the site code here will save the extra redirect from the proxy if successful.
		if ( $site_code ) {
			try {
				$this->handle_site_code( $code, $site_code );
			} catch ( Missing_Verification_Exception $exception ) {
				$this->redirect_to_proxy( $code, compact( 'site_code', 'step' ) );
			} catch ( Exchange_Site_Code_Exception $exception ) {
				$this->redirect_to_splash();
			}
		}

		$this->redirect_to_proxy( $code, compact( 'step' ) );
	}

	/**
	 * Handles the action for exchanging the site code for site credentials.
	 *
	 * This action will only be called if the site code failed to be handled
	 * during the verification step.
	 *
	 * @since 1.48.0
	 */
	public function handle_action_exchange_site_code() {
		$input     = $this->context->input();
		$step      = $input->filter( INPUT_GET, 'step', FILTER_SANITIZE_STRING );
		$nonce     = $input->filter( INPUT_GET, 'nonce', FILTER_SANITIZE_STRING );
		$code      = $input->filter( INPUT_GET, 'googlesitekit_code', FILTER_SANITIZE_STRING );
		$site_code = $input->filter( INPUT_GET, 'googlesitekit_site_code', FILTER_SANITIZE_STRING );

		$this->verify_nonce( $nonce );

		if ( ! current_user_can( Permissions::SETUP ) ) {
			wp_die( esc_html__( 'You don\'t have permissions to set up Site Kit.', 'google-site-kit' ), 403 );
		}

		if ( ! $code || ! $site_code ) {
			wp_die( esc_html__( 'Invalid request.', 'google-site-kit' ), 400 );
		}

		try {
			$this->handle_site_code( $code, $site_code );
		} catch ( Missing_Verification_Exception $exception ) {
			$this->redirect_to_proxy( $code, compact( 'site_code', 'step' ) );
		} catch ( Exchange_Site_Code_Exception $exception ) {
			$this->redirect_to_splash();
		}

		$this->redirect_to_proxy( $code, compact( 'step' ) );
	}
}
