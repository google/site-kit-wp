<?php
/**
 * FakeModule Schema-Aware Test Request Datapoint
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules\Datapoints;

use Google\Site_Kit\Core\Modules\Schema_Aware_Datapoint;

/**
 * Fake datapoint that describes the parameters it accepts, so its requests are
 * validated before it runs.
 *
 * @since n.e.x.t
 */
class FakeModule_Schema_Aware_Request extends FakeModule_Test_Request implements Schema_Aware_Datapoint {

	/**
	 * Gets the schema of the parameters the datapoint accepts.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Map of parameter names to their schemas.
	 */
	public function get_args_schema() {
		return array(
			'propertyID' => array(
				'type'     => 'string',
				'required' => true,
			),
			'limit'      => array(
				'type' => 'integer',
			),
			'metric'     => array(
				'type'    => 'string',
				'default' => 'totalUsers',
			),
		);
	}
}
