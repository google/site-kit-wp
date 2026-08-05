<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\Get_Terms_Of_ServiceTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Get_Terms_Of_Service;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Get_Terms_Of_ServiceTest extends TestCase {

	/**
	 * Get Terms of Service datapoint.
	 *
	 * @var Get_Terms_Of_Service
	 */
	private $datapoint;

	public function set_up() {
		parent::set_up();

		$this->datapoint = new Get_Terms_Of_Service( array() );
	}

	public function test_create_request_and_parse_response() {
		$tos_url  = 'https://example.com/terms';
		$tos_html = '<h1>Terms of Service</h1>';

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $tos_url, $tos_html ) {
				if ( $tos_url !== $url ) {
					return $preempt;
				}

				return array(
					'body'     => $tos_html,
					'headers'  => array(),
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'cookies'  => array(),
					'filename' => null,
				);
			},
			10,
			3
		);

		$data_request = $this->get_data_request( array( 'tosURL' => $tos_url ) );
		$request      = $this->datapoint->create_request( $data_request );
		$response     = $request();

		$this->assertSame(
			$tos_html,
			$this->datapoint->parse_response( $response, $data_request ),
			'The datapoint should return the Terms of Service HTML.'
		);
	}

	public function test_create_request__requires_tos_url() {
		$this->expectException( Missing_Required_Param_Exception::class );
		$this->expectExceptionMessage( 'Request parameter is empty: tosURL.' );

		$this->datapoint->create_request( $this->get_data_request( array() ) );
	}

	public function test_create_request__returns_error_for_unsuccessful_response() {
		$tos_url = 'https://example.com/terms';

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $tos_url ) {
				if ( $tos_url !== $url ) {
					return $preempt;
				}

				return array(
					'body'     => 'Not found',
					'headers'  => array(),
					'response' => array(
						'code'    => 404,
						'message' => 'Not Found',
					),
					'cookies'  => array(),
					'filename' => null,
				);
			},
			10,
			3
		);

		$request  = $this->datapoint->create_request( $this->get_data_request( array( 'tosURL' => $tos_url ) ) );
		$response = $request();

		$this->assertWPError( $response );
		$this->assertSame( 'terms_of_service_request_failed', $response->get_error_code(), 'The response should use the expected error code.' );
		$this->assertSame( 404, $response->get_error_data()['status'], 'The upstream response status should be preserved.' );
	}

	private function get_data_request( array $data ) {
		return new Data_Request( 'GET', 'modules', 'reader-revenue-manager', 'terms-of-service', $data );
	}
}
