<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Save_Site_Goals_Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;

/**
 * Class for the Site Goals settings save datapoint.
 *
 * @since 1.181.0
 * @access private
 * @ignore
 */
class Save_Site_Goals_Settings extends Site_Goals_Settings_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since 1.181.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable Closure that saves Site Goals settings and returns the updated settings.
	 */
	public function create_request( Data_Request $data_request ) {
		$settings            = $data_request['settings'];
		$site_goals_settings = $this->site_goals_settings;

		return function () use ( $settings, $site_goals_settings ) {
			$site_goals_settings->merge( (array) $settings );

			return $site_goals_settings->get();
		};
	}
}
