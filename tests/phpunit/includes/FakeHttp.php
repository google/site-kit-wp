<?php
/**
 * Fake HTTP helper class.
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit_Dependencies\Google\Client as Google_Client;
use Google\Site_Kit_Dependencies\GuzzleHttp\Client;
use Google\Site_Kit_Dependencies\GuzzleHttp\HandlerStack;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

class FakeHttp {

	/**
	 * Replaces the configured HTTP client with one that is overridden with the given handler.
	 *
	 * @param Google_Client $google_client Google\Client instance to modify.
	 * @param callable|null $handler       Optional. HTTP handler each request will be handled by. Default 200/success.
	 *                                     Called with (RequestInterface, array $options)
	 *
	 * @see \Google\Site_Kit_Dependencies\GuzzleHttp\HandlerStack::__invoke
	 */
	public static function fake_google_http_handler( Google_Client $google_client, callable $handler = null ) {
		$config = $google_client->getHttpClient()->getConfig();

		// The given handler technically only needs to be a callable,
		// however it is expected to be a HandlerStack in some places (e.g. Guzzle6AuthHandler::attachToken)
		// so we wrap it here.
		$config['handler'] = HandlerStack::create(
			$handler ?: function () {
				return new FulfilledPromise( new Response( 200 ) );
			}
		);
		// The default stack includes support for redirects which will fail if response is not a Promise.
		$config['handler']->remove( 'allow_redirects' );

		$google_client->setHttpClient(
			new Client( $config )
		);
	}
}
