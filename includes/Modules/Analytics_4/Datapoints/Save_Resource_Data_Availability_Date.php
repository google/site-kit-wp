<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Save_Resource_Data_Availability_Date
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
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Modules\Analytics_4\Resource_Data_Availability_Date;

/**
 * Class for the resource data availability date save datapoint.
 *
 * @since 1.177.0
 * @access private
 * @ignore
 */
class Save_Resource_Data_Availability_Date extends Datapoint implements Executable_Datapoint {

	/**
	 * Resource_Data_Availability_Date instance.
	 *
	 * @since 1.177.0
	 * @var Resource_Data_Availability_Date
	 */
	private $resource_data_availability_date;

	/**
	 * Constructor.
	 *
	 * @since 1.177.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->resource_data_availability_date = $definition['resource_data_availability_date'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.177.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable Closure that saves the resource data availability date.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing.
	 * @throws Invalid_Param_Exception Thrown if a parameter is invalid.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( ! isset( $data_request['resourceType'] ) ) {
			throw new Missing_Required_Param_Exception( 'resourceType' );
		}

		if ( ! isset( $data_request['resourceSlug'] ) ) {
			throw new Missing_Required_Param_Exception( 'resourceSlug' );
		}

		if ( ! isset( $data_request['date'] ) ) {
			throw new Missing_Required_Param_Exception( 'date' );
		}

		if ( ! $this->resource_data_availability_date->is_valid_resource_type( $data_request['resourceType'] ) ) {
			throw new Invalid_Param_Exception( 'resourceType' );
		}

		if ( ! $this->resource_data_availability_date->is_valid_resource_slug( $data_request['resourceSlug'], $data_request['resourceType'] ) ) {
			throw new Invalid_Param_Exception( 'resourceSlug' );
		}

		if ( ! is_int( $data_request['date'] ) ) {
			throw new Invalid_Param_Exception( 'date' );
		}

		return function () use ( $data_request ) {
			return $this->resource_data_availability_date->set_resource_date( $data_request['resourceSlug'], $data_request['resourceType'], $data_request['date'] );
		};
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.177.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed The response without any modifications.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
