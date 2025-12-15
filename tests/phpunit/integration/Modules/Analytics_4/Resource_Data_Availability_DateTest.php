<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Resource_Data_Availability_DateTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Modules\Analytics_4\Resource_Data_Availability_Date;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 */
class Resource_Data_Availability_DateTest extends TestCase {

	/**
	 * @var Settings
	 */
	protected $settings;

	/**
	 * @var Audience_Settings
	 */
	protected $audience_settings;

	/**
	 * @var Resource_Data_Availability_Date
	 */
	protected $resource_data_availability_date;

	// Test property ID.
	protected $test_property_id = '12345';

	// Test audience resource names.
	protected $test_audience_1 = 'properties/12345/audiences/12345';
	protected $test_audience_2 = 'properties/12345/audiences/67890';

	public function set_up() {
		parent::set_up();

		$context                               = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options                               = new Options( $context );
		$transients                            = new Transients( $context );
		$this->settings                        = new Settings( $options );
		$this->audience_settings               = new Audience_Settings( $options );
		$this->resource_data_availability_date = new Resource_Data_Availability_Date( $transients, $this->settings, $this->audience_settings );

		$this->settings->merge(
			array(
				'propertyID' => $this->test_property_id,
			)
		);

		$available_audiences = array(
			array(
				'name' => $this->test_audience_1,
			),
			array(
				'name' => $this->test_audience_2,
			),
		);

		$this->audience_settings->set(
			array(
				'availableAudiences' => $available_audiences,
			)
		);
	}

	public function test_get_set_resource_date() {
		// Should be 0 if no date is set for a given resource.
		$this->assertEquals( 0, $this->resource_data_availability_date->get_resource_date( 'googlesitekit_post_type', Resource_Data_Availability_Date::RESOURCE_TYPE_CUSTOM_DIMENSION ), 'Custom dimension resource date should be 0 when not set.' );
		$this->assertEquals( 0, $this->resource_data_availability_date->get_resource_date( $this->test_audience_1, Resource_Data_Availability_Date::RESOURCE_TYPE_AUDIENCE ), 'Audience resource date should be 0 when not set.' );
		$this->assertEquals( 0, $this->resource_data_availability_date->get_resource_date( $this->test_property_id, Resource_Data_Availability_Date::RESOURCE_TYPE_PROPERTY ), 'Property resource date should be 0 when not set.' );

		$this->set_test_resource_dates();

		$this->assertEquals( 20201220, $this->resource_data_availability_date->get_resource_date( 'googlesitekit_post_type', Resource_Data_Availability_Date::RESOURCE_TYPE_CUSTOM_DIMENSION ), 'Custom dimension resource date should be set.' );
		$this->assertEquals( 20201221, $this->resource_data_availability_date->get_resource_date( $this->test_audience_1, Resource_Data_Availability_Date::RESOURCE_TYPE_AUDIENCE ), 'Audience resource date should be set.' );
		$this->assertEquals( 20201223, $this->resource_data_availability_date->get_resource_date( $this->test_property_id, Resource_Data_Availability_Date::RESOURCE_TYPE_PROPERTY ), 'Property resource date should be set.' );
	}

	public function test_reset_resource_date() {
		$this->set_test_resource_dates();

		$this->resource_data_availability_date->reset_resource_date( 'googlesitekit_post_type', Resource_Data_Availability_Date::RESOURCE_TYPE_CUSTOM_DIMENSION );
		$this->resource_data_availability_date->reset_resource_date( $this->test_audience_1, Resource_Data_Availability_Date::RESOURCE_TYPE_AUDIENCE );
		$this->resource_data_availability_date->reset_resource_date( $this->test_property_id, Resource_Data_Availability_Date::RESOURCE_TYPE_PROPERTY );

		$this->assertEquals( 0, $this->resource_data_availability_date->get_resource_date( 'googlesitekit_post_type', Resource_Data_Availability_Date::RESOURCE_TYPE_CUSTOM_DIMENSION ), 'Custom dimension resource date should reset to 0.' );
		$this->assertEquals( 0, $this->resource_data_availability_date->get_resource_date( $this->test_audience_1, Resource_Data_Availability_Date::RESOURCE_TYPE_AUDIENCE ), 'Audience 1 resource date should reset to 0.' );
		$this->assertEquals( 20201222, $this->resource_data_availability_date->get_resource_date( $this->test_audience_2, Resource_Data_Availability_Date::RESOURCE_TYPE_AUDIENCE ), 'Audience 2 resource date should remain set.' );
		$this->assertEquals( 0, $this->resource_data_availability_date->get_resource_date( $this->test_property_id, Resource_Data_Availability_Date::RESOURCE_TYPE_PROPERTY ), 'Property resource date should reset to 0.' );
	}

	public function test_get_all_resource_dates() {
		$this->assertEquals(
			array(
				'audience'        => array(),
				'customDimension' => array(),
				'property'        => array(),

			),
			$this->resource_data_availability_date->get_all_resource_dates(),
			'All resource dates should be empty when nothing set.'
		);

		$this->set_test_resource_dates();

		$this->assertEquals(
			array(
				'audience'        => array(
					$this->test_audience_1 => 20201221,
					$this->test_audience_2 => 20201222,
				),
				'customDimension' => array(
					'googlesitekit_post_type' => 20201220,
				),
				'property'        => array(
					$this->test_property_id => 20201223,
				),
			),
			$this->resource_data_availability_date->get_all_resource_dates(),
			'All resource dates should reflect set values.'
		);

		$this->resource_data_availability_date->reset_resource_date( $this->test_audience_1, Resource_Data_Availability_Date::RESOURCE_TYPE_AUDIENCE );

		$this->assertEquals(
			array(
				'audience'        => array(
					$this->test_audience_2 => 20201222,
				),
				'customDimension' => array(
					'googlesitekit_post_type' => 20201220,
				),
				'property'        => array(
					$this->test_property_id => 20201223,
				),
			),
			$this->resource_data_availability_date->get_all_resource_dates(),
			'Audience 1 date should be removed after reset; others unchanged.'
		);
	}

	public function test_reset_all_resource_dates() {
		$this->set_test_resource_dates();

		$this->resource_data_availability_date->reset_all_resource_dates();

		$this->assertEquals(
			array(
				'audience'        => array(),
				'customDimension' => array(),
				'property'        => array(),
			),
			$this->resource_data_availability_date->get_all_resource_dates(),
			'All resource dates should be cleared after reset.'
		);
	}

	public function test_is_valid_resource_slug() {
		$this->assertTrue( $this->resource_data_availability_date->is_valid_resource_slug( 'googlesitekit_post_type', Resource_Data_Availability_Date::RESOURCE_TYPE_CUSTOM_DIMENSION ), 'Valid custom dimension slug should be accepted.' );
		$this->assertTrue( $this->resource_data_availability_date->is_valid_resource_slug( $this->test_audience_1, Resource_Data_Availability_Date::RESOURCE_TYPE_AUDIENCE ), 'Valid audience slug should be accepted.' );
		$this->assertTrue( $this->resource_data_availability_date->is_valid_resource_slug( $this->test_property_id, Resource_Data_Availability_Date::RESOURCE_TYPE_PROPERTY ), 'Valid property slug should be accepted.' );

		$this->assertFalse( $this->resource_data_availability_date->is_valid_resource_slug( 'invalid', Resource_Data_Availability_Date::RESOURCE_TYPE_CUSTOM_DIMENSION ), 'Invalid custom dimension slug should be rejected.' );
		$this->assertFalse( $this->resource_data_availability_date->is_valid_resource_slug( 'invalid', Resource_Data_Availability_Date::RESOURCE_TYPE_AUDIENCE ), 'Invalid audience slug should be rejected.' );
		$this->assertFalse( $this->resource_data_availability_date->is_valid_resource_slug( 'invalid', Resource_Data_Availability_Date::RESOURCE_TYPE_PROPERTY ), 'Invalid property slug should be rejected.' );

		// Simulate a property ID change.
		$new_property_id = '67890';
		$this->settings->merge(
			array(
				'propertyID' => $new_property_id,
			)
		);

		$this->assertFalse( $this->resource_data_availability_date->is_valid_resource_slug( $this->test_property_id, Resource_Data_Availability_Date::RESOURCE_TYPE_PROPERTY ), 'Old property ID should be invalid after change.' );
		$this->assertTrue( $this->resource_data_availability_date->is_valid_resource_slug( $new_property_id, Resource_Data_Availability_Date::RESOURCE_TYPE_PROPERTY ), 'New property ID should be valid.' );
	}

	private function set_test_resource_dates() {
		$this->resource_data_availability_date->set_resource_date( 'googlesitekit_post_type', Resource_Data_Availability_Date::RESOURCE_TYPE_CUSTOM_DIMENSION, 20201220 );
		$this->resource_data_availability_date->set_resource_date( $this->test_audience_1, Resource_Data_Availability_Date::RESOURCE_TYPE_AUDIENCE, 20201221 );
		$this->resource_data_availability_date->set_resource_date( $this->test_audience_2, Resource_Data_Availability_Date::RESOURCE_TYPE_AUDIENCE, 20201222 );
		$this->resource_data_availability_date->set_resource_date( $this->test_property_id, Resource_Data_Availability_Date::RESOURCE_TYPE_PROPERTY, 20201223 );
	}
}
