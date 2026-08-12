<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Site_Goals_Settings_Datapoint
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Permission_Aware_Datapoint;
use Google\Site_Kit\Core\Modules\Shareable_Datapoint;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4\Site_Goals_Settings;

/**
 * Base class for the per-user Site Goals settings datapoints.
 *
 * @since 1.181.0
 * @access private
 * @ignore
 */
abstract class Site_Goals_Settings_Datapoint extends Shareable_Datapoint implements Executable_Datapoint, Permission_Aware_Datapoint {

	/**
	 * Site Goals settings instance.
	 *
	 * @since 1.181.0
	 * @var Site_Goals_Settings
	 */
	protected $site_goals_settings;

	/**
	 * Constructor.
	 *
	 * @since 1.181.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->site_goals_settings = $definition['site_goals_settings'];
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.181.0
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
	 * @since 1.181.0
	 *
	 * @return bool True if the current user can view the dashboard, false otherwise.
	 */
	public function permission_callback() {
		return current_user_can( Permissions::VIEW_DASHBOARD );
	}
}
