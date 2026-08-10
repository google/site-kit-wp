<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Email_Template_RendererTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Email_Template_Renderer;
use Google\Site_Kit\Core\Email_Reporting\Sections_Map;
use Google\Site_Kit\Core\Golinks\Dashboard_Golink_Handler;
use Google\Site_Kit\Core\Golinks\Golinks;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Email_Template_RendererTest extends TestCase {

	public function test_email_report_header_notice_renders_only_when_present() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$golinks = new Golinks( $context );
		$golinks->register_handler( 'dashboard', new Dashboard_Golink_Handler() );

		$payload = array(
			'total_visitors' => array(
				'label'          => 'Total visitors',
				'value'          => '120',
				'change'         => 20,
				'change_context' => 'Compared to previous 7 days',
			),
		);

		$sections_map = new Sections_Map( $context, $payload, $golinks );
		$renderer     = new Email_Template_Renderer( $sections_map );

		$template_data = array(
			'subject'                => 'Test subject',
			'preheader'              => 'Test preheader',
			'site'                   => array(
				'domain' => 'example.com',
				'url'    => 'https://example.com',
			),
			'date_range'             => array(
				'label'   => 'Jan 1 – Jan 7',
				'context' => 'Compared to previous 7 days',
			),
			'header_notices'         => array(
				array(
					'id'               => 'analytics-setup',
					'title'            => 'Notice title',
					'body'             => 'Notice body',
					'learn_more_label' => 'Learn more',
					'learn_more_url'   => 'https://example.com/learn-more',
					'cta_label'        => 'Complete setup',
					'cta_url'          => 'https://example.com/notice-cta',
				),
			),
			'primary_call_to_action' => array(
				'label' => 'View dashboard',
				'url'   => 'https://example.com/dashboard',
			),
			'footer'                 => array(
				'copy'            => 'Footer text',
				'unsubscribe_url' => 'https://example.com/unsubscribe',
				'links'           => array(),
			),
		);

		$html_output = $renderer->render( 'email-report', $template_data );

		$this->assertStringContainsString( 'googlesitekit-email-report-notice', $html_output, 'Expected notice markup in header.' );
		$this->assertStringContainsString( 'Notice title', $html_output, 'Expected notice title in rendered email.' );
		$this->assertStringContainsString( 'Notice body', $html_output, 'Expected notice body in rendered email.' );
		$this->assertStringContainsString( 'Learn more', $html_output, 'Expected notice learn more label in rendered email.' );
		$this->assertStringContainsString( 'https://example.com/learn-more', $html_output, 'Expected notice learn more URL in rendered email.' );
		$this->assertStringContainsString( 'Complete setup', $html_output, 'Expected notice CTA label in rendered email.' );
		$this->assertStringContainsString( 'https://example.com/notice-cta', $html_output, 'Expected notice CTA URL in rendered email.' );

		$template_data['header_notices'] = array();
		$html_output_without_notice      = $renderer->render( 'email-report', $template_data );

		$this->assertStringNotContainsString( 'class="googlesitekit-email-report-notice"', $html_output_without_notice, 'Expected notice markup to be absent when no header notices are provided.' );
		$this->assertStringNotContainsString( 'Notice title', $html_output_without_notice, 'Expected notice title to be absent when no header notices are provided.' );
		$this->assertStringNotContainsString( 'https://example.com/notice-cta', $html_output_without_notice, 'Expected notice CTA URL to be absent when no header notices are provided.' );
	}

	public function test_email_report_footer_renders_localised_unsubscribe_link() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$golinks = new Golinks( $context );
		$golinks->register_handler( 'dashboard', new Dashboard_Golink_Handler() );

		$payload = array(
			'total_visitors' => array(
				'label'          => 'Total visitors',
				'value'          => '120',
				'change'         => 20,
				'change_context' => 'Compared to previous 7 days',
			),
		);

		$sections_map = new Sections_Map( $context, $payload, $golinks );
		$renderer     = new Email_Template_Renderer( $sections_map );

		$template_data = array(
			'subject'                => 'Test subject',
			'preheader'              => 'Test preheader',
			'site'                   => array(
				'domain' => 'example.com',
				'url'    => 'https://example.com',
			),
			'date_range'             => array(
				'label'   => 'Jan 1 – Jan 7',
				'context' => 'Compared to previous 7 days',
			),
			'header_notices'         => array(),
			'primary_call_to_action' => array(
				'label' => 'View dashboard',
				'url'   => 'https://example.com/dashboard',
			),
			'footer'                 => array(
				'copy'            => 'You received this email because you signed up to receive email reports from Site Kit. If you do not want to receive these emails in the future you can <a class="link" href="https://example.com/unsubscribe" style="text-decoration:none;">unsubscribe</a>.',
				'unsubscribe_url' => 'https://example.com/unsubscribe',
				'links'           => array(),
			),
		);

		$html_output = $renderer->render( 'email-report', $template_data );

		$this->assertStringContainsString( '>unsubscribe</a>.', $html_output, 'Expected the rendered footer to keep the descriptive unsubscribe link text.' );
		$this->assertStringContainsString( 'class="link"', $html_output, 'Expected the rendered unsubscribe link to keep its class attribute.' );
		$this->assertStringContainsString( 'href="https://example.com/unsubscribe"', $html_output, 'Expected the rendered unsubscribe link to keep its href attribute.' );
		$this->assertStringNotContainsString( '>here</a>', $html_output, 'Expected footer copy to not use inaccessible "here" link text.' );
	}

	public function test_dashboard_link_renders_outlook_vml_and_html_anchor_branches() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$golinks = new Golinks( $context );
		$golinks->register_handler( 'dashboard', new Dashboard_Golink_Handler() );

		$payload = array(
			'total_visitors' => array(
				'label'          => 'Total visitors',
				'value'          => '120',
				'change'         => 20,
				'change_context' => 'Compared to previous 7 days',
			),
		);

		$sections_map = new Sections_Map( $context, $payload, $golinks );
		$renderer     = new Email_Template_Renderer( $sections_map );

		$template_data = array(
			'subject'                => 'Test subject',
			'preheader'              => 'Test preheader',
			'site'                   => array(
				'domain' => 'example.com',
				'url'    => 'https://example.com',
			),
			'date_range'             => array(
				'label'   => 'Jan 1 – Jan 7',
				'context' => 'Compared to previous 7 days',
			),
			'header_notices'         => array(),
			'primary_call_to_action' => array(
				'label' => 'View dashboard',
				'url'   => 'https://example.com/dashboard',
			),
			'footer'                 => array(
				'copy'            => 'Footer text',
				'unsubscribe_url' => 'https://example.com/unsubscribe',
				'links'           => array(),
			),
		);

		$html_output = $renderer->render( 'email-report', $template_data );

		$vml_matched = preg_match( '#<v:roundrect[^>]*href="https://example\.com/dashboard"[^>]*>(.*?)</v:roundrect>#s', $html_output, $vml_matches );
		$this->assertSame( 1, $vml_matched, 'Expected an Outlook VML roundrect button linking to the dashboard.' );
		$this->assertStringContainsString( 'View dashboard', $vml_matches[1], 'Expected the label inside the VML roundrect branch.' );

		$anchor_matched = preg_match( '#<a class="button" href="https://example\.com/dashboard"[^>]*>(.*?)</a>#s', $html_output, $anchor_matches );
		$this->assertSame( 1, $anchor_matched, 'Expected an HTML anchor button linking to the dashboard.' );
		$this->assertStringContainsString( 'View dashboard', $anchor_matches[1], 'Expected the label inside the HTML anchor branch.' );
	}
}
