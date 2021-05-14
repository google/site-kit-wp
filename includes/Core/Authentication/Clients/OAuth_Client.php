<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Clients\OAuth_Client
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
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Owner_ID;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Authentication\Exception\Google_Proxy_Code_Exception;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Encrypted_User_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Scopes;
use Google\Site_Kit_Dependencies\Google\Task\Runner;
use Google\Site_Kit_Dependencies\Google_Service_PeopleService;
use WP_HTTP_Proxy;

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
	const OPTION_ADDITIONAL_AUTH_SCOPES  = 'googlesitekit_additional_auth_scopes';
	const OPTION_ERROR_CODE              = 'googlesitekit_error_code';
	const OPTION_PROXY_ACCESS_CODE       = 'googlesitekit_proxy_access_code';
	const CRON_REFRESH_PROFILE_DATA      = 'googlesitekit_cron_refresh_profile_data';

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
	 * Google_Proxy instance.
	 *
	 * @since 1.1.2
	 * @var Google_Proxy
	 */
	private $google_proxy;

	/**
	 * Google Client object.
	 *
	 * @since 1.0.0
	 * @since 1.2.0 Now always a Google_Site_Kit_Client.
	 * @var Google_Site_Kit_Client
	 */
	private $google_client;

	/**
	 * Profile instance.
	 *
	 * @since 1.1.4
	 * @var Profile
	 */
	private $profile;

	/**
	 * WP_HTTP_Proxy instance.
	 *
	 * @since 1.2.0
	 * @var WP_HTTP_Proxy
	 */
	private $http_proxy;

	/**
	 * Owner_ID instance.
	 *
	 * @since 1.16.0
	 * @var Owner_ID
	 */
	private $owner_id;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context       $context      Plugin context.
	 * @param Options       $options      Optional. Option API instance. Default is a new instance.
	 * @param User_Options  $user_options Optional. User Option API instance. Default is a new instance.
	 * @param Credentials   $credentials  Optional. Credentials instance. Default is a new instance from $options.
	 * @param Google_Proxy  $google_proxy Optional. Google proxy instance. Default is a new instance.
	 * @param Profile       $profile      Optional. Profile instance. Default is a new instance.
	 * @param WP_HTTP_Proxy $http_proxy   Optional. WP_HTTP_Proxy instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null,
		Credentials $credentials = null,
		Google_Proxy $google_proxy = null,
		Profile $profile = null,
		WP_HTTP_Proxy $http_proxy = null
	) {
		$this->context                = $context;
		$this->options                = $options ?: new Options( $this->context );
		$this->user_options           = $user_options ?: new User_Options( $this->context );
		$this->encrypted_options      = new Encrypted_Options( $this->options );
		$this->encrypted_user_options = new Encrypted_User_Options( $this->user_options );
		$this->credentials            = $credentials ?: new Credentials( $this->encrypted_options );
		$this->google_proxy           = $google_proxy ?: new Google_Proxy( $this->context );
		$this->profile                = $profile ?: new Profile( $this->user_options );
		$this->http_proxy             = $http_proxy ?: new WP_HTTP_Proxy();
		$this->owner_id               = new Owner_ID( $this->options );
	}

	/**
	 * Gets the Google client object.
	 *
	 * @since 1.0.0
	 * @since 1.2.0 Now always returns a Google_Site_Kit_Client.
	 *
	 * @return Google_Site_Kit_Client Google client object.
	 */
	public function get_client() {
		if ( ! $this->google_client instanceof Google_Site_Kit_Client ) {
			$this->google_client = Client_Factory::create_client(
				array(
					'context'      => $this->context,
					'options'      => $this->options,
					'user_options' => $this->user_options,
				)
			);
		}

		return $this->google_client;
	}

	/**
	 * Refreshes the access token.
	 *
	 * While this method can be used to explicitly refresh the current access token, the preferred way
	 * should be to rely on the Google_Site_Kit_Client to do that automatically whenever the current access token
	 * has expired.
	 *
	 * @since 1.0.0
	 */
	public function refresh_token() {
		// Stop if google_client not initialized yet.
		if ( ! $this->google_client instanceof Google_Site_Kit_Client ) {
			return;
		}

		try {
			$token_response = $this->google_client->fetchAccessTokenWithRefreshToken( $refresh_token );
		} catch ( \Exception $e ) {
			Client_Factory::handle_fetch_token_exception( $this->user_options, $e );
			return;
		}

		if ( ! isset( $token_response['access_token'] ) ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, 'access_token_not_received' );
			return;
		}

		Client_Factory::set_saved_token( $this->user_options, $token_response );
	}

	/**
	 * Revokes the access token.
	 *
	 * @since 1.0.0
	 */
	public function revoke_token() {
		try {
			$this->get_client()->revokeToken();
		} catch ( \Exception $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement
			// No special handling, we just need to make sure this goes through.
		}

		Client_Factory::delete_saved_token( $this->user_options );
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
	 * @return string[] List of Google OAuth scopes.
	 */
	public function get_granted_scopes() {
		$base_scopes  = $this->user_options->get( self::OPTION_AUTH_SCOPES ) ?: array();
		$extra_scopes = $this->get_granted_additional_scopes();

		return array_unique(
			array_merge( $base_scopes, $extra_scopes )
		);
	}

	/**
	 * Gets the list of currently granted additional Google OAuth scopes for the current user.
	 *
	 * Scopes are considered "additional scopes" if they were granted to perform a specific action,
	 * rather than being granted as an overall required scope.
	 *
	 * @since 1.9.0
	 * @see https://developers.google.com/identity/protocols/googlescopes
	 *
	 * @return string[] List of Google OAuth scopes.
	 */
	public function get_granted_additional_scopes() {
		return array_values( $this->user_options->get( self::OPTION_ADDITIONAL_AUTH_SCOPES ) ?: array() );
	}

	/**
	 * Checks if new scopes are required that are not yet granted for the current user.
	 *
	 * @since 1.9.0
	 *
	 * @return bool true if any required scopes are not satisfied, otherwise false.
	 */
	public function needs_reauthentication() {
		if ( ! Client_Factory::get_saved_token( $this->user_options ) ) {
			return false;
		}

		return ! $this->has_sufficient_scopes();
	}

	/**
	 * Gets the list of scopes which are not satisfied by the currently granted scopes.
	 *
	 * @since 1.9.0
	 *
	 * @param string[] $scopes Optional. List of scopes to test against granted scopes.
	 *                         Default is the list of required scopes.
	 * @return string[] Filtered $scopes list, only including scopes that are not satisfied.
	 */
	public function get_unsatisfied_scopes( array $scopes = null ) {
		if ( null === $scopes ) {
			$scopes = $this->get_required_scopes();
		}

		$granted_scopes     = $this->get_granted_scopes();
		$unsatisfied_scopes = array_filter(
			$scopes,
			function( $scope ) use ( $granted_scopes ) {
				return ! Scopes::is_satisfied_by( $scope, $granted_scopes );
			}
		);

		return array_values( $unsatisfied_scopes );
	}

	/**
	 * Checks whether or not currently granted scopes are sufficient for the given list.
	 *
	 * @since 1.9.0
	 *
	 * @param string[] $scopes Optional. List of scopes to test against granted scopes.
	 *                         Default is the list of required scopes.
	 * @return bool True if all $scopes are satisfied, false otherwise.
	 */
	public function has_sufficient_scopes( array $scopes = null ) {
		if ( null === $scopes ) {
			$scopes = $this->get_required_scopes();
		}
		return Scopes::are_satisfied_by( $scopes, $this->get_granted_scopes() );
	}

	/**
	 * Sets the list of currently granted Google OAuth scopes for the current user.
	 *
	 * @since 1.0.0
	 * @see https://developers.google.com/identity/protocols/googlescopes
	 *
	 * @param string[] $scopes List of Google OAuth scopes.
	 */
	public function set_granted_scopes( $scopes ) {
		$required_scopes = $this->get_required_scopes();
		$base_scopes     = array();
		$extra_scopes    = array();

		foreach ( $scopes as $scope ) {
			if ( in_array( $scope, $required_scopes, true ) ) {
				$base_scopes[] = $scope;
			} else {
				$extra_scopes[] = $scope;
			}
		}

		$this->user_options->set( self::OPTION_AUTH_SCOPES, $base_scopes );
		$this->user_options->set( self::OPTION_ADDITIONAL_AUTH_SCOPES, $extra_scopes );
	}

	/**
	 * Gets the current user's OAuth access token.
	 *
	 * @since 1.0.0
	 * @deprecated n.e.x.t
	 *
	 * @return string|bool Access token if it exists, false otherwise.
	 */
	public function get_access_token() {
		_deprecated_function( __METHOD__, 'n.e.x.t', Client_Factory::class . '::get_saved_token' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		$token = Client_Factory::get_saved_token( $this->user_options );
		if ( empty( $token['access_token'] ) ) {
			return false;
		}
		return $token['access_token'];
	}

	/**
	 * Sets the current user's OAuth access token.
	 *
	 * @since 1.0.0
	 * @deprecated n.e.x.t
	 *
	 * @param string $access_token New access token.
	 * @param int    $expires_in   TTL of the access token in seconds.
	 * @param int    $created      Optional. Timestamp when the token was created, in GMT. Default is the current time.
	 * @return bool True on success, false on failure.
	 */
	public function set_access_token( $access_token, $expires_in, $created = 0 ) {
		_deprecated_function( __METHOD__, 'n.e.x.t', Client_Factory::class . '::set_saved_token' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		return Client_Factory::set_saved_token(
			$this->user_options,
			array(
				'access_token' => $access_token,
				'expires_in'   => $expires_in,
				'created'      => $created,
			)
		);
	}

	/**
	 * Gets the current user's OAuth refresh token.
	 *
	 * @since 1.0.0
	 * @deprecated n.e.x.t
	 *
	 * @return string|bool Refresh token if it exists, false otherwise.
	 */
	public function get_refresh_token() {
		_deprecated_function( __METHOD__, 'n.e.x.t', Client_Factory::class . '::get_saved_token' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		$token = Client_Factory::get_saved_token( $this->user_options );
		if ( empty( $token['refresh_token'] ) ) {
			return false;
		}
		return $token['refresh_token'];
	}

	/**
	 * Sets the current user's OAuth refresh token.
	 *
	 * @since 1.0.0
	 * @deprecated n.e.x.t
	 *
	 * @param string $refresh_token New refresh token.
	 * @return bool True on success, false on failure.
	 */
	public function set_refresh_token( $refresh_token ) {
		_deprecated_function( __METHOD__, 'n.e.x.t', Client_Factory::class . '::set_saved_token' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		$token = Client_Factory::get_saved_token( $this->user_options );
		if ( empty( $token ) ) {
			return false;
		}

		$token['refresh_token'] = $refresh_token;
		return Client_Factory::set_saved_token( $this->user_options, $token );
	}

	/**
	 * Gets the authentication URL.
	 *
	 * @since 1.0.0
	 * @since 1.9.0 Added $additional_scopes parameter.
	 *
	 * @param string   $redirect_url      Redirect URL after authentication.
	 * @param string[] $additional_scopes List of additional scopes to request.
	 * @return string Authentication URL.
	 */
	public function get_authentication_url( $redirect_url = '', $additional_scopes = array() ) {
		if ( empty( $redirect_url ) ) {
			$redirect_url = $this->context->admin_url( 'splash' );
		}
		if ( ! is_array( $additional_scopes ) ) {
			$additional_scopes = array();
		}

		$redirect_url = add_query_arg( array( 'notification' => 'authentication_success' ), $redirect_url );
		// Ensure we remove error query string.
		$redirect_url = remove_query_arg( 'error', $redirect_url );

		$this->user_options->set( self::OPTION_REDIRECT_URL, $redirect_url );

		// Ensure the latest required scopes are requested.
		$scopes = array_merge( $this->get_required_scopes(), $additional_scopes );
		$this->get_client()->setScopes( array_unique( $scopes ) );

		$query_params = array(
			'hl' => $this->context->get_locale( 'user' ),
		);

		return add_query_arg( $query_params, $this->get_client()->createAuthUrl() );
	}

	/**
	 * Redirects the current user to the Google OAuth consent screen, or processes a response from that consent
	 * screen if present.
	 *
	 * @since 1.0.0
	 */
	public function authorize_user() {
		$code       = $this->context->input()->filter( INPUT_GET, 'code', FILTER_SANITIZE_STRING );
		$error_code = $this->context->input()->filter( INPUT_GET, 'error', FILTER_SANITIZE_STRING );
		// If the OAuth redirects with an error code, handle it.
		if ( ! empty( $error_code ) ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, $error_code );
			wp_safe_redirect( admin_url() );
			exit();
		}

		if ( ! $this->credentials->has() ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, 'oauth_credentials_not_exist' );
			wp_safe_redirect( admin_url() );
			exit();
		}

		try {
			$token_response = $this->get_client()->fetchAccessTokenWithAuthCode( $code );
		} catch ( Google_Proxy_Code_Exception $e ) {
			// Redirect back to proxy immediately with the access code.
			wp_safe_redirect( $this->get_proxy_setup_url( $e->getAccessCode(), $e->getMessage() ) );
			exit();
		} catch ( Exception $e ) {
			Client_Factory::handle_fetch_token_exception( $this->user_options, $e );
			wp_safe_redirect( admin_url() );
			exit();
		}

		if ( ! isset( $token_response['access_token'] ) ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, 'access_token_not_received' );
			wp_safe_redirect( admin_url() );
			exit();
		}

		// Update the access token and refresh token.
		Client_Factory::set_saved_token( $this->user_options, $token_response );

		// Store the previously granted scopes for use in the action below before they're updated.
		$previous_scopes = $this->get_granted_scopes();

		// Update granted scopes.
		if ( isset( $token_response['scope'] ) ) {
			$scopes = explode( ' ', sanitize_text_field( $token_response['scope'] ) );
		} elseif ( $this->context->input()->filter( INPUT_GET, 'scope' ) ) {
			$scope  = $this->context->input()->filter( INPUT_GET, 'scope', FILTER_SANITIZE_STRING );
			$scopes = explode( ' ', $scope );
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

		$this->refresh_profile_data( 2 * MINUTE_IN_SECONDS );

		/**
		 * Fires when the current user has just been authorized to access Google APIs.
		 *
		 * In other words, this action fires whenever Site Kit has just obtained a new set of access token and
		 * refresh token for the current user, which may happen to set up the initial connection or to request
		 * access to further scopes.
		 *
		 * @since 1.3.0
		 * @since 1.6.0 The $token_response parameter was added.
		 * @since 1.30.0 The $scopes and $previous_scopes parameters were added.
		 *
		 * @param array $token_response Token response data.
		 * @param string[] $scopes List of scopes.
		 * @param string[] $previous_scopes List of previous scopes.
		 */
		do_action( 'googlesitekit_authorize_user', $token_response, $scopes, $previous_scopes );

		// This must happen after googlesitekit_authorize_user as the permissions checks depend on
		// values set which affect the meta capability mapping.
		$current_user_id = get_current_user_id();
		if ( $this->should_update_owner_id( $current_user_id ) ) {
			$this->owner_id->set( $current_user_id );
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
	 * Fetches and updates the user profile data for the currently authenticated Google account.
	 *
	 * @since 1.1.4
	 * @since 1.13.0 Added $retry_after param, also made public.
	 *
	 * @param int $retry_after Optional. Number of seconds to retry data fetch if unsuccessful.
	 */
	public function refresh_profile_data( $retry_after = 0 ) {
		try {
			$people_service = new Google_Service_PeopleService( $this->get_client() );
			$response       = $people_service->people->get( 'people/me', array( 'personFields' => 'emailAddresses,photos' ) );

			if ( isset( $response['emailAddresses'][0]['value'], $response['photos'][0]['url'] ) ) {
				$this->profile->set(
					array(
						'email' => $response['emailAddresses'][0]['value'],
						'photo' => $response['photos'][0]['url'],
					)
				);
			}
			// Clear any scheduled job to refresh this data later, if any.
			wp_clear_scheduled_hook(
				self::CRON_REFRESH_PROFILE_DATA,
				array( $this->user_options->get_user_id() )
			);
		} catch ( Exception $e ) {
			$retry_after = absint( $retry_after );
			if ( $retry_after < 1 ) {
				return;
			}
			wp_schedule_single_event(
				time() + $retry_after,
				self::CRON_REFRESH_PROFILE_DATA,
				array( $this->user_options->get_user_id() )
			);
		}
	}

	/**
	 * Determines whether the authentication proxy is used.
	 *
	 * In order to streamline the setup and authentication flow, the plugin uses a proxy mechanism based on an external
	 * service. This can be overridden by providing actual GCP credentials with the {@see 'googlesitekit_oauth_secret'}
	 * filter.
	 *
	 * @since 1.0.0
	 * @deprecated 1.9.0
	 *
	 * @return bool True if proxy authentication is used, false otherwise.
	 */
	public function using_proxy() {
		_deprecated_function( __METHOD__, '1.9.0', Credentials::class . '::using_proxy' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		return $this->credentials->using_proxy();
	}

	/**
	 * Returns the setup URL to the authentication proxy.
	 *
	 * @since 1.0.0
	 * @since 1.1.2 Added googlesitekit_proxy_setup_url_params filter.
	 * @since 1.27.0 Error code is no longer used.
	 *
	 * @param string $access_code Optional. Temporary access code for an undelegated access token. Default empty string.
	 * @return string URL to the setup page on the authentication proxy.
	 */
	public function get_proxy_setup_url( $access_code = '' ) {
		$scope = rawurlencode( implode( ' ', $this->get_required_scopes() ) );

		$query_params = array( 'scope' => $scope );
		if ( ! empty( $access_code ) ) {
			$query_params['code'] = $access_code;
		}

		return $this->google_proxy->setup_url( $this->credentials, $query_params );
	}

	/**
	 * Determines whether the current owner ID must be changed or not.
	 *
	 * @since 1.16.0
	 *
	 * @param int $user_id Current user ID.
	 * @return bool TRUE if owner needs to be changed, otherwise FALSE.
	 */
	private function should_update_owner_id( $user_id ) {
		$current_owner_id = $this->owner_id->get();
		if ( $current_owner_id === $user_id ) {
			return false;
		}

		if ( ! empty( $current_owner_id ) && user_can( $current_owner_id, Permissions::MANAGE_OPTIONS ) ) {
			return false;
		}

		if ( ! user_can( $user_id, Permissions::MANAGE_OPTIONS ) ) {
			return false;
		}

		return true;
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
		$token = Client_Factory::get_saved_token( $this->user_options );
		if ( empty( $token['access_token'] ) ) {
			return '';
		}

		return $this->google_proxy->permissions_url(
			$this->credentials,
			array( 'token' => $token['access_token'] )
		);
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
			case 'access_denied':
				return __( 'The Site Kit setup was interrupted because you did not grant the necessary permissions.', 'google-site-kit' );
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
}
