<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Create_Measurement_Protocol_Secret
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
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_Secret;
use Google\Site_Kit\Modules\Analytics_4\Settings;

/**
 * Class for the datapoint that stores a Measurement Protocol secret for the connected web data stream.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Create_Measurement_Protocol_Secret extends Datapoint implements Executable_Datapoint {

	/**
	 * Analytics 4 settings instance.
	 *
	 * @since n.e.x.t
	 * @var Settings
	 */
	private $settings;

	/**
	 * Measurement_Protocol_Secret instance.
	 *
	 * @since n.e.x.t
	 * @var Measurement_Protocol_Secret
	 */
	private $measurement_protocol_secret;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		$this->settings                    = $definition['settings'];
		$this->measurement_protocol_secret = $definition['measurement_protocol_secret'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable Closure that stores the secret, and returns a WP_Error when it is not stored.
	 * @throws Missing_Required_Param_Exception Thrown if the `propertyID` or `webDataStreamID` parameter is missing or empty.
	 * @throws Invalid_Param_Exception Thrown if the `propertyID` or `webDataStreamID` parameter differs from the connected one.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( empty( $data_request->data['propertyID'] ) ) {
			throw new Missing_Required_Param_Exception( 'propertyID' );
		}

		if ( empty( $data_request->data['webDataStreamID'] ) ) {
			throw new Missing_Required_Param_Exception( 'webDataStreamID' );
		}

		$settings = $this->settings->get();

		if ( $data_request->data['propertyID'] !== $settings['propertyID'] ) {
			throw new Invalid_Param_Exception( 'propertyID' );
		}

		if ( $data_request->data['webDataStreamID'] !== $settings['webDataStreamID'] ) {
			throw new Invalid_Param_Exception( 'webDataStreamID' );
		}

		return function ( Google_Site_Kit_Client $client ) {
			// `execute_data_request()` turns client defer on, while `create()` needs the responses of its requests.
			$restore_defer = $client->withDefer( false );

			try {
				return $this->measurement_protocol_secret->create();
			} finally {
				$restore_defer();
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
	 * @return array The `measurementProtocolSecretID` setting, without the secret value.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return array(
			'measurementProtocolSecretID' => $this->settings->get()['measurementProtocolSecretID'],
		);
	}
}
