<?php
/**
 * EmailTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email;

use Google\Site_Kit\Core\Email\Email;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

/**
 * @group Email
 */
class EmailTest extends TestCase {

	/**
	 * @var Email
	 */
	private $email;

	public function set_up() {
		parent::set_up();
		$this->email = new Email();
	}

	public function test_build_headers() {
		// Ensure we have a known from address.
		$filter_val = 'wordpress@example.org';
		add_filter(
			'wp_mail_from',
			function () use ( &$filter_val ) {
				return $filter_val;
			}
		);

		// Test default behavior.
		$headers = $this->email->build_headers();
		$this->assertContains( 'From: Site Kit <wordpress@example.org>', $headers, 'Headers should contain default From address.' );

		// Test with custom headers.
		$custom_headers = array( 'Cc: test@example.com' );
		$headers        = $this->email->build_headers( $custom_headers );
		$this->assertContains( 'From: Site Kit <wordpress@example.org>', $headers, 'Headers should contain default From address with custom headers.' );
		$this->assertContains( 'Cc: test@example.com', $headers, 'Headers should contain custom header.' );

		// Test with filtered From address.
		$filter_val = 'custom@example.com';
		$headers    = $this->email->build_headers();
		$this->assertContains( 'From: Site Kit <custom@example.com>', $headers, 'Headers should contain filtered From address.' );
	}

	public function test_send() {
		// The pre_wp_mail filter was introduced in WordPress 5.7.
		if ( version_compare( $GLOBALS['wp_version'], '5.7', '<' ) ) {
			$this->markTestSkipped( 'This test requires WordPress 5.7 or higher for the pre_wp_mail filter.' );
		}

		// Use pre_wp_mail to simulate successful email sending and capture attributes.
		$captured_atts = null;
		add_filter(
			'pre_wp_mail',
			function ( $short_circuit, $atts ) use ( &$captured_atts ) {
				$captured_atts = $atts;
				return true;
			},
			10,
			2
		);

		$to      = 'test@example.com';
		$subject = 'Test Subject';
		$content = 'Test Content';

		$result = $this->email->send( $to, $subject, $content );
		$this->assertTrue( $result, 'Send should return true on success.' );
		$this->assertNull( $this->email->get_last_error(), 'Last error should be null on success.' );

		$this->assertNotNull( $captured_atts, 'Attributes should be captured.' );
		$this->assertEquals( $to, $captured_atts['to'], 'To address should match.' );
		$this->assertEquals( $subject, $captured_atts['subject'], 'Subject should match.' );
		$this->assertEquals( $content, $captured_atts['message'], 'Content should match.' );
	}

	public function test_send_failure() {
		// The pre_wp_mail filter was introduced in WordPress 5.7.
		if ( version_compare( $GLOBALS['wp_version'], '5.7', '<' ) ) {
			$this->markTestSkipped( 'This test requires WordPress 5.7 or higher for the pre_wp_mail filter.' );
		}

		// Force wp_mail failure using pre_wp_mail filter.
		$captured_atts = null;
		add_filter(
			'pre_wp_mail',
			function ( $short_circuit, $atts ) use ( &$captured_atts ) {
				$captured_atts = $atts;
				// Trigger the failure action that the class listens to.
				do_action( 'wp_mail_failed', new WP_Error( 'test_error', 'Test Error' ) );
				return false; // Return false to simulate failure.
			},
			10,
			2
		);

		$to      = 'test@example.com';
		$subject = 'Test Subject';
		$content = 'Test Content';

		$result = $this->email->send( $to, $subject, $content );

		$this->assertNotTrue( $result, 'Send should return false on failure.' );
		$this->assertInstanceOf( WP_Error::class, $result, 'Result should be an instance of WP_Error.' );
		$this->assertEquals( 'test_error', $result->get_error_code(), 'Error code should match.' );
		$this->assertEquals( 'Test Error', $result->get_error_message(), 'Error message should match.' );

		$this->assertEquals( $result, $this->email->get_last_error(), 'Last error should match returned error.' );

		$this->assertNotNull( $captured_atts, 'Attributes should be captured.' );
		$this->assertEquals( $to, $captured_atts['to'], 'To address should match.' );
		$this->assertEquals( $subject, $captured_atts['subject'], 'Subject should match.' );
		$this->assertEquals( $content, $captured_atts['message'], 'Content should match.' );
	}

	public function test_get_last_error() {
		$this->assertNull( $this->email->get_last_error(), 'Last error should be null initially.' );
	}

	public function test_send_sets_alt_body_when_text_content_provided() {
		$captured_alt_body = null;

		// Capture the AltBody via phpmailer_init hook at high priority (after Site Kit sets it).
		// Also clear recipients to prevent actual send attempt.
		add_action(
			'phpmailer_init',
			function ( $phpmailer ) use ( &$captured_alt_body ) {
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- PHPMailer property.
				$captured_alt_body = $phpmailer->AltBody;
				// Prevent actual send by clearing recipients.
				$phpmailer->clearAllRecipients();
			},
			999 // Run after Site Kit's hook (priority 10).
		);

		$to           = 'test@example.com';
		$subject      = 'Test Subject';
		$content      = '<html><body>HTML Content</body></html>';
		$text_content = 'Plain text content';

		// Note: We don't assert on $result because the actual send will fail
		// (recipients cleared). We only care that AltBody was set correctly.
		$this->email->send( $to, $subject, $content, array(), $text_content );

		$this->assertEquals( $text_content, $captured_alt_body, 'AltBody should be set to the text content.' );
	}

	public function test_send_does_not_set_alt_body_when_text_content_empty() {
		// The pre_wp_mail filter was introduced in WordPress 5.7.
		if ( version_compare( $GLOBALS['wp_version'], '5.7', '<' ) ) {
			$this->markTestSkipped( 'This test requires WordPress 5.7 or higher for the pre_wp_mail filter.' );
		}

		$alt_body_was_set = false;

		// Check if our callback was added to phpmailer_init.
		add_action(
			'phpmailer_init',
			function ( $phpmailer ) use ( &$alt_body_was_set ) {
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- PHPMailer property.
				if ( ! empty( $phpmailer->AltBody ) ) {
					$alt_body_was_set = true;
				}
			},
			999 // Run after any potential Site Kit callback.
		);

		// Use pre_wp_mail to simulate successful email sending.
		add_filter(
			'pre_wp_mail',
			function () {
				return true;
			}
		);

		$to      = 'test@example.com';
		$subject = 'Test Subject';
		$content = '<html><body>HTML Content</body></html>';

		// Send without text_content (empty string is default).
		$result = $this->email->send( $to, $subject, $content );

		$this->assertTrue( $result, 'Send should return true on success.' );
		$this->assertFalse( $alt_body_was_set, 'AltBody should not be set when text_content is empty.' );
	}

	public function test_send_removes_phpmailer_init_hook_after_send() {
		// The pre_wp_mail filter was introduced in WordPress 5.7.
		if ( version_compare( $GLOBALS['wp_version'], '5.7', '<' ) ) {
			$this->markTestSkipped( 'This test requires WordPress 5.7 or higher for the pre_wp_mail filter.' );
		}

		// Use pre_wp_mail to simulate successful email sending.
		add_filter(
			'pre_wp_mail',
			function () {
				return true;
			}
		);

		$to           = 'test@example.com';
		$subject      = 'Test Subject';
		$content      = '<html><body>HTML Content</body></html>';
		$text_content = 'Plain text content';

		// Count phpmailer_init callbacks before send.
		$hooks_before = has_action( 'phpmailer_init' );

		$this->email->send( $to, $subject, $content, array(), $text_content );

		// Count phpmailer_init callbacks after send.
		$hooks_after = has_action( 'phpmailer_init' );

		// The hook should be removed after send, so count should be same as before.
		$this->assertEquals( $hooks_before, $hooks_after, 'phpmailer_init hook should be removed after send.' );
	}
}
