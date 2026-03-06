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
use Google\Site_Kit\Core\Email_Reporting\Email_Notices;
use Google\Site_Kit\Core\Email_Reporting\Email_Report_Data_Section_Part;
use Google\Site_Kit\Core\Email_Reporting\Email_Report_Section_Builder;
use Google\Site_Kit\Core\Email_Reporting\Email_Template_Formatter;
use Google\Site_Kit\Core\Email_Reporting\Notices\Analytics_Setup_Email_Notice;
use Google\Site_Kit\Core\Golinks\Golinks;
use Google\Site_Kit\Core\Modules\Disconnected_Modules;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Email_Template_FormatterTest extends TestCase {


	private $context;
	private $formatter;
	private $manage_options_cap_filter;

	public function set_up() {
		parent::set_up();

		$this->context  = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $this->context );
		$user_options   = new User_Options( $this->context );
		$authentication = new Authentication( $this->context, $options, $user_options );
		$modules        = new Modules( $this->context, $options, $user_options, $authentication );
		$golinks        = new Golinks( $this->context );
		$email_notices  = new Email_Notices(
			$this->context,
			$golinks,
			array(
				new Analytics_Setup_Email_Notice( $this->context, $modules, $golinks ),
			)
		);

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
		$this->assertSame( Analytics_Setup_Email_Notice::ID, $payload['template_data']['header_notices'][0]['id'], 'Expected analytics setup notice ID in template payload.' );
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
}
