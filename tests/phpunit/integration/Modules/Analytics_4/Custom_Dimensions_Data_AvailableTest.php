<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Custom_Dimensions_Data_AvailableTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Modules\Analytics_4\Custom_Dimensions_Data_Available;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 */
class Custom_Dimensions_Data_AvailableTest extends TestCase {

	/**
	 * @var Custom_Dimensions_Data_Available
	 */
	protected $custom_dimensions_data_available;

	public function set_up() {
		parent::set_up();

		$context                                = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$transients                             = new Transients( $context );
		$this->custom_dimensions_data_available = new Custom_Dimensions_Data_Available( $transients );
	}

	public function test_reset_data_available() {
		foreach (
			Custom_Dimensions_Data_Available::CUSTOM_DIMENSION_SLUGS as $custom_dimension_slug
		) {
			$this->custom_dimensions_data_available->set_data_available(
				$custom_dimension_slug,
				true
			);
		}

		// Reset data available state for a subset of custom dimensions.
		$this->custom_dimensions_data_available->reset_data_available(
			array(
				'googlesitekit_post_date',
				'googlesitekit_post_author',
			)
		);

		// Verify that the data available state was reset for the subset of custom dimensions.
		$this->assertEquals(
			$this->custom_dimensions_data_available->get_data_availability(),
			array(
				'googlesitekit_post_date'       => false,
				'googlesitekit_post_author'     => false,
				'googlesitekit_post_categories' => true,
				'googlesitekit_post_type'       => true,
				'googlesitekit_event_provider'  => true,
				'googlesitekit_form_id'         => true,
			),
			'Resetting selected custom dimensions should preserve availability for dimensions outside the subset.'
		);

		// Reset data available state for all custom dimensions.
		$this->custom_dimensions_data_available->reset_data_available();

		// Verify that the data available state was reset for all custom dimensions.
		$this->assertEquals(
			$this->custom_dimensions_data_available->get_data_availability(),
			array(
				'googlesitekit_post_date'       => false,
				'googlesitekit_post_author'     => false,
				'googlesitekit_post_categories' => false,
				'googlesitekit_post_type'       => false,
				'googlesitekit_event_provider'  => false,
				'googlesitekit_form_id'         => false,
			),
			'Resetting without a subset should mark every custom dimension as unavailable.'
		);
	}

	public function test_is_valid_custom_dimension() {
		$this->assertTrue(
			$this->custom_dimensions_data_available->is_valid_custom_dimension(
				'googlesitekit_post_date'
			),
			'Post date should be a supported custom dimension.'
		);
		$this->assertTrue(
			$this->custom_dimensions_data_available->is_valid_custom_dimension(
				'googlesitekit_post_author'
			),
			'Post author should be a supported custom dimension.'
		);
		$this->assertTrue(
			$this->custom_dimensions_data_available->is_valid_custom_dimension(
				'googlesitekit_post_categories'
			),
			'Post categories should be a supported custom dimension.'
		);
		$this->assertTrue(
			$this->custom_dimensions_data_available->is_valid_custom_dimension(
				'googlesitekit_post_type'
			),
			'Post type should be a supported custom dimension.'
		);
		$this->assertTrue(
			$this->custom_dimensions_data_available->is_valid_custom_dimension(
				'googlesitekit_event_provider'
			),
			'Event provider should be a supported custom dimension.'
		);
		$this->assertTrue(
			$this->custom_dimensions_data_available->is_valid_custom_dimension(
				'googlesitekit_form_id'
			),
			'Form ID should be a supported custom dimension.'
		);
		$this->assertFalse(
			$this->custom_dimensions_data_available->is_valid_custom_dimension(
				'invalid_custom_dimension'
			),
			'Unknown slug should not be accepted as a custom dimension.'
		);
	}

	public function test_get_data_availability_includes_all_slugs() {
		$availability = $this->custom_dimensions_data_available->get_data_availability();

		$this->assertArrayHasKey( 'googlesitekit_event_provider', $availability, 'Data availability should include the event provider dimension.' );
		$this->assertArrayHasKey( 'googlesitekit_form_id', $availability, 'Data availability should include the form ID dimension.' );
	}
}
