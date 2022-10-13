<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Clients\OAuth2
 *
 * @package   Google\Site_Kit
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication\Clients;

use Google\Site_Kit_Dependencies\Google\Auth\OAuth2 as Google_Service_OAuth2;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Utils;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Query;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;

/**
 * Class for connecting to Google APIs via OAuth2.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class OAuth2 extends Google_Service_OAuth2 {

	/**
	 * Overrides generateCredentialsRequest with active consumers.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $active_consumers Optional. Array of active consumers.
	 * @return RequestInterface Token credentials request.
	 */
	public function generateCredentialsRequest( $active_consumers = array() ) {
		$request    = parent::generateCredentialsRequest();
		$grant_type = $this->getGrantType();

		if ( 'refresh_token' !== $grant_type ) {
			return $request;
		}

		$params = array_merge(
			Query::parse( Utils::copyToString( $request->getBody() ) ),
			$active_consumers
		);

		return Utils::modifyRequest( $request, $params );
	}
}
