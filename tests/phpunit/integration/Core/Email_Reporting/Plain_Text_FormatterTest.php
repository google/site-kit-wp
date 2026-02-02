<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Plain_Text_FormatterTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Core\Email_Reporting\Plain_Text_Formatter;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Plain_Text_FormatterTest extends TestCase {

	public function test_format_header() {
		$site_domain = 'example.com';
		$date_label  = 'Dec 9 – Dec 15';

		$result = Plain_Text_Formatter::format_header( $site_domain, $date_label );

		$this->assertStringContainsString( 'Site Kit by Google', $result, 'Header should contain Site Kit branding.' );
		$this->assertStringContainsString( 'Your performance at a glance', $result, 'Header should contain performance title.' );
		$this->assertStringContainsString( $site_domain, $result, 'Header should contain site domain.' );
		$this->assertStringContainsString( $date_label, $result, 'Header should contain date label.' );
		$this->assertStringContainsString( str_repeat( '-', 50 ), $result, 'Header should contain separator line.' );
	}

	public function test_format_section_heading() {
		$title = 'Test Section';

		$result = Plain_Text_Formatter::format_section_heading( $title );

		$this->assertStringContainsString( $title, $result, 'Section heading should contain title.' );
		$this->assertStringContainsString( str_repeat( '=', strlen( $title ) ), $result, 'Section heading should contain underline.' );
	}

	public function test_format_metric_with_positive_change() {
		$label  = 'Total visitors';
		$value  = '1.2K';
		$change = 12.5;

		$result = Plain_Text_Formatter::format_metric( $label, $value, $change );

		$this->assertEquals( 'Total visitors: 1.2K (+12.5%)', $result, 'Metric should format with positive change.' );
	}

	public function test_format_metric_with_negative_change() {
		$label  = 'Total visitors';
		$value  = '1.2K';
		$change = -5.3;

		$result = Plain_Text_Formatter::format_metric( $label, $value, $change );

		$this->assertEquals( 'Total visitors: 1.2K (-5.3%)', $result, 'Metric should format with negative change.' );
	}

	public function test_format_metric_with_null_change() {
		$label  = 'Total visitors';
		$value  = '1.2K';
		$change = null;

		$result = Plain_Text_Formatter::format_metric( $label, $value, $change );

		$this->assertEquals( 'Total visitors: 1.2K', $result, 'Metric should format without change when null.' );
	}

	public function test_format_metric_with_zero_change() {
		$label  = 'Total visitors';
		$value  = '1.2K';
		$change = 0;

		$result = Plain_Text_Formatter::format_metric( $label, $value, $change );

		$this->assertEquals( 'Total visitors: 1.2K (0%)', $result, 'Metric should format with zero change.' );
	}

	public function test_format_page_row_without_url() {
		$label  = 'Homepage';
		$value  = '500';
		$change = 5.0;

		$result = Plain_Text_Formatter::format_page_row( $label, $value, $change );

		$this->assertStringContainsString( '• Homepage: 500 (+5%)', $result, 'Page row should format without URL.' );
	}

	public function test_format_page_row_with_url() {
		$label  = 'Homepage';
		$value  = '500';
		$change = 5.0;
		$url    = 'https://example.com/';

		$result = Plain_Text_Formatter::format_page_row( $label, $value, $change, $url );

		$this->assertStringContainsString( '• Homepage: 500 (+5%)', $result, 'Page row should format with change.' );
		$this->assertStringContainsString( $url, $result, 'Page row should contain URL.' );
	}

	public function test_format_link() {
		$label = 'View dashboard';
		$url   = 'https://example.com/dashboard';

		$result = Plain_Text_Formatter::format_link( $label, $url );

		$this->assertEquals( 'View dashboard: https://example.com/dashboard', $result, 'Link should format with label and URL.' );
	}

	public function test_format_change_positive() {
		$result = Plain_Text_Formatter::format_change( 12.5 );
		$this->assertEquals( '(+12.5%)', $result, 'Positive change should have plus prefix.' );
	}

	public function test_format_change_negative() {
		$result = Plain_Text_Formatter::format_change( -5.3 );
		$this->assertEquals( '(-5.3%)', $result, 'Negative change should have minus prefix.' );
	}

	public function test_format_change_null() {
		$result = Plain_Text_Formatter::format_change( null );
		$this->assertEquals( '', $result, 'Null change should return empty string.' );
	}

	public function test_format_footer() {
		$cta = array(
			'label' => 'View dashboard',
			'url'   => 'https://example.com/dashboard',
		);

		$footer = array(
			'copy'            => 'You received this email because you signed up.',
			'unsubscribe_url' => 'https://example.com/unsubscribe',
			'links'           => array(
				array(
					'label' => 'Help center',
					'url'   => 'https://example.com/help',
				),
				array(
					'label' => 'Privacy Policy',
					'url'   => 'https://example.com/privacy',
				),
			),
		);

		$result = Plain_Text_Formatter::format_footer( $cta, $footer );

		$this->assertStringContainsString( str_repeat( '-', 50 ), $result, 'Footer should contain separator line.' );
		$this->assertStringContainsString( 'View dashboard: https://example.com/dashboard', $result, 'Footer should contain CTA link.' );
		$this->assertStringContainsString( 'You received this email because you signed up.', $result, 'Footer should contain copy text.' );
		$this->assertStringContainsString( 'https://example.com/unsubscribe', $result, 'Footer should contain unsubscribe URL.' );
		$this->assertStringContainsString( 'Help center: https://example.com/help', $result, 'Footer should contain help center link.' );
		$this->assertStringContainsString( 'Privacy Policy: https://example.com/privacy', $result, 'Footer should contain privacy policy link.' );
	}

	public function test_format_section_dispatches_to_metrics_section() {
		$section = array(
			'title'            => 'How many people are finding my site?',
			'section_template' => 'section-metrics',
			'section_parts'    => array(
				'total_visitors' => array(
					'data' => array(
						'label'          => 'Total visitors',
						'value'          => '1.2K',
						'change'         => 12.5,
						'change_context' => 'Compared to previous 7 days',
					),
				),
				'new_visitors'   => array(
					'data' => array(
						'label'  => 'New visitors',
						'value'  => '800',
						'change' => 8.2,
					),
				),
			),
		);

		$result = Plain_Text_Formatter::format_section( $section );

		$this->assertStringContainsString( 'How many people are finding my site?', $result, 'Metrics section should contain title.' );
		$this->assertStringContainsString( 'Total visitors: 1.2K (+12.5%)', $result, 'Metrics section should contain total visitors metric.' );
		$this->assertStringContainsString( 'New visitors: 800 (+8.2%)', $result, 'Metrics section should contain new visitors metric.' );
		$this->assertStringContainsString( 'Compared to previous 7 days', $result, 'Metrics section should contain change context.' );
	}

	public function test_format_section_dispatches_to_page_metrics_section() {
		$section = array(
			'title'            => 'How are people finding me?',
			'section_template' => 'section-page-metrics',
			'section_parts'    => array(
				'traffic_channels' => array(
					'data' => array(
						'change_context'   => 'Compared to previous 7 days',
						'dimension_values' => array( 'Organic Search', 'Direct' ),
						'values'           => array( '500', '300' ),
						'changes'          => array( 10.5, -2.3 ),
					),
				),
			),
		);

		$result = Plain_Text_Formatter::format_section( $section );

		$this->assertStringContainsString( 'How are people finding me?', $result, 'Page metrics section should contain title.' );
		$this->assertStringContainsString( 'Traffic channels by visitor count', $result, 'Page metrics section should contain part label.' );
		$this->assertStringContainsString( 'Organic Search: 500 (+10.5%)', $result, 'Page metrics section should contain first row.' );
		$this->assertStringContainsString( 'Direct: 300 (-2.3%)', $result, 'Page metrics section should contain second row.' );
	}

	public function test_format_section_dispatches_to_conversions_section() {
		$section = array(
			'title'            => 'Is my site helping my business grow?',
			'section_template' => 'section-conversions',
			'section_parts'    => array(
				'total_conversion_events' => array(
					'data' => array(
						'label'          => 'Total conversions',
						'value'          => '150',
						'change'         => 25.0,
						'change_context' => 'Compared to previous 7 days',
					),
				),
				'purchases'               => array(
					'data' => array(
						'label'           => 'Purchases',
						'value'           => '50',
						'change'          => 15.0,
						'event_name'      => 'purchase',
						'dimension'       => 'traffic_channel',
						'dimension_value' => 'Organic Search',
					),
				),
			),
		);

		$result = Plain_Text_Formatter::format_section( $section );

		$this->assertStringContainsString( 'Is my site helping my business grow?', $result, 'Conversions section should contain title.' );
		$this->assertStringContainsString( 'Total conversions: 150 (+25%)', $result, 'Conversions section should contain total conversions.' );
		$this->assertStringContainsString( 'Purchases', $result, 'Conversions section should contain purchases label.' );
		$this->assertStringContainsString( '“Purchase“ events', $result, 'Conversions section should contain event name.' );
		$this->assertStringContainsString( 'Top traffic channel driving the most conversions: Organic Search', $result, 'Conversions section should contain top traffic channel.' );
	}

	public function test_format_section_returns_empty_for_empty_section_parts() {
		$section = array(
			'title'            => 'Empty Section',
			'section_template' => 'section-metrics',
			'section_parts'    => array(),
		);

		$result = Plain_Text_Formatter::format_section( $section );

		$this->assertEquals( '', $result, 'Section with empty parts should return empty string.' );
	}

	public function test_format_section_returns_empty_for_unknown_template() {
		$section = array(
			'title'            => 'Unknown Template',
			'section_template' => 'unknown-template',
			'section_parts'    => array(
				'some_part' => array(
					'data' => array( 'value' => 'test' ),
				),
			),
		);

		$result = Plain_Text_Formatter::format_section( $section );

		$this->assertEquals( '', $result, 'Section with unknown template should return empty string.' );
	}

	public function test_format_invitation_email() {
		$data = array(
			'site'                   => array(
				'domain' => 'example.com',
			),
			'inviter_email'          => 'admin@example.com',
			'learn_more_url'         => 'https://sitekit.withgoogle.com/documentation/email-reports/',
			'primary_call_to_action' => array(
				'label' => 'Get your report',
				'url'   => 'https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard',
			),
			'footer'                 => array(
				'copy' => 'You received this email because your site admin invited you to use Site Kit email reports feature',
			),
		);

		$result = Plain_Text_Formatter::format_invitation_email( $data );

		$this->assertStringContainsString( 'Site Kit by Google', $result, 'Invitation email should contain Site Kit branding.' );
		$this->assertStringContainsString( 'example.com', $result, 'Invitation email should contain site domain.' );
		$this->assertStringContainsString( 'admin@example.com invited you to receive periodic performance reports', $result, 'Invitation email should contain inviter email and invitation text.' );
		$this->assertStringContainsString( 'Receive the most important insights about your site\'s performance', $result, 'Invitation email should contain description.' );
		$this->assertStringContainsString( 'Learn more: https://sitekit.withgoogle.com/documentation/email-reports/', $result, 'Invitation email should contain Learn more link.' );
		$this->assertStringContainsString( 'You can easily unsubscribe or change the reports frequency', $result, 'Invitation email should contain unsubscribe note.' );
		$this->assertStringContainsString( 'Get your report: https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard', $result, 'Invitation email should contain CTA link.' );
		$this->assertStringContainsString( 'You received this email because your site admin invited you', $result, 'Invitation email should contain footer copy.' );
	}

	public function test_format_invitation_email_with_missing_data() {
		$data = array(
			'site'                   => array(
				'domain' => 'example.com',
			),
			'inviter_email'          => 'admin@example.com',
			'learn_more_url'         => '',
			'primary_call_to_action' => array(),
			'footer'                 => array(
				'copy' => '',
			),
		);

		$result = Plain_Text_Formatter::format_invitation_email( $data );

		$this->assertStringContainsString( 'Site Kit by Google', $result, 'Invitation email should contain Site Kit branding even with missing data.' );
		$this->assertStringContainsString( 'example.com', $result, 'Invitation email should contain site domain.' );
		$this->assertStringContainsString( 'admin@example.com invited you to receive periodic performance reports', $result, 'Invitation email should contain invitation text.' );
	}
}
