<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\Datapoints\Get_Adunits
 *
 * @package   Google\Site_Kit\Modules\AdSense\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

namespace Google\Site_Kit\Modules\AdSense\Datapoints;

use Google\Site_Kit\Modules\AdSense\Datapoints\AdSense_Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\AdSense;
use WP_Error;

/**
 * Class for the ad units listing datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Adunits extends AdSense_Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data_request ) {
		$account_id = $data_request->data['accountID'] ?? null;
		$client_id  = $data_request->data['clientID'] ?? null;

		if ( ! $account_id || ! $client_id ) {
			$option     = $this->get_module()->get_settings()->get();
			$account_id = $account_id ?? $option['accountID'];
			if ( empty( $account_id ) ) {
				/* translators: %s: Missing parameter name */
				return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ), array( 'status' => 400 ) );
			}
			$client_id = $client_id ?? $option['clientID'];
			if ( empty( $client_id ) ) {
				/* translators: %s: Missing parameter name */
				return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'clientID' ), array( 'status' => 400 ) );
			}
		}

		$service = $this->get_service();
		return $service->accounts_adclients_adunits->listAccountsAdclientsAdunits( AdSense::normalize_client_id( $account_id, $client_id ) );
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
		return array_map( array( $this->get_module(), 'filter_adunit_with_ids' ), $response->getAdUnits() );
	}
}
