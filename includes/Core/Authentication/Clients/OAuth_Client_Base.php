<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Clients\OAuth_Client_Base
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication\Clients;

use Exception;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\Exception\Google_Proxy_Code_Exception;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Authentication\Token;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Base class for connecting to Google APIs via OAuth.
 *
 * @since 1.39.0
 * @access private
 * @ignore
 */
abstract class OAuth_Client_Base {

	const OPTION_ACCESS_TOKEN            = 'googlesitekit_access_token';
	const OPTION_ACCESS_TOKEN_EXPIRES_IN = 'googlesitekit_access_token_expires_in';
	const OPTION_ACCESS_TOKEN_CREATED    = 'googlesitekit_access_token_created_at';
	const OPTION_REFRESH_TOKEN           = 'googlesitekit_refresh_token';
	const OPTION_AUTH_SCOPES             = 'googlesitekit_auth_scopes';
	const OPTION_ERROR_CODE              = 'googlesitekit_error_code';
	const OPTION_PROXY_ACCESS_CODE       = 'googlesitekit_proxy_access_code';

	/**
	 * Plugin context.
	 *
	 * @since 1.39.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Options instance
	 *
	 * @since 1.39.0
	 * @var Options
	 */
	protected $options;

	/**
	 * User_Options instance
	 *
	 * @since 1.39.0
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * OAuth credentials instance.
	 *
	 * @since 1.39.0
	 * @var Credentials
	 */
	protected $credentials;

	/**
	 * Google_Proxy instance.
	 *
	 * @since 1.39.0
	 * @var Google_Proxy
	 */
	protected $google_proxy;

	/**
	 * Google Client object.
	 *
	 * @since 1.39.0
	 * @var Google_Site_Kit_Client
	 */
	protected $google_client;

	/**
	 * Profile instance.
	 *
	 * @since 1.39.0
	 * @var Profile
	 */
	protected $profile;

	/**
	 * Token instance.
	 *
	 * @since 1.39.0
	 * @var Token
	 */
	protected $token;

	/**
	 * Constructor.
	 *
	 * @since 1.39.0
	 *
	 * @param Context      $context      Plugin context.
	 * @param Options      $options      Optional. Option API instance. Default is a new instance.
	 * @param User_Options $user_options Optional. User Option API instance. Default is a new instance.
	 * @param Credentials  $credentials  Optional. Credentials instance. Default is a new instance from $options.
	 * @param Google_Proxy $google_proxy Optional. Google proxy instance. Default is a new instance.
	 * @param Profile      $profile      Optional. Profile instance. Default is a new instance.
	 * @param Token        $token        Optional. Token instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null,
		Credentials $credentials = null,
		Google_Proxy $google_proxy = null,
		Profile $profile = null,
		Token $token = null
	) {
		$this->context      = $context;
		$this->options      = $options ?: new Options( $this->context );
		$this->user_options = $user_options ?: new User_Options( $this->context );
		$this->credentials  = $credentials ?: new Credentials( new Encrypted_Options( $this->options ) );
		$this->google_proxy = $google_proxy ?: new Google_Proxy( $this->context );
		$this->profile      = $profile ?: new Profile( $this->user_options );
		$this->token        = $token ?: new Token( $this->user_options );
	}

	/**
	 * Gets the Google client object.
	 *
	 * @since 1.39.0
	 * @since 1.2.0 Now always returns a Google_Site_Kit_Client.
	 *
	 * @return Google_Site_Kit_Client Google client object.
	 */
	public function get_client() {
		if ( ! $this->google_client instanceof Google_Site_Kit_Client ) {
			$credentials = $this->credentials->get();

			$this->google_client = Client_Factory::create_client(
				array(
					'client_id'                => $credentials['oauth2_client_id'],
					'client_secret'            => $credentials['oauth2_client_secret'],
					'redirect_uri'             => $this->get_redirect_uri(),
					'token'                    => $this->get_token(),
					'token_callback'           => array( $this, 'set_token' ),
					'token_exception_callback' => function( Exception $e ) {
						$this->handle_fetch_token_exception( $e );
					},
					'required_scopes'          => $this->get_required_scopes(),
					'login_hint_email'         => $this->profile->has() ? $this->profile->get()['email'] : '',
					'using_proxy'              => $this->credentials->using_proxy(),
					'proxy_url'                => $this->google_proxy->url(),
				)
			);
		}

		return $this->google_client;
	}

	/**
	 * Gets the list of currently required Google OAuth scopes.
	 *
	 * @since 1.39.0
	 * @see https://developers.google.com/identity/protocols/googlescopes
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_required_scopes() {
		/**
		 * Filters the list of required Google OAuth scopes.
		 *
		 * See all Google oauth scopes here: https://developers.google.com/identity/protocols/googlescopes
		 *
		 * @since 1.39.0
		 *
		 * @param array $scopes List of scopes.
		 */
		$scopes = (array) apply_filters( 'googlesitekit_auth_scopes', array() );

		return array_unique(
			array_merge(
				// Default scopes that are always required.
				array(
					'openid',
					'https://www.googleapis.com/auth/userinfo.profile',
					'https://www.googleapis.com/auth/userinfo.email',
				),
				$scopes
			)
		);
	}

	/**
	 * Gets the list of currently granted Google OAuth scopes for the current user.
	 *
	 * @since 1.39.0
	 * @see https://developers.google.com/identity/protocols/googlescopes
	 *
	 * @return string[] List of Google OAuth scopes.
	 */
	public function get_granted_scopes() {
		return $this->user_options->get( self::OPTION_AUTH_SCOPES ) ?: array();
	}

	/**
	 * Sets the list of currently granted Google OAuth scopes for the current user.
	 *
	 * @since 1.39.0
	 * @see https://developers.google.com/identity/protocols/googlescopes
	 *
	 * @param string[] $scopes List of Google OAuth scopes.
	 */
	public function set_granted_scopes( $scopes ) {
		$required_scopes = $this->get_required_scopes();
		$scopes          = array_values( array_unique( array_intersect( $scopes, $required_scopes ) ) );

		$this->user_options->set( self::OPTION_AUTH_SCOPES, $scopes );
	}

	/**
	 * Gets the current user's full OAuth token data, including access token and optional refresh token.
	 *
	 * @since 1.39.0
	 *
	 * @return array Associative array with 'access_token', 'expires_in', 'created', and 'refresh_token' keys, or empty
	 *               array if no token available.
	 */
	public function get_token() {
		return $this->token->get();
	}

	/**
	 * Sets the current user's full OAuth token data, including access token and optional refresh token.
	 *
	 * @since 1.39.0
	 *
	 * @param array $token {
	 *     Full token data, optionally including the refresh token.
	 *
	 *     @type string $access_token  Required. The access token.
	 *     @type int    $expires_in    Number of seconds in which the token expires. Default 3600 (1 hour).
	 *     @type int    $created       Timestamp in seconds when the token was created. Default is the current time.
	 *     @type string $refresh_token The refresh token, if relevant. If passed, it is set as well.
	 * }
	 * @return bool True on success, false on failure.
	 */
	public function set_token( array $token ) {
		// Remove the error code from the user options so it doesn't
		// appear again.
		$this->user_options->delete( OAuth_Client::OPTION_ERROR_CODE );

		return $this->token->set( $token );
	}

	/**
	 * Deletes the current user's token and all associated data.
	 *
	 * @since 1.0.3
	 */
	protected function delete_token() {
		$this->token->delete();

		$this->user_options->delete( self::OPTION_AUTH_SCOPES );
	}

	/**
	 * Converts the given error code to a user-facing message.
	 *
	 * @since 1.39.0
	 *
	 * @param string $error_code Error code.
	 * @return string Error message.
	 */
	public function get_error_message( $error_code ) {
		switch ( $error_code ) {
			case 'access_denied':
				return __( 'Setup was interrupted because you did not grant the necessary permissions.', 'google-site-kit' );
			case 'access_token_not_received':
				return __( 'Unable to receive access token because of an unknown error.', 'google-site-kit' );
			case 'cannot_log_in':
				return __( 'Internal error that the Google login redirect failed.', 'google-site-kit' );
			case 'invalid_client':
				return __( 'Unable to receive access token because of an invalid client.', 'google-site-kit' );
			case 'invalid_code':
				return __( 'Unable to receive access token because of an empty authorization code.', 'google-site-kit' );
			case 'invalid_grant':
				return __( 'Unable to receive access token because of an invalid authorization code or refresh token.', 'google-site-kit' );
			case 'invalid_request':
				return __( 'Unable to receive access token because of an invalid OAuth request.', 'google-site-kit' );
			case 'missing_delegation_consent':
				return __( 'Looks like your site is not allowed access to Google account data and can’t display stats in the dashboard.', 'google-site-kit' );
			case 'missing_search_console_property':
				return __( 'Looks like there is no Search Console property for your site.', 'google-site-kit' );
			case 'missing_verification':
				return __( 'Looks like the verification token for your site is missing.', 'google-site-kit' );
			case 'oauth_credentials_not_exist':
				return __( 'Unable to authenticate Site Kit, as no client credentials exist.', 'google-site-kit' );
			case 'refresh_token_not_exist':
				return __( 'Unable to refresh access token, as no refresh token exists.', 'google-site-kit' );
			case 'unauthorized_client':
				return __( 'Unable to receive access token because of an unauthorized client.', 'google-site-kit' );
			case 'unsupported_grant_type':
				return __( 'Unable to receive access token because of an unsupported grant type.', 'google-site-kit' );
			default:
				/* translators: %s: error code from API */
				return sprintf( __( 'Unknown Error (code: %s).', 'google-site-kit' ), $error_code );
		}
	}

	/**
	 * Handles an exception thrown when fetching an access token.
	 *
	 * @since 1.2.0
	 *
	 * @param Exception $e Exception thrown.
	 */
	protected function handle_fetch_token_exception( Exception $e ) {
		$error_code = $e->getMessage();

		// Revoke and delete user connection data on 'invalid_grant'.
		// This typically happens during refresh if the refresh token is invalid or expired.
		if ( 'invalid_grant' === $error_code ) {
			$this->delete_token();
		}

		$this->user_options->set( self::OPTION_ERROR_CODE, $error_code );
		if ( $e instanceof Google_Proxy_Code_Exception ) {
			$this->user_options->set( self::OPTION_PROXY_ACCESS_CODE, $e->getAccessCode() );
		}
	}

	/**
	 * Gets the OAuth redirect URI that listens to the callback request.
	 *
	 * @since 1.39.0
	 *
	 * @return string OAuth redirect URI.
	 */
	protected function get_redirect_uri() {
		return add_query_arg( 'oauth2callback', '1', admin_url( 'index.php' ) );
	}
}
