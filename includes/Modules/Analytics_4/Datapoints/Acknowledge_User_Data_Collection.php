<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Acknowledge_User_Data_Collection
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client;
use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_Secret;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit_Dependencies\Google\Service\Exception as Google_Service_Exception;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaAcknowledgeUserDataCollectionRequest;

/**
 * Class for the datapoint that records the user data collection acknowledgement of a property.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Acknowledge_User_Data_Collection extends Datapoint implements Executable_Datapoint {

	/**
	 * Acknowledgement text that the Google Analytics Admin API requires word for word.
	 * It is an API value that users never see, so it is not translated.
	 *
	 * @since n.e.x.t
	 */
	const ACKNOWLEDGEMENT = 'I acknowledge that I have the necessary privacy disclosures and rights from my end users for the collection and processing of their data, including the association of such data with the visitation information Google Analytics collects from my site and/or app property.';

	/**
	 * Analytics 4 settings instance.
	 *
	 * @since n.e.x.t
	 * @var Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		$this->settings = $definition['settings'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable Closure that records the acknowledgement, and returns a WP_Error when Google refuses the request.
	 * @throws Missing_Required_Param_Exception Thrown if the `propertyID` parameter is missing or empty.
	 * @throws Invalid_Param_Exception Thrown if the `propertyID` parameter differs from the connected one.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( empty( $data_request->data['propertyID'] ) ) {
			throw new Missing_Required_Param_Exception( 'propertyID' );
		}

		if ( $data_request->data['propertyID'] !== $this->settings->get()['propertyID'] ) {
			throw new Invalid_Param_Exception( 'propertyID' );
		}

		$request_body = new GoogleAnalyticsAdminV1betaAcknowledgeUserDataCollectionRequest();
		$request_body->setAcknowledgement( self::ACKNOWLEDGEMENT );

		/**
		 * Google Analytics Admin service instance.
		 *
		 * @var GoogleAnalyticsAdmin $service
		 */
		$service = $this->get_service();
		$request = $service->properties->acknowledgeUserDataCollection(
			Analytics_4::normalize_property_id( $data_request->data['propertyID'] ),
			$request_body
		);

		// The closure sends this deferred request, so that a refusal from Google
		// returns the error of `Measurement_Protocol_Secret::exception_to_error()`.
		return function ( Google_Site_Kit_Client $client ) use ( $request ) {
			try {
				return $client->execute( $request );
			} catch ( Google_Service_Exception $error ) {
				return Measurement_Protocol_Secret::exception_to_error( $error );
			}
		};
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return bool Always true, since an error response never reaches this method.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return true;
	}
}
