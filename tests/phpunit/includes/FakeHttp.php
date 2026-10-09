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
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;

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
	public static function fake_google_http_handler( Google_Client $google_client, ?callable $handler = null ) {
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

	/**
	 * Creates the response to a Google API batch request, with one part for each
	 * request in the batch.
	 *
	 * @since n.e.x.t
	 *
	 * @param RequestInterface $request              The batch request.
	 * @param callable         $create_part_response Creates the response to one request in the batch. Called with
	 *                                               the request's `Content-ID`, and returns a `ResponseInterface`.
	 * @return Response The multipart response, in the shape `Google\Http\Batch` parses.
	 */
	public static function create_batch_response( RequestInterface $request, callable $create_part_response ) {
		preg_match( '/boundary=([^;]+)/', $request->getHeaderLine( 'Content-Type' ), $boundary_matches );
		preg_match_all( '/Content-ID:\s*(.+)/i', (string) $request->getBody(), $content_id_matches );

		$boundary = trim( $boundary_matches[1] );
		$body     = '';

		foreach ( array_map( 'trim', $content_id_matches[1] ) as $content_id ) {
			$part_response = $create_part_response( $content_id );

			$body .= "--{$boundary}\r\n";
			$body .= "Content-Type: application/http\r\n";
			$body .= "Content-ID: {$content_id}\r\n\r\n";
			$body .= "HTTP/1.1 {$part_response->getStatusCode()} {$part_response->getReasonPhrase()}\r\n";
			$body .= "Content-Type: application/json; charset=UTF-8\r\n\r\n";
			$body .= $part_response->getBody() . "\r\n";
		}

		$body .= "--{$boundary}--";

		return new Response(
			200,
			array( 'Content-Type' => "multipart/mixed; boundary={$boundary}" ),
			$body
		);
	}
}
