<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\ReportTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4\Report;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\MetricHeader;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportResponse;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 */
class ReportTest extends TestCase {

	/**
	 * @var Report
	 */
	protected $report;

	public function set_up() {
		parent::set_up();

		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->report = new Report( $context );
	}

	public function test_parse_response() {
		$report_args = array(
			'startDate'        => '2023-02-01',
			'endDate'          => '2023-02-03',
			'compareStartDate' => '2023-01-01',
			'compareEndDate'   => '2023-01-03',
			'dimensions'       => 'date',
		);

		$first_metric = new MetricHeader();
		$first_metric->setType( 'TYPE_INTEGER' );

		$second_metric = new MetricHeader();
		$second_metric->setType( 'TYPE_KILOMETERS' );

		$data     = new Data_Request( '', '', '', '', $report_args );
		$response = new RunReportResponse();
		$response->setMetricHeaders( array( $first_metric, $second_metric ) );

		$response = $this->report->parse_response( $data, $response );

		$this->assertEquals( 6, $response->getRowCount() );

		foreach ( $response->getRows() as $i => $row ) {
			$date = strtotime( $i < 3 ? '2023-02-01' : '2023-01-01' ) + ( $i % 3 ) * DAY_IN_SECONDS;
			$date = gmdate( 'Ymd', $date );

			$dimension_values = $row->getDimensionValues();
			$this->assertEquals( $date, $dimension_values[0]->getValue() );

			$metric_values = $row->getMetricValues();
			$this->assertEquals( 0, $metric_values[0]->getValue() );
			$this->assertNull( $metric_values[1]->getValue() );
		}
	}

}
