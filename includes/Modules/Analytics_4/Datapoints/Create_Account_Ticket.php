<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Create_Account_Ticket
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Account_Ticket;
use Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin\Proxy_GoogleAnalyticsAdminProvisionAccountTicketRequest;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaAccount;

/**
 * Class for the account ticket creation datapoint.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Create_Account_Ticket extends Datapoint implements Executable_Datapoint {

	/**
	 * Credentials array.
	 *
	 * @since 1.167.0
	 * @var array
	 */
	private $credentials;

	/**
	 * Provisioning redirect URI.
	 *
	 * @since 1.167.0
	 * @var string
	 */
	private $provisioning_redirect_uri;

	/**
	 * Constructor.
	 *
	 * @since 1.167.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->credentials               = $definition['credentials'];
		$this->provisioning_redirect_uri = $definition['provisioning_redirect_uri'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.167.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing or empty.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( empty( $data_request->data['displayName'] ) ) {
			throw new Missing_Required_Param_Exception( 'displayName' );
		}
		if ( empty( $data_request->data['regionCode'] ) ) {
			throw new Missing_Required_Param_Exception( 'regionCode' );
		}
		if ( empty( $data_request->data['propertyName'] ) ) {
			throw new Missing_Required_Param_Exception( 'propertyName' );
		}
		if ( empty( $data_request->data['dataStreamName'] ) ) {
			throw new Missing_Required_Param_Exception( 'dataStreamName' );
		}
		if ( empty( $data_request->data['timezone'] ) ) {
			throw new Missing_Required_Param_Exception( 'timezone' );
		}

		$account = new GoogleAnalyticsAdminV1betaAccount();
		$account->setDisplayName( $data_request->data['displayName'] );
		$account->setRegionCode( $data_request->data['regionCode'] );

		$redirect_uri = $this->provisioning_redirect_uri;

		// Add `show_progress` query parameter if the feature flag is enabled
		// and `showProgress` is set and truthy.
		if (
			Feature_Flags::enabled( 'setupFlowRefresh' ) &&
			! empty( $data_request->data['showProgress'] )
		) {
			$redirect_uri = add_query_arg( 'show_progress', 1, $redirect_uri );
		}

		$account_ticket_request = new Proxy_GoogleAnalyticsAdminProvisionAccountTicketRequest();
		$account_ticket_request->setSiteId( $this->credentials['oauth2_client_id'] );
		$account_ticket_request->setSiteSecret( $this->credentials['oauth2_client_secret'] );
		$account_ticket_request->setRedirectUri( $redirect_uri );
		$account_ticket_request->setAccount( $account );

		return $this->get_service()->accounts
			->provisionAccountTicket( $account_ticket_request );
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.167.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data Data request object.
	 * @return mixed The original response without any modifications.
	 */
	public function parse_response( $response, Data_Request $data ) {
		$account_ticket = new Account_Ticket();
		$account_ticket->set_id( $response->getAccountTicketId() );
		// Required in create_data_request.
		$account_ticket->set_property_name( $data['propertyName'] );
		$account_ticket->set_data_stream_name( $data['dataStreamName'] );
		$account_ticket->set_timezone( $data['timezone'] );
		$account_ticket->set_enhanced_measurement_stream_enabled( ! empty( $data['enhancedMeasurementStreamEnabled'] ) );
		// Cache the create ticket id long enough to verify it upon completion of the terms of service.
		set_transient(
			Analytics_4::PROVISION_ACCOUNT_TICKET_ID . '::' . get_current_user_id(),
			$account_ticket->to_array(),
			15 * MINUTE_IN_SECONDS
		);

		return $response;
	}
}
