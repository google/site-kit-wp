<?php
/**
 * FakeModule GET/POST Test Request Datapoint
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules\Datapoints;

use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Shareable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;

class FakeModule_Test_Request extends Shareable_Datapoint implements Executable_Datapoint {

	/**
	 * Creates the request object.
	 *
	 * @param Data_Request $data Data request object.
	 *
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data ) {
		$method    = $data->method;
		$datapoint = $data->datapoint;

		do_action( 'googlesitekit_fake_module_data_request', $data );

		return function () use ( $method, $datapoint, $data ) {
			$data = $data->data;
			return json_encode( compact( 'method', 'datapoint', 'data' ) );
		};
	}

	/**
	 * Parses the response.
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data Data request object.
	 *
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return json_decode( $response, $data['asArray'] );
	}
}
