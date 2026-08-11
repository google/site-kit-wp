<?php
/**
 * Class Google\Site_Kit\Tests\Modules\AdSense\Datapoints\Get_ReportTest
 *
 * @package   Google\Site_Kit\Tests\Modules\AdSense\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\AdSense\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\AdSense\Datapoints\Get_Report;

/**
 * @group Modules
 * @group AdSense
 * @group Datapoints
 */
class Get_ReportTest extends DatapointTestCase {
	public function test_create_request_invalid_shared_metrics() {
		$datapoint = new Get_Report(
			array(
				'service'                             => function () {
					return $this->service;
				},
				'is_shared_data_request'              => function () {
					return true;
				},
				'create_adsense_earning_data_request' => function ( $args ) {
					return $args;
				},
			)
		);

		$request = $datapoint->create_request(
			new Data_Request(
				'GET',
				'modules',
				'adsense',
				'report',
				array(
					'startDate' => '2026-01-01',
					'endDate'   => '2026-01-31',
					'metrics'   => array( 'INVALID_METRIC' ),
				)
			)
		);

		$this->assertWPError( $request );
		$this->assertEquals( 'invalid_adsense_report_metrics', $request->get_error_code(), 'Expected invalid shared metrics to fail validation.' );
	}
}
