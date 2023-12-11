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
use Google\Site_Kit\Core\Authentication\Exception\Exchange_Site_Code_Exception;
use Google\Site_Kit\Core\Authentication\Exception\Missing_Verification_Exception;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Feature_Flags;

/**
 * Base class for authentication setup.
 *
 * @since 1.48.0
 * @access private
 * @ignore
 */
class Setup {

	/**
	 * Context instance.
	 *
	 * @since 1.48.0
	 *
	 * @var Context
	 */
	protected $context;

	/**
	 * User_Options instance.
	 *
	 * @since 1.48.0
	 *
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * Authentication instance.
	 *
	 * @since 1.48.0
	 *
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * Google_Proxy instance.
	 *
	 * @since 1.48.0
	 *
	 * @var Google_Proxy
	 */
	protected $google_proxy;

	/**
	 * Proxy support URL.
	 *
	 * @since 1.109.0 Explicitly declared; previously, it was dynamically declared.
	 *
	 * @var string
	 */
	protected $proxy_support_link_url;

	/**
	 * Credentials instance.
	 *
	 * @since 1.48.0
	 *
	 * @var Credentials
	 */
	protected $credentials;

	/**
	 * Constructor.
	 *
	 * @since 1.48.0
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
		$this->context                = $context;
		$this->user_options           = $user_options;
		$this->authentication         = $authentication;
		$this->credentials            = $authentication->credentials();
		$this->google_proxy           = $authentication->get_google_proxy();
		$this->proxy_support_link_url = $authentication->get_proxy_support_link_url();
	}

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
	 * Composes the oAuth proxy get help link.
	 *
	 * @since 1.81.0
	 *
	 * @return string The get help link.
	 */
	private function get_oauth_proxy_failed_help_link() {
		return sprintf(
			/* translators: 1: Support link URL. 2: Get help string. */
			__( '<a href="%1$s" target="_blank">%2$s</a>', 'google-site-kit' ),
			esc_url( add_query_arg( 'error_id', 'request_to_auth_proxy_failed', $this->proxy_support_link_url ) ),
			esc_html__( 'Get help', 'google-site-kit' )
		);
	}

	/**
	 * Handles the setup start action, taking the user to the proxy setup screen.
	 *
	 * @since 1.48.0
	 */
	public function handle_action_setup_start() {
		$nonce        = htmlspecialchars( $this->context->input()->filter( INPUT_GET, 'nonce' ) );
		$redirect_url = $this->context->input()->filter( INPUT_GET, 'redirect', FILTER_DEFAULT );

		$this->verify_nonce( $nonce, Google_Proxy::ACTION_SETUP_START );

		if ( ! current_user_can( Permissions::SETUP ) ) {
			wp_die( esc_html__( 'You have insufficient permissions to connect Site Kit.', 'google-site-kit' ) );
		}

		if ( ! $this->credentials->using_proxy() ) {
			wp_die( esc_html__( 'Site Kit is not configured to use the authentication proxy.', 'google-site-kit' ) );
		}

		$required_scopes = $this->authentication->get_oauth_client()->get_required_scopes();
		$this->google_proxy->with_scopes( $required_scopes );

		$oauth_setup_redirect = $this->credentials->has()
			? $this->google_proxy->sync_site_fields( $this->credentials, 'sync' )
			: $this->google_proxy->register_site( 'sync' );

		$oauth_proxy_failed_help_link = $this->get_oauth_proxy_failed_help_link();

		if ( is_wp_error( $oauth_setup_redirect ) ) {
			$error_message = $oauth_setup_redirect->get_error_message();
			if ( empty( $error_message ) ) {
				$error_message = $oauth_setup_redirect->get_error_code();
			}

			wp_die(
				sprintf(
					/* translators: 1: Error message or error code. 2: Get help link. */
					esc_html__( 'The request to the authentication proxy has failed with an error: %1$s %2$s.', 'google-site-kit' ),
					esc_html( $error_message ),
					wp_kses(
						$oauth_proxy_failed_help_link,
						array(
							'a' => array(
								'href'   => array(),
								'target' => array(),
							),
						)
					)
				)
			);
		}

		if ( ! filter_var( $oauth_setup_redirect, FILTER_VALIDATE_URL ) ) {
			wp_die(
				sprintf(
					/* translators: %s: Get help link. */
					esc_html__( 'The request to the authentication proxy has failed. Please, try again later. %s.', 'google-site-kit' ),
					wp_kses(
						$oauth_proxy_failed_help_link,
						array(
							'a' => array(
								'href'   => array(),
								'target' => array(),
							),
						)
					)
				)
			);
		}

		if ( $redirect_url ) {
			$this->user_options->set( OAuth_Client::OPTION_REDIRECT_URL, $redirect_url );
		}

		wp_safe_redirect( $oauth_setup_redirect );
		exit;
	}

	/**
	 * Handles the action for verifying site ownership.
	 *
	 * @since 1.48.0
	 * @since 1.49.0 Sets the `verify` and `verification_method` and `site_id` query params.
	 */
	public function handle_action_verify() {
		$input               = $this->context->input();
		$step                = htmlspecialchars( $input->filter( INPUT_GET, 'step' ) );
		$nonce               = htmlspecialchars( $input->filter( INPUT_GET, 'nonce' ) );
		$code                = htmlspecialchars( $input->filter( INPUT_GET, 'googlesitekit_code' ) );
		$site_code           = htmlspecialchars( $input->filter( INPUT_GET, 'googlesitekit_site_code' ) );
		$verification_token  = htmlspecialchars( $input->filter( INPUT_GET, 'googlesitekit_verification_token' ) );
		$verification_method = htmlspecialchars( $input->filter( INPUT_GET, 'googlesitekit_verification_token_type' ) );

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

		$proxy_query_params = array(
			'step'                => $step,
			'verify'              => 'true',
			'verification_method' => $verification_method,
		);

		// If the site does not have a site ID yet, a site code will be passed.
		// Handling the site code here will save the extra redirect from the proxy if successful.
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

		$credentials                   = $this->credentials->get();
		$proxy_query_params['site_id'] = ! empty( $credentials['oauth2_client_id'] ) ? $credentials['oauth2_client_id'] : '';

		$this->redirect_to_proxy( $code, $proxy_query_params );
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
		$step      = htmlspecialchars( $input->filter( INPUT_GET, 'step' ) );
		$nonce     = htmlspecialchars( $input->filter( INPUT_GET, 'nonce' ) );
		$code      = htmlspecialchars( $input->filter( INPUT_GET, 'googlesitekit_code' ) );
		$site_code = htmlspecialchars( $input->filter( INPUT_GET, 'googlesitekit_site_code' ) );

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

		$credentials = $this->credentials->get();
		$site_id     = ! empty( $credentials['oauth2_client_id'] ) ? $credentials['oauth2_client_id'] : '';

		$this->redirect_to_proxy( $code, compact( 'site_id', 'step' ) );
	}

	/**
	 * Verifies the given nonce for a setup action.
	 *
	 * The nonce passed from the proxy will always be the one initially provided to it.
	 * {@see Google_Proxy::setup_url()}
	 *
	 * @since 1.48.0
	 *
	 * @param string $nonce  Action nonce.
	 * @param string $action Action name. Optional. Defaults to the action for the nonce given to the proxy.
	 */
	protected function verify_nonce( $nonce, $action = Google_Proxy::NONCE_ACTION ) {
		if ( ! wp_verify_nonce( $nonce, $action ) ) {
			$this->authentication->invalid_nonce_error( $action );
		}
	}

	/**
	 * Handles site verification.
	 *
	 * @since 1.48.0
	 *
	 * @param string $token  Verification token.
	 * @param string $method Verification method.
	 */
	protected function handle_verification( $token, $method ) {
		/**
		 * Verifies site ownership using the given token and verification method.
		 *
		 * @since 1.48.0
		 *
		 * @param string $token  Verification token.
		 * @param string $method Verification method.
		 */
		do_action( 'googlesitekit_verify_site_ownership', $token, $method );
	}

	/**
	 * Handles the exchange of a code and site code for client credentials from the proxy.
	 *
	 * @since 1.48.0
	 *
	 * @param string $code      Code ('googlesitekit_code') provided by proxy.
	 * @param string $site_code Site code ('googlesitekit_site_code') provided by proxy.
	 *
	 * @throws Missing_Verification_Exception Thrown if exchanging the site code fails due to missing site verification.
	 * @throws Exchange_Site_Code_Exception Thrown if exchanging the site code fails for any other reason.
	 */
	protected function handle_site_code( $code, $site_code ) {
		$data = $this->google_proxy->exchange_site_code( $site_code, $code );

		if ( is_wp_error( $data ) ) {
			$error_code = $data->get_error_message() ?: $data->get_error_code();
			$error_code = $error_code ?: 'unknown_error';

			if ( 'missing_verification' === $error_code ) {
				throw new Missing_Verification_Exception();
			}

			$this->user_options->set( OAuth_Client::OPTION_ERROR_CODE, $error_code );

			throw new Exchange_Site_Code_Exception( $error_code );
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
	 * @since 1.48.0
	 * @since 1.49.0 Uses the new `Google_Proxy::setup_url_v2` method when the `serviceSetupV2` feature flag is enabled.
	 *
	 * @param string $code   Code ('googlesitekit_code') provided by proxy.
	 * @param array  $params Additional query parameters to include in the proxy redirect URL.
	 */
	protected function redirect_to_proxy( $code = '', $params = array() ) {
		$params['code'] = $code;
		$url            = $this->authentication->get_google_proxy()->setup_url( $params );

		wp_safe_redirect( $url );
		exit;
	}

	/**
	 * Redirects to the Site Kit splash page.
	 *
	 * @since 1.48.0
	 */
	protected function redirect_to_splash() {
		wp_safe_redirect( $this->context->admin_url( 'splash' ) );
		exit;
	}
}
