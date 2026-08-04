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

use Google\Site_Kit\Modules\AdSense\Datapoints\AdSense_Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;

/**
 * Class for the accounts listing datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Accounts extends AdSense_Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @param mixed        $response API response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed Parsed response.
	 */
	public function parse_response( $response, Data_Request $data ) {
		$accounts = array_filter( $response->getAccounts(), array( $this->get_module(), 'is_account_not_closed' ) );
		return \Google\Site_Kit\Core\Util\Sort::case_insensitive_list_sort(
			array_map( array( $this->get_module(), 'filter_account_with_ids' ), $accounts ),
			'displayName'
		);
	}
}
