<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Report\Custom_Dimensions_Response_ParserTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Report
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Report;

use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Modules\Analytics_4\Report\Custom_Dimensions_Response_Parser;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportResponse as Google_Service_AnalyticsData_RunReportResponse;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DimensionHeader as Google_Service_AnalyticsData_DimensionHeader;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DimensionValue as Google_Service_AnalyticsData_DimensionValue;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Row as Google_Service_AnalyticsData_Row;

/**
 * @group Modules
 * @group Analytics_4
 * @group Report
 */
class Custom_Dimensions_Response_ParserTest extends TestCase {

	protected function create_rows_with_dimension_values( $values ) {
		$rows = array();
		foreach ( $values as $key => $value ) {
			$dimension_value = new Google_Service_AnalyticsData_DimensionValue();
			$dimension_value->setValue( $value );
			$rows[ $key ] = new Google_Service_AnalyticsData_Row();
			$rows[ $key ]->setDimensionValues( array( $dimension_value ) );
		}
		return $rows;
	}

	public function test_swap_custom_dimension_ids_with_names__post_author() {
		$response                     = new Google_Service_AnalyticsData_RunReportResponse();
		$dimension_header_post_author = new Google_Service_AnalyticsData_DimensionHeader();
		$dimension_header_post_author->setName( 'customEvent:googlesitekit_post_author' );
		$response->setDimensionHeaders( array( $dimension_header_post_author ) );

		$rows = array();

		// Existing author with a valid display name.
		$author_id = $this->factory()->user->create( array( 'display_name' => 'test author 1' ) );

		// 5000 would be a non-existent user and `(not set)` is an invalid user_id.
		$rows = $this->create_rows_with_dimension_values( array( (string) $author_id, '5000', '(not set)' ) );

		$response->setRows( $rows );
		$custom_dimension_query = new Custom_Dimensions_Response_Parser( $response );
		$custom_dimension_query->swap_custom_dimension_ids_with_names();

		$swappedRows = $response->getRows();

		$this->assertEquals( 'test author 1', $swappedRows[0]->getDimensionValues()[0]->getValue() );
		$this->assertEquals( '5000', $swappedRows[1]->getDimensionValues()[0]->getValue() );
		$this->assertEquals( '(not set)', $swappedRows[2]->getDimensionValues()[0]->getValue() );
	}

	public function test_swap_custom_dimension_ids_with_names__post_categories() {
		$response                         = new Google_Service_AnalyticsData_RunReportResponse();
		$dimension_header_post_categories = new Google_Service_AnalyticsData_DimensionHeader();
		$dimension_header_post_categories->setName( 'customEvent:googlesitekit_post_categories' );
		$response->setDimensionHeaders( array( $dimension_header_post_categories ) );

		$rows = array();

		$category_with_number = $this->factory()->category->create( array( 'name' => '2' ) );
		$category_with_commas = $this->factory()->category->create( array( 'name' => 'Category,with,commas' ) );
		$normal_category      = $this->factory()->category->create( array( 'name' => 'Normal Category' ) );
		$category_ids_string  = implode( ',', array( $category_with_number, $category_with_commas, 1955, 'Uncategorized', $normal_category ) ); // 1955 would be a non-existent category

		$rows = $this->create_rows_with_dimension_values( array( $category_ids_string ) );
		$response->setRows( $rows );
		$custom_dimension_query = new Custom_Dimensions_Response_Parser( $response );
		$custom_dimension_query->swap_custom_dimension_ids_with_names();

		$swappedRows = $response->getRows();
		$this->assertEquals( '["2","Category,with,commas",1955,"Uncategorized","Normal Category"]', $swappedRows[0]->getDimensionValues()[0]->getValue() );
	}
}
