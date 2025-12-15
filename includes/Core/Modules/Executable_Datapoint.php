<?php
/**
 * Class Google\Site_Kit\Core\Modules\Executable_Datapoint
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Core\REST_API\Data_Request;

/**
 * Interface for a datapoint that can be executed.
 *
 * @since 1.160.0
 */
interface Executable_Datapoint {

	/**
	 * Creates a request object.
	 *
	 * @since 1.160.0
	 *
	 * @param Data_Request $data Data request object.
	 */
	public function create_request( Data_Request $data );

	/**
	 * Parses a response.
	 *
	 * @since 1.160.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data Data request object.
	 */
	public function parse_response( $response, Data_Request $data );
}
