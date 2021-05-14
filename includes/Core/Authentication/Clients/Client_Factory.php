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
 * Class for creating Site Kit-specific Google_Client instances.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Client_Factory {

	/**
	 * Creates a new Google client instance for the given arguments.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $args Associative array of arguments. See {@see Client_Factory::parse_args()} for more
	 *                    information about the supported fields.
	 * @return Google_Site_Kit_Client|Google_Site_Kit_Proxy_Client The created Google client instance.
	 */
	public static function create_client( array $args ) {
		$args = self::parse_args( $args );

		$context           = $args['context'];
		$options           = $args['options'];
		$user_options      = $args['user_options'];
		$encrypted_options = new Encrypted_Options( $options );
		$credentials       = new Credentials( $encrypted_options );
		$google_proxy      = new Google_Proxy( $context );
		$profile           = new Profile( $user_options );
		$http_proxy        = new WP_HTTP_Proxy();

		if ( $credentials->using_proxy() ) {
			$client = new Google_Site_Kit_Proxy_Client(
				array( 'proxy_base_path' => $google_proxy->url() )
			);
		} else {
			$client = new Google_Site_Kit_Client();
		}

		// Enable exponential retries, try up to three times.
		$client->setConfig( 'retry', array( 'retries' => 3 ) );

		// Override the default user-agent for the Guzzle client. This is used for oauth/token requests.
		// By default this header uses the generic Guzzle client's user-agent and includes
		// Guzzle, cURL, and PHP versions as it is normally shared.
		// In our case however, the client is namespaced to be used by Site Kit only.
		$http_client = $client->getHttpClient();
		$http_client->setDefaultOption( 'headers/User-Agent', Google_Proxy::get_application_name() );

		// Configure the Google_Client's HTTP client to use to use the same HTTP proxy as WordPress HTTP, if set.
		if ( $http_proxy->is_enabled() ) {
			// See http://docs.guzzlephp.org/en/5.3/clients.html#proxy for reference.
			$auth = $http_proxy->use_authentication() ? "{$http_proxy->authentication()}@" : '';
			$http_client->setDefaultOption( 'proxy', "{$auth}{$http_proxy->host()}:{$http_proxy->port()}" );
			$ssl_verify = $http_client->getDefaultOption( 'verify' );
			// Allow SSL verification to be filtered, as is often necessary with HTTP proxies.
			$http_client->setDefaultOption(
				'verify',
				/** This filter is documented in wp-includes/class-http.php */
				apply_filters( 'https_ssl_verify', $ssl_verify, null )
			);
		}

		$auth_config = self::get_auth_config( $credentials );
		if ( ! empty( $auth_config ) ) {
			try {
				$client->setAuthConfig( $auth_config );
			} catch ( Exception $e ) {
				return $client;
			}
		}

		// Offline access so we can access the refresh token even when the user is logged out.
		$client->setAccessType( 'offline' );
		$client->setPrompt( 'consent' );
		$client->setRedirectUri( self::get_redirect_uri() );
		$client->setScopes( $args['required_scopes'] );
		$client->prepareScopes();

		// This is called when the client refreshes the access token on-the-fly.
		$client->setTokenCallback(
			function( $cache_key, $access_token ) use ( $client, $user_options ) {
				// The same token from this callback should also already be set in the client object, which is useful
				// to get the full token data, all of which needs to be saved. Just in case, if that is not the same,
				// we save the passed token only, relying on defaults for the other values.
				$token = $client->getAccessToken();
				if ( $access_token !== $token['access_token'] ) {
					$token = array( 'access_token' => $access_token );
				}

				self::set_saved_token( $user_options, $token );
			}
		);

		// This is called when refreshing the access token on-the-fly fails.
		$client->setTokenExceptionCallback(
			function( Exception $e ) use ( $user_options ) {
				self::handle_fetch_token_exception( $user_options, $e );
			}
		);

		if ( $profile->has() ) {
			$client->setLoginHint( $profile->get()['email'] );
		}

		// Set the full token data.
		$token = self::get_saved_token();
		if ( ! empty( $token ) ) {
			$client->setAccessToken( $token );
		}

		return $client;
	}

	/**
	 * Gets the saved token.
	 *
	 * @since n.e.x.t
	 *
	 * @param User_Options $user_options User options instance to operate on.
	 * @return array Full token data, optionally including a refresh token, or empty array if no access token set.
	 */
	public static function get_saved_token( User_Options $user_options ) {
		$encrypted_user_options = new Encrypted_User_Options( $user_options );

		$access_token = $encrypted_user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN );
		if ( empty( $access_token ) ) {
			// The access token is the bare minimum, so it needs to exist.
			return array();
		}

		$token = array(
			'access_token' => $access_token,
			'expires_in'   => $user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN ),
			'created'      => $user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED ),
		);

		// If a refresh token exists, include it as well.
		$refresh_token = $encrypted_user_options->get( OAuth_Client::OPTION_REFRESH_TOKEN );
		if ( ! empty( $refresh_token ) ) {
			$token['refresh_token'] = $refresh_token;
		}

		return $token;
	}

	/**
	 * Sets the saved token.
	 *
	 * @since n.e.x.t
	 *
	 * @param User_Options $user_options User options instance to operate on.
	 * @param array        $token        {
	 *     Full token data, optionally including the refresh token.
	 *
	 *     @type string $access_token  Required. The access token.
	 *     @type int    $expires_in    Number of seconds in which the token expires. Default 3600 (1 hour).
	 *     @type int    $created       Timestamp in seconds when the token was created. Default is the current time.
	 *     @type string $refresh_token The refresh token, if relevant. If passed, it is set as well.
	 * }
	 * @return bool True on success, false on failure.
	 */
	public static function set_saved_token( User_Options $user_options, array $token ) {
		// The access token is the bare minimum, so it needs to exist.
		if ( empty( $token['access_token'] ) ) {
			return false;
		}

		// Use sane defaults for these fields.
		if ( empty( $token['expires_in'] ) ) {
			$token['expires_in'] = HOUR_IN_SECONDS;
		}
		if ( empty( $token['created'] ) ) {
			$token['created'] = time();
		}

		$encrypted_user_options = new Encrypted_User_Options( $user_options );
		if ( ! $encrypted_user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN, $token['access_token'] ) ) {
			return false;
		}

		$user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN, $token['expires_in'] );
		$user_options->set( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED, $token['created'] );

		// If a refresh token is passed, set it as well.
		if ( ! empty( $token['refresh_token'] ) ) {
			return $encrypted_user_options->set( OAuth_Client::OPTION_REFRESH_TOKEN, $token['refresh_token'] );
		}

		return true;
	}

	/**
	 * Deletes the saved token.
	 *
	 * @since n.e.x.t
	 *
	 * @param User_Options $user_options User options instance to operate on.
	 */
	public static function delete_saved_token( User_Options $user_options ) {
		$user_options->delete( OAuth_Client::OPTION_ACCESS_TOKEN );
		$user_options->delete( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN );
		$user_options->delete( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED );
		$user_options->delete( OAuth_Client::OPTION_REFRESH_TOKEN );
		$user_options->delete( OAuth_Client::OPTION_REDIRECT_URL );
		$user_options->delete( OAuth_Client::OPTION_AUTH_SCOPES );
		$user_options->delete( OAuth_Client::OPTION_ADDITIONAL_AUTH_SCOPES );
	}

	/**
	 * Handles an exception thrown when fetching an access token.
	 *
	 * @since n.e.x.t
	 *
	 * @param User_Options $user_options User options instance to operate on.
	 * @param Exception    $e            Exception thrown.
	 */
	public static function handle_fetch_token_exception( User_Options $user_options, Exception $e ) {
		$error_code = $e->getMessage();

		// Revoke and delete user connection data on 'invalid_grant'.
		// This typically happens during refresh if the refresh token is invalid or expired.
		if ( 'invalid_grant' === $error_code ) {
			self::delete_saved_token( $user_options );
		}

		$user_options->set( OAuth_Client::OPTION_ERROR_CODE, $error_code );
		if ( $e instanceof Google_Proxy_Code_Exception ) {
			$user_options->set( OAuth_Client::OPTION_PROXY_ACCESS_CODE, $e->getAccessCode() );
		}
	}

	/**
	 * Retrieves the OAuth credentials configuration data.
	 *
	 * @since n.e.x.t
	 *
	 * @param Credentials $credentials Credentials instance to read data from.
	 * @return array Credentials data, or empty array if no credentials available.
	 */
	private static function get_auth_config( Credentials $credentials ) {
		if ( ! $credentials->has() ) {
			return array();
		}

		$credentials = $credentials->get();

		return array(
			'client_id'                   => $credentials['oauth2_client_id'],
			'client_secret'               => $credentials['oauth2_client_secret'],
			'auth_uri'                    => 'https://accounts.google.com/o/oauth2/auth',
			'token_uri'                   => 'https://oauth2.googleapis.com/token',
			'auth_provider_x509_cert_url' => 'https://www.googleapis.com/oauth2/v1/certs',
			'redirect_uris'               => array( self::get_redirect_uri() ),
		);
	}

	/**
	 * Gets the OAuth redirect URI that listens to the callback request.
	 *
	 * @since n.e.x.t Ported from `OAuth_Client` class.
	 *
	 * @return string OAuth redirect URI.
	 */
	private static function get_redirect_uri() {
		return add_query_arg( 'oauth2callback', '1', admin_url( 'index.php' ) );
	}

	/**
	 * Parses the arguments array for creating a new client.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $args {
	 *     Associative array of arguments.
	 *
	 *     @type Context      $context         Required. Context instance.
	 *     @type Options      $options         Options instance. Default is a new instance based on $context.
	 *     @type User_Options $user_options    User_Options instance. Default is a new instance based on $context.
	 *     @type array        $required_scopes List of required scopes. Default is the filtered plugin-wide list of
	 *                                         required scopes.
	 * }
	 * @return array Parsed arguments.
	 *
	 * @throws Exception Thrown if no context argument is provided.
	 */
	private static function parse_args( array $args ) {
		if ( ! isset( $args['context'] ) || ! $args['context'] instanceof Context ) {
			throw new Exception(); // TODO.
		}

		if ( ! isset( $args['options'] ) || ! $args['options'] instanceof Options ) {
			$args['options'] = new Options( $args['context'] );
		}
		if ( ! isset( $args['user_options'] ) || ! $args['user_options'] instanceof User_Options ) {
			$args['user_options'] = new User_Options( $args['context'] );
		}
		if ( ! isset( $args['required_scopes'] ) ) {
			$args['required_scopes'] = array(); // TODO.
		}

		return $args;
	}
}
