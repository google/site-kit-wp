<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Accounts
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
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListAccountsResponse;

/**
 * Class for the accounts listing datapoint.
 *
 * @since 1.178.0
 * @access private
 * @ignore
 */
class Get_Accounts extends Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since 1.178.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 */
	public function create_request( Data_Request $data_request ) {
		/**
		 * Google Analytics Admin service instance.
		 *
		 * @var GoogleAnalyticsAdmin $service
		 */
		$service = $this->get_service();

		return $service->accounts->listAccounts();
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.178.0
	 *
	 * @param GoogleAnalyticsAdminV1betaListAccountsResponse $response List accounts API response.
	 * @param Data_Request                                   $data     Data request object.
	 * @return array
	 */
	public function parse_response( $response, Data_Request $data ) {
		return array_map( array( Analytics_4::class, 'filter_account_with_ids' ), $response->getAccounts() );
	}
}
