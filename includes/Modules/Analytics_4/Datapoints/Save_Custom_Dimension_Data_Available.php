<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Save_Custom_Dimension_Data_Available
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
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Modules\Analytics_4\Custom_Dimensions_Data_Available;
use WP_Error;

/**
 * Class for saving custom dimension data availability.
 *
 * @since 1.175.0
 * @access private
 * @ignore
 */
class Save_Custom_Dimension_Data_Available extends Datapoint implements Executable_Datapoint {

	/**
	 * Custom dimensions data available instance.
	 *
	 * @since 1.175.0
	 * @var Custom_Dimensions_Data_Available
	 */
	private $custom_dimensions_data_available;

	/**
	 * Constructor.
	 *
	 * @since 1.175.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->custom_dimensions_data_available = $definition['custom_dimensions_data_available'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.175.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( ! isset( $data_request->data['customDimension'] ) ) {
			throw new Missing_Required_Param_Exception( 'customDimension' );
		}

		$custom_dimension = $data_request->data['customDimension'];

		if ( ! $this->custom_dimensions_data_available->is_valid_custom_dimension( $custom_dimension ) ) {
			return new WP_Error(
				'invalid_custom_dimension_slug',
				/* translators: %s: Invalid custom dimension slug */
				sprintf( __( 'Invalid custom dimension slug: %s.', 'google-site-kit' ), $custom_dimension ),
				array( 'status' => 400 )
			);
		}

		return function () use ( $custom_dimension ) {
			return $this->custom_dimensions_data_available->set_data_available( $custom_dimension );
		};
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.175.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed The original response without any modifications.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
