<?php
/**
 * Measurement_Protocol_Requests_Trait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

trait Measurement_Protocol_Requests_Trait {

	/**
	 * Each request sent, with its URL and its arguments.
	 *
	 * @var array
	 */
	protected $requests = array();

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
