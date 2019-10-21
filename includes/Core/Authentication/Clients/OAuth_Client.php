<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Clients\OAuth_Client
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication\Clients;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Encrypted_User_Options;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\Verification;
use Google\Site_Kit\Modules\Search_Console;
use Google_Client;
use Exception;

/**
 * Class for connecting to Google APIs via OAuth.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class OAuth_Client {

	const OPTION_ACCESS_TOKEN            = 'googlesitekit_access_token';
	const OPTION_ACCESS_TOKEN_EXPIRES_IN = 'googlesitekit_access_token_expires_in';
	const OPTION_ACCESS_TOKEN_CREATED    = 'googlesitekit_access_token_created_at';
	const OPTION_REFRESH_TOKEN           = 'googlesitekit_refresh_token';
	const OPTION_REDIRECT_URL            = 'googlesitekit_redirect_url';
	const OPTION_AUTH_SCOPES             = 'googlesitekit_auth_scopes';
	const OPTION_ERROR_CODE              = 'googlesitekit_error_code';
	const OPTION_PROXY_NONCE             = 'googlesitekit_proxy_nonce';
	const OPTION_PROXY_ACCESS_CODE       = 'googlesitekit_proxy_access_code';
	const PROXY_URL                      = 'https://sitekit.withgoogle.com';

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Options instance
	 *
	 * @since 1.0.0
	 * @var Options
	 */
	private $options;

	/**
	 * User_Options instance
	 *
	 * @since 1.0.0
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Encrypted_Options instance
	 *
	 * @since 1.0.0
	 * @var Encrypted_Options
	 */
	private $encrypted_options;

	/**
	 * Encrypted_User_Options instance
	 *
	 * @since 1.0.0
	 * @var Encrypted_User_Options
	 */
	private $encrypted_user_options;

	/**
	 * OAuth credentials instance.
	 *
	 * @since 1.0.0
	 * @var Credentials
	 */
	private $credentials;

	/**
	 * Google Client object.
	 *
	 * @since 1.0.0
	 * @var Google_Client
	 */
	private $google_client;

	/**
	 * Access token for communication with Google APIs, for temporary storage.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	private $access_token = '';

	/**
	 * Refresh token to refresh access token, for temporary storage.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	private $refresh_token = '';

	/**
	 * OAuth2 client credentials data, for temporary storage.
	 *
	 * @since 1.0.0
	 * @var object|null
	 */
	private $client_credentials = false;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context      $context      Plugin context.
	 * @param Options      $options      Optional. Option API instance. Default is a new instance.
	 * @param User_Options $user_options Optional. User Option API instance. Default is a new instance.
	 * @param Credentials  $credentials  Optional. Credentials instance. Default is a new instance from $options.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null,
		Credentials $credentials = null
	) {
		$this->context = $context;

		if ( ! $options ) {
			$options = new Options( $this->context );
		}
		$this->options = $options;

		if ( ! $user_options ) {
			$user_options = new User_Options( $this->context );
		}
		$this->user_options = $user_options;

		$this->encrypted_options      = new Encrypted_Options( $this->options );
		$this->encrypted_user_options = new Encrypted_User_Options( $this->user_options );

		if ( ! $credentials ) {
			$credentials = new Credentials( $this->options );
		}
		$this->credentials = $credentials;
	}

	/**
	 * Gets the Google client object.
	 *
	 * @since 1.0.0
	 *
	 * @return Google_Client Google client object.
	 */
	public function get_client() {
		if ( $this->google_client instanceof Google_Client ) {
			return $this->google_client;
		}

		if ( $this->using_proxy() ) {
			$this->google_client = new Google_Proxy_Client();
		} else {
			$this->google_client = new Google_Client();
		}

		// Return unconfigured client if credentials not yet set.
		$client_credentials = $this->get_client_credentials();
		if ( ! $client_credentials ) {
			return $this->google_client;
		}

		try {
			$this->google_client->setAuthConfig( (array) $client_credentials->web );
		} catch ( Exception $e ) {
			return $this->google_client;
		}

		// Offline access so we can access the refresh token even when the user is logged out.
		$this->google_client->setAccessType( 'offline' );

		$this->google_client->setRedirectUri( $this->get_redirect_uri() );

		$this->google_client->setScopes( $this->get_required_scopes() );
		$this->google_client->prepareScopes();

		$access_token = $this->get_access_token();

		// Return unconfigured client if access token not yet set.
		if ( empty( $access_token ) ) {
			return $this->google_client;
		}

		$token = array(
			'access_token' => $access_token,
			'expires_in'   => $this->user_options->get( self::OPTION_ACCESS_TOKEN_EXPIRES_IN ),
			'created'      => $this->user_options->get( self::OPTION_ACCESS_TOKEN_CREATED ),
		);
		if ( ! $this->using_proxy() ) {
			$token['refresh_token'] = $this->get_refresh_token();
		}

		$this->google_client->setAccessToken( $token );

		// If the token expired or is going to expire in the next 30 seconds.
		if ( $this->google_client->isAccessTokenExpired() ) {
			$this->refresh_token();
		}

		return $this->google_client;
	}

	/**
	 * Refreshes the access token.
	 *
	 * @since 1.0.0
	 */
	public function refresh_token() {
		$refresh_token = $this->get_refresh_token();
		if ( empty( $refresh_token ) ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, 'refresh_token_not_exist' );
		}

		// Stop if google_client not initialized yet.
		if ( ! $this->google_client instanceof Google_Client ) {
			return;
		}

		try {
			$authentication_token = $this->google_client->fetchAccessTokenWithRefreshToken( $refresh_token );
		} catch ( Google_Proxy_Exception $e ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, $e->getMessage() );
			$this->user_options->set( self::OPTION_PROXY_ACCESS_CODE, $e->getAccessCode() );
			return;
		} catch ( \Exception $e ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, 'invalid_grant' );
			return;
		}

		// Refresh token is expired or revoked.
		if ( ! empty( $authentication_token['error'] ) ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, $authentication_token['error'] );
			return;
		}

		if ( ! isset( $authentication_token['access_token'] ) ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, 'access_token_not_received' );
			return;
		}

		$this->set_access_token(
			$authentication_token['access_token'],
			isset( $authentication_token['expires_in'] ) ? $authentication_token['expires_in'] : '',
			isset( $authentication_token['created'] ) ? $authentication_token['created'] : 0
		);

		$refresh_token = $this->get_client()->getRefreshToken();
		$this->set_refresh_token( $refresh_token );
	}

	/**
	 * Revokes the access token.
	 *
	 * @since 1.0.0
	 */
	public function revoke_token() {
		// Stop if google_client not initialized yet.
		if ( ! $this->google_client instanceof Google_Client ) {
			return;
		}

		$this->google_client->revokeToken();
	}

	/**
	 * Gets the list of currently required Google OAuth scopes.
	 *
	 * @since 1.0.0
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
		 * @since 1.0.0
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
	 * @since 1.0.0
	 * @see https://developers.google.com/identity/protocols/googlescopes
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_granted_scopes() {
		return array_values( (array) $this->user_options->get( self::OPTION_AUTH_SCOPES ) );
	}

	/**
	 * Sets the list of currently granted Google OAuth scopes for the current user.
	 *
	 * @since 1.0.0
	 * @see https://developers.google.com/identity/protocols/googlescopes
	 *
	 * @param array $scopes List of Google OAuth scopes.
	 * @return bool True on success, false on failure.
	 */
	public function set_granted_scopes( $scopes ) {
		$scopes = array_filter( $scopes, 'is_string' );

		return $this->user_options->set( self::OPTION_AUTH_SCOPES, $scopes );
	}

	/**
	 * Gets the current user's OAuth access token.
	 *
	 * @since 1.0.0
	 *
	 * @return string|bool Access token if it exists, false otherwise.
	 */
	public function get_access_token() {
		if ( ! empty( $this->access_token ) ) {
			return $this->access_token;
		}

		$access_token = $this->encrypted_user_options->get( self::OPTION_ACCESS_TOKEN );

		if ( ! $access_token ) {
			return false;
		}

		$this->access_token = $access_token;

		return $this->access_token;
	}

	/**
	 * Sets the current user's OAuth access token.
	 *
	 * @since 1.0.0
	 *
	 * @param string $access_token New access token.
	 * @param int    $expires_in   TTL of the access token in seconds.
	 * @param int    $created      Optional. Timestamp when the token was created, in GMT. Default is the current time.
	 * @return bool True on success, false on failure.
	 */
	public function set_access_token( $access_token, $expires_in, $created = 0 ) {
		// Bail early if nothing change.
		if ( $this->get_access_token() === $access_token ) {
			return true;
		}

		$this->access_token = $access_token;

		// If not provided, assume current GMT time.
		if ( empty( $created ) ) {
			$created = current_time( 'timestamp', 1 );
		}

		$this->user_options->set( self::OPTION_ACCESS_TOKEN_EXPIRES_IN, $expires_in );
		$this->user_options->set( self::OPTION_ACCESS_TOKEN_CREATED, $created );

		return $this->encrypted_user_options->set( self::OPTION_ACCESS_TOKEN, $this->access_token );
	}

	/**
	 * Gets the current user's OAuth refresh token.
	 *
	 * @since 1.0.0
	 *
	 * @return string|bool Refresh token if it exists, false otherwise.
	 */
	public function get_refresh_token() {
		if ( ! empty( $this->refresh_token ) ) {
			return $this->refresh_token;
		}

		$refresh_token = $this->encrypted_user_options->get( self::OPTION_REFRESH_TOKEN );

		if ( ! $refresh_token ) {
			return false;
		}

		$this->refresh_token = $refresh_token;

		return $this->refresh_token;
	}

	/**
	 * Sets the current user's OAuth refresh token.
	 *
	 * @since 1.0.0
	 *
	 * @param string $refresh_token New refresh token.
	 * @return bool True on success, false on failure.
	 */
	public function set_refresh_token( $refresh_token ) {
		// Bail early if nothing change.
		if ( $this->get_refresh_token() === $refresh_token ) {
			return true;
		}

		$this->refresh_token = $refresh_token;

		return $this->encrypted_user_options->set( self::OPTION_REFRESH_TOKEN, $this->refresh_token );
	}

	/**
	 * Gets the authentication URL.
	 *
	 * @since 1.0.0
	 *
	 * @param string $redirect_url Redirect URL after authentication.
	 * @return string Authentication URL.
	 */
	public function get_authentication_url( $redirect_url = '' ) {
		if ( empty( $redirect_url ) ) {
			$redirect_url = $this->context->admin_url( 'splash' );
		}

		$redirect_url = add_query_arg( array( 'notification' => 'authentication_success' ), $redirect_url );
		// Ensure we remove error query string.
		$redirect_url = remove_query_arg( 'error', $redirect_url );

		$this->user_options->set( self::OPTION_REDIRECT_URL, $redirect_url );

		// Ensure the latest required scopes are requested.
		$this->get_client()->setScopes( $this->get_required_scopes() );

		return $this->get_client()->createAuthUrl();
	}

	/**
	 * Redirects the current user to the Google OAuth consent screen, or processes a response from that consent
	 * screen if present.
	 *
	 * @since 1.0.0
	 */
	public function authorize_user() {
		if ( ! isset( $_GET['code'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.NoNonceVerification
			$auth_url = $this->get_client()->createAuthUrl();
			$auth_url = filter_var( $auth_url, FILTER_SANITIZE_URL );

			wp_safe_redirect( $auth_url );
			exit();
		}

		// Assume Site Kit has credentials if it is not using the proxy (only possible via filter).
		if ( ! $this->credentials->has() && $this->using_proxy() ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, 'oauth_credentials_not_exist' );
			wp_safe_redirect( admin_url() );
			exit();
		}

		try {
			$authentication_token = $this->get_client()->fetchAccessTokenWithAuthCode( $_GET['code'] ); // phpcs:ignore WordPress.Security.NonceVerification.NoNonceVerification
		} catch ( Google_Proxy_Exception $e ) {
			wp_safe_redirect( $this->get_proxy_setup_url( $e->getAccessCode(), $e->getMessage() ) );
			exit();
		} catch ( Exception $e ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, 'invalid_code' );
			wp_safe_redirect( admin_url() );
			exit();
		}

		if ( ! empty( $authentication_token['error'] ) ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, $authentication_token['error'] );
			wp_safe_redirect( admin_url() );
			exit();
		}

		if ( ! isset( $authentication_token['access_token'] ) ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, 'access_token_not_received' );
			wp_safe_redirect( admin_url() );
			exit();
		}

		$this->set_access_token(
			$authentication_token['access_token'],
			isset( $authentication_token['expires_in'] ) ? $authentication_token['expires_in'] : '',
			isset( $authentication_token['created'] ) ? $authentication_token['created'] : 0
		);

		// Update the site refresh token.
		$refresh_token = $this->get_client()->getRefreshToken();
		$this->set_refresh_token( $refresh_token );

		// Update granted scopes.
		if ( isset( $authentication_token['scope'] ) ) {
			$scopes = explode( ' ', $authentication_token['scope'] );
		} elseif ( isset( $_GET['scope'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.NoNonceVerification
			$scopes = explode( ' ', $_GET['scope'] ); // phpcs:ignore WordPress.Security.NonceVerification.NoNonceVerification
		} else {
			$scopes = $this->get_required_scopes();
		}
		$scopes = array_filter(
			$scopes,
			function( $scope ) {
				if ( ! is_string( $scope ) ) {
					return false;
				}
				if ( in_array( $scope, array( 'openid', 'profile', 'email' ), true ) ) {
					return true;
				}
				return 0 === strpos( $scope, 'https://www.googleapis.com/auth/' );
			}
		);
		$this->set_granted_scopes( $scopes );

		// If using the proxy, these values can reliably be set at this point because the proxy already took care of
		// them.
		// TODO: In the future, once the old authentication mechanism no longer exists, this should be resolved in
		// another way.
		if ( $this->using_proxy() ) {
			$this->user_options->set( Verification::OPTION, 'verified' );
			$this->options->set( Search_Console::PROPERTY_OPTION, trailingslashit( $this->context->get_reference_site_url() ) );
		}

		$redirect_url = $this->user_options->get( self::OPTION_REDIRECT_URL );

		if ( $redirect_url ) {
			$parts  = wp_parse_url( $redirect_url );
			$reauth = strpos( $parts['query'], 'reAuth=true' );
			if ( false === $reauth ) {
				$redirect_url = add_query_arg( array( 'notification' => 'authentication_success' ), $redirect_url );
			}
			$this->user_options->delete( self::OPTION_REDIRECT_URL );
		} else {
			// No redirect_url is set, use default page.
			$redirect_url = $this->context->admin_url( 'splash', array( 'notification' => 'authentication_success' ) );
		}

		wp_safe_redirect( $redirect_url );
		exit();
	}

	/**
	 * Determines whether the authentication proxy is used.
	 *
	 * In order to streamline the setup and authentication flow, the plugin uses a proxy mechanism based on an external
	 * service. This can be overridden by providing actual GCP credentials with the {@see 'googlesitekit_oauth_secret'}
	 * filter.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if proxy authentication is used, false otherwise.
	 */
	public function using_proxy() {
		$credentials = $this->get_client_credentials();

		// If no credentials yet, assume true.
		if ( ! is_object( $credentials ) || empty( $credentials->web->client_id ) ) {
			return true;
		}

		// If proxy credentials, return true.
		if ( false !== strpos( $credentials->web->client_id, '.apps.sitekit.withgoogle.com' ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Returns the setup URL to the authentication proxy.
	 *
	 * @since 1.0.0
	 *
	 * @param string $access_code Optional. Temporary access code for an undelegated access token. Default empty string.
	 * @param string $error_code  Optional. Error code, if the user should be redirected because of an error. Default empty string.
	 * @return string URL to the setup page on the authentication proxy.
	 */
	public function get_proxy_setup_url( $access_code = '', $error_code = '' ) {
		$url = self::PROXY_URL . '/site-management/setup/';

		$credentials = $this->get_client_credentials();

		if ( ! is_object( $credentials ) || empty( $credentials->web->client_id ) ) {
			$home_url           = home_url();
			$home_url_no_scheme = str_replace( array( 'http://', 'https://' ), '', $home_url );

			$rest_root  = str_replace( array( 'http://', 'https://', $home_url_no_scheme ), '', rest_url() );
			$admin_root = str_replace( array( 'http://', 'https://', $home_url_no_scheme ), '', admin_url() );

			$nonce = $this->options->get( self::OPTION_PROXY_NONCE );
			if ( empty( $nonce ) ) {
				$nonce = wp_create_nonce( 'googlesitekit_proxy' );
				$this->options->set( self::OPTION_PROXY_NONCE, $nonce );
			}

			return add_query_arg(
				array(
					'nonce'      => $nonce,
					'name'       => rawurlencode( wp_specialchars_decode( get_bloginfo( 'name' ) ) ),
					'url'        => rawurlencode( $home_url ),
					'rest_root'  => rawurlencode( $rest_root ),
					'admin_root' => rawurlencode( $admin_root ),
				),
				$url
			);
		}

		$query_args = array(
			'site_id' => $credentials->web->client_id,
			'code'    => $access_code,
		);
		if ( 'missing_verification' === $error_code ) {
			$query_args['verification_nonce'] = wp_create_nonce( 'googlesitekit_verification' );
		}

		return add_query_arg( $query_args, $url );
	}

	/**
	 * Returns the permissions URL to the authentication proxy.
	 *
	 * This only returns a URL if the user already has an access token set.
	 *
	 * @since 1.0.0
	 *
	 * @return string URL to the permissions page on the authentication proxy on success,
	 *                or empty string on failure.
	 */
	public function get_proxy_permissions_url() {
		$access_token = $this->get_access_token();
		if ( empty( $access_token ) ) {
			return '';
		}

		$query_args = array( 'token' => $access_token );

		$credentials = $this->get_client_credentials();
		if ( is_object( $credentials ) && ! empty( $credentials->web->client_id ) ) {
			$query_args['site_id'] = $credentials->web->client_id;
		}

		return add_query_arg(
			$query_args,
			self::PROXY_URL . '/site-management/permissions/'
		);
	}

	/**
	 * Checks whether the given proxy nonce is valid.
	 *
	 * @since 1.0.0
	 *
	 * @param string $nonce Nonce to validate.
	 * @return bool True if nonce is valid, false otherwise.
	 */
	public function validate_proxy_nonce( $nonce ) {
		$valid_nonce = $this->options->get( self::OPTION_PROXY_NONCE );
		if ( $nonce !== $valid_nonce ) {
			return false;
		}

		$this->options->delete( self::OPTION_PROXY_NONCE );
		return true;
	}

	/**
	 * Converts the given error code to a user-facing message.
	 *
	 * @since 1.0.0
	 *
	 * @param string $error_code Error code.
	 * @return string Error message.
	 */
	public function get_error_message( $error_code ) {
		switch ( $error_code ) {
			case 'oauth_credentials_not_exist':
				$message = __( 'Unable to authenticate Site Kit. Check your client configuration is in the correct JSON format.', 'google-site-kit' );
				break;
			case 'refresh_token_not_exist':
				$message = __( 'Unable to refresh access token, as no refresh token exists.', 'google-site-kit' );
				break;
			case 'cannot_log_in':
				$message = __( 'Internal error that the Google login redirect failed.', 'google-site-kit' );
				break;
			case 'invalid_code':
				$message = __( 'Unable to receive access token because of an empty authorization code.', 'google-site-kit' );
				break;
			case 'access_token_not_received':
				$message = __( 'Unable to receive access token because of an unknown error.', 'google-site-kit' );
				break;
			// The following messages are based on https://tools.ietf.org/html/rfc6749#section-5.2.
			case 'invalid_request':
				$message = __( 'Unable to receive access token because of an invalid OAuth request.', 'google-site-kit' );
				break;
			case 'invalid_client':
				$message = __( 'Unable to receive access token because of an invalid client.', 'google-site-kit' );
				break;
			case 'invalid_grant':
				$message = __( 'Unable to receive access token because of an invalid authorization code or refresh token.', 'google-site-kit' );
				break;
			case 'unauthorized_client':
				$message = __( 'Unable to receive access token because of an unauthorized client.', 'google-site-kit' );
				break;
			case 'unsupported_grant_type':
				$message = __( 'Unable to receive access token because of an unsupported grant type.', 'google-site-kit' );
				break;
			default:
				if ( $this->using_proxy() ) {
					$access_code = $this->user_options->get( self::OPTION_PROXY_ACCESS_CODE );
					if ( ! empty( $access_code ) ) {
						$message = sprintf(
							/* translators: 1: error code from API, 2: URL to re-authenticate */
							__( 'Setup Error (code: %1$s). <a href="%2$s">Re-authenticate with Google</a>', 'google-site-kit' ),
							$error_code,
							esc_url( $this->get_proxy_setup_url( $access_code, $error_code ) )
						);
						$this->user_options->delete( self::OPTION_PROXY_ACCESS_CODE );
						return $message;
					}
				}
				/* translators: %s: error code from API */
				$message = sprintf( __( 'Unknown Error (code: %s).', 'google-site-kit' ), $error_code );
				break;
		}

		return $message;
	}

	/**
	 * Gets the OAuth redirect URI that listens to the callback request.
	 *
	 * @since 1.0.0
	 *
	 * @return string OAuth redirect URI.
	 */
	private function get_redirect_uri() {
		return add_query_arg( 'oauth2callback', '1', untrailingslashit( home_url() ) );
	}

	/**
	 * Retrieve the Site Kit oAuth secret.
	 */
	private function get_client_credentials() {
		if ( false !== $this->client_credentials ) {
			return $this->client_credentials;
		}

		/**
		 * Site Kit oAuth Secret is a string of the JSON for the Google Cloud Platform web application used for Site Kit
		 * that will be associated with this account. This is meant to be a temporary way to specify the client secret
		 * until the authentication proxy has been completed. This filter can be specified from a separate theme or plugin.
		 *
		 * To retrieve the JSON secret, use the following instructions:
		 * - Go to the Google Cloud Platform and create a new project or use an existing one
		 * - In the APIs & Services section, enable the APIs that are used within Site Kit
		 * - Under 'credentials' either create new oAuth Client ID credentials or use an existing set of credentials
		 * - Set the authorizes redirect URIs to be the URL to the oAuth callback for Site Kit, eg. https://<domainname>?oauth2callback=1 (this must be public)
		 * - Click the 'Download JSON' button to download the JSON file that can be copied and pasted into the filter
		 */
		$credentials = trim( apply_filters( 'googlesitekit_oauth_secret', '' ) );

		if ( empty( $credentials ) && $this->credentials->has() ) {
			$redirect_uri = $this->get_redirect_uri();
			$credentials  = $this->credentials->get();
			$credentials  = '{"web":{"client_id":"' . $credentials['oauth2_client_id'] . '","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":"' . $credentials['oauth2_client_secret'] . '","redirect_uris":["' . $redirect_uri . '"]}}';
		}

		if ( ! empty( $credentials ) ) {
			$this->client_credentials = json_decode( $credentials );
		}

		if ( ! is_object( $this->client_credentials ) || empty( $this->client_credentials->web ) ) {
			$this->client_credentials = null;
		}

		return $this->client_credentials;
	}
}
