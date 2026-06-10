<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Advanced_Data_Breakdowns_Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Shareable_Datapoint;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4\Advanced_Data_Breakdowns_Settings;

/**
 * Class for the advanced data breakdowns settings retrieval datapoint.
 *
 * @since 1.181.0
 * @access private
 * @ignore
 */
class Get_Advanced_Data_Breakdowns_Settings extends Shareable_Datapoint implements Executable_Datapoint {

	/**
	 * The advanced data breakdowns settings this datapoint reads from.
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
	 * Builds the callback that reads the advanced data breakdowns settings.
	 *
	 * Users who can manage options get the full settings. Everyone else gets only the view-only keys.
	 *
	 * @since 1.181.0
	 *
	 * @param Data_Request $data_request The REST data request.
	 * @return callable Callback that returns the settings the current user may read.
	 */
	public function create_request( Data_Request $data_request ): callable {
		$advanced_data_breakdowns_settings = $this->advanced_data_breakdowns_settings;

		return function () use ( $advanced_data_breakdowns_settings ): array {
			$settings = $advanced_data_breakdowns_settings->get();

			return current_user_can( Permissions::MANAGE_OPTIONS )
				? $settings
				: array_intersect_key( $settings, array_flip( $advanced_data_breakdowns_settings->get_view_only_keys() ) );
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
