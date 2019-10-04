<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Clients\Google_Proxy_Client
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication\Clients;

use Google_Client;
use Google\Auth\OAuth2;
use Google\Auth\HttpHandler\HttpHandlerFactory;
use Google\Auth\HttpHandler\HttpClientCache;
use Exception;
use InvalidArgumentException;

/**
 * Modified Google API client relying on the authentication proxy.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Google_Proxy_Client extends Google_Client {

	const OAUTH2_REVOKE_URI = 'https://sitekit.withgoogle.com/o/oauth2/revoke';
	const OAUTH2_TOKEN_URI  = 'https://sitekit.withgoogle.com/o/oauth2/token';
	const OAUTH2_AUTH_URL   = 'https://sitekit.withgoogle.com/o/oauth2/auth';

	/**
	 * Fetches an OAuth 2.0 access token by using a temporary code.
	 *
	 * @since 1.0.0
	 *
	 * @param string $code Temporary authorization code, or undelegated token code.
	 * @return array Access token.
	 *
	 * @throws InvalidArgumentException Thrown when the passed code is empty.
	 */
	public function fetchAccessTokenWithAuthCode( $code ) {
		if ( strlen( $code ) === 0 ) {
			throw new InvalidArgumentException( 'Invalid code' );
		}

		$auth = $this->getOAuth2Service();
		$auth->setCode( $code );
		$auth->setRedirectUri( $this->getRedirectUri() );

		$http_handler = HttpHandlerFactory::build( $this->getHttpClient() );

		$creds = $this->fetchAuthToken( $auth, $http_handler );
		if ( $creds && isset( $creds['access_token'] ) ) {
			$creds['created'] = time();
			$this->setAccessToken( $creds );
		}

		return $creds;
	}

	/**
	 * Fetches a fresh OAuth 2.0 access token by using a refresh token.
	 *
	 * @param string $refresh_token Optional. Refresh token. Unused here.
	 * @return array Access token.
	 */
	public function fetchAccessTokenWithRefreshToken( $refresh_token = null ) {
		if ( null === $refresh_token ) {
			$refresh_token = '';
		}

		$old_access_token = $this->getAccessToken();
		if ( empty( $old_access_token['access_token'] ) ) {
			$url = add_query_arg( 'access_token', $old_access_token['access_token'], $url );
		}

		$this->getLogger()->info( 'OAuth2 access token refresh' );
		$auth = $this->getOAuth2Service();
		$auth->setRefreshToken( $refresh_token );

		// Set our own parameters.
		$auth->setGrantType( 'refresh_token_proxy' );
		$auth->setExtensionParams(
			array(
				'grant_type'   => 'refresh_token',
				'access_token' => $old_access_token['access_token'],
			)
		);

		$http_handler = HttpHandlerFactory::build( $this->getHttpClient() );

		$creds = $this->fetchAuthToken( $auth, $http_handler );
		if ( $creds && isset( $creds['access_token'] ) ) {
			$creds['created'] = time();
			$this->setAccessToken( $creds );
		}

		return $creds;
	}

	/**
	 * Revokes an OAuth2 access token using the authentication proxy.
	 *
	 * @since 1.0.0
	 *
	 * @param string|array|null $token Optional. Access token. Default is the current one.
	 * @return bool True on success, false on failure.
	 */
	public function revokeToken( $token = null ) {
		if ( ! $token ) {
			$token = $this->getAccessToken();
		}
		if ( is_array( $token ) ) {
			$token = $token['access_token'];
		}

		$response = wp_remote_get(
			add_query_arg(
				array(
					'client_id' => $this->getClientId(),
					'token'     => $token,
				),
				self::OAUTH2_REVOKE_URI
			)
		);
		if ( is_wp_error( $response ) ) {
			return false;
		}

		return 200 === (int) wp_remote_retrieve_response_code( $response );
	}

	/**
	 * Creates an auth URL for the authentication proxy.
	 *
	 * @since 1.0.0
	 *
	 * @param string|array $scope Optional. One or more scopes. Default is the originally passed scopes.
	 * @return string Auth URL to redirect the user to.
	 */
	public function createAuthUrl( $scope = null ) {
		$url = parent::createAuthUrl( $scope );

		$old_access_token = $this->getAccessToken();
		if ( ! empty( $old_access_token['access_token'] ) ) {
			$url = add_query_arg( 'access_token', $old_access_token['access_token'], $url );
		}

		return $url;
	}

	/**
	 * Creates a Google auth object for the authentication proxy.
	 *
	 * @since 1.0.0
	 */
	protected function createOAuth2Service() {
		$auth = new OAuth2(
			array(
				'clientId'           => $this->getClientId(),
				'clientSecret'       => $this->getClientSecret(),
				'authorizationUri'   => self::OAUTH2_AUTH_URL,
				'tokenCredentialUri' => self::OAUTH2_TOKEN_URI,
				'redirectUri'        => $this->getRedirectUri(),
				'issuer'             => $this->config['client_id'],
				'signingKey'         => $this->config['signing_key'],
				'signingAlgorithm'   => $this->config['signing_algorithm'],
			)
		);

		return $auth;
	}

	/**
	 * Fetches an OAuth 2.0 access token using a given auth object and HTTP handler.
	 *
	 * This method is used in place of {@see OAuth2::fetchAuthToken()}.
	 *
	 * @since 1.0.0
	 *
	 * @param OAuth2        $auth         OAuth2 instance.
	 * @param callable|null $http_handler Optional. HTTP handler callback. Default null.
	 * @return array Access token.
	 *
	 * @throws Google_Proxy_Exception Thrown when proxy returns an error accompanied by a temporary access code.
	 * @throws Exception              Thrown when any other type of error occurs.
	 */
	private function fetchAuthToken( OAuth2 $auth, callable $http_handler = null ) {
		if ( is_null( $http_handler ) ) {
			$http_handler = HttpHandlerFactory::build( HttpClientCache::getHttpClient() );
		}

		$request     = $auth->generateCredentialsRequest();
		$response    = $http_handler( $request );
		$credentials = $auth->parseTokenResponse( $response );
		if ( ! empty( $credentials['error'] ) ) {
			if ( ! empty( $credentials['code'] ) ) {
				throw new Google_Proxy_Exception( $credentials['error'], 0, $credentials['code'] );
			}
			throw new Exception( $credentials['error'] );
		}

		$auth->updateToken( $credentials );

		return $credentials;
	}
}
