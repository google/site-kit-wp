<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\Datapoints\Get_Clients
 *
 * @package   Google\Site_Kit\Modules\AdSense\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

namespace Google\Site_Kit\Modules\AdSense\Datapoints;

use GoogleSite_KitModulesAdSenseDatapointsAdSense_Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\AdSense;
use WP_Error;

/**
 * Class for the clients listing datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Clients extends AdSense_Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( ! isset( $data_request->data['accountID'] ) ) {
			return new WP_Error(
				'missing_required_param',
				/* translators: %s: Missing parameter name */
				sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ),
				array( 'status' => 400 )
			);
		}

		$service = $this->get_service();
		return $service->accounts_adclients->listAccountsAdclients( AdSense::normalize_account_id( $data_request->data['accountID'] ) );
	}
	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response API response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed Parsed response.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return array_map( array( $this->get_module(), 'filter_client_with_ids' ), $response->getAdClients() );
	}
}
