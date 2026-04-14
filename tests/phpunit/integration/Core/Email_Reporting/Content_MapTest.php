<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Content_MapTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Content_Map;
use Google\Site_Kit\Core\Golinks\Dashboard_Golink_Handler;
use Google\Site_Kit\Core\Golinks\Golinks;
use Google\Site_Kit\Core\Golinks\Settings_Golink_Handler;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Content_MapTest extends TestCase {

	public function test_get_body_returns_array_for_invitation_email() {
		$body = Content_Map::get_body( 'invitation-email' );

		$this->assertIsArray( $body, 'Body should be an array.' );
		$this->assertNotEmpty( $body, 'Body should not be empty for invitation-email template.' );
	}

	public function test_get_body_returns_expected_paragraphs_for_invitation_email() {
		$body = Content_Map::get_body( 'invitation-email' );

		$this->assertCount( 2, $body, 'Invitation email body should contain 2 paragraphs.' );
		$this->assertStringContainsString( 'insights about your site', $body[0], 'First paragraph should contain insights text.' );
		$this->assertStringContainsString( 'unsubscribe', $body[1], 'Second paragraph should contain unsubscribe text.' );
	}

	public function test_get_body_returns_empty_array_for_unknown_template() {
		$body = Content_Map::get_body( 'unknown-template' );

		$this->assertIsArray( $body, 'Body should be an array even for unknown templates.' );
		$this->assertEmpty( $body, 'Body should be empty for unknown template.' );
	}

	public function test_get_body_returns_empty_array_for_email_report_template() {
		$body = Content_Map::get_body( 'email-report' );

		$this->assertIsArray( $body, 'Body should be an array.' );
		$this->assertEmpty( $body, 'Body should be empty for email-report template as it uses sections.' );
	}

	public function test_get_body_with_args_substitutes_placeholders() {
		$body = Content_Map::get_body_with_args(
			'subscription-confirmation',
			array( 'monthly', '1st of April' )
		);

		$this->assertCount( 3, $body, 'Subscription confirmation body should contain 3 paragraphs.' );
		$this->assertStringContainsString( 'monthly', $body[1], 'Second paragraph should contain frequency.' );
		$this->assertStringContainsString( '1st of April', $body[1], 'Second paragraph should contain first report date.' );
		$this->assertStringNotContainsString( '%1$s', $body[1], 'Second paragraph should not contain unresolved placeholders.' );
	}

	public function test_get_body_with_args_returns_unmodified_body_with_empty_args() {
		$body_without_args = Content_Map::get_body( 'invitation-email' );
		$body_with_args    = Content_Map::get_body_with_args( 'invitation-email', array() );

		$this->assertSame( $body_without_args, $body_with_args, 'Body should be identical when no args are provided.' );
	}

	public function test_get_body_with_args_returns_empty_array_for_unknown_template() {
		$body = Content_Map::get_body_with_args( 'unknown-template', array( 'arg1' ) );

		$this->assertIsArray( $body, 'Body should be an array.' );
		$this->assertEmpty( $body, 'Body should be empty for unknown template.' );
	}

	public function test_subscription_confirmation_body_contains_strong_tags_for_placeholders() {
		$body = Content_Map::get_body( 'subscription-confirmation' );

		$this->assertStringContainsString( '<strong>%1$s</strong>', $body[1], 'Second paragraph should wrap frequency placeholder in strong tags.' );
		$this->assertStringContainsString( '<strong>%2$s</strong>', $body[1], 'Second paragraph should wrap date placeholder in strong tags.' );
	}

	public function test_get_title_returns_string_for_known_template() {
		$title = Content_Map::get_title( 'subscription-confirmation' );

		$this->assertIsString( $title, 'Title should be a string.' );
		$this->assertNotEmpty( $title, 'Title should not be empty for known template.' );
		$this->assertStringContainsString( 'subscribed', $title, 'Subscription confirmation title should contain "subscribed".' );
	}

	public function test_get_title_returns_empty_string_for_unknown_template() {
		$title = Content_Map::get_title( 'unknown-template' );

		$this->assertIsString( $title, 'Title should be a string.' );
		$this->assertEmpty( $title, 'Title should be empty for unknown template.' );
	}

	public function test_get_title_returns_placeholders_for_invitation_email() {
		$title = Content_Map::get_title( 'invitation-email' );

		$this->assertStringContainsString( '%1$s', $title, 'Invitation email title should contain opening tag placeholder.' );
		$this->assertStringContainsString( '%2$s', $title, 'Invitation email title should contain email placeholder.' );
		$this->assertStringContainsString( '%3$s', $title, 'Invitation email title should contain closing tag placeholder.' );
		$this->assertStringContainsString( 'invited', $title, 'Invitation email title should contain "invited".' );
	}

	public function test_get_title_with_args_substitutes_placeholder() {
		$title = Content_Map::get_title_with_args(
			'invitation-email',
			array(
				'<a href="mailto:admin@example.com" style="color: #161B18;">',
				'admin@example.com',
				'</a>',
			)
		);

		$this->assertStringContainsString( 'admin@example.com', $title, 'Title should contain substituted email.' );
		$this->assertStringNotContainsString( '%1$s', $title, 'Title should not contain unresolved placeholder.' );
		$this->assertStringContainsString( 'mailto:admin@example.com', $title, 'Title should contain mailto link.' );
	}

	public function test_get_title_with_args_returns_unmodified_title_with_empty_args() {
		$title_without_args = Content_Map::get_title( 'subscription-confirmation' );
		$title_with_args    = Content_Map::get_title_with_args( 'subscription-confirmation', array() );

		$this->assertSame( $title_without_args, $title_with_args, 'Title should be identical when no args are provided.' );
	}

	public function test_get_title_with_args_returns_empty_string_for_unknown_template() {
		$title = Content_Map::get_title_with_args( 'unknown-template', array( 'arg1' ) );

		$this->assertIsString( $title, 'Title should be a string.' );
		$this->assertEmpty( $title, 'Title should be empty for unknown template.' );
	}

	public function test_error_email_has_title_and_body() {
		$title = Content_Map::get_title( 'error-email' );
		$body  = Content_Map::get_body( 'error-email' );

		$this->assertNotEmpty( $title, 'Error email should have a title.' );
		$this->assertStringContainsString( 'report', $title, 'Error email title should mention report.' );
		$this->assertNotEmpty( $body, 'Error email should have body content.' );
	}

	public function test_get_graphic_config_returns_correct_config_for_invitation_email() {
		$config = Content_Map::get_graphic_config( 'invitation-email' );

		$this->assertSame( 'invitation-envelope-graphic', $config['slug'], 'Invitation email should use envelope graphic slug.' );
		$this->assertSame( 'bottom-center', $config['position'], 'Invitation email graphic should be bottom-center.' );
		$this->assertSame( 209, $config['width'], 'Invitation email graphic width should be 209.' );
		$this->assertSame( 163, $config['height'], 'Invitation email graphic height should be 163.' );
		$this->assertSame( 'raw', $config['title_escape'], 'Invitation email title should use raw escape for mailto link.' );
	}

	public function test_get_graphic_config_returns_correct_config_for_subscription_confirmation() {
		$config = Content_Map::get_graphic_config( 'subscription-confirmation' );

		$this->assertSame( 'subscription-envelope-graphic', $config['slug'], 'Subscription confirmation should use envelope graphic slug.' );
		$this->assertSame( 'top-center', $config['position'], 'Subscription confirmation graphic should be top-center.' );
		$this->assertSame( 177, $config['width'], 'Subscription confirmation graphic width should be 177.' );
		$this->assertSame( 143, $config['height'], 'Subscription confirmation graphic height should be 143.' );
		$this->assertSame( 'esc_html', $config['title_escape'], 'Subscription confirmation title should use esc_html escape.' );
	}

	public function test_get_graphic_config_returns_correct_config_for_error_email() {
		$config = Content_Map::get_graphic_config( 'error-email' );

		$this->assertSame( 'warning-icon', $config['slug'], 'Error email should use warning icon slug.' );
		$this->assertSame( 'top-left', $config['position'], 'Error email graphic should be top-left.' );
		$this->assertSame( 32, $config['width'], 'Error email graphic width should be 32.' );
		$this->assertSame( 32, $config['height'], 'Error email graphic height should be 32.' );
		$this->assertSame( 'esc_html', $config['title_escape'], 'Error email title should use esc_html escape.' );
	}

	public function test_get_graphic_config_returns_empty_array_for_unknown_template() {
		$config = Content_Map::get_graphic_config( 'unknown-template' );

		$this->assertIsArray( $config, 'Graphic config should be an array for unknown template.' );
		$this->assertEmpty( $config, 'Graphic config should be empty for unknown template.' );
	}

	/**
	 * @dataProvider data_graphic_config_templates
	 */
	public function test_get_graphic_config_has_required_keys( $template_name ) {
		$config        = Content_Map::get_graphic_config( $template_name );
		$required_keys = array( 'slug', 'position', 'width', 'height', 'title_escape' );

		foreach ( $required_keys as $key ) {
			$this->assertArrayHasKey( $key, $config, "Graphic config for '$template_name' should have key '$key'." );
		}
	}

	public function test_get_body_args_uses_module_issues_doc_for_search_console_report_error() {
		$args = Content_Map::get_body_args( 'error-email-report-search-console', $this->build_golinks() );

		$this->assertNotEmpty( $args, 'Body args should not be empty for SC report error.' );
		$this->assertStringContainsString( 'module=search-console', $args[0], 'SC report error should link to search console settings.' );
		$this->assertStringContainsString( 'doc=email-reporting-module-issues', $args[2], 'SC report error should link to module-issues doc.' );
	}

	public function test_get_body_args_uses_module_issues_doc_for_analytics_4_report_error() {
		$args = Content_Map::get_body_args( 'error-email-report-analytics-4', $this->build_golinks() );

		$this->assertNotEmpty( $args, 'Body args should not be empty for GA4 report error.' );
		$help_anchor = $args[ count( $args ) - 2 ];
		$this->assertStringContainsString( 'doc=email-reporting-module-issues', $help_anchor, 'GA4 report error should link to module-issues doc.' );
	}

	public function test_get_body_args_uses_search_console_error_id_for_permissions_error() {
		$args = Content_Map::get_body_args( 'error-email-permissions-search-console', $this->build_golinks() );

		$this->assertNotEmpty( $args, 'Body args should not be empty for SC permissions error.' );
		$this->assertStringContainsString( 'error_id=search-console_insufficient_permissions', $args[0], 'SC permissions error should link via search-console error_id.' );
		$this->assertStringNotContainsString( 'doc=email-reporting', $args[0], 'SC permissions error should not use the generic doc key.' );
	}

	public function test_get_body_args_uses_analytics_4_error_id_for_permissions_error() {
		$args = Content_Map::get_body_args( 'error-email-permissions-analytics-4', $this->build_golinks() );

		$this->assertNotEmpty( $args, 'Body args should not be empty for GA4 permissions error.' );
		$this->assertStringContainsString( 'error_id=analytics-4_insufficient_permissions', $args[0], 'GA4 permissions error should link via analytics-4 error_id.' );
		$this->assertStringNotContainsString( 'doc=email-reporting', $args[0], 'GA4 permissions error should not use the generic doc key.' );
	}

	private function build_golinks() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$golinks = new Golinks( $context );
		$golinks->register_handler( 'dashboard', new Dashboard_Golink_Handler() );
		$golinks->register_handler( 'settings', new Settings_Golink_Handler() );

		return $golinks;
	}

	public function data_graphic_config_templates() {
		return array(
			'invitation-email'          => array( 'invitation-email' ),
			'subscription-confirmation' => array( 'subscription-confirmation' ),
			'error-email'               => array( 'error-email' ),
		);
	}
}
