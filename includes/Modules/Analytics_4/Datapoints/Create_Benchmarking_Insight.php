<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Create_Benchmarking_Insight
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Insight_Payload;

/**
 * Class for the `POST:benchmarking-insight` datapoint, which asks the Site Kit
 * service for the generated benchmarking insight.
 *
 * It takes the signed `payload` that `GET:benchmarking-data` built, checks
 * that this site built it for the current user, and forwards the request it
 * holds to the service, which generates the insight in the background. The
 * request is a `POST` because the payload can be longer than a server or a
 * firewall allows in a query string.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Create_Benchmarking_Insight extends Benchmarking_Insight_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable Closure that asks the service for the insight. It returns the insight as `insight` when the service had one in its cache, the ID of the operation that generates it as `operationID` otherwise, or an error.
	 * @throws Missing_Required_Param_Exception Thrown when `payload` is missing.
	 * @throws Invalid_Param_Exception Thrown when `payload` isn't one this site built for the current user.
	 */
	public function create_request( Data_Request $data_request ) {
		$payload = $data_request['payload'];

		if ( empty( $payload ) ) {
			throw new Missing_Required_Param_Exception( 'payload' );
		}

		// The payload makes a trip through the browser, so a payload the user
		// wrote, rather than one the site built, never reaches the model.
		$decoded_payload = Insight_Payload::decode( $payload, get_current_user_id() );

		if ( null === $decoded_payload ) {
			throw new Invalid_Param_Exception( 'payload' );
		}

		return function ( $client ) use ( $decoded_payload ) {
			$access_token = $this->get_access_token( $client );

			if ( is_wp_error( $access_token ) ) {
				return $access_token;
			}

			$response = $this->google_proxy->send_benchmarking_insight_request(
				$this->credentials,
				$access_token,
				$decoded_payload['request'],
				$decoded_payload['locale']
			);

			if ( is_wp_error( $response ) ) {
				return $this->get_error( $response );
			}

			// The service answers from its cache with the insight, when it
			// generated one for the same request in the last day, and with the
			// operation that generates it otherwise.
			if ( ! empty( $response['operation_id'] ) && is_string( $response['operation_id'] ) ) {
				return array( 'operationID' => $response['operation_id'] );
			}

			$insight = $this->get_insight( $response );

			if ( null === $insight ) {
				return $this->get_invalid_response_error();
			}

			return array( 'insight' => $insight );
		};
	}
}
