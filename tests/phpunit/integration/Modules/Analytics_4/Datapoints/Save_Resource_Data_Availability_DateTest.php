<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Save_Resource_Data_Availability_DateTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Save_Resource_Data_Availability_Date;
use Google\Site_Kit\Modules\Analytics_4\Resource_Data_Availability_Date;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Save_Resource_Data_Availability_DateTest extends TestCase {

	/**
	 * Save_Resource_Data_Availability_Date datapoint instance.
	 *
	 * @var Save_Resource_Data_Availability_Date
	 */
	private $datapoint;

	/**
	 * Resource_Data_Availability_Date instance.
	 *
	 * @var Resource_Data_Availability_Date
	 */
	private $resource_data_availability_date;

	/**
	 * Analytics_4 instance.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	public function set_up() {
		parent::set_up();

		$context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options         = new Options( $context );
		$user            = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options    = new User_Options( $context, $user->ID );
		$authentication  = new Authentication( $context, $options, $user_options );
		$this->analytics = new Analytics_4( $context, $options, $user_options, $authentication );

		$transients                            = new Transients( $context );
		$audience_settings                     = new Audience_Settings( $options );
		$this->resource_data_availability_date = new Resource_Data_Availability_Date(
			$transients,
			$this->analytics->get_settings(),
			$audience_settings
		);

		$this->datapoint = new Save_Resource_Data_Availability_Date(
			array(
				'resource_data_availability_date' => $this->resource_data_availability_date,
				'service'                         => '',
			)
		);
	}

	public function required_params() {
		return array(
			array( 'resourceType' ),
			array( 'resourceSlug' ),
			array( 'date' ),
		);
	}

	/**
	 * @dataProvider required_params
	 */
	public function test_create_request__requires_params( $required_param ) {
		$data = array(
			'resourceType' => Resource_Data_Availability_Date::RESOURCE_TYPE_CUSTOM_DIMENSION,
			'resourceSlug' => 'googlesitekit_post_type',
			'date'         => 20201231,
		);
		unset( $data[ $required_param ] );

		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'save-resource-data-availability-date', $data );

		$this->expectException( Missing_Required_Param_Exception::class );
		$this->datapoint->create_request( $data_request );
	}

	public function test_create_request__validates_resource_type() {
		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'save-resource-data-availability-date',
			array(
				'resourceType' => 'invalid-resource-type',
				'resourceSlug' => 'googlesitekit_post_type',
				'date'         => 20201231,
			)
		);

		$this->expectException( Invalid_Param_Exception::class );
		$this->expectExceptionMessage( 'Invalid parameter: resourceType.' );
		$this->datapoint->create_request( $data_request );
	}

	public function test_create_request__validates_resource_slug() {
		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'save-resource-data-availability-date',
			array(
				'resourceType' => Resource_Data_Availability_Date::RESOURCE_TYPE_CUSTOM_DIMENSION,
				'resourceSlug' => 'invalid-slug',
				'date'         => 20201231,
			)
		);

		$this->expectException( Invalid_Param_Exception::class );
		$this->expectExceptionMessage( 'Invalid parameter: resourceSlug.' );
		$this->datapoint->create_request( $data_request );
	}

	public function test_create_request__validates_date_type() {
		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'save-resource-data-availability-date',
			array(
				'resourceType' => Resource_Data_Availability_Date::RESOURCE_TYPE_CUSTOM_DIMENSION,
				'resourceSlug' => 'googlesitekit_post_type',
				'date'         => '20201231',
			)
		);

		$this->expectException( Invalid_Param_Exception::class );
		$this->expectExceptionMessage( 'Invalid parameter: date.' );
		$this->datapoint->create_request( $data_request );
	}

	public function test_create_request() {
		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'save-resource-data-availability-date',
			array(
				'resourceType' => Resource_Data_Availability_Date::RESOURCE_TYPE_CUSTOM_DIMENSION,
				'resourceSlug' => 'googlesitekit_post_type',
				'date'         => 20201231,
			)
		);

		$request  = $this->datapoint->create_request( $data_request );
		$response = $request();

		$this->assertTrue( $response, 'The datapoint should return true on success.' );
		$this->assertEquals(
			20201231,
			$this->resource_data_availability_date->get_resource_date( 'googlesitekit_post_type', Resource_Data_Availability_Date::RESOURCE_TYPE_CUSTOM_DIMENSION ),
			'The resource data availability date should be saved.'
		);
	}

	public function test_parse_response() {
		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'save-resource-data-availability-date', array() );

		$this->assertTrue( $this->datapoint->parse_response( true, $data_request ), 'The `parse_response` method should return the response unchanged.' );
		$this->assertFalse( $this->datapoint->parse_response( false, $data_request ), 'The `parse_response` method should return the response unchanged.' );
	}
}
