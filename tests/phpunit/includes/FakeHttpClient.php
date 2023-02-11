<?php
/**
 * Fake HTTP Client
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit_Dependencies\GuzzleHttp\Client;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use Google\Site_Kit_Dependencies\Psr\Http\Message\ResponseInterface;

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
	 * Fake sending an HTTP request.
	 *
	 * @param RequestInterface $request
	 * @param array            $options Request options to apply to the given
	 *                                  request and to the transfer. See \GuzzleHttp\RequestOptions.
	 *
	 * @return ResponseInterface
	 */
	public function send( RequestInterface $request, array $options = array() ) {
		if ( $this->request_handler ) {
			return call_user_func( $this->request_handler, $request );
		}

		return new Response( 200 );
	}
}
