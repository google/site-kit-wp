<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\User_Settings_Datapoint
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Permission_Aware_Datapoint;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\User_Settings;

/**
 * Base class for the per-user Reader Revenue Manager settings datapoints.
 *
 * @since 1.185.0
 * @access private
 * @ignore
 */
abstract class User_Settings_Datapoint extends Datapoint implements Executable_Datapoint, Permission_Aware_Datapoint {

	/**
	 * Reader Revenue Manager user settings instance.
	 *
	 * @since 1.185.0
	 *
	 * @var User_Settings
	 */
	protected $user_settings;

	/**
	 * Constructor.
	 *
	 * @since 1.185.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->user_settings = $definition['user_settings'];
	}

	/**
	 * Gets the user settings formatted for a REST response.
	 *
	 * @since 1.185.0
	 *
	 * @return array Reader Revenue Manager user settings.
	 */
	protected function get_user_settings() {
		$user_settings = $this->user_settings->get();

		$user_settings['lastActionedExpressSetups'] = (object) $user_settings['lastActionedExpressSetups'];

		return $user_settings;
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.185.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed The response without any modifications.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}

	/**
	 * Checks whether the current user is allowed to access the datapoint.
	 *
	 * @since 1.185.0
	 *
	 * @return bool True if the current user can view the dashboard, false otherwise.
	 */
	public function permission_callback() {
		return current_user_can( Permissions::VIEW_DASHBOARD );
	}
}
