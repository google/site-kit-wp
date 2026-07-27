<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Save_User_Settings
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;

/**
 * Class for the Reader Revenue Manager user settings save datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Save_User_Settings extends User_Settings_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable Closure that saves and returns Reader Revenue Manager user settings.
	 */
	public function create_request( Data_Request $data_request ) {
		$settings = $data_request->data;

		return function () use ( $settings ) {
			$this->user_settings->merge( $settings );

			return $this->get_user_settings();
		};
	}
}
