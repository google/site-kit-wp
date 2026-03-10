<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Save_Custom_Dimension_Data_AvailableTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Modules\Analytics_4\Custom_Dimensions_Data_Available;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Save_Custom_Dimension_Data_Available;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Save_Custom_Dimension_Data_AvailableTest extends TestCase {

	/**
	 * Save_Custom_Dimension_Data_Available datapoint instance.
	 *
	 * @var Save_Custom_Dimension_Data_Available
	 */
	private $datapoint;

	/**
	 * Custom_Dimensions_Data_Available instance.
	 *
	 * @var Custom_Dimensions_Data_Available
	 */
	private $custom_dimensions_data_available;

	public function set_up() {
		parent::set_up();

		$context                                = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->custom_dimensions_data_available = new Custom_Dimensions_Data_Available( new Transients( $context ) );
		$this->datapoint                        = new Save_Custom_Dimension_Data_Available(
			array(
				'custom_dimensions_data_available' => $this->custom_dimensions_data_available,
			)
		);
	}

	public function test_create_request_validates_required_param() {
		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'custom-dimension-data-available',
			array()
		);

		$this->expectException( Missing_Required_Param_Exception::class );
		$this->datapoint->create_request( $data_request );
	}

	public function test_create_request_validates_custom_dimension_slug() {
		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'custom-dimension-data-available',
			array(
				'customDimension' => 'invalid_custom_dimension_slug',
			)
		);

		$response = $this->datapoint->create_request( $data_request );

		$this->assertInstanceOf( WP_Error::class, $response, 'Saving custom dimension data available should return WP_Error for invalid custom dimension slugs.' );
		$this->assertEquals( 'invalid_custom_dimension_slug', $response->get_error_code(), 'Saving custom dimension data available should return invalid_custom_dimension_slug for invalid custom dimension slugs.' );
	}

	public function test_create_request() {
		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'custom-dimension-data-available',
			array(
				'customDimension' => 'googlesitekit_post_author',
			)
		);

		$request = $this->datapoint->create_request( $data_request );

		$this->assertIsCallable( $request, 'Save custom dimension data available should return a callable request handler.' );

		$response        = $request();
		$parsed_response = $this->datapoint->parse_response( $response, $data_request );

		$this->assertTrue( $parsed_response, 'Executing save custom dimension data available request should return true on success.' );
		$this->assertEquals(
			array(
				'googlesitekit_post_date'       => false,
				'googlesitekit_post_author'     => true,
				'googlesitekit_post_categories' => false,
				'googlesitekit_post_type'       => false,
			),
			$this->custom_dimensions_data_available->get_data_availability(),
			'Saving custom dimension data available should mark only the requested custom dimension as data available.'
		);
	}
}
