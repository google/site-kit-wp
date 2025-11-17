<?php
/**
 * \Google\Site_Kit\Tests\Core\Util\EmailTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Email;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

/**
 * @group Util
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

	public function test_build_headers_returns_array() {
		$headers = $this->email->build_headers();

		$this->assertIsArray( $headers, 'build_headers should return an array.' );
	}

	public function test_build_headers_includes_from_header_with_site_kit_name() {
		// Set a default from email.
		add_filter(
			'wp_mail_from',
			function () {
				return 'test@example.com';
			}
		);

		$headers = $this->email->build_headers();

		$this->assertCount( 1, $headers, 'build_headers should return one header when no additional headers are provided.' );
		$this->assertEquals( 'From: Site Kit <test@example.com>', $headers[0], 'From header should include Site Kit name and filtered email address.' );
	}

	public function test_build_headers_uses_wp_mail_from_filter() {
		$custom_email = 'custom@example.com';

		add_filter(
			'wp_mail_from',
			function () use ( $custom_email ) {
				return $custom_email;
			}
		);

		$headers = $this->email->build_headers();

		$this->assertStringContainsString( $custom_email, $headers[0], 'build_headers should use the email from wp_mail_from filter.' );
	}

	public function test_build_headers_merges_with_caller_headers() {
		add_filter(
			'wp_mail_from',
			function () {
				return 'test@example.com';
			}
		);

		$caller_headers = array(
			'Content-Type: text/html; charset=UTF-8',
			'Cc: cc@example.com',
		);

		$headers = $this->email->build_headers( $caller_headers );

		$this->assertCount( 3, $headers, 'build_headers should merge caller headers with From header.' );
		$this->assertEquals( 'From: Site Kit <test@example.com>', $headers[0], 'From header should be first.' );
		$this->assertEquals( 'Content-Type: text/html; charset=UTF-8', $headers[1], 'Caller headers should be preserved.' );
		$this->assertEquals( 'Cc: cc@example.com', $headers[2], 'Caller headers should be preserved.' );
	}

	public function test_build_headers_handles_non_array_headers() {
		add_filter(
			'wp_mail_from',
			function () {
				return 'test@example.com';
			}
		);

		// Pass a non-array value.
		$headers = $this->email->build_headers( 'Content-Type: text/html' );

		$this->assertIsArray( $headers, 'build_headers should return an array even when passed non-array headers.' );
		$this->assertCount( 1, $headers, 'build_headers should only contain From header when non-array is passed.' );
	}

	public function test_send_returns_true_on_success() {
		// Mock wp_mail to succeed.
		add_filter(
			'pre_wp_mail',
			function () {
				return true;
			}
		);

		$result = $this->email->send( 'test@example.com', 'Test Subject', 'Test Content' );

		$this->assertTrue( $result, 'send should return true when wp_mail succeeds.' );
	}

	public function test_send_returns_wp_error_on_failure() {
		// Mock wp_mail to fail.
		add_filter(
			'pre_wp_mail',
			function () {
				return false;
			}
		);

		$result = $this->email->send( 'test@example.com', 'Test Subject', 'Test Content' );

		$this->assertInstanceOf( WP_Error::class, $result, 'send should return WP_Error when wp_mail fails.' );
		$this->assertEquals( 'wp_mail_failed', $result->get_error_code(), 'Error code should be wp_mail_failed.' );
	}

	public function test_send_captures_wp_mail_failed_error() {
		$error_message = 'SMTP connection failed';

		// Mock wp_mail to trigger wp_mail_failed.
		add_action(
			'phpmailer_init',
			function ( $phpmailer ) use ( $error_message ) {
				// Force an error by making the send fail.
				$phpmailer->Mailer   = 'smtp';
				$phpmailer->SMTPAuth = true;
				$phpmailer->Host     = 'invalid-host-that-does-not-exist.example.com';
				$phpmailer->Port     = 25;
				$phpmailer->Username = 'invalid';
				$phpmailer->Password = 'invalid';
			}
		);

		$result = $this->email->send( 'test@example.com', 'Test Subject', 'Test Content' );

		$this->assertInstanceOf( WP_Error::class, $result, 'send should return WP_Error when wp_mail_failed is triggered.' );
	}

	public function test_send_removes_listener_after_execution() {
		global $wp_filter;

		// Mock wp_mail to succeed.
		add_filter(
			'pre_wp_mail',
			function () {
				return true;
			}
		);

		// Check initial hook count.
		$initial_count = isset( $wp_filter['wp_mail_failed'] ) ? count( $wp_filter['wp_mail_failed']->callbacks ) : 0;

		$this->email->send( 'test@example.com', 'Test Subject', 'Test Content' );

		// Check hook count after send.
		$after_count = isset( $wp_filter['wp_mail_failed'] ) ? count( $wp_filter['wp_mail_failed']->callbacks ) : 0;

		$this->assertEquals( $initial_count, $after_count, 'wp_mail_failed listener should be removed after send.' );
	}

	public function test_send_resets_last_error_before_sending() {
		// Set up an initial error.
		add_filter(
			'pre_wp_mail',
			function () {
				return false;
			}
		);

		// First send that fails.
		$this->email->send( 'test@example.com', 'Test Subject', 'Test Content' );
		$this->assertInstanceOf( WP_Error::class, $this->email->get_last_error(), 'Last error should be set after failed send.' );

		// Now mock wp_mail to succeed.
		remove_all_filters( 'pre_wp_mail' );
		add_filter(
			'pre_wp_mail',
			function () {
				return true;
			}
		);

		// Second send that succeeds.
		$result = $this->email->send( 'test@example.com', 'Test Subject', 'Test Content' );

		$this->assertTrue( $result, 'send should return true on success.' );
		$this->assertNull( $this->email->get_last_error(), 'Last error should be reset to null after successful send.' );
	}

	public function test_get_last_error_returns_null_initially() {
		$error = $this->email->get_last_error();

		$this->assertNull( $error, 'get_last_error should return null when no error has occurred.' );
	}

	public function test_get_last_error_returns_wp_error_after_failed_send() {
		// Mock wp_mail to fail.
		add_filter(
			'pre_wp_mail',
			function () {
				return false;
			}
		);

		$this->email->send( 'test@example.com', 'Test Subject', 'Test Content' );
		$error = $this->email->get_last_error();

		$this->assertInstanceOf( WP_Error::class, $error, 'get_last_error should return WP_Error after failed send.' );
	}
}
