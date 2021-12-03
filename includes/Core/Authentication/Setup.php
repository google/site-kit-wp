<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Setup
 *
 * @package   Google\Site_Kit\Core\Authentication
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Base class for authentication setup.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
abstract class Setup {

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 *
	 * @var Context
	 */
	protected $context;

	/**
	 * User_Options instance.
	 *
	 * @since n.e.x.t
	 *
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * Authentication instance.
	 *
	 * @since n.e.x.t
	 *
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * Google_Proxy instance.
	 *
	 * @since n.e.x.t
	 *
	 * @var Google_Proxy
	 */
	protected $google_proxy;

	/**
	 * Credentials instance.
	 *
	 * @since n.e.x.t
	 *
	 * @var Credentials
	 */
	protected $credentials;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context        $context        Context instance.
	 * @param User_Options   $user_options   User_Options instance.
	 * @param Authentication $authentication Authentication instance.
	 */
	public function __construct(
		Context $context,
		User_Options $user_options,
		Authentication $authentication
	) {
		$this->context        = $context;
		$this->user_options   = $user_options;
		$this->authentication = $authentication;
		$this->credentials    = $authentication->credentials();
		$this->google_proxy   = $authentication->get_google_proxy();
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	abstract public function register();

	/**
	 * Verifies the given nonce for a setup action.
	 *
	 * The nonce passed from the proxy will always be the one initially provided to it.
	 * {@see Google_Proxy::setup_url()}
	 *
	 * @since n.e.x.t
	 *
	 * @param string $nonce  Action nonce.
	 * @param string $action Action name. Optional. Defaults to the main setup action.
	 */
	protected function verify_nonce( $nonce, $action = Google_Proxy::ACTION_SETUP ) {
		if ( ! wp_verify_nonce( $nonce, $action ) ) {
			Authentication::invalid_nonce_error( $action );
		}
	}

	/**
	 * Handles site verification.
	 *
	 * @since n.e.x.t
	 */
	protected function handle_verification() {
		$verification_token = $this->context->input()->filter( INPUT_GET, 'googlesitekit_verification_token', FILTER_SANITIZE_STRING );
		$verification_type  = $this->context->input()->filter( INPUT_GET, 'googlesitekit_verification_token_type', FILTER_SANITIZE_STRING );

		if ( $verification_token ) {
			do_action( 'googlesitekit_verify_site_ownership', $verification_token, $verification_type );
		}
	}

	/**
	 * Handles the exchange of a code and site code for client credentials from the proxy.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $code      Code ('googlesitekit_code') provided by proxy.
	 * @param string $site_code Site code ('googlesitekit_site_code') provided by proxy.
	 */
	protected function handle_site_code( $code, $site_code ) {
		if ( ! $code || ! $site_code ) {
			return;
		}

		if ( ! current_user_can( Permissions::SETUP ) ) {
			wp_die( esc_html__( 'You don\'t have permissions to set up Site Kit.', 'google-site-kit' ), 403 );
		}

		$data = $this->google_proxy->exchange_site_code( $site_code, $code );

		if ( is_wp_error( $data ) ) {
			$error_message = $data->get_error_message() ?: $data->get_error_code();
			$error_message = $error_message ?: 'unknown_error';

			// If missing verification, rely on the redirect back to the proxy,
			// passing the site code instead of site ID.
			if ( 'missing_verification' === $error_message ) {
				add_filter(
					'googlesitekit_proxy_setup_url_params',
					function ( $params ) use ( $site_code ) {
						$params['site_code'] = $site_code;
						return $params;
					}
				);
				return;
			}

			$this->user_options->set( OAuth_Client::OPTION_ERROR_CODE, $error_message );
			wp_safe_redirect( $this->context->admin_url( 'splash' ) );
			exit;
		}

		$this->credentials->set(
			array(
				'oauth2_client_id'     => $data['site_id'],
				'oauth2_client_secret' => $data['site_secret'],
			)
		);
	}

	/**
	 * Redirects back to the authentication service with any added parameters.
	 *
	 * For v2 of the proxy, this method now has to ensure that the user is redirected back to the correct step on the
	 * proxy, based on which action was received.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $code Code ('googlesitekit_code') provided by proxy.
	 */
	protected function redirect_to_proxy( $code = '' ) {
		wp_safe_redirect(
			$this->authentication->get_oauth_client()->get_proxy_setup_url( $code )
		);
		exit;
	}
}
