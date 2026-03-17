<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Email_Template_FormatterTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking_Settings;
use Google\Site_Kit\Core\Email_Reporting\Email_Notices;
use Google\Site_Kit\Core\Email_Reporting\Email_Report_Data_Section_Part;
use Google\Site_Kit\Core\Email_Reporting\Email_Report_Section_Builder;
use Google\Site_Kit\Core\Email_Reporting\Email_Template_Formatter;
use Google\Site_Kit\Core\Email_Reporting\Sections_Map;
use Google\Site_Kit\Core\Email_Reporting\Notices\Analytics_Setup_Email_Notice;
use Google\Site_Kit\Core\Email_Reporting\Notices\Enable_Conversion_Events_Email_Notice;
use Google\Site_Kit\Core\Golinks\Golinks;
use Google\Site_Kit\Core\Modules\Disconnected_Modules;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_4_Settings;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Email_Template_FormatterTest extends TestCase {

	private $context;
	private $formatter;
	private $options;
	private $manage_options_cap_filter;

	public function set_up() {
		parent::set_up();

		$this->context       = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options             = new Options( $this->context );
		$user_options        = new User_Options( $this->context );
		$authentication      = new Authentication( $this->context, $options, $user_options );
		$modules             = new Modules( $this->context, $options, $user_options, $authentication );
		$golinks             = new Golinks( $this->context );
		$conversion_tracking = $this->createMock( Conversion_Tracking::class );
		$conversion_tracking->method( 'get_active_providers' )->willReturn( array( 'mock-provider' => true ) );
		$email_notices = new Email_Notices(
			$this->context,
			$golinks,
			array(
				new Analytics_Setup_Email_Notice( $this->context, $modules, $golinks ),
				new Enable_Conversion_Events_Email_Notice(
					$this->context,
					$modules,
					$golinks,
					new Conversion_Tracking_Settings( $options ),
					$conversion_tracking
				),
			)
		);
		$this->options = $options;

		$section_builder = $this->createMock( Email_Report_Section_Builder::class );
		$this->formatter = new Email_Template_Formatter( $this->context, $section_builder, $golinks, $email_notices );

		$this->manage_options_cap_filter = function ( $caps, $cap ) {
			if ( Permissions::MANAGE_OPTIONS === $cap ) {
				return array( 'manage_options' );
			}

			return $caps;
		};

		add_filter( 'map_meta_cap', $this->manage_options_cap_filter, 99, 2 );
	}

	public function tear_down() {
		delete_option( Disconnected_Modules::OPTION );
		delete_option( Conversion_Tracking_Settings::OPTION );
		parent::tear_down();
	}

	public function test_build_template_payload__includes_header_notices_when_eligible() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$user    = get_user_by( 'id', $user_id );

		$payload = $this->formatter->build_template_payload(
			array( $this->get_total_conversion_events_section() ),
			Email_Reporting_Settings::FREQUENCY_WEEKLY,
			$this->get_date_range(),
			$user
		);

		$this->assertNotWPError( $payload, 'Expected template payload to be built successfully.' );
		$this->assertArrayHasKey( 'header_notices', $payload['template_data'], 'Expected header_notices key in template data.' );
		$this->assertCount( 1, $payload['template_data']['header_notices'], 'Expected one eligible header notice.' );
		$this->assertSame( 'analytics-setup', $payload['template_data']['header_notices'][0]['id'], 'Expected analytics setup notice ID in template payload.' );
	}

	public function test_build_template_payload__includes_empty_header_notices_when_ineligible() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$user    = get_user_by( 'id', $user_id );

		update_option(
			Disconnected_Modules::OPTION,
			array(
				'analytics-4' => time(),
			)
		);

		$payload = $this->formatter->build_template_payload(
			array( $this->get_total_conversion_events_section() ),
			Email_Reporting_Settings::FREQUENCY_WEEKLY,
			$this->get_date_range(),
			$user
		);

		$this->assertNotWPError( $payload, 'Expected template payload to be built successfully.' );
		$this->assertArrayHasKey( 'header_notices', $payload['template_data'], 'Expected header_notices key in template data.' );
		$this->assertSame( array(), $payload['template_data']['header_notices'], 'Expected no header notices when analytics was previously connected/disconnected.' );
	}

	public function test_build_template_payload__includes_section_notices_when_eligible() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$user    = get_user_by( 'id', $user_id );

		$this->set_analytics_settings_connected();

		$payload = $this->formatter->build_template_payload(
			array( $this->get_total_conversion_events_section() ),
			Email_Reporting_Settings::FREQUENCY_WEEKLY,
			$this->get_date_range(),
			$user
		);

		$this->assertNotWPError( $payload, 'Expected template payload to be built successfully.' );
		$this->assertArrayHasKey( 'section_notices', $payload['template_data'], 'Expected section_notices key in template data.' );
		$this->assertArrayHasKey( 'is_my_site_helping_my_business_grow', $payload['template_data']['section_notices'], 'Expected conversion section notices to be keyed by section slug.' );
		$this->assertCount( 1, $payload['template_data']['section_notices']['is_my_site_helping_my_business_grow'], 'Expected one eligible conversion section notice.' );
		$this->assertSame( 'enable-conversion-events', $payload['template_data']['section_notices']['is_my_site_helping_my_business_grow'][0]['id'], 'Expected conversion notice ID in section notices.' );
	}

	public function test_build_template_payload__includes_empty_section_notices_when_ineligible() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$user    = get_user_by( 'id', $user_id );

		$this->set_analytics_settings_connected();
		( new Conversion_Tracking_Settings( $this->options ) )->set( array( 'enabled' => true ) );

		$payload = $this->formatter->build_template_payload(
			array( $this->get_total_conversion_events_section() ),
			Email_Reporting_Settings::FREQUENCY_WEEKLY,
			$this->get_date_range(),
			$user
		);

		$this->assertNotWPError( $payload, 'Expected template payload to be built successfully.' );
		$this->assertArrayHasKey( 'section_notices', $payload['template_data'], 'Expected section_notices key in template data.' );
		$this->assertSame( array(), $payload['template_data']['section_notices'], 'Expected no section notices when conversion tracking is enabled.' );
	}

	public function test_build_template_payload__forces_conversions_section_when_notice_only_is_eligible() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$user    = get_user_by( 'id', $user_id );

		$this->set_analytics_settings_connected();

		$payload = $this->formatter->build_template_payload(
			array( $this->get_total_visitors_section() ),
			Email_Reporting_Settings::FREQUENCY_WEEKLY,
			$this->get_date_range(),
			$user
		);

		$this->assertNotWPError( $payload, 'Expected template payload to be built successfully.' );
		$this->assertArrayHasKey( Sections_Map::CONVERSIONS_NOTICE_ONLY_FLAG, $payload['sections_payload'], 'Expected conversions notice-only flag to be present in sections payload.' );
		$this->assertTrue( $payload['sections_payload'][ Sections_Map::CONVERSIONS_NOTICE_ONLY_FLAG ], 'Expected conversions notice-only flag to be true.' );
		$this->assertArrayHasKey( 'is_my_site_helping_my_business_grow', $payload['template_data']['section_notices'], 'Expected conversion section notice to be present when only non-conversion metric data exists.' );
	}

	public function test_build_template_payload__returns_no_data_error_when_report_has_no_sections_even_if_notice_is_eligible() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$user    = get_user_by( 'id', $user_id );

		$this->set_analytics_settings_connected();

		$payload = $this->formatter->build_template_payload(
			array(),
			Email_Reporting_Settings::FREQUENCY_WEEKLY,
			$this->get_date_range(),
			$user
		);

		$this->assertWPError( $payload, 'Expected no data error when no report sections are available.' );
		$this->assertSame( 'email_report_no_data', $payload->get_error_code(), 'Expected no data error code when report has no data sections.' );
	}

	/**
	 * Gets a minimal valid date range.
	 *
	 * @return array
	 */
	private function get_date_range() {
		return array(
			'startDate'        => '2024-01-01',
			'endDate'          => '2024-01-07',
			'compareStartDate' => '2023-12-25',
			'compareEndDate'   => '2023-12-31',
		);
	}

	/**
	 * Gets a minimal valid section for template payload generation.
	 *
	 * @return Email_Report_Data_Section_Part
	 */
	private function get_total_conversion_events_section() {
		return new Email_Report_Data_Section_Part(
			'total_conversion_events',
			array(
				'title'  => 'Conversions',
				'labels' => array( 'Total conversions' ),
				'values' => array( '10' ),
				'trends' => array( '5.5' ),
			)
		);
	}

	/**
	 * Gets a minimal non-conversion section for template payload generation.
	 *
	 * @return Email_Report_Data_Section_Part
	 */
	private function get_total_visitors_section() {
		return new Email_Report_Data_Section_Part(
			'total_visitors',
			array(
				'title'  => 'Visitors',
				'labels' => array( 'Total visitors' ),
				'values' => array( '100' ),
				'trends' => array( '10.5' ),
			)
		);
	}

	/**
	 * Marks Analytics as connected for notice eligibility checks.
	 */
	private function set_analytics_settings_connected() {
		$this->options->set( Modules::OPTION_ACTIVE_MODULES, array( Analytics_4::MODULE_SLUG ) );

		$settings = new Analytics_4_Settings( $this->options );
		$settings->merge(
			array(
				'accountID'       => '12345678',
				'propertyID'      => '987654321',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
			)
		);
	}
}
