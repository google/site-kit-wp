<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Sync_Audiences
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Shareable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Audience_Utilities;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use WP_Error;

/**
 * Class for syncing audiences.
 *
 * @since 1.177.0
 * @access private
 * @ignore
 */
class Sync_Audiences extends Shareable_Datapoint implements Executable_Datapoint {

	/**
	 * Authentication instance.
	 *
	 * @since 1.177.0
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Analytics settings instance.
	 *
	 * @since 1.177.0
	 * @var Settings
	 */
	private $settings;

	/**
	 * Audience utilities instance.
	 *
	 * @since 1.177.0
	 * @var Audience_Utilities
	 */
	private $audience_utilities;

	/**
	 * Constructor.
	 *
	 * @since 1.177.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->authentication     = $definition['authentication'];
		$this->settings           = $definition['settings'];
		$this->audience_utilities = $definition['audience_utilities'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.177.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( ! $this->authentication->is_authenticated() ) {
			return new WP_Error(
				'forbidden',
				__( 'User must be authenticated to sync audiences.', 'google-site-kit' ),
				array( 'status' => 403 )
			);
		}

		$settings = $this->settings->get();
		if ( empty( $settings['propertyID'] ) ) {
			return new WP_Error(
				'missing_required_setting',
				__( 'No connected Google Analytics property ID.', 'google-site-kit' ),
				array( 'status' => 500 )
			);
		}

		$property_id = Analytics_4::normalize_property_id( $settings['propertyID'] );

		return $this->get_service()
			->properties_audiences
			->listPropertiesAudiences( $property_id );
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.177.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed Parsed response data.
	 */
	public function parse_response( $response, Data_Request $data ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $this->audience_utilities->set_available_audiences( $response->getAudiences() );
	}
}
