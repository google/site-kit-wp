<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Create_Audience
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
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdminV1alpha\GoogleAnalyticsAdminV1alphaAudience;
use WP_Error;

/**
 * Class for the audience creation datapoint.
 *
 * @since 1.177.0
 * @access private
 * @ignore
 */
class Create_Audience extends Datapoint implements Executable_Datapoint {

	/**
	 * Analytics settings instance.
	 *
	 * @since 1.177.0
	 * @var Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since 1.177.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->settings = $definition['settings'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.177.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing.
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

		if ( ! isset( $data_request['audience'] ) ) {
			throw new Missing_Required_Param_Exception( 'audience' );
		}

		$property_id = $settings['propertyID'];
		$audience    = $data_request['audience'];

		$fields = array(
			'displayName',
			'description',
			'membershipDurationDays',
			'eventTrigger',
			'exclusionDurationMode',
			'filterClauses',
		);

		$invalid_keys = array_diff( array_keys( $audience ), $fields );

		if ( ! empty( $invalid_keys ) ) {
			return new WP_Error(
				'invalid_property_name',
				/* translators: %s: Invalid property names */
				sprintf( __( 'Invalid properties in audience: %s.', 'google-site-kit' ), implode( ', ', $invalid_keys ) ),
				array( 'status' => 400 )
			);
		}

		$property_id = Analytics_4::normalize_property_id( $property_id );

		$post_body = new GoogleAnalyticsAdminV1alphaAudience( $audience );

		return $this->get_service()
			->properties_audiences
			->create(
				$property_id,
				$post_body
			);
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
