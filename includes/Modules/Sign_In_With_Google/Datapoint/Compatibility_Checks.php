<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\Datapoint\Compatibility_Checks
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google\Datapoint
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google\Datapoint;

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks\Compatibility_Checks as Checks;
use WP_Error;

/**
 * Class for the compatibility-check datapoint.
 *
 * @since 1.164.0
 * @access private
 * @ignore
 */
class Compatibility_Checks extends Datapoint implements Executable_Datapoint {

	/**
	 * Compatibilty checks instance.
	 *
	 * @since 1.164.0
	 * @var Checks
	 */
	private $checks;

	/**
	 * Constructor.
	 *
	 * @since 1.164.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		if ( isset( $definition['checks'] ) ) {
			$this->checks = $definition['checks'];
		}
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.164.0
	 *
	 * @param Data_Request $data Data request object.
	 */
	public function create_request( Data_Request $data ) {
		if ( ! current_user_can( Permissions::MANAGE_OPTIONS ) ) {
			return new WP_Error( 'rest_forbidden', __( 'You are not allowed to access this resource.', 'google-site-kit' ), array( 'status' => 403 ) );
		}

		return function () {
			return array(
				'checks'    => $this->checks->run_checks(),
				'timestamp' => time(),
			);
		};
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.164.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data Data request object.
	 * @return mixed The original response without any modifications.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
