<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Sync_Custom_Dimensions
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
use Google\Site_Kit\Modules\Analytics_4\Custom_Dimensions_Data_Available;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use WP_Error;

/**
 * Class for syncing custom dimensions.
 *
 * @since 1.175.0
 * @access private
 * @ignore
 */
class Sync_Custom_Dimensions extends Datapoint implements Executable_Datapoint {

	/**
	 * Analytics settings instance.
	 *
	 * @since 1.175.0
	 * @var Settings
	 */
	private $settings;

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
		$this->settings                         = $definition['settings'];
		$this->custom_dimensions_data_available = $definition['custom_dimensions_data_available'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.175.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data_request ) {
		$settings = $this->settings->get();

		if ( empty( $settings['propertyID'] ) ) {
			return new WP_Error(
				'missing_required_setting',
				__( 'No connected Google Analytics property ID.', 'google-site-kit' ),
				array( 'status' => 500 )
			);
		}

		return $this->get_service()
			->properties_customDimensions // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			->listPropertiesCustomDimensions( Analytics_4::normalize_property_id( $settings['propertyID'] ) );
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.175.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed Parsed response data.
	 */
	public function parse_response( $response, Data_Request $data ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$custom_dimensions   = wp_list_pluck( $response->getCustomDimensions(), 'parameterName' );
		$matching_dimensions = array_values(
			array_filter(
				$custom_dimensions,
				function ( $dimension ) {
					return strpos( $dimension, 'googlesitekit_' ) === 0;
				}
			)
		);

		$this->settings->merge(
			array(
				'availableCustomDimensions' => $matching_dimensions,
			)
		);

		$missing_custom_dimensions_with_data_available = array_diff(
			array_keys(
				array_filter( $this->custom_dimensions_data_available->get_data_availability() )
			),
			$matching_dimensions
		);

		if ( count( $missing_custom_dimensions_with_data_available ) > 0 ) {
			$this->custom_dimensions_data_available->reset_data_available(
				$missing_custom_dimensions_with_data_available
			);
		}

		return $matching_dimensions;
	}
}
