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

	public function test_email_report_notice_keeps_colors_in_dark_mode() {
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

		$sections_map  = new Sections_Map( $context, $payload, $golinks );
		$renderer      = new Email_Template_Renderer( $sections_map );
		$template_data = $this->get_minimal_template_data();

		$template_data['header_notices'] = array(
			array(
				'id'               => 'analytics-setup',
				'title'            => 'Notice title',
				'body'             => 'Notice body',
				'learn_more_label' => 'Learn more',
				'learn_more_url'   => 'https://example.com/learn-more',
				'cta_label'        => 'Set up Analytics',
				'cta_url'          => 'https://example.com/notice-cta',
			),
		);

		$html_output = $renderer->render( 'email-report', $template_data );

		$this->assertStringContainsString( 'googlesitekit-email-report-notice-text', $html_output, 'Expected the notice text lock class in the rendered email.' );
		$this->assertStringContainsString( 'googlesitekit-email-report-notice-cta', $html_output, 'Expected the notice CTA lock class in the rendered email.' );
		$this->assertStringContainsString( '.googlesitekit-email-report-notice .googlesitekit-email-report-notice-text,', $html_output, 'Expected the notice text color lock rule in the rendered email.' );
		$this->assertStringContainsString( 'color: #462083 !important;', $html_output, 'Expected the notice text color lock in the rendered email.' );
		$this->assertStringContainsString( '[data-ogsc] .googlesitekit-email-report-notice .googlesitekit-email-report-notice-cta', $html_output, 'Expected the Outlook app notice CTA lock in the rendered email.' );
	}

	public function test_change_badge_shows_signed_value_and_is_omitted_when_change_is_null() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$golinks = new Golinks( $context );
		$golinks->register_handler( 'dashboard', new Dashboard_Golink_Handler() );

		$payload = array(
			'total_visitors' => array(
				'label'          => 'Total visitors',
				'value'          => '120',
				'change'         => 6.52,
				'change_context' => 'Compared to previous 7 days',
			),
		);

		$sections_map  = new Sections_Map( $context, $payload, $golinks );
		$renderer      = new Email_Template_Renderer( $sections_map );
		$template_data = $this->get_minimal_template_data();

		$html_output = $renderer->render( 'email-report', $template_data );

		$this->assertStringContainsString( '+6.5%', $html_output, 'Expected the signed, real percentage change in the rendered badge.' );

		$payload['total_visitors']['change'] = null;
		$sections_map                        = new Sections_Map( $context, $payload, $golinks );
		$renderer                            = new Email_Template_Renderer( $sections_map );
		$html_output_without_change          = $renderer->render( 'email-report', $template_data );

		// The email's static <style> block always defines `.badge-positive`/
		// `.badge-negative` CSS rules, so include the `class=""` wrapper to
		// ensure we're testing for the existence of the badge markup and not
		// just the CSS in the `<style>` tag.
		$this->assertStringNotContainsString( 'class="badge-positive"', $html_output_without_change, 'Expected no change badge when the change value is null.' );
		$this->assertStringNotContainsString( 'class="badge-negative"', $html_output_without_change, 'Expected no change badge when the change value is null.' );
	}

	public function test_page_metrics_change_badge_shows_signed_value_and_is_omitted_when_change_is_null() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$golinks = new Golinks( $context );
		$golinks->register_handler( 'dashboard', new Dashboard_Golink_Handler() );

		$payload = array(
			'traffic_channels' => array(
				'label'            => 'Traffic channels by visitor count',
				'change_context'   => 'Compared to previous 7 days',
				'dimension_values' => array( 'Organic Search', 'Direct' ),
				'values'           => array( '120', '80' ),
				'changes'          => array( -0.85, null ),
			),
		);

		$sections_map  = new Sections_Map( $context, $payload, $golinks );
		$renderer      = new Email_Template_Renderer( $sections_map );
		$template_data = $this->get_minimal_template_data();

		$html_output = $renderer->render( 'email-report', $template_data );

		$this->assertStringContainsString( '-0.9%', $html_output, 'Expected the signed, real percentage change for the row with a comparison.' );
		$this->assertSame( 1, substr_count( $html_output, 'class="badge-negative"' ), 'Expected exactly one badge for the row with a comparison, and none for the row without one.' );
		$this->assertStringNotContainsString( 'class="badge-positive"', $html_output, 'Expected no positive badge to be rendered.' );
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

		$sections_map  = new Sections_Map( $context, $payload, $golinks );
		$renderer      = new Email_Template_Renderer( $sections_map );
		$template_data = $this->get_minimal_template_data();

		$html_output = $renderer->render( 'email-report', $template_data );

		$vml_matched = preg_match( '#<v:roundrect[^>]*href="https://example\.com/dashboard"[^>]*>(.*?)</v:roundrect>#s', $html_output, $vml_matches );
		$this->assertSame( 1, $vml_matched, 'Expected an Outlook VML roundrect button linking to the dashboard.' );
		$this->assertStringContainsString( 'View dashboard', $vml_matches[1], 'Expected the label inside the VML roundrect branch.' );

		$anchor_matched = preg_match( '#<a class="button" href="https://example\.com/dashboard"[^>]*>(.*?)</a>#s', $html_output, $anchor_matches );
		$this->assertSame( 1, $anchor_matched, 'Expected an HTML anchor button linking to the dashboard.' );
		$this->assertStringContainsString( 'View dashboard', $anchor_matches[1], 'Expected the label inside the HTML anchor branch.' );
	}

	/**
	 * Gets minimal template data for rendering the email-report template.
	 *
	 * @return array Template data.
	 */
	private function get_minimal_template_data() {
		return array(
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
	}
}
