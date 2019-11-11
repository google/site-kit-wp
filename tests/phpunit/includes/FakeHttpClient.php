<?php
/**
 * Fake HTTP Client
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit_Dependencies\GuzzleHttp\Client;
use Google\Site_Kit_Dependencies\GuzzleHttp\Message\RequestInterface;
use Google\Site_Kit_Dependencies\GuzzleHttp\Message\Response;

/**
 * Class FakeHttpClient
 */
class FakeHttpClient extends Client {
	/**
	 * Handler function for overriding requests.
	 *
	 * @var callable
	 */
	protected $request_handler;

	/**
	 * Sets the handler for all requests.
	 *
	 * @param callable $handler
	 */
	public function set_request_handler( callable $handler ) {
		$this->request_handler = $handler;
	}

	/**
	 * @param RequestInterface $request
	 *
	 * @return \Google\Site_Kit_Dependencies\GuzzleHttp\Message\ResponseInterface
	 */
	public function send( RequestInterface $request ) {
		if ( $this->request_handler ) {
			return call_user_func( $this->request_handler, $request );
		}

		return new Response( 200 );
	}
}
