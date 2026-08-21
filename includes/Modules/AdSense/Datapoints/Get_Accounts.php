<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\Datapoints\Get_Accounts
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
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Util\Sort;

/**
 * Class for the accounts listing datapoint.
 *
 * @since 1.186.0
 * @access private
 * @ignore
 */
class Get_Accounts extends Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since 1.186.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 */
	public function create_request( Data_Request $data_request ) {
		$service = $this->get_service();
		return $service->accounts->listAccounts();
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
		$accounts = array_filter( $response->getAccounts(), array( $this, 'is_account_not_closed' ) );
		return Sort::case_insensitive_list_sort(
			array_map( array( $this, 'filter_account_with_ids' ), $accounts ),
			'displayName'
		);
	}

	/**
	 * Checks for the state of an Account, whether closed or not.
	 *
	 * @since 1.186.0
	 *
	 * @param object $account Account model.
	 * @return bool Whether the account is not closed.
	 */
	private function is_account_not_closed( $account ) {
		return 'CLOSED' !== $account->getState();
	}

	/**
	 * Parses account ID, adds it to the model object and returns updated model.
	 *
	 * @since 1.186.0
	 *
	 * @param object $account Account model.
	 * @param string $id_key Attribute name that contains account ID.
	 * @return \stdClass Updated model with _id attribute.
	 */
	private function filter_account_with_ids( $account, $id_key = 'name' ) {
		$obj = $account->toSimpleObject();

		$matches = array();
		if ( preg_match( '#accounts/([^/]+)#', $account[ $id_key ], $matches ) ) {
			$obj->_id = $matches[1];
		}

		return $obj;
	}
}
