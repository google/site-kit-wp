<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Save_Advanced_Data_Breakdowns_Settings
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
use Google\Site_Kit\Modules\Analytics_4\Advanced_Data_Breakdowns_Settings;
use WP_Error;

/**
 * Class for the advanced data breakdowns settings save datapoint.
 *
 * @since 1.181.0
 * @access private
 * @ignore
 */
class Save_Advanced_Data_Breakdowns_Settings extends Datapoint implements Executable_Datapoint {

	/**
	 * The advanced data breakdowns settings this datapoint writes to.
	 *
	 * @since 1.181.0
	 *
	 * @var Advanced_Data_Breakdowns_Settings
	 */
	private Advanced_Data_Breakdowns_Settings $advanced_data_breakdowns_settings;

	/**
	 * Constructor.
	 *
	 * @since 1.181.0
	 *
	 * @param array $definition Datapoint definition. Must include the `advanced_data_breakdowns_settings` instance.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->advanced_data_breakdowns_settings = $definition['advanced_data_breakdowns_settings'];
	}

	/**
	 * Builds the callback that saves the advanced data breakdowns settings.
	 *
	 * Returns a `WP_Error` when the user cannot manage options, and throws when the `enabled` value is not a boolean.
	 *
	 * @since 1.181.0
	 *
	 * @param Data_Request $data_request The REST data request, read for its `settings` payload.
	 * @return callable|WP_Error Callback that saves the settings, or a `WP_Error` when the user lacks permission.
	 * @throws Invalid_Param_Exception When `enabled` is set but is not a boolean.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( ! current_user_can( Permissions::MANAGE_OPTIONS ) ) {
			return new WP_Error(
				'forbidden',
				__( 'User does not have permission to save advanced data breakdowns settings.', 'google-site-kit' ),
				array( 'status' => 403 )
			);
		}

		$settings = $data_request['settings'];

		if ( isset( $settings['enabled'] ) && ! is_bool( $settings['enabled'] ) ) {
			throw new Invalid_Param_Exception( 'enabled' );
		}

		$advanced_data_breakdowns_settings = $this->advanced_data_breakdowns_settings;

		return function () use ( $settings, $advanced_data_breakdowns_settings ): array {
			$new_settings = array();

			if ( isset( $settings['enabled'] ) ) {
				$new_settings['enabled'] = $settings['enabled'];
			}

			return $advanced_data_breakdowns_settings->merge( $new_settings );
		};
	}

	/**
	 * Returns the settings as the final response.
	 *
	 * The settings already have the shape the REST API needs, so there is
	 * nothing to parse.
	 *
	 * @since 1.181.0
	 *
	 * @param mixed        $response The settings from `create_request`.
	 * @param Data_Request $data     The REST data request.
	 * @return mixed The settings from `create_request`.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
