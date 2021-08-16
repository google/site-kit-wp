<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Search_Console\Google_API\Search_AnalyticsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Search_Console\Google_API
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Search_Console\Google_API;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Search_Console\Google_API\Search_Analytics;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Search_Console
 */
class Search_AnalyticsTest extends TestCase {

	public function test_parse_request_data() {
		$request = new Data_Request(
			'GET',
			null,
			null,
			null,
			array(
				'startDate'  => '2021-01-01',
				'endDate'    => '2021-01-08',
				'dimensions' => 'dimensionA,dimensionB',
				'url'        => 'http://www.EXAMPLE.org/',
				'limit'      => 20,
			)
		);

		$searchanalytics = new Search_Analytics();
		$params          = $searchanalytics->parse_request_data( $request );

		$this->assertEquals( '2021-01-01', $params['start_date'] );
		$this->assertEquals( '2021-01-08', $params['end_date'] );
		$this->assertEquals( 20, $params['row_limit'] );
		$this->assertEquals( 'http://www.example.org/', $params['page'] );
		$this->assertEqualSets( array( 'dimensionA', 'dimensionB' ), $request['dimensions'] );
	}

}
