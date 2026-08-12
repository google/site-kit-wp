<?php
/**
 * Class Google\Site_Kit\Tests\Modules\AdSense\Datapoints\Get_AlertsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\AdSense\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\AdSense\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Alerts;

/**
 * @group Modules
 * @group AdSense
 * @group Datapoints
 */
class Get_AlertsTest extends DatapointTestCase {
	public function test_create_request_requires_account_id() {
		$datapoint = new Get_Alerts(
			array(
				'service' => function () {
					return $this->service;
				},
			)
		);

		$request = $datapoint->create_request( new Data_Request( 'GET', 'modules', 'adsense', 'alerts', array() ) );
		$this->assertWPError( $request );
	}
}
