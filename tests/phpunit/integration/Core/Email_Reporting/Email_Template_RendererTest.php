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
}
