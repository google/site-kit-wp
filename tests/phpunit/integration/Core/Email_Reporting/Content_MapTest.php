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

use Google\Site_Kit\Core\Email_Reporting\Content_Map;
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

	public function test_get_title_returns_placeholder_for_invitation_email() {
		$title = Content_Map::get_title( 'invitation-email' );

		$this->assertStringContainsString( '%s', $title, 'Invitation email title should contain placeholder.' );
		$this->assertStringContainsString( 'invited', $title, 'Invitation email title should contain "invited".' );
	}

	public function test_get_title_with_args_substitutes_placeholder() {
		$title = Content_Map::get_title_with_args( 'invitation-email', array( 'admin@example.com' ) );

		$this->assertStringContainsString( 'admin@example.com', $title, 'Title should contain substituted email.' );
		$this->assertStringNotContainsString( '%s', $title, 'Title should not contain unresolved placeholder.' );
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
		$this->assertStringContainsString( 'issue', $title, 'Error email title should mention issue.' );
		$this->assertNotEmpty( $body, 'Error email should have body content.' );
	}
}
