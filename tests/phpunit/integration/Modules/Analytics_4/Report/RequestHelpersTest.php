<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Report\RequestHelpersTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Report
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Report;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Validation\Exception\Invalid_Report_Dimensions_Exception;
use Google\Site_Kit\Modules\Analytics_4\Report\RequestHelpers;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Dimension;

/**
 * @group Modules
 * @group Analytics_4
 * @group Report
 */
class RequestHelpersTest extends TestCase {

	public function test_validate_shared_dimensions__accepts_session_source_without_the_typical_traffic_flag() {
		$this->validate_shared_dimension( 'sessionSource' );

		$this->addToAssertionCount( 1 );
	}

	public function test_validate_shared_dimensions__accepts_session_source_with_the_typical_traffic_flag() {
		$this->enable_feature( 'typicalTraffic' );

		$this->validate_shared_dimension( 'sessionSource' );

		$this->addToAssertionCount( 1 );
	}

	public function test_validate_shared_dimensions__accepts_page_path_plus_query_string_with_the_fresh_data_flag() {
		$this->enable_feature( 'freshData' );

		$this->validate_shared_dimension( 'pagePathPlusQueryString' );

		$this->addToAssertionCount( 1 );
	}

	public function test_validate_shared_dimensions__refuses_page_path_plus_query_string_without_the_fresh_data_flag() {
		$this->expectException( Invalid_Report_Dimensions_Exception::class );

		$this->validate_shared_dimension( 'pagePathPlusQueryString' );
	}

	/**
	 * Validates a shared report that asks for one dimension.
	 *
	 * The validation throws `Invalid_Report_Dimensions_Exception` when a shared
	 * report may not ask for the dimension, which fails a test that expects no
	 * exception.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $dimension_name The dimension, such as `sessionSource`.
	 */
	private function validate_shared_dimension( $dimension_name ) {
		$dimension = new Dimension();
		$dimension->setName( $dimension_name );

		( new RequestHelpers( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) )->validate_shared_dimensions( array( $dimension ) );
	}
}
