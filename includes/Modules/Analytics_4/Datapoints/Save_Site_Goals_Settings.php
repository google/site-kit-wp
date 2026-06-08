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

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4\Site_Goals_Settings;

/**
 * Class for the Site Goals settings save datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Save_Site_Goals_Settings extends Datapoint implements Executable_Datapoint {

	/**
	 * Site Goals settings instance.
	 *
	 * @since n.e.x.t
	 * @var Site_Goals_Settings
	 */
	private $site_goals_settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->site_goals_settings = $definition['site_goals_settings'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
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

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed The response without any modifications.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
