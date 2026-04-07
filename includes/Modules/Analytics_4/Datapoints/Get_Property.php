<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Property
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
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProperty;
use stdClass;
use WP_Error;

/**
 * Class for the single property retrieval datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Property extends Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( ! isset( $data_request->data['propertyID'] ) ) {
			return new WP_Error(
				'missing_required_param',
				/* translators: %s: Missing parameter name */
				sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'propertyID' ),
				array( 'status' => 400 )
			);
		}

		/**
		 * Google Analytics Admin service instance.
		 *
		 * @var GoogleAnalyticsAdmin $service
		 */
		$service = $this->get_service();

		return $service->properties->get(
			Analytics_4::normalize_property_id( $data_request->data['propertyID'] )
		);
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param GoogleAnalyticsAdminV1betaProperty $response Property resource from the Admin API.
	 * @param Data_Request                       $data     Data request object.
	 * @return stdClass Updated model with _id and _accountID attributes.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return Analytics_4::filter_property_with_ids( $response );
	}
}
