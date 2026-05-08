<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication\Clients;

use Google\Site_Kit\Core\Authentication\Clients\OAuth2;
use Google\Site_Kit\Core\Authentication\Exception\Google_OAuth_Exception;
use Google\Site_Kit_Dependencies\Google_Client;
use Google\Site_Kit_Dependencies\Google\Auth\HttpHandler\HttpHandlerFactory;
use Google\Site_Kit_Dependencies\Google\Auth\HttpHandler\HttpClientCache;
use Google\Site_Kit_Dependencies\GuzzleHttp\ClientInterface;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use Google\Site_Kit\Core\Util\URL;
use Exception;
use InvalidArgumentException;
use LogicException;
use WP_User;

/**
 * Extended Google API client with custom functionality for Site Kit.
 *
 * @since 1.2.0
 * @access private
 * @ignore
 */
class Google_Site_Kit_Client extends Google_Client {

	/**
	 * Callback to pass a potential exception to while refreshing an access token.
	 *
	 * @since 1.2.0
	 * @var callable|null
	 */
	protected $token_exception_callback;

	/**
	 * Construct the Google client.
	 *
	 * @since 1.2.0
	 *
	 * @param array $config Client configuration.
	 */
	public function __construct( array $config = array() ) {
		if ( isset( $config['token_exception_callback'] ) ) {
			$this->setTokenExceptionCallback( $config['token_exception_callback'] );
		}

		unset( $config['token_exception_callback'] );

		parent::__construct( $config );
	}

	/**
	 * Sets the function to be called when fetching an access token results in an exception.
	 *
	 * @since 1.2.0
	 *
	 * @param callable $exception_callback Function accepting an exception as single parameter.
	 */
	public function setTokenExceptionCallback( callable $exception_callback ) {
		$this->token_exception_callback = $exception_callback;
	}

	/**
	 * Sets whether or not to return raw requests and returns a callback to reset to the previous value.
	 *
	 * @since 1.2.0
	 *
	 * @param bool $defer Whether or not to return raw requests.
	 * @return callable Callback function that resets to the original $defer value.
	 */
	public function withDefer( $defer ) {
		$orig_defer = $this->shouldDefer();
		$this->setDefer( $defer );

		// Return a function to restore the original refer value.
		return function () use ( $orig_defer ) {
			$this->setDefer( $orig_defer );
		};
	}

	/**
	 * Adds auth listeners to the HTTP client based on the credentials set in the Google API Client object.
	 *
	 * @since 1.2.0
	 *
	 * @param ClientInterface $http The HTTP client object.
	 * @return ClientInterface The HTTP client object.
	 *
	 * @throws Exception Thrown when fetching a new access token via refresh token on-the-fly fails.
	 */
	public function authorize( ?ClientInterface $http = null ) {
		if ( $this->isUsingApplicationDefaultCredentials() ) {
			return parent::authorize( $http );
		}

		$token = $this->getAccessToken();
		if ( isset( $token['refresh_token'] ) && $this->isAccessTokenExpired() ) {
			$callback = $this->getConfig( 'token_callback' );

			try {
				$token_response = $this->fetchAccessTokenWithRefreshToken( $token['refresh_token'] );
				if ( $callback ) {
					// Due to original callback signature this can only accept the token itself.
					call_user_func( $callback, '', $token_response['access_token'] );
				}
			} catch ( Exception $e ) {
				// Pass exception to special callback if provided.
				if ( $this->token_exception_callback ) {
					call_user_func( $this->token_exception_callback, $e );
				}
				throw $e;
			}
		}

		return parent::authorize( $http );
	}

	/**
	 * Fetches an OAuth 2.0 access token by using a temporary code.
	 *
	 * @since 1.0.0
	 * @since 1.2.0 Ported from Google_Site_Kit_Proxy_Client.
	 * @since 1.149.0 Added $code_verifier param for client v2.15.0 compatibility. (@link https://github.com/googleapis/google-api-php-client/commit/bded223ece445a6130cde82417b20180b1d6698a)
	 *
	 * @param string $code          Temporary authorization code, or undelegated token code.
	 * @param string $code_verifier The code verifier used for PKCE (if applicable).
	 *
	 * @return array Access token.
	 *
	 * @throws InvalidArgumentException Thrown when the passed code is empty.
	 */
	public function fetchAccessTokenWithAuthCode( $code, $code_verifier = null ) {
		if ( strlen( $code ) === 0 ) {
			throw new InvalidArgumentException( 'Invalid code' );
		}

		$auth = $this->getOAuth2Service();
		$auth->setCode( $code );
		$auth->setRedirectUri( $this->getRedirectUri() );
		if ( $code_verifier ) {
			$auth->setCodeVerifier( $code_verifier );
		}

		$http_handler = HttpHandlerFactory::build( $this->getHttpClient() );

		$token_response = $this->fetchAuthToken( $auth, $http_handler );
		if ( $token_response && isset( $token_response['access_token'] ) ) {
			$token_response['created'] = time();
			$this->setAccessToken( $token_response );
		}

		return $token_response;
	}

	/**
	 * Fetches a fresh OAuth 2.0 access token by using a refresh token.
	 *
	 * @since 1.0.0
	 * @since 1.2.0 Ported from Google_Site_Kit_Proxy_Client.
	 *
	 * @param string $refresh_token Optional. Refresh token. Unused here.
	 * @param array  $extra_params  Optional. Array of extra parameters to fetch with.
	 * @return array Access token.
	 *
	 * @throws LogicException Thrown when no refresh token is available.
	 */
	public function fetchAccessTokenWithRefreshToken( $refresh_token = null, $extra_params = array() ) {
		if ( null === $refresh_token ) {
			$refresh_token = $this->getRefreshToken();
			if ( ! $refresh_token ) {
				throw new LogicException( 'refresh token must be passed in or set as part of setAccessToken' );
			}
		}

		$this->getLogger()->info( 'OAuth2 access token refresh' );
		$auth = $this->getOAuth2Service();
		$auth->setRefreshToken( $refresh_token );

		$http_handler = HttpHandlerFactory::build( $this->getHttpClient() );

		$token_response = $this->fetchAuthToken( $auth, $http_handler, $extra_params );
		if ( $token_response && isset( $token_response['access_token'] ) ) {
			$token_response['created'] = time();
			if ( ! isset( $token_response['refresh_token'] ) ) {
				$token_response['refresh_token'] = $refresh_token;
			}
			$this->setAccessToken( $token_response );

			/**
			 * Fires when the current user has just been reauthorized to access Google APIs with a refreshed access token.
			 *
			 * In other words, this action fires whenever Site Kit has just obtained a new access token based on
			 * the refresh token for the current user, which typically happens once every hour when using Site Kit,
			 * since that is the lifetime of every access token.
			 *
			 * @since 1.25.0
			 *
			 * @param array $token_response Token response data.
			 */
			do_action( 'googlesitekit_reauthorize_user', $token_response );
		}

		return $token_response;
	}

	/**
	 * Executes deferred HTTP requests.
	 *
	 * @since 1.38.0
	 *
	 * @param RequestInterface $request Request object to execute.
	 * @param string           $expected_class Expected class to return.
	 * @return object An object of the type of the expected class or Psr\Http\Message\ResponseInterface.
	 */
	public function execute( RequestInterface $request, $expected_class = null ) {
		$request = $request->withHeader( 'X-Goog-Quota-User', self::getQuotaUser() );

		return parent::execute( $request, $expected_class );
	}

	/**
	 * Returns a string that uniquely identifies a user of the application.
	 *
	 * @since 1.38.0
	 *
	 * @return string Unique user identifier.
	 */
	public static function getQuotaUser() {
		$user_id = get_current_user_id();
		$url     = get_home_url();

		$scheme = URL::parse( $url, PHP_URL_SCHEME );
		$host   = URL::parse( $url, PHP_URL_HOST );
		$path   = URL::parse( $url, PHP_URL_PATH );

		return "{$scheme}://{$user_id}@{$host}{$path}";
	}

	/**
	 * Fetches an OAuth 2.0 access token using a given auth object and HTTP handler.
	 *
	 * This method is used in place of {@see OAuth2::fetchAuthToken()}.
	 *
	 * @since 1.0.0
	 * @since 1.2.0 Ported from Google_Site_Kit_Proxy_Client.
	 *
	 * @param OAuth2        $auth         OAuth2 instance.
	 * @param callable|null $http_handler Optional. HTTP handler callback. Default null.
	 * @param array         $extra_params Optional. Array of extra parameters to fetch with.
	 * @return array Access token.
	 */
	protected function fetchAuthToken( OAuth2 $auth, ?callable $http_handler = null, $extra_params = array() ) {
		if ( is_null( $http_handler ) ) {
			$http_handler = HttpHandlerFactory::build( HttpClientCache::getHttpClient() );
		}

		$request     = $auth->generateCredentialsRequest( $extra_params );
		$response    = $http_handler( $request );
		$credentials = $auth->parseTokenResponse( $response );
		if ( ! empty( $credentials['error'] ) ) {
			$this->handleAuthTokenErrorResponse( $credentials['error'], $credentials );
		}

		$auth->updateToken( $credentials );

		return $credentials;
	}

	/**
	 * Handles an erroneous response from a request to fetch an auth token.
	 *
	 * @since 1.2.0
	 *
	 * @param string $error Error code / error message.
	 * @param array  $data  Associative array of full response data.
	 *
	 * @throws Google_OAuth_Exception Thrown with the given $error as message.
	 */
	protected function handleAuthTokenErrorResponse( $error, array $data ) {
		throw new Google_OAuth_Exception( $error );
	}

	/**
	 * Create a default Google OAuth2 object.
	 *
	 * @return OAuth2 Created OAuth2 instance.
	 */
	protected function createOAuth2Service() {
		$auth = new OAuth2(
			array(
				'clientId'           => $this->getClientId(),
				'clientSecret'       => $this->getClientSecret(),
				'authorizationUri'   => self::OAUTH2_AUTH_URL,
				'tokenCredentialUri' => self::OAUTH2_TOKEN_URI,
				'redirectUri'        => $this->getRedirectUri(),
				'issuer'             => $this->getConfig( 'client_id' ),
				'signingKey'         => $this->getConfig( 'signing_key' ),
				'signingAlgorithm'   => $this->getConfig( 'signing_algorithm' ),
			)
		);

		return $auth;
	}
}
