<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Body_Content_MapTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Core\Email_Reporting\Body_Content_Map;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Email_Reporting
 */
class Body_Content_MapTest extends TestCase {

	public function test_get_body_returns_array_for_invitation_email() {
		$body = Body_Content_Map::get_body( 'invitation-email' );

		$this->assertIsArray( $body, 'Body should be an array.' );
		$this->assertNotEmpty( $body, 'Body should not be empty for invitation-email template.' );
	}

	public function test_get_body_returns_expected_paragraphs_for_invitation_email() {
		$body = Body_Content_Map::get_body( 'invitation-email' );

		$this->assertCount( 2, $body, 'Invitation email body should contain 2 paragraphs.' );
		$this->assertStringContainsString( 'insights about your site', $body[0], 'First paragraph should contain insights text.' );
		$this->assertStringContainsString( 'unsubscribe', $body[1], 'Second paragraph should contain unsubscribe text.' );
	}

	public function test_get_body_returns_empty_array_for_unknown_template() {
		$body = Body_Content_Map::get_body( 'unknown-template' );

		$this->assertIsArray( $body, 'Body should be an array even for unknown templates.' );
		$this->assertEmpty( $body, 'Body should be empty for unknown template.' );
	}

	public function test_get_body_returns_empty_array_for_email_report_template() {
		$body = Body_Content_Map::get_body( 'email-report' );

		$this->assertIsArray( $body, 'Body should be an array.' );
		$this->assertEmpty( $body, 'Body should be empty for email-report template as it uses sections.' );
	}

	public function test_get_body_with_args_substitutes_placeholders() {
		$body = Body_Content_Map::get_body_with_args(
			'subscription-confirmation',
			array( 'monthly', '1st of April' )
		);

		$this->assertCount( 3, $body, 'Subscription confirmation body should contain 3 paragraphs.' );
		$this->assertStringContainsString( 'monthly', $body[1], 'Second paragraph should contain frequency.' );
		$this->assertStringContainsString( '1st of April', $body[1], 'Second paragraph should contain first report date.' );
		$this->assertStringNotContainsString( '%1$s', $body[1], 'Second paragraph should not contain unresolved placeholders.' );
	}

	public function test_get_body_with_args_returns_unmodified_body_with_empty_args() {
		$body_without_args = Body_Content_Map::get_body( 'invitation-email' );
		$body_with_args    = Body_Content_Map::get_body_with_args( 'invitation-email', array() );

		$this->assertSame( $body_without_args, $body_with_args, 'Body should be identical when no args are provided.' );
	}

	public function test_get_body_with_args_returns_empty_array_for_unknown_template() {
		$body = Body_Content_Map::get_body_with_args( 'unknown-template', array( 'arg1' ) );

		$this->assertIsArray( $body, 'Body should be an array.' );
		$this->assertEmpty( $body, 'Body should be empty for unknown template.' );
	}

	public function test_subscription_confirmation_body_contains_strong_tags_for_placeholders() {
		$body = Body_Content_Map::get_body( 'subscription-confirmation' );

		$this->assertStringContainsString( '<strong>%1$s</strong>', $body[1], 'Second paragraph should wrap frequency placeholder in strong tags.' );
		$this->assertStringContainsString( '<strong>%2$s</strong>', $body[1], 'Second paragraph should wrap date placeholder in strong tags.' );
	}
}
