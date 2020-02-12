<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Proxy_Client
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication\Clients;

use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Exception\Google_Proxy_Code_Exception;
use Google\Site_Kit_Dependencies\Google\Auth\OAuth2;
use Google\Site_Kit_Dependencies\Google\Auth\HttpHandler\HttpHandlerFactory;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Exception;

/**
 * Modified Google Site Kit API client relying on the authentication proxy.
 *
 * @since 1.0.0
 * @since 1.2.0 Renamed to Google_Site_Kit_Proxy_Client.
 * @access private
 * @ignore
 */
class Google_Site_Kit_Proxy_Client extends Google_Site_Kit_Client {

	/**
	 * Base URL to the proxy.
	 *
	 * @since 1.1.2
	 * @var string
	 */
	protected $proxy_base_path = Google_Proxy::BASE_URL;

	/**
	 * Construct the Google client.
	 *
	 * @since 1.1.2
	 *
	 * @param array $config Proxy client configuration.
	 */
	public function __construct( array $config = array() ) {
		if ( ! empty( $config['proxy_base_path'] ) ) {
			$this->setProxyBasePath( $config['proxy_base_path'] );
		}

		unset( $config['proxy_base_path'] );

		parent::__construct( $config );
	}

	/**
	 * Sets the base URL to the proxy.
	 *
	 * @since 1.2.0
	 *
	 * @param string $base_path Proxy base URL.
	 */
	public function setProxyBasePath( $base_path ) {
		$this->proxy_base_path = untrailingslashit( $base_path );
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

		$body    = Psr7\stream_for(
			http_build_query(
				array(
					'client_id' => $this->getClientId(),
					'token'     => $token,
				)
			)
		);
		$request = new Request(
			'POST',
			$this->proxy_base_path . Google_Proxy::OAUTH2_REVOKE_URI,
			array(
				'Cache-Control' => 'no-store',
				'Content-Type'  => 'application/x-www-form-urlencoded',
			),
			$body
		);

		$http_handler = HttpHandlerFactory::build( $this->getHttpClient() );

		$response = $http_handler( $request );

		return 200 === (int) $response->getStatusCode();
	}

	/**
	 * Creates a Google auth object for the authentication proxy.
	 *
	 * @since 1.0.0
	 */
	protected function createOAuth2Service() {
		return new OAuth2(
			array(
				'clientId'           => $this->getClientId(),
				'clientSecret'       => $this->getClientSecret(),
				'authorizationUri'   => $this->proxy_base_path . Google_Proxy::OAUTH2_AUTH_URI,
				'tokenCredentialUri' => $this->proxy_base_path . Google_Proxy::OAUTH2_TOKEN_URI,
				'redirectUri'        => $this->getRedirectUri(),
				'issuer'             => $this->getClientId(),
				'signingKey'         => null,
				'signingAlgorithm'   => null,
			)
		);
	}



	/**
	 * Handles an erroneous response from a request to fetch an auth token.
	 *
	 * @since 1.2.0
	 *
	 * @param string $error Error code / error message.
	 * @param array  $data  Associative array of full response data.
	 *
	 * @throws Google_Proxy_Code_Exception Thrown when proxy returns an error accompanied by a temporary access code.
	 */
	protected function handleAuthTokenErrorResponse( $error, array $data ) {
		if ( ! empty( $data['code'] ) ) {
			throw new Google_Proxy_Code_Exception( $error, 0, $data['code'] );
		}
		parent::handleAuthTokenErrorResponse( $error, $data );
	}
}
