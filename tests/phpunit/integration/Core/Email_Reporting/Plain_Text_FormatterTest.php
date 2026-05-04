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

	public function test_format_report_matches_previous_inline_email_report_assembly() {
		$data = array(
			'site'                   => array(
				'domain' => 'example.com',
			),
			'date_range'             => array(
				'label' => 'Dec 9 – Dec 15',
			),
			'primary_call_to_action' => array(
				'label' => 'View dashboard',
				'url'   => 'https://example.com/dashboard',
			),
			'footer'                 => array(
				'copy'            => 'Footer copy',
				'unsubscribe_url' => 'https://example.com/unsubscribe',
				'links'           => array(),
			),
		);

		$sections = array(
			'visitors' => array(
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
				),
			),
			'empty'    => array(
				'title'            => 'Empty section',
				'section_template' => 'section-metrics',
				'section_parts'    => array(),
			),
		);

		$expected = Plain_Text_Formatter::format_header(
			$data['site']['domain'],
			$data['date_range']['label']
		);

		foreach ( $sections as $section ) {
			if ( empty( $section['section_parts'] ) ) {
				continue;
			}
			$expected .= Plain_Text_Formatter::format_section( $section );
		}

		$expected .= Plain_Text_Formatter::format_footer(
			$data['primary_call_to_action'],
			$data['footer']
		);

		$result = Plain_Text_Formatter::format_report( $data, $sections );

		$this->assertSame( $expected, $result, 'Expected format_report output to match previous inline renderer assembly.' );
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
		);

		$result = Plain_Text_Formatter::format_footer( $cta, $footer );

		$expected_footer_block = implode(
			"\n",
			array(
				'',
				'',
				'Manage subscription: https://example.com/unsubscribe',
				'Privacy Policy: https://policies.google.com/privacy',
				'Help center: ' . add_query_arg( 'doc', 'get-support', 'https://sitekit.withgoogle.com/support/' ),
			)
		);

		$this->assertStringContainsString( str_repeat( '-', 50 ), $result, 'Footer should contain separator line.' );
		$this->assertStringContainsString( 'View dashboard: https://example.com/dashboard', $result, 'Footer should contain CTA link.' );
		$this->assertStringContainsString( 'You received this email because you signed up.', $result, 'Footer should contain copy text.' );
		$this->assertStringContainsString( 'Unsubscribe: https://example.com/unsubscribe', $result, 'Footer should contain unsubscribe link as separate line.' );
		$this->assertStringContainsString( $expected_footer_block, $result, 'Footer utility links should appear as a separate-line list preceded by a blank separator line.' );
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

	public function test_format_simple_email() {
		$data = array(
			'site'                   => array(
				'domain' => 'example.com',
			),
			'title'                  => 'admin@example.com invited you to receive periodic performance reports',
			'preheader'              => 'This preheader should not appear in plain text output',
			'body'                   => array(
				'Receive the most important insights about your site\'s performance, key trends, and tailored metrics.',
				'You can easily unsubscribe or change the reports frequency anytime from your Site Kit dashboard.',
			),
			'learn_more_url'         => 'https://sitekit.withgoogle.com/support/?doc=email-reporting',
			'primary_call_to_action' => array(
				'label' => 'Get your report',
				'url'   => 'https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard',
			),
			'footer'                 => array(
				'copy' => 'You received this email because your site admin invited you to use Site Kit email reports feature',
			),
		);

		$result = Plain_Text_Formatter::format_simple_email( $data );

		$this->assertStringContainsString( 'Site Kit by Google', $result, 'Simple email should contain Site Kit branding.' );
		$this->assertStringContainsString( 'example.com', $result, 'Simple email should contain site domain.' );
		$this->assertStringContainsString( 'admin@example.com invited you to receive periodic performance reports', $result, 'Simple email should contain title text.' );
		$this->assertStringNotContainsString( 'This preheader should not appear in plain text output', $result, 'Simple email should not contain preheader text.' );
		$this->assertStringContainsString( 'Receive the most important insights about your site\'s performance', $result, 'Simple email should contain first body paragraph.' );
		$this->assertStringContainsString( 'You can easily unsubscribe or change the reports frequency', $result, 'Simple email should contain second body paragraph.' );
		$this->assertStringContainsString( 'Learn more: https://sitekit.withgoogle.com/support/?doc=email-reporting', $result, 'Simple email should contain Learn more link.' );
		$this->assertStringContainsString( 'Get your report: https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard', $result, 'Simple email should contain CTA link.' );
		$this->assertStringContainsString( 'You received this email because your site admin invited you', $result, 'Simple email should contain footer copy.' );
	}

	public function test_format_simple_email_strips_html_from_title() {
		$data = array(
			'site'  => array( 'domain' => 'example.com' ),
			'title' => '<a href="mailto:admin@example.com" style="color: #161B18;">admin@example.com</a> invited you to receive reports',
			'body'  => array(),
		);

		$result = Plain_Text_Formatter::format_simple_email( $data );

		$this->assertStringContainsString( 'admin@example.com invited you to receive reports', $result, 'Title should have HTML stripped for plain text.' );
		$this->assertStringNotContainsString( '<a ', $result, 'Title should not contain HTML tags.' );
	}

	public function test_format_simple_email_outputs_plain_title_unchanged() {
		$data = array(
			'site'  => array( 'domain' => 'example.com' ),
			'title' => 'Success! You are subscribed',
			'body'  => array(),
		);

		$result = Plain_Text_Formatter::format_simple_email( $data );

		$this->assertStringContainsString( 'Success! You are subscribed', $result, 'Plain title should pass through unchanged.' );
	}

	public function test_format_simple_email_with_missing_data() {
		$data = array(
			'site'                   => array(
				'domain' => 'example.com',
			),
			'title'                  => 'You have been invited to receive performance reports',
			'preheader'              => 'This preheader should not appear in plain text output',
			'body'                   => array(),
			'learn_more_url'         => '',
			'primary_call_to_action' => array(),
			'footer'                 => array(
				'copy' => '',
			),
		);

		$result = Plain_Text_Formatter::format_simple_email( $data );

		$this->assertStringContainsString( 'Site Kit by Google', $result, 'Simple email should contain Site Kit branding even with missing data.' );
		$this->assertStringContainsString( 'example.com', $result, 'Simple email should contain site domain.' );
		$this->assertStringContainsString( 'You have been invited to receive performance reports', $result, 'Simple email should contain title text.' );
		$this->assertStringNotContainsString( 'This preheader should not appear in plain text output', $result, 'Simple email should not contain preheader text.' );
		$this->assertStringNotContainsString( 'Learn more:', $result, 'Simple email should not contain Learn more link when URL is empty.' );
	}

	public function test_convert_links_to_text__converts_anchor_tags() {
		$html = 'Contact your administrator or <a href="https://example.com/help">get help</a>.';

		$result = Plain_Text_Formatter::convert_links_to_text( $html );

		$this->assertSame( 'Contact your administrator or get help (https://example.com/help).', $result, 'Anchor tag should be converted to text with URL in parentheses' );
	}

	public function test_convert_links_to_text__converts_multiple_links() {
		$html = 'Go to <a href="https://example.com/settings">Settings</a> or <a href="https://example.com/help">get help</a>.';

		$result = Plain_Text_Formatter::convert_links_to_text( $html );

		$this->assertSame( 'Go to Settings (https://example.com/settings) or get help (https://example.com/help).', $result, 'Multiple anchor tags should each be converted to text with URLs in parentheses' );
	}

	public function test_convert_links_to_text__preserves_non_link_html() {
		$html = 'This is <strong>important</strong> text without links.';

		$result = Plain_Text_Formatter::convert_links_to_text( $html );

		$this->assertSame( $html, $result, 'Non-link HTML should be preserved.' );
	}

	public function test_convert_links_to_text__handles_string_without_html() {
		$text = 'Plain text with no HTML.';

		$result = Plain_Text_Formatter::convert_links_to_text( $text );

		$this->assertSame( $text, $result, 'Plain text should pass through unchanged.' );
	}

	public function test_convert_links_to_text__handles_style_attribute() {
		$html = 'Contact us or <a href="https://example.com/help" style="color:#108080;">get help</a>.';

		$result = Plain_Text_Formatter::convert_links_to_text( $html );

		$this->assertSame( 'Contact us or get help (https://example.com/help).', $result, 'Anchor with style attribute should be converted correctly.' );
	}

	public function test_convert_links_to_text__handles_class_attribute() {
		$html = 'Visit <a class="link" href="https://example.com/">our site</a> for more.';

		$result = Plain_Text_Formatter::convert_links_to_text( $html );

		$this->assertSame( 'Visit our site (https://example.com/) for more.', $result, 'Anchor with class attribute should be converted correctly.' );
	}

	public function test_convert_links_to_text__handles_multiple_attributes() {
		$html = 'Go to <a class="cta" href="https://example.com/settings" style="color:#108080; font-weight:500;" target="_blank">Settings</a> in Site Kit.';

		$result = Plain_Text_Formatter::convert_links_to_text( $html );

		$this->assertSame( 'Go to Settings (https://example.com/settings) in Site Kit.', $result, 'Anchor with multiple attributes should be converted correctly.' );
	}

	public function test_format_simple_email_body_converts_links_to_text() {
		$data = array(
			'site'                   => array( 'domain' => 'example.com' ),
			'title'                  => 'Test',
			'body'                   => array(
				'Go to <a href="https://example.com/settings">Settings</a> or <a href="https://example.com/help">get help</a>.',
			),
			'primary_call_to_action' => array(),
			'footer'                 => array( 'copy' => '' ),
		);

		$result = Plain_Text_Formatter::format_simple_email( $data );

		$this->assertStringContainsString( 'Settings (https://example.com/settings)', $result, 'Body links should be converted to text format.' );
		$this->assertStringContainsString( 'get help (https://example.com/help)', $result, 'Multiple body links should be converted.' );
		$this->assertStringNotContainsString( '<a ', $result, 'No HTML anchor tags should remain in plain text.' );
	}
}
