<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Key_Events
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Shareable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaKeyEvent;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use WP_Error;

/**
 * Get key events datapoint class.
 *
 * @since 1.177.0
 * @access private
 * @ignore
 */
class Get_Key_Events extends Shareable_Datapoint implements Executable_Datapoint {

	/**
	 * Module settings instance.
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
	 * @param Data_Request $data Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data ) {
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
			->properties_keyEvents // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			->listPropertiesKeyEvents( $property_id );
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.177.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data Data request object.
	 * @return GoogleAnalyticsAdminV1betaKeyEvent[] Array of key events.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return (array) $response->getKeyEvents();
	}
}
