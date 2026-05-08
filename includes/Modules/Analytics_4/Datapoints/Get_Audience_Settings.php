<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Audience_Settings
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
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings;

/**
 * Class for the audience settings retrieval datapoint.
 *
 * @since 1.177.0
 * @access private
 * @ignore
 */
class Get_Audience_Settings extends Shareable_Datapoint implements Executable_Datapoint {

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
	 * @return callable Closure that returns audience settings.
	 */
	public function create_request( Data_Request $data_request ) {
		$audience_settings = $this->audience_settings;

		return function () use ( $audience_settings ) {
			$settings = $audience_settings->get();
			return current_user_can( Permissions::MANAGE_OPTIONS ) ? $settings : array_intersect_key( $settings, array_flip( $audience_settings->get_view_only_keys() ) );
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
