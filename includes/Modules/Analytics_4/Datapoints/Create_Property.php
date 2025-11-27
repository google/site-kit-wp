<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Create_Property
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
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProperty as Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1betaProperty;
use stdClass;

/**
 * Class for the property creation datapoint.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Create_Property extends Datapoint implements Executable_Datapoint {

	/**
	 * Reference site URL.
	 *
	 * @since 1.167.0
	 * @var string
	 */
	private $reference_site_url;

	/**
	 * Constructor.
	 *
	 * @since 1.167.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->reference_site_url = $definition['reference_site_url'];
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
		if ( ! isset( $data_request->data['accountID'] ) ) {
			throw new Missing_Required_Param_Exception( 'accountID' );
		}

		if ( ! empty( $data_request->data['displayName'] ) ) {
			$display_name = sanitize_text_field( $data_request->data['displayName'] );
		} else {
			$display_name = URL::parse( $this->reference_site_url, PHP_URL_HOST );
		}

		if ( ! empty( $data_request->data['timezone'] ) ) {
			$timezone = $data_request->data['timezone'];
		} else {
			$timezone = get_option( 'timezone_string' ) ?: 'UTC';
		}

		$property = new Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1betaProperty();
		$property->setParent( Analytics_4::normalize_account_id( $data_request->data['accountID'] ) );
		$property->setDisplayName( $display_name );
		$property->setTimeZone( $timezone );

		return $this->get_service()->properties->create( $property );
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.167.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data Data request object.
	 * @return stdClass Updated model with _id and _accountID attributes.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return Analytics_4::filter_property_with_ids( $response );
	}
}
