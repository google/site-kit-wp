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

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\AdSense;
use WP_Error;

/**
 * Class for the ad units listing datapoint.
 *
 * @since 1.186.0
 * @access private
 * @ignore
 */
class Get_Adunits extends Datapoint implements Executable_Datapoint {

	/**
	 * Module settings instance.
	 *
	 * @since 1.186.0
	 * @var Module_Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since 1.186.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		if ( isset( $definition['settings'] ) ) {
			$this->settings = $definition['settings'];
		}
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.186.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data_request ) {
		$account_id = $data_request->data['accountID'] ?? null;
		$client_id  = $data_request->data['clientID'] ?? null;

		if ( ! $account_id || ! $client_id ) {
			$option     = $this->settings->get();
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
	 * @since 1.186.0
	 *
	 * @param mixed        $response API response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed Parsed response.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return array_map( array( $this, 'filter_adunit_with_ids' ), $response->getAdUnits() );
	}

	/**
	 * Parses account, client and ad unit IDs, adds it to the model object and returns updated model.
	 *
	 * @since 1.186.0
	 *
	 * @param object $adunit Ad unit model.
	 * @param string $id_key Attribute name that contains ad unit ID.
	 * @return \stdClass Updated model with _id, _clientID and _accountID attributes.
	 */
	private function filter_adunit_with_ids( $adunit, $id_key = 'name' ) {
		$obj = $adunit->toSimpleObject();

		$matches = array();
		if ( preg_match( '#accounts/([^/]+)/adclients/([^/]+)/adunits/([^/]+)#', $adunit[ $id_key ], $matches ) ) {
			$obj->_id        = $matches[3];
			$obj->_clientID  = $matches[2]; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$obj->_accountID = $matches[1]; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		}

		return $obj;
	}
}
