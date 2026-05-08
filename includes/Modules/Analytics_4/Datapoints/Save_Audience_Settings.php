<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Save_Audience_Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings;
use WP_Error;

/**
 * Class for the audience settings save datapoint.
 *
 * @since 1.177.0
 * @access private
 * @ignore
 */
class Save_Audience_Settings extends Datapoint implements Executable_Datapoint {

	/**
	 * Audience settings instance.
	 *
	 * @since 1.177.0
	 * @var Audience_Settings
	 */
	private $audience_settings;

	/**
	 * Constructor.
	 *
	 * @since 1.177.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->audience_settings = $definition['audience_settings'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.177.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable|WP_Error Closure that saves audience settings, or WP_Error on failure.
	 * @throws Invalid_Param_Exception Thrown if a parameter is invalid.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( ! current_user_can( Permissions::MANAGE_OPTIONS ) ) {
			return new WP_Error(
				'forbidden',
				__( 'User does not have permission to save audience settings.', 'google-site-kit' ),
				array( 'status' => 403 )
			);
		}

		$settings = $data_request['settings'];

		if (
			isset( $settings['audienceSegmentationSetupCompletedBy'] ) &&
			! is_int( $settings['audienceSegmentationSetupCompletedBy'] )
		) {
			throw new Invalid_Param_Exception( 'audienceSegmentationSetupCompletedBy' );
		}

		$audience_settings = $this->audience_settings;

		return function () use ( $settings, $audience_settings ) {
			$new_settings = array();

			if ( isset( $settings['audienceSegmentationSetupCompletedBy'] ) ) {
				$new_settings['audienceSegmentationSetupCompletedBy'] = $settings['audienceSegmentationSetupCompletedBy'];
			}

			$settings = $audience_settings->merge( $new_settings );

			return $settings;
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
