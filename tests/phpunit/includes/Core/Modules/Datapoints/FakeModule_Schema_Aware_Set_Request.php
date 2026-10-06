<?php
/**
 * FakeModule Schema-Aware Set Test Request Datapoint
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules\Datapoints;

use Google\Site_Kit\Core\Modules\Schema_Aware_Datapoint;

/**
 * Fake `POST` datapoint that describes its REST arguments and response, so it
 * is served by its own REST route.
 */
class FakeModule_Schema_Aware_Set_Request extends FakeModule_Test_Request implements Schema_Aware_Datapoint {

	/**
	 * Gets the argument schema of the datapoint's REST endpoint.
	 *
	 * @return array Map of argument names to their schemas.
	 */
	public function get_args() {
		return array(
			'data' => array(
				'type'        => 'object',
				'description' => 'Settings to save.',
				'required'    => true,
				'properties'  => array(
					'propertyID' => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			),
		);
	}

	/**
	 * Gets the resource schema of the data the datapoint returns.
	 *
	 * @return array Resource schema.
	 */
	public function get_schema() {
		return array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title'   => 'fake-module-schema-aware-set-request',
			'type'    => 'object',
		);
	}
}
