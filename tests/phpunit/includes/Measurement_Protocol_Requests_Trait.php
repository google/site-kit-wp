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

use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_Settings;

trait Measurement_Protocol_Requests_Trait {

	/**
	 * Each request sent, with its URL and its arguments.
	 *
	 * @var array
	 */
	protected $requests = array();

	/**
	 * Keeps each HTTP request in `$requests`, and answers it with a 204 response, so no request leaves the test.
	 */
	protected function capture_requests() {
		$this->requests = array();
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
	 * @return array Request body, decoded.
	 */
	protected function get_sent_body() {
		$this->assertCount( 1, $this->requests, 'One request should be sent.' );

		return json_decode( $this->requests[0]['args']['body'], true );
	}

	/**
	 * Stores the Measurement Protocol secret `test-secret-value` for the property `123456789` and the web data stream `987654321`.
	 *
	 * @param Options $options Options instance.
	 */
	protected function store_measurement_protocol_secret( Options $options ) {
		( new Measurement_Protocol_Settings( new Encrypted_Options( $options ) ) )->set(
			array(
				'secretValue'     => 'test-secret-value',
				'propertyID'      => '123456789',
				'webDataStreamID' => '987654321',
				'secretID'        => 'test-secret-id',
			)
		);
	}
}
