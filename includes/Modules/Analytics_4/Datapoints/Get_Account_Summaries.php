<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Account_Summaries
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
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListAccountSummariesResponse;

/**
 * Class for the account summaries listing datapoint.
 *
 * @since 1.178.0
 * @access private
 * @ignore
 */
class Get_Account_Summaries extends Datapoint implements Executable_Datapoint {

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

		return $service
			->accountSummaries // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			->listAccountSummaries(
				array(
					'pageSize'  => 200,
					'pageToken' => $data_request['pageToken'],
				)
			);
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.178.0
	 *
	 * @param GoogleAnalyticsAdminV1betaListAccountSummariesResponse $response List account summaries API response.
	 * @param Data_Request                                           $data     Data request object.
	 * @return GoogleAnalyticsAdminV1betaListAccountSummariesResponse
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
