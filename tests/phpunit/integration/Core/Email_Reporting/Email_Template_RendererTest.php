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

	public function test_conversions_section_uses_top_two_dynamic_events_and_raw_event_names() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$golinks = new Golinks( $context );
		$golinks->register_handler( 'dashboard', new Dashboard_Golink_Handler() );
		$date_label   = 'Jan 1 – Jan 7';
		$payload      = array(
			'total_conversion_events'         => array(
				'label'          => 'Total conversions',
				'value'          => '120',
				'change'         => 20,
				'change_context' => 'Compared to previous 7 days',
			),
			'conversion_event_add_to_cart'    => array(
				'label'           => 'add_to_cart',
				'value'           => '45',
				'change'          => 15,
				'event_name'      => 'add_to_cart',
				'dimension'       => 'sessionDefaultChannelGroup',
				'dimension_value' => 'Organic Search',
				'change_context'  => 'Compared to previous 7 days',
			),
			'conversion_event_purchase'       => array(
				'label'           => 'purchase',
				'value'           => '30',
				'change'          => 10,
				'event_name'      => 'purchase',
				'dimension'       => 'sessionDefaultChannelGroup',
				'dimension_value' => 'Direct',
				'change_context'  => 'Compared to previous 7 days',
			),
			'conversion_event_begin_checkout' => array(
				'label'           => 'contact',
				'value'           => '20',
				'change'          => 5,
				'event_name'      => 'contact',
				'dimension'       => 'sessionDefaultChannelGroup',
				'dimension_value' => 'Referral',
				'change_context'  => 'Compared to previous 7 days',
			),
		);
		$sections_map = new Sections_Map( $context, $payload, $golinks );
		$renderer     = new Email_Template_Renderer( $sections_map );
		$sections     = $sections_map->get_sections();

		$this->assertArrayHasKey( 'is_my_site_helping_my_business_grow', $sections, 'Conversions section should exist.' );
		$this->assertSame(
			array(
				'total_conversion_events',
				'conversion_event_add_to_cart',
				'conversion_event_purchase',
			),
			array_keys( $sections['is_my_site_helping_my_business_grow']['section_parts'] ),
			'Conversions section should include total conversions and top two conversion events by event count.'
		);

		$template_data = array(
			'subject'                => 'Test subject',
			'preheader'              => 'Test preheader',
			'site'                   => array(
				'domain' => 'example.com',
				'url'    => 'https://example.com',
			),
			'date_range'             => array(
				'label'   => $date_label,
				'context' => 'Compared to previous 7 days',
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

		$this->assertStringContainsString( 'Total conversions', $html_output, 'HTML should include total conversions metric.' );
		$this->assertStringContainsString( '&quot;add_to_cart&quot; events', $html_output, 'HTML should render conversion event name as lowercase raw value.' );
		$this->assertStringContainsString( '&quot;purchase&quot; events', $html_output, 'HTML should render second conversion event name as lowercase raw value.' );
		$this->assertStringNotContainsString( '&quot;contact&quot; events', $html_output, 'HTML should not include conversion events outside the top two by event count.' );

		$text_output = $renderer->render_text( 'email-report', $template_data );

		$this->assertStringContainsString( 'Total conversions: 120 (+20%)', $text_output, 'Plain text should include total conversions metric.' );
		$this->assertStringContainsString( '“add_to_cart“ events', $text_output, 'Plain text should render conversion event name as lowercase raw value.' );
		$this->assertStringContainsString( '“purchase“ events', $text_output, 'Plain text should render second conversion event name as lowercase raw value.' );
		$this->assertStringNotContainsString( 'contact events', $text_output, 'Plain text should not include conversion events outside the top two by event count.' );
	}

	public function test_email_report_header_notice_renders_only_when_present() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$golinks = new Golinks( $context );
		$golinks->register_handler( 'dashboard', new Dashboard_Golink_Handler() );

		$payload = array(
			'total_conversion_events' => array(
				'label'          => 'Total conversions',
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

	public function test_email_report_conversions_section_notice_renders_only_when_present() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$golinks = new Golinks( $context );
		$golinks->register_handler( 'dashboard', new Dashboard_Golink_Handler() );

		$payload = array(
			'total_conversion_events' => array(
				'label'          => 'Total conversions',
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
			'section_notices'        => array(
				'is_my_site_helping_my_business_grow' => array(
					array(
						'id'        => 'enable-conversion-events',
						'title'     => 'Enable conversion events',
						'body'      => 'Track meaningful actions on your site.',
						'cta_label' => 'Enable now',
						'cta_url'   => 'https://example.com/enable',
					),
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

		$this->assertStringContainsString( 'Enable conversion events', $html_output, 'Expected conversion section notice title in rendered email.' );
		$this->assertStringContainsString( 'Track meaningful actions on your site.', $html_output, 'Expected conversion section notice body in rendered email.' );
		$this->assertStringContainsString( 'https://example.com/enable', $html_output, 'Expected conversion section notice CTA URL in rendered email.' );

		$template_data['section_notices'] = array();
		$html_output_without_notice       = $renderer->render( 'email-report', $template_data );

		$this->assertStringNotContainsString( 'Enable conversion events', $html_output_without_notice, 'Expected conversion section notice title to be absent when no section notices are provided.' );
	}

	public function test_email_report_conversions_section_renders_notice_only_when_no_conversion_metrics_exist() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$golinks = new Golinks( $context );
		$golinks->register_handler( 'dashboard', new Dashboard_Golink_Handler() );

		$payload = array(
			Sections_Map::CONVERSIONS_NOTICE_ONLY_FLAG => true,
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
			'section_notices'        => array(
				'is_my_site_helping_my_business_grow' => array(
					array(
						'id'        => 'enable-conversion-events',
						'title'     => 'Enable conversion events',
						'body'      => 'Track meaningful actions on your site.',
						'cta_label' => 'Enable now',
						'cta_url'   => 'https://example.com/enable',
					),
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

		$this->assertStringContainsString( 'Is my site helping my business grow?', $html_output, 'Expected conversions section heading in notice-only rendering.' );
		$this->assertStringContainsString( 'Enable conversion events', $html_output, 'Expected conversion section notice title in notice-only rendering.' );
		$this->assertStringNotContainsString( 'Total conversions', $html_output, 'Expected no conversion metric rows when conversions section is rendered as notice-only.' );
		$this->assertStringNotContainsString( 'View more in dashboard', $html_output, 'Expected section footer CTA to be hidden when conversions section is rendered as notice-only.' );
	}
}
