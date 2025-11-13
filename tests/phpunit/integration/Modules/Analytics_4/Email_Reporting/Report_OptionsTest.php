<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting\Report_OptionsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options as Core_Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Audience_Settings as User_Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings as Module_Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Analytics_4_Report_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Analytics_4_Report_OptionsTest extends TestCase {

	/**
	 * Plugin context.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Test user ID.
	 *
	 * @var int
	 */
	private $user_id;

	public function set_up() {
		parent::set_up();
		$this->user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $this->user_id );
		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->reset_audience_settings();
	}

	public function tear_down() {
		wp_set_current_user( 0 );
		$this->reset_audience_settings();
		parent::tear_down();
	}

	public function test_total_visitors_report_includes_compare_dates() {
		$builder = $this->create_builder();
		$options = $builder->get_total_visitors_report_options();

		$this->assertArrayHasKey( 'startDate', $options, 'Total visitors report should include startDate.' );
		$this->assertArrayHasKey( 'endDate', $options, 'Total visitors report should include endDate.' );
		$this->assertArrayHasKey( 'compareStartDate', $options, 'Total visitors report should include compareStartDate.' );
		$this->assertArrayHasKey( 'compareEndDate', $options, 'Total visitors report should include compareEndDate.' );

		$this->assertEquals(
			array( array( 'name' => 'totalUsers' ) ),
			$options['metrics'],
			'Total visitors report should request the totalUsers metric.'
		);
	}

	public function test_total_visitors_respects_custom_date_range() {
		$date_range = array(
			'startDate'        => '2024-02-01',
			'endDate'          => '2024-02-07',
			'compareStartDate' => '2024-01-25',
			'compareEndDate'   => '2024-01-31',
		);

		$builder = $this->create_builder( $date_range );
		$options = $builder->get_total_visitors_report_options();

		$this->assertSame( '2024-02-01', $options['startDate'], 'Start date should match provided date range.' );
		$this->assertSame( '2024-02-07', $options['endDate'], 'End date should match provided date range.' );
		$this->assertSame( '2024-01-25', $options['compareStartDate'], 'Compare start should match provided compare range.' );
		$this->assertSame( '2024-01-31', $options['compareEndDate'], 'Compare end should match provided compare range.' );
	}

	public function test_products_added_to_cart_report_orders_by_metric() {
		$builder = $this->create_builder();
		$options = $builder->get_products_added_to_cart_report_options();

		$this->assertEquals(
			array(
				array( 'name' => 'sessionDefaultChannelGroup' ),
			),
			$options['dimensions'],
			'Add to cart report should group by default channel group.'
		);

		$this->assertEquals(
			array(
				array(
					'metric' => array( 'metricName' => 'addToCarts' ),
					'desc'   => true,
				),
			),
			$options['orderby'],
			'Add to cart report should order by addToCarts metric.'
		);
	}

	public function test_top_categories_uses_custom_dimension() {
		$builder = $this->create_builder();
		$options = $builder->get_top_categories_report_options();

		$expected_dimension = sprintf(
			'customEvent:%s',
			Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES
		);

		$this->assertSame(
			$expected_dimension,
			$options['dimensions'][0]['name'],
			'Top categories report should reference the custom category dimension.'
		);

		$this->assertSame( 3, $options['limit'], 'Top categories report should limit to three rows.' );
	}

	public function test_new_visitors_uses_site_kit_audience_when_available() {
		$audience_resource = 'properties/1234/audiences/567';
		$this->set_available_audiences(
			array(
				array(
					'name'         => $audience_resource,
					'displayName'  => 'New Visitors',
					'audienceSlug' => 'new-visitors',
				),
			)
		);
		$builder = $this->create_builder();
		$options = $builder->get_new_visitors_report_options();

		$this->assertSame(
			'audienceResourceName',
			$options['dimensions'][0]['name'],
			'When an audience resource exists, the report should target the audience dimension.'
		);
		$this->assertSame(
			$audience_resource,
			$options['dimensionFilters']['audienceResourceName']['value'],
			'Audience resource name should be applied as a dimension filter.'
		);
		$this->assertEquals(
			array( array( 'name' => 'totalUsers' ) ),
			$options['metrics'],
			'Audience-backed report should request totalUsers.'
		);
	}

	public function test_returning_visitors_falls_back_without_audience() {
		$builder = $this->create_builder();
		$options = $builder->get_returning_visitors_report_options();

		$this->assertSame(
			'newVsReturning',
			$options['dimensions'][0]['name'],
			'Fallback should rely on the newVsReturning dimension.'
		);
		$this->assertSame(
			'returning',
			$options['dimensionFilters']['newVsReturning']['value'],
			'Fallback should restrict to the returning cohort.'
		);
	}

	public function test_get_custom_audiences_report_options_returns_empty_array_when_missing() {
		$this->reset_audience_settings();
		$builder = $this->create_builder();
		$options = $builder->get_custom_audiences_report_options();

		$this->assertSame(
			array(
				'options'   => array(),
				'audiences' => array(),
			),
			$options,
			'When no audiences are configured the helper should return empty payload data.'
		);
	}

	public function test_get_custom_audiences_report_options_builds_expected_payload() {
		$resource_one = 'properties/12345/audiences/1';
		$resource_two = 'properties/12345/audiences/2';
		$this->set_configured_audiences( array( $resource_one, $resource_two, $resource_one ) );
		$this->set_available_audiences(
			array(
				array(
					'name'        => $resource_one,
					'displayName' => 'Audience One',
				),
				array(
					'name'        => $resource_two,
					'displayName' => 'Audience Two',
				),
			)
		);

		$builder = $this->create_builder();

		$result = $builder->get_custom_audiences_report_options();

		$this->assertArrayHasKey( 'options', $result, 'Custom audiences payload should include options key.' );
		$this->assertArrayHasKey( 'audiences', $result, 'Custom audiences payload should include audiences key.' );

		$options = $result['options'];

		$this->assertArrayHasKey( 'dimensionFilters', $options, 'Custom audiences options should include dimension filters.' );
		$this->assertArrayHasKey( 'audienceResourceName', $options['dimensionFilters'], 'Custom audiences filters should include audienceResourceName.' );

		$this->assertSame(
			array( $resource_one, $resource_two ),
			$options['dimensionFilters']['audienceResourceName'],
			'Configured audience resource names should be applied as filters.'
		);

		$metric_names = wp_list_pluck( $options['metrics'], 'name' );
		$this->assertEquals( array( 'totalUsers' ), $metric_names, 'Custom audiences should request totalUsers metric.' );

		$this->assertSame(
			'audienceResourceName',
			$options['dimensions'][0]['name'],
			'Custom audiences should dimension on audienceResourceName.'
		);

		$this->assertSame(
			array(
				array(
					'resourceName' => $resource_one,
					'displayName'  => 'Audience One',
				),
				array(
					'resourceName' => $resource_two,
					'displayName'  => 'Audience Two',
				),
			),
			$result['audiences'],
			'Custom audiences payload should return matching audience metadata.'
		);
	}

	/**
	 * Creates a builder instance with the shared context.
	 *
	 * @param array $date_range    Optional date range payload.
	 * @param array $compare_range Optional compare range override.
	 * @return Analytics_4_Report_Options
	 */
	private function create_builder( $date_range = array(), $compare_range = array() ) {
		if ( empty( $date_range ) ) {
			$date_range = $this->get_default_date_range();
		}

		return new Analytics_4_Report_Options( $this->context, $date_range, $compare_range );
	}

	/**
	 * Resets audience settings to defaults.
	 */
	private function reset_audience_settings() {
		$user_settings = new User_Audience_Settings( new User_Options( $this->context ) );
		$user_settings->set(
			array(
				'configuredAudiences'                => null,
				'isAudienceSegmentationWidgetHidden' => false,
				'didSetAudiences'                    => false,
			)
		);

		$module_settings = new Module_Audience_Settings( new Core_Options( $this->context ) );
		$module_settings->set(
			array(
				'availableAudiences'                   => null,
				'availableAudiencesLastSyncedAt'       => 0,
				'audienceSegmentationSetupCompletedBy' => null,
			)
		);
	}

	/**
	 * Helper to set configured audiences.
	 *
	 * @param array $resource_names Resource names to configure.
	 */
	private function set_configured_audiences( array $resource_names ) {
		$user_settings = new User_Audience_Settings( new User_Options( $this->context ) );
		$user_settings->set(
			array(
				'configuredAudiences'                => $resource_names,
				'isAudienceSegmentationWidgetHidden' => false,
				'didSetAudiences'                    => ! empty( $resource_names ),
			)
		);
	}

	/**
	 * Helper to set available audience metadata.
	 *
	 * @param array $audiences Audience metadata list.
	 */
	private function set_available_audiences( array $audiences ) {
		$module_settings = new Module_Audience_Settings( new Core_Options( $this->context ) );
		$module_settings->set(
			array(
				'availableAudiences'                   => $audiences,
				'availableAudiencesLastSyncedAt'       => time(),
				'audienceSegmentationSetupCompletedBy' => null,
			)
		);
	}

	/**
	 * Default date range payload for tests.
	 *
	 * @return array
	 */
	private function get_default_date_range() {
		return array(
			'startDate'        => '2024-01-01',
			'endDate'          => '2024-01-07',
			'compareStartDate' => '2023-12-25',
			'compareEndDate'   => '2023-12-31',
		);
	}
}
