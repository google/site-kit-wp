<?php
/**
 * FakeModule Permission-Aware Test Request Datapoint
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules\Datapoints;

use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Permission_Aware_Datapoint;
use Google\Site_Kit\Core\Modules\Shareable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;

/**
 * Fake datapoint that overrides the default REST permission check.
 *
 * The permission check is configurable via the `permission_callback` definition
 * key (a callable). By default it uses the `edit_posts` capability so tests can
 * exercise a non-admin user being allowed through the override; passing a
 * callable that throws lets tests exercise the fail-closed-on-error path.
 */
class FakeModule_Permission_Aware_Request extends Shareable_Datapoint implements Executable_Datapoint, Permission_Aware_Datapoint {

	/**
	 * Permission check callable.
	 *
	 * @var callable|null
	 */
	private $permission_check;

	/**
	 * Constructor.
	 *
	 * @param array $definition Definition fields. May include a `permission_callback` callable.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->permission_check = $definition['permission_callback'] ?? null;
	}

	/**
	 * Creates the request object.
	 *
	 * @param Data_Request $data Data request object.
	 * @return callable Callable returning the encoded request details.
	 */
	public function create_request( Data_Request $data ) {
		$method    = $data->method;
		$datapoint = $data->datapoint;

		return function () use ( $method, $datapoint, $data ) {
			$data = $data->data;
			return json_encode( compact( 'method', 'datapoint', 'data' ) );
		};
	}

	/**
	 * Parses the response.
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data Data request object.
	 * @return mixed Parsed response data.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return json_decode( $response, $data['asArray'] );
	}

	/**
	 * Checks whether the current user is allowed to access the datapoint.
	 *
	 * @return bool True if allowed. Defaults to the `edit_posts` capability when
	 *              no `permission_callback` was provided.
	 */
	public function permission_callback() {
		if ( is_callable( $this->permission_check ) ) {
			return ( $this->permission_check )();
		}

		return current_user_can( 'edit_posts' );
	}
}
