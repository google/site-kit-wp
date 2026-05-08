<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Container_Destinations
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit_Dependencies\Google\Service\TagManager\Destination;
use Google\Site_Kit_Dependencies\Google\Service\TagManager\ListDestinationsResponse;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;

/**
 * Get container destinations datapoint class.
 *
 * @since 1.177.0
 * @access private
 * @ignore
 */
class Get_Container_Destinations extends Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since 1.177.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return RequestInterface|WP_Error Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data ) {
		if ( ! isset( $data['accountID'] ) ) {
			return new WP_Error(
				'missing_required_param',
				/* translators: %s: Missing parameter name */
				sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
				array( 'status' => 400 )
			);
		}
		if ( ! isset( $data['containerID'] ) ) {
			return new WP_Error(
				'missing_required_param',
				/* translators: %s: Missing parameter name */
				sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'containerID' ),
				array( 'status' => 400 )
			);
		}

		return $this->get_service()->accounts_containers_destinations->listAccountsContainersDestinations(
			"accounts/{$data['accountID']}/containers/{$data['containerID']}"
		);
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.177.0
	 *
	 * @param ListDestinationsResponse $response Request response.
	 * @param Data_Request             $data     Data request object.
	 * @return Destination[] Array of destinations linked to the GTM container.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return (array) $response->getDestination();
	}
}
