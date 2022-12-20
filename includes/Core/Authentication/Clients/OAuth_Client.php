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
use Google\Site_Kit\Core\Authentication\Exception\Google_Proxy_Code_Exception;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Owner_ID;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Authentication\Token;
use Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics\Activity_Metrics;
use Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics\Active_Consumers;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Scopes;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit_Dependencies\Google\Service\PeopleService as Google_Service_PeopleService;
use WP_User;

/**
 * Class for connecting to Google APIs via OAuth.
 *
 * @since 1.0.0
 * @since 1.39.0 Now extends `OAuth_Client_Base`.
 * @access private
 * @ignore
 */
final class OAuth_Client extends OAuth_Client_Base {

	const OPTION_ADDITIONAL_AUTH_SCOPES = 'googlesitekit_additional_auth_scopes';
	const OPTION_REDIRECT_URL           = 'googlesitekit_redirect_url';
	const CRON_REFRESH_PROFILE_DATA     = 'googlesitekit_cron_refresh_profile_data';

	/**
	 * Owner_ID instance.
	 *
	 * @since 1.16.0
	 * @var Owner_ID
	 */
	private $owner_id;

	/**
	 * Activity_Metrics instance.
	 *
	 * @since 1.87.0
	 * @var Activity_Metrics
	 */
	private $activity_metrics;

	/**
	 * Active_Consumers instance.
	 *
	 * @since 1.87.0
	 * @var Active_Consumers
	 */
	private $active_consumers;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
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
		parent::__construct(
			$context,
			$options,
			$user_options,
			$credentials,
			$google_proxy,
			$profile,
			$token
		);

		$this->owner_id         = new Owner_ID( $this->options );
		$this->activity_metrics = new Activity_Metrics( $this->context, $this->user_options );
		$this->active_consumers = new Active_Consumers( $this->user_options );
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
		$token = $this->get_token();
		if ( empty( $token['refresh_token'] ) ) {
			$this->delete_token();
			$this->user_options->set( self::OPTION_ERROR_CODE, 'refresh_token_not_exist' );
			return;
		}

		$active_consumers = $this->activity_metrics->get_for_refresh_token();

		try {
			$token_response = $this->get_client()->fetchAccessTokenWithRefreshToken( $token['refresh_token'], $active_consumers );
		} catch ( \Exception $e ) {
			$this->handle_fetch_token_exception( $e );
			return;
		}

		if ( ! isset( $token_response['access_token'] ) ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, 'access_token_not_received' );
			return;
		}

		$this->active_consumers->delete();
		$this->set_token( $token_response );
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

		$this->delete_token();
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
		$base_scopes  = parent::get_granted_scopes();
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
		if ( ! $this->token->has() ) {
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

		parent::set_granted_scopes( $base_scopes );
		$this->user_options->set( self::OPTION_ADDITIONAL_AUTH_SCOPES, $extra_scopes );
	}

	/**
	 * Gets the current user's OAuth access token.
	 *
	 * @since 1.0.0
	 *
	 * @return string|bool Access token if it exists, false otherwise.
	 */
	public function get_access_token() {
		$token = $this->get_token();
		if ( empty( $token['access_token'] ) ) {
			return false;
		}
		return $token['access_token'];
	}

	/**
	 * Sets the current user's OAuth access token.
	 *
	 * @since 1.0.0
	 * @deprecated 1.39.0 Use `OAuth_Client::set_token` instead.
	 *
	 * @param string $access_token New access token.
	 * @param int    $expires_in   TTL of the access token in seconds.
	 * @param int    $created      Optional. Timestamp when the token was created, in GMT. Default is the current time.
	 * @return bool True on success, false on failure.
	 */
	public function set_access_token( $access_token, $expires_in, $created = 0 ) {
		_deprecated_function( __METHOD__, '1.39.0', self::class . '::set_token' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		return $this->set_token(
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
	 * @deprecated 1.39.0 Use `OAuth_Client::get_token` instead.
	 *
	 * @return string|bool Refresh token if it exists, false otherwise.
	 */
	public function get_refresh_token() {
		_deprecated_function( __METHOD__, '1.39.0', self::class . '::get_token' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		$token = $this->get_token();
		if ( empty( $token['refresh_token'] ) ) {
			return false;
		}
		return $token['refresh_token'];
	}

	/**
	 * Sets the current user's OAuth refresh token.
	 *
	 * @since 1.0.0
	 * @deprecated 1.39.0 Use `OAuth_Client::set_token` instead.
	 *
	 * @param string $refresh_token New refresh token.
	 * @return bool True on success, false on failure.
	 */
	public function set_refresh_token( $refresh_token ) {
		_deprecated_function( __METHOD__, '1.39.0', self::class . '::set_token' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		$token                  = $this->get_token();
		$token['refresh_token'] = $refresh_token;
		return $this->set_token( $token );
	}

	/**
	 * Gets the authentication URL.
	 *
	 * @since 1.0.0
	 * @since 1.9.0 Added $additional_scopes parameter.
	 * @since 1.34.1 Updated handling of $additional_scopes to restore rewritten scope.
	 *
	 * @param string   $redirect_url      Redirect URL after authentication.
	 * @param string[] $additional_scopes List of additional scopes to request.
	 * @return string Authentication URL.
	 */
	public function get_authentication_url( $redirect_url = '', $additional_scopes = array() ) {
		if ( empty( $redirect_url ) ) {
			$redirect_url = $this->context->admin_url( 'splash' );
		}
		if ( is_array( $additional_scopes ) ) {
			// Rewrite each scope to convert `gttp` -> `http`, if it starts with this placeholder scheme.
			// This restores the original scope rewritten by getConnectURL.
			$additional_scopes = array_map(
				function ( $scope ) {
					return preg_replace( '/^gttp(s)?:/', 'http$1:', $scope );
				},
				$additional_scopes
			);
		} else {
			$additional_scopes = array();
		}

		$url_query = URL::parse( $redirect_url, PHP_URL_QUERY );

		if ( $url_query ) {
			parse_str( $url_query, $query_args );
		}

		if ( empty( $query_args['notification'] ) ) {
			$redirect_url = add_query_arg( array( 'notification' => 'authentication_success' ), $redirect_url );
		}
		// Ensure we remove error query string.
		$redirect_url = remove_query_arg( 'error', $redirect_url );

		$this->user_options->set( self::OPTION_REDIRECT_URL, $redirect_url );

		// Ensure the latest required scopes are requested.
		$scopes = array_merge( $this->get_required_scopes(), $additional_scopes );
		$this->get_client()->setScopes( array_unique( $scopes ) );

		return add_query_arg(
			$this->google_proxy->get_metadata_fields(),
			$this->get_client()->createAuthUrl()
		);
	}

	/**
	 * Redirects the current user to the Google OAuth consent screen, or processes a response from that consent
	 * screen if present.
	 *
	 * @since 1.0.0
	 * @since 1.49.0 Uses the new `Google_Proxy::setup_url_v2` method when the `serviceSetupV2` feature flag is enabled.
	 */
	public function authorize_user() {
		$code       = htmlspecialchars( $this->context->input()->filter( INPUT_GET, 'code' ) );
		$error_code = htmlspecialchars( $this->context->input()->filter( INPUT_GET, 'error' ) );
		// If the OAuth redirects with an error code, handle it.
		if ( ! empty( $error_code ) ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, $error_code );
			wp_safe_redirect( $this->authorize_user_redirect_url() );
			exit();
		}

		if ( ! $this->credentials->has() ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, 'oauth_credentials_not_exist' );
			wp_safe_redirect( $this->authorize_user_redirect_url() );
			exit();
		}

		try {
			$token_response = $this->get_client()->fetchAccessTokenWithAuthCode( $code );
		} catch ( Google_Proxy_Code_Exception $e ) {
			// Redirect back to proxy immediately with the access code.
			$credentials = $this->credentials->get();
			$params      = array(
				'code'    => $e->getAccessCode(),
				'site_id' => ! empty( $credentials['oauth2_client_id'] ) ? $credentials['oauth2_client_id'] : '',
			);
			$params      = $this->google_proxy->add_setup_step_from_error_code( $params, $e->getMessage() );
			$url         = $this->google_proxy->setup_url( $params );

			wp_safe_redirect( $url );
			exit();
		} catch ( Exception $e ) {
			$this->handle_fetch_token_exception( $e );
			wp_safe_redirect( $this->authorize_user_redirect_url() );
			exit();
		}

		if ( ! isset( $token_response['access_token'] ) ) {
			$this->user_options->set( self::OPTION_ERROR_CODE, 'access_token_not_received' );
			wp_safe_redirect( $this->authorize_user_redirect_url() );
			exit();
		}

		// Update the access token and refresh token.
		$this->set_token( $token_response );

		// Store the previously granted scopes for use in the action below before they're updated.
		$previous_scopes = $this->get_granted_scopes();

		// Update granted scopes.
		if ( isset( $token_response['scope'] ) ) {
			$scopes = explode( ' ', sanitize_text_field( $token_response['scope'] ) );
		} elseif ( $this->context->input()->filter( INPUT_GET, 'scope' ) ) {
			$scope  = htmlspecialchars( $this->context->input()->filter( INPUT_GET, 'scope' ) );
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
			$url_query = URL::parse( $redirect_url, PHP_URL_QUERY );

			if ( $url_query ) {
				parse_str( $url_query, $query_args );
			}

			$reauth = isset( $query_args['reAuth'] ) && 'true' === $query_args['reAuth'];

			if ( false === $reauth && empty( $query_args['notification'] ) ) {
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
			$response       = $people_service->people->get( 'people/me', array( 'personFields' => 'emailAddresses,photos,names' ) );

			if ( isset( $response['emailAddresses'][0]['value'], $response['photos'][0]['url'], $response['names'][0]['displayName'] ) ) {
				$this->profile->set(
					array(
						'email'     => $response['emailAddresses'][0]['value'],
						'photo'     => $response['photos'][0]['url'],
						'full_name' => $response['names'][0]['displayName'],
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
		$access_token = $this->get_access_token();
		if ( empty( $access_token ) ) {
			return '';
		}

		return $this->google_proxy->permissions_url(
			$this->credentials,
			array( 'token' => $access_token )
		);
	}

	/**
	 * Deletes the current user's token and all associated data.
	 *
	 * @since 1.0.3
	 */
	protected function delete_token() {
		parent::delete_token();

		$this->user_options->delete( self::OPTION_REDIRECT_URL );
		$this->user_options->delete( self::OPTION_ADDITIONAL_AUTH_SCOPES );
	}

	/**
	 * Return the URL for the user to view the dashboard/splash
	 * page based on their permissions.
	 *
	 * @since 1.77.0
	 */
	private function authorize_user_redirect_url() {
		return current_user_can( Permissions::VIEW_DASHBOARD )
			? $this->context->admin_url( 'dashboard' )
			: $this->context->admin_url( 'splash' );
	}

	/**
	 * Adds a user to the active consumers list.
	 *
	 * @since 1.87.0
	 *
	 * @param WP_User $user User object.
	 */
	public function add_active_consumer( WP_User $user ) {
		$this->active_consumers->add( $user->ID, $user->roles );
	}
}
