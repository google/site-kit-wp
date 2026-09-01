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

	public function test_metrics_section_hides_change_column_when_no_metric_has_a_comparison() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$golinks = new Golinks( $context );
		$golinks->register_handler( 'dashboard', new Dashboard_Golink_Handler() );

		$payload = array(
			'total_visitors' => array(
				'label'          => 'Total visitors',
				'value'          => '2',
				'change'         => null,
				'change_context' => 'Compared to previous 30 days',
			),
			'new_visitors'   => array(
				'label'  => 'New visitors',
				'value'  => '1',
				'change' => null,
			),
		);

		$sections_map  = new Sections_Map( $context, $payload, $golinks );
		$renderer      = new Email_Template_Renderer( $sections_map );
		$template_data = $this->get_minimal_template_data();

		$html_output = $renderer->render( 'email-report', $template_data );

		$this->assertStringContainsString( 'Total visitors', $html_output, 'Expected the metric rows to still render.' );
		$this->assertStringNotContainsString( 'Compared to previous 30 days', $html_output, 'Expected the change context subtitle to be hidden when no metric has a comparison value.' );
		$this->assertStringNotContainsString( 'class="badge-positive"', $html_output, 'Expected no badges to be rendered.' );
		$this->assertStringNotContainsString( 'class="badge-negative"', $html_output, 'Expected no badges to be rendered.' );
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

	public function test_page_metrics_hides_change_column_when_no_row_has_a_comparison() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$golinks = new Golinks( $context );
		$golinks->register_handler( 'dashboard', new Dashboard_Golink_Handler() );

		$payload = array(
			'traffic_channels' => array(
				'label'            => 'Traffic channels by visitor count',
				'change_context'   => 'Compared to previous 7 days',
				'dimension_values' => array( 'Organic Search', 'Direct' ),
				'values'           => array( '120', '80' ),
				'changes'          => array( null, null ),
			),
		);

		$sections_map  = new Sections_Map( $context, $payload, $golinks );
		$renderer      = new Email_Template_Renderer( $sections_map );
		$template_data = $this->get_minimal_template_data();

		$html_output = $renderer->render( 'email-report', $template_data );

		$this->assertStringContainsString( 'Organic Search', $html_output, 'Expected the row labels to still render.' );
		$this->assertStringNotContainsString( 'Compared to previous 7 days', $html_output, 'Expected the change context column header to be hidden when no row has a comparison value.' );
		$this->assertStringNotContainsString( '<td style="text-align:right; width:80px;">', $html_output, 'Expected the change badge column cell to be omitted, not just left empty, when no row has a comparison value.' );
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

	public function test_render__shows_each_site_goals_group_with_its_name_and_values() {
		$sections = array(
			'site_goals_online_store' => $this->get_site_goals_section(
				'How is my online store performing?',
				'online-store',
				array(
					'change_context' => 'Compared to previous 7 days',
					'groups'         => array(
						array(
							'label'   => 'WooCommerce',
							'metrics' => array(
								array(
									'label' => 'Sales rate',
									'value' => '3.8%',
									'trend' => 7.2,
								),
								array(
									'label' => 'Total sales',
									'value' => '116',
									'trend' => -4.6,
								),
							),
						),
						array(
							'label'   => 'Other sources',
							'metrics' => array(
								array(
									'label' => 'Total sales',
									'value' => '214',
									'trend' => 6.8,
								),
							),
						),
					),
					'prompt'         => array(),
				)
			),
		);

		$html_output = $this->render_site_goals_report( $sections );

		$this->assertStringContainsString( 'WooCommerce', $html_output, 'The card should name each plugin above its own group of metrics.' );
		$this->assertStringContainsString( 'Other sources', $html_output, 'The card should show an "Other sources" group for the results that name no plugin.' );
		$this->assertStringContainsString( '3.8%', $html_output, 'The card should show the sales rate of the WooCommerce group.' );
		$this->assertStringContainsString( '116', $html_output, 'The card should show the total sales of the WooCommerce group.' );
		$this->assertStringContainsString( '214', $html_output, 'The card should show the total sales of the "Other sources" group.' );
		$this->assertStringContainsString( '+7.2%', $html_output, 'The card should show the trend badge of the sales rate row.' );
		$this->assertStringContainsString( '-4.6%', $html_output, 'The card should show the trend badge of the total sales row.' );
		$this->assertSame( 1, substr_count( $html_output, 'Sales rate' ), 'The "Other sources" group should show its total alone, with no rate row.' );
		$this->assertSame( 2, substr_count( $html_output, 'class="badge-positive"' ), 'The card should mark each value that went up with a positive badge.' );
		$this->assertSame( 1, substr_count( $html_output, 'class="badge-negative"' ), 'The card should mark the one value that went down with a negative badge.' );
	}

	public function test_render__shows_the_enable_data_breakdown_prompt_when_the_site_goals_values_are_not_split_by_plugin() {
		$sections = array(
			'site_goals_online_store' => $this->get_site_goals_section(
				'How is my online store performing?',
				'online-store',
				array(
					'change_context' => 'Compared to previous 7 days',
					'groups'         => array(
						array(
							'label'   => '',
							'metrics' => array(
								array(
									'label' => 'Sales rate',
									'value' => '3.8%',
									'trend' => 7.2,
								),
							),
						),
					),
					'prompt'         => array(
						'text'      => 'Your events data may be grouped together across plugins. To see separate results by plugin, %s.',
						'link_text' => 'enable data breakdown',
					),
				)
			),
		);

		$html_output = $this->render_site_goals_report( $sections );

		$this->assertStringContainsString(
			'Your events data may be grouped together across plugins. To see separate results by plugin, <a class="link" href="https://example.com/dashboard"',
			$html_output,
			'The card should show the prompt sentence with the dashboard link inside it.'
		);
		$this->assertStringContainsString( '>enable data breakdown</a>.', $html_output, 'The card should close the link before the period that ends the prompt sentence.' );
		$this->assertStringNotContainsString( '<td class="text-primary" colspan="2"', $html_output, 'The card should show no group title when the group has no name.' );
	}

	public function test_render__shows_each_site_goals_section_as_its_own_card() {
		$store_data = array(
			'change_context' => 'Compared to previous 7 days',
			'groups'         => array(
				array(
					'label'   => '',
					'metrics' => array(
						array(
							'label' => 'Total sales',
							'value' => '116',
							'trend' => 7.2,
						),
					),
				),
			),
			'prompt'         => array(),
		);
		$lead_data  = array(
			'change_context' => 'Compared to previous 7 days',
			'groups'         => array(
				array(
					'label'   => '',
					'metrics' => array(
						array(
							'label' => 'Total form completions',
							'value' => '85',
							'trend' => 0.6,
						),
					),
				),
			),
			'prompt'         => array(),
		);

		$sections = array(
			'site_goals_online_store'    => $this->get_site_goals_section( 'How is my online store performing?', 'online-store', $store_data ),
			'site_goals_lead_generation' => $this->get_site_goals_section( 'Are people reaching out to my business?', 'lead-generation', $lead_data ),
		);

		$html_output = $this->render_site_goals_report( $sections );

		$this->assertStringContainsString( 'How is my online store performing?', $html_output, 'The online store card should show its title.' );
		$this->assertStringContainsString( 'Are people reaching out to my business?', $html_output, 'The lead generation card should show its title.' );
		$this->assertStringContainsString(
			'https://sitekit-static.withgoogle.com/2026-08-31-icon-online-store.png',
			$html_output,
			'The online store card should show the online store icon.'
		);
		$this->assertStringContainsString(
			'https://sitekit-static.withgoogle.com/2026-08-31-icon-lead-generation.png',
			$html_output,
			'The lead generation card should show the lead generation icon.'
		);
		$this->assertSame( 2, substr_count( $html_output, 'View more in dashboard' ), 'Each of the two cards should end with its own dashboard link.' );
	}

	public function test_render__hides_the_site_goals_change_column_when_no_metric_has_a_comparison() {
		$sections = array(
			'site_goals_online_store' => $this->get_site_goals_section(
				'How is my online store performing?',
				'online-store',
				array(
					'change_context' => 'Compared to previous 7 days',
					'groups'         => array(
						array(
							'label'   => 'WooCommerce',
							'metrics' => array(
								array(
									'label' => 'Sales rate',
									'value' => '3.8%',
									'trend' => null,
								),
								array(
									'label' => 'Total sales',
									'value' => '116',
									'trend' => null,
								),
							),
						),
					),
					'prompt'         => array(),
				)
			),
		);

		$html_output = $this->render_site_goals_report( $sections );

		$this->assertStringContainsString( 'Total sales', $html_output, 'The card should still show every metric row.' );
		$this->assertStringNotContainsString( 'Compared to previous 7 days', $html_output, 'The card should hide the change context when no metric has a comparison value.' );
		$this->assertStringNotContainsString( 'class="badge-positive"', $html_output, 'The card should show no positive badge when no metric has a comparison value.' );
		$this->assertStringNotContainsString( 'class="badge-negative"', $html_output, 'The card should show no negative badge when no metric has a comparison value.' );
	}

	/**
	 * Builds one Site Goals section from the given part data.
	 *
	 * @param string $title Title the card shows.
	 * @param string $icon  Icon slug the card builds its image URL from.
	 * @param array  $data  Section part data, with `change_context`, `groups`, and `prompt`.
	 * @return array Section configuration the email report template reads.
	 */
	private function get_site_goals_section( $title, $icon, array $data ) {
		return array(
			'title'            => $title,
			'icon'             => $icon,
			'section_template' => 'section-site-goals',
			'dashboard_url'    => 'https://example.com/dashboard',
			'section_parts'    => array(
				'site_goals' => array( 'data' => $data ),
			),
		);
	}

	/**
	 * Renders an email report with the given Site Goals sections.
	 *
	 * `Sections_Map` builds no Site Goals section yet, so this subclass returns the sections it was given.
	 *
	 * @param array $sections Site Goals sections to render.
	 * @return string Rendered HTML of the email report.
	 */
	private function render_site_goals_report( array $sections ) {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$sections_map = new class( $context, $sections, new Golinks( $context ) ) extends Sections_Map {

			public function get_sections() {
				return $this->payload;
			}
		};

		$renderer = new Email_Template_Renderer( $sections_map );

		return $renderer->render( 'email-report', $this->get_minimal_template_data() );
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
