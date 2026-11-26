<?php
/**
 * Trait Google\Site_Kit\Tests\Fake_Token_Refresh_Trait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use ArrayObject;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;

/**
 * Trait for signing in a user with a refresh token and answering the refresh with a fake response.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Fake_Token_Refresh_Trait {

	/**
	 * Creates the authentication of the current user, signed in with an access token and a refresh token.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 * @return Authentication Authentication of the current user.
	 */
	protected function create_signed_in_authentication( Context $context ) {
		$authentication = new Authentication( $context );
		$authentication->get_oauth_client()->set_token(
			array(
				'access_token'  => 'test-access-token',
				'refresh_token' => 'test-refresh-token',
			)
		);

		return $authentication;
	}

	/**
	 * Answers the token requests of the given authentication's OAuth client with the given response.
	 *
	 * Any other request, such as revoking the token, gets an empty `200` response.
	 *
	 * @since n.e.x.t
	 *
	 * @param Authentication $authentication Authentication of the current user.
	 * @param int            $status         HTTP status of the token response.
	 * @param array          $body           Body of the token response, encoded as JSON.
	 * @return ArrayObject Every request the OAuth client sends, in order.
	 */
	protected function fake_token_response( Authentication $authentication, $status, array $body ) {
		$requests = new ArrayObject();

		FakeHttp::fake_google_http_handler(
			$authentication->get_oauth_client()->get_client(),
			function ( RequestInterface $request ) use ( $requests, $status, $body ) {
				$requests[] = $request;

				if ( false === strpos( $request->getUri()->getPath(), '/token' ) ) {
					return new FulfilledPromise( new Response( 200 ) );
				}

				return new FulfilledPromise( new Response( $status, array(), wp_json_encode( $body ) ) );
			}
		);

		return $requests;
	}
}
