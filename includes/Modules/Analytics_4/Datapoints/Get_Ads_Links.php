<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Ads_Links
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaGoogleAdsLink;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListGoogleAdsLinksResponse;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;

/**
 * Get Ads links datapoint class.
 *
 * @since 1.177.0
 * @access private
 * @ignore
 */
class Get_Ads_Links extends Datapoint implements Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since 1.177.0
	 *
	 * @param Data_Request $data Data request object.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing.
	 * @return RequestInterface Request object.
	 */
	public function create_request( Data_Request $data ) {
		if ( empty( $data['propertyID'] ) ) {
			throw new Missing_Required_Param_Exception( 'propertyID' );
		}

		$parent = Analytics_4::normalize_property_id( $data['propertyID'] );

		return $this->get_service()->properties_googleAdsLinks->listPropertiesGoogleAdsLinks( $parent );
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.177.0
	 *
	 * @param GoogleAnalyticsAdminV1betaListGoogleAdsLinksResponse $response Request response.
	 * @param Data_Request                                         $data Data request object.
	 * @return GoogleAnalyticsAdminV1betaGoogleAdsLink[] Array of Google ads links.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return (array) $response->getGoogleAdsLinks();
	}
}
