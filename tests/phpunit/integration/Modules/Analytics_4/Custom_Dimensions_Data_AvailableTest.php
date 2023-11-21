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
			)
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
			)
		);
	}
}
