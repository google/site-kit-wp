<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Site_Goals_Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4\Site_Goals_Site_Settings;

/**
 * Class for the Site Goals settings retrieval datapoint.
 *
 * Returns a merged object combining per-user settings (goalDrivers,
 * visitorEngagement) with site-wide settings (activeWidgets).
 *
 * @since 1.181.0
 * @access private
 * @ignore
 */
class Get_Site_Goals_Settings extends Site_Goals_Settings_Datapoint {

	/**
	 * Site-wide Site Goals settings instance.
	 *
	 * @since 1.182.0
	 * @var Site_Goals_Site_Settings
	 */
	private $site_goals_site_settings;

	/**
	 * Constructor.
	 *
	 * @since 1.182.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->site_goals_site_settings = $definition['site_goals_site_settings'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.181.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable Closure that returns merged Site Goals settings.
	 */
	public function create_request( Data_Request $data_request ) {
		$site_goals_settings      = $this->site_goals_settings;
		$site_goals_site_settings = $this->site_goals_site_settings;

		return function () use ( $site_goals_settings, $site_goals_site_settings ) {
			return array_merge(
				$site_goals_settings->get(),
				$site_goals_site_settings->get()
			);
		};
	}
}
