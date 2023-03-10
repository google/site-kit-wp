<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Clients\Client_Factory
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication\Clients;

use Exception;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit_Dependencies\GuzzleHttp\Client;
use WP_HTTP_Proxy;

/**
 * Class for creating Site Kit-specific Google_Client instances.
 *
 * @since 1.39.0
 * @access private
 * @ignore
 */
final class Client_Factory {

	/**
	 * Creates a new Google client instance for the given arguments.
	 *
	 * @since 1.39.0
	 *
	 * @param array $args Associative array of arguments.
	 * @return Google_Site_Kit_Client|Google_Site_Kit_Proxy_Client The created Google client instance.
	 */
	public static function create_client( array $args ) {
		$args = array_merge(
			array(
				'client_id'                => '',
				'client_secret'            => '',
				'redirect_uri'             => '',
				'token'                    => array(),
				'token_callback'           => null,
				'token_exception_callback' => null,
				'required_scopes'          => array(),
				'login_hint_email'         => '',
				'using_proxy'              => true,
				'proxy_url'                => Google_Proxy::PRODUCTION_BASE_URL,
			),
			$args
		);

		if ( $args['using_proxy'] ) {
			$client = new Google_Site_Kit_Proxy_Client(
				array( 'proxy_base_path' => $args['proxy_url'] )
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
		$http_client        = $client->getHttpClient();
		$http_client_config = $http_client->getConfig();

		$http_client_config['headers']['User-Agent'] = Google_Proxy::get_application_name();

		/** This filter is documented in wp-includes/class-http.php */
		$ssl_verify = apply_filters( 'https_ssl_verify', true, null );
		// If SSL verification is enabled (default) use the SSL certificate bundle included with WP.
		if ( $ssl_verify ) {
			$http_client_config['verify'] = ABSPATH . WPINC . '/certificates/ca-bundle.crt';
		} else {
			$http_client_config['verify'] = false;
		}

		// Configure the Google_Client's HTTP client to use to use the same HTTP proxy as WordPress HTTP, if set.
		$http_proxy = new WP_HTTP_Proxy();
		if ( $http_proxy->is_enabled() ) {
			// See https://docs.guzzlephp.org/en/6.5/request-options.html#proxy for reference.
			$auth = $http_proxy->use_authentication() ? "{$http_proxy->authentication()}@" : '';

			$http_client_config['proxy'] = "{$auth}{$http_proxy->host()}:{$http_proxy->port()}";
		}

		// In Guzzle 6+, the HTTP client is immutable, so only a new instance can be set.
		$client->setHttpClient( new Client( $http_client_config ) );

		$auth_config = self::get_auth_config( $args['client_id'], $args['client_secret'], $args['redirect_uri'] );
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
		$client->setRedirectUri( $args['redirect_uri'] );
		$client->setScopes( (array) $args['required_scopes'] );

		// Set the full token data.
		if ( ! empty( $args['token'] ) ) {
			$client->setAccessToken( $args['token'] );
		}

		// Set the callback which is called when the client refreshes the access token on-the-fly.
		$token_callback = $args['token_callback'];
		if ( $token_callback ) {
			$client->setTokenCallback(
				function( $cache_key, $access_token ) use ( $client, $token_callback ) {
					// The same token from this callback should also already be set in the client object, which is useful
					// to get the full token data, all of which needs to be saved. Just in case, if that is not the same,
					// we save the passed token only, relying on defaults for the other values.
					$token = $client->getAccessToken();
					if ( $access_token !== $token['access_token'] ) {
						$token = array( 'access_token' => $access_token );
					}

					$token_callback( $token );
				}
			);
		}

		// Set the callback which is called when refreshing the access token on-the-fly fails.
		$token_exception_callback = $args['token_exception_callback'];
		if ( ! empty( $token_exception_callback ) ) {
			$client->setTokenExceptionCallback( $token_exception_callback );
		}

		if ( ! empty( $args['login_hint_email'] ) ) {
			$client->setLoginHint( $args['login_hint_email'] );
		}

		return $client;
	}

	/**
	 * Returns the full OAuth credentials configuration data based on the given client ID and secret.
	 *
	 * @since 1.39.0
	 *
	 * @param string $client_id     OAuth client ID.
	 * @param string $client_secret OAuth client secret.
	 * @param string $redirect_uri  OAuth redirect URI.
	 * @return array Credentials data, or empty array if any of the given values is empty.
	 */
	private static function get_auth_config( $client_id, $client_secret, $redirect_uri ) {
		if ( ! $client_id || ! $client_secret || ! $redirect_uri ) {
			return array();
		}

		return array(
			'client_id'                   => $client_id,
			'client_secret'               => $client_secret,
			'auth_uri'                    => 'https://accounts.google.com/o/oauth2/auth',
			'token_uri'                   => 'https://oauth2.googleapis.com/token',
			'auth_provider_x509_cert_url' => 'https://www.googleapis.com/oauth2/v1/certs',
			'redirect_uris'               => array( $redirect_uri ),
		);
	}
}
