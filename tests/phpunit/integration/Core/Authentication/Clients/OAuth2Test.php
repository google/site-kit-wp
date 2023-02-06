<?php
/**
 * OAuth2Test.php
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication\Clients
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication\Clients;

use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Utils;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Query;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Authentication
 */
class OAuth2Test extends TestCase {

	/**
	 * Parse request body stream.
	 *
	 * @param RequestInterface $request The request to parse body for.
	 * @return array The parsed body.
	 */
	private static function get_parsed_request_body( $request ) {
		return Query::parse( Utils::copyToString( $request->getBody() ) );
	}

	public function test_generateCredentialsRequest() {
		$client = new Google_Site_Kit_Client();
		$auth   = $client->getOAuth2Service();

		// Request with no params should have an empty body.
		$request = $auth->generateCredentialsRequest();
		$this->assertEquals( array(), self::get_parsed_request_body( $request ) );

		// Request with params should also have an empty body, unless a refresh token is set.
		$extra_params = array( 'active_consumers' => '1:a,b,c 2:x,y,z' );
		$request      = $auth->generateCredentialsRequest( $extra_params );
		$this->assertEquals( array(), self::get_parsed_request_body( $request ) );

		// Request with refresh token and params should have them in the body accordingly.
		$refresh_token = 'test-refresh-token';
		$auth->setRefreshToken( $refresh_token );
		$request = $auth->generateCredentialsRequest( $extra_params );
		$this->assertEquals(
			array_merge(
				array(
					'grant_type'    => 'refresh_token',
					'refresh_token' => $refresh_token,
				),
				$extra_params
			),
			self::get_parsed_request_body( $request )
		);
	}
}
