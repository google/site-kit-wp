<?php
/**
 * Trait Google\Site_Kit\Tests\Measurement_Protocol_Requests_Trait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

/**
 * Trait for recording the Measurement Protocol requests a test sends.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Measurement_Protocol_Requests_Trait {

	/**
	 * Each request sent, with its URL and its arguments.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	protected $requests = array();

	/**
	 * Records each request in `$requests`, and answers it with a 204 response, so no request leaves the test.
	 *
	 * @since n.e.x.t
	 */
	protected function capture_requests() {
		$this->subscribe_to_wp_http_requests(
			function ( $url, $args ) {
				$this->requests[] = array(
					'url'  => $url,
					'args' => $args,
				);
			},
			array(
				'headers'  => array(),
				'body'     => '',
				'response' => array( 'code' => 204 ),
			)
		);
	}

	/**
	 * Gets the body of the one request sent.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Request body, decoded.
	 */
	protected function get_sent_body() {
		$this->assertCount( 1, $this->requests, 'One request should be sent.' );

		return json_decode( $this->requests[0]['args']['body'], true );
	}
}
