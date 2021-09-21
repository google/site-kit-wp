<?php
/**
 * Interface Google\Site_Kit\Core\Google_API\Google_API
 *
 * @package   Google\Site_Kit\Core\Google_API
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Google_API;

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\DI\DI_Aware_Interface;
use Google\Site_Kit\Core\DI\DI_Aware_Trait;
use Google\Site_Kit\Core\DI\DI_Services_Aware_Trait;
use Google\Site_Kit\Core\REST_API\Data_Request;
use WP_Error;

/**
 * Base class for Google services APIs.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 *
 * @property-read Context        $context        Plugin context.
 * @property-read Authentication $authentication Authentication instance.
 */
abstract class Google_API implements DI_Aware_Interface {

	use DI_Aware_Trait, DI_Services_Aware_Trait;

	/**
	 * Fetches Google service API.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $params API request parameters.
	 * @return mixed API response.
	 */
	abstract public function fetch( array $params = array() );

	/**
	 * Validates request data, returns WP_Error instance if data is invalid.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data Request data.
	 * @return WP_Error|null NULL if request data is valid, otherwise an instance of WP_Error class.
	 */
	public function validate_request_data( Data_Request $data ) {
		return null;
	}

	/**
	 * Parses request data and returns prepared arguments for the Google API call.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data Request data.
	 * @return array Arguments for the Google API call.
	 */
	public function parse_request_data( Data_Request $data ) {
		return array();
	}

}
