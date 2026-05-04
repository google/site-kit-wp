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

	public function test_send_does_not_register_any_phpmailer_init_hooks() {
		// The pre_wp_mail filter was introduced in WordPress 5.7.
		if ( version_compare( $GLOBALS['wp_version'], '5.7', '<' ) ) {
			$this->markTestSkipped( 'This test requires WordPress 5.7 or higher for the pre_wp_mail filter.' );
		}

		add_filter(
			'pre_wp_mail',
			function () {
				return true;
			}
		);

		$hooks_before = has_action( 'phpmailer_init' );

		// Cover both code paths: with and without text_content.
		$this->email->send( 'test@example.com', 'Test Subject', '<html><body>HTML</body></html>', array(), 'Plain text' );
		$this->email->send( 'test@example.com', 'Test Subject', '<html><body>HTML only</body></html>' );

		$this->assertEquals(
			$hooks_before,
			has_action( 'phpmailer_init' ),
			'Email::send() must not couple to PHPMailer — no phpmailer_init hooks should be registered before, during, or after a send.'
		);
	}

	public function test_send_passes_multipart_body_when_text_content_provided() {
		if ( version_compare( $GLOBALS['wp_version'], '5.7', '<' ) ) {
			$this->markTestSkipped( 'This test requires WordPress 5.7 or higher for the pre_wp_mail filter.' );
		}

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

		$content      = '<html><body>HTML Content</body></html>';
		$text_content = 'Plain text content';

		$this->email->send( 'test@example.com', 'Test Subject', $content, array(), $text_content );

		$this->assertNotNull( $captured_atts, 'Attributes should be captured.' );

		$message = $captured_atts['message'];
		$this->assertNotEquals(
			$content,
			$message,
			'When text_content is provided, the message passed to wp_mail() should be a multipart body, not the raw HTML.'
		);
		$this->assertStringContainsString( 'Content-Type: text/plain; charset=UTF-8', $message, 'Multipart body should declare a text/plain part.' );
		$this->assertStringContainsString( 'Content-Type: text/html; charset=UTF-8', $message, 'Multipart body should declare a text/html part.' );
		$this->assertStringContainsString( $text_content, $message, 'Multipart body should contain the plain text content.' );
		$this->assertStringContainsString( $content, $message, 'Multipart body should contain the HTML content.' );
		$this->assertMatchesRegularExpression(
			'/--=_SiteKit_[A-Za-z0-9]{24}/',
			$message,
			'Multipart body should include the Site Kit boundary delimiter.'
		);
		$this->assertMatchesRegularExpression(
			'/--=_SiteKit_[A-Za-z0-9]{24}--/',
			$message,
			'Multipart body should be terminated with the closing boundary delimiter.'
		);

		// Plain text part precedes HTML part (canonical multipart/alternative ordering).
		$this->assertLessThan(
			strpos( $message, 'Content-Type: text/html' ),
			strpos( $message, 'Content-Type: text/plain' ),
			'text/plain part should appear before the text/html part.'
		);
	}

	public function test_send_normalises_lf_line_endings_to_crlf_in_multipart_body() {
		if ( version_compare( $GLOBALS['wp_version'], '5.7', '<' ) ) {
			$this->markTestSkipped( 'This test requires WordPress 5.7 or higher for the pre_wp_mail filter.' );
		}

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

		// Source content uses LF only, mimicking Plain_Text_Formatter's implode( "\n", ... ).
		$text_content = "Line 1\nLine 2\nLine 3";
		$html_content = "<p>HTML Line 1</p>\n<p>HTML Line 2</p>";

		$this->email->send( 'test@example.com', 'Test Subject', $html_content, array(), $text_content );

		$message = $captured_atts['message'];

		$this->assertStringContainsString(
			"Line 1\r\nLine 2\r\nLine 3",
			$message,
			'Plain text content should be normalised to CRLF line endings before being embedded in the multipart body.'
		);
		$this->assertStringContainsString(
			"<p>HTML Line 1</p>\r\n<p>HTML Line 2</p>",
			$message,
			'HTML content should be normalised to CRLF line endings before being embedded in the multipart body.'
		);
		$this->assertDoesNotMatchRegularExpression(
			"/Line 1[^\r]\nLine 2/",
			$message,
			'Plain text content should not retain any bare LF line endings.'
		);
	}

	public function test_send_adds_multipart_content_type_header_when_text_content_provided() {
		if ( version_compare( $GLOBALS['wp_version'], '5.7', '<' ) ) {
			$this->markTestSkipped( 'This test requires WordPress 5.7 or higher for the pre_wp_mail filter.' );
		}

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

		$this->email->send( 'test@example.com', 'Test Subject', '<p>HTML</p>', array(), 'Plain text' );

		$this->assertNotNull( $captured_atts, 'Attributes should be captured.' );
		$this->assertIsArray( $captured_atts['headers'], 'Headers should be passed as an array.' );

		$content_type_headers = array_values(
			array_filter(
				$captured_atts['headers'],
				function ( $header ) {
					return is_string( $header ) && 0 === stripos( ltrim( $header ), 'content-type:' );
				}
			)
		);

		$this->assertCount( 1, $content_type_headers, 'Exactly one Content-Type header should be present.' );
		$this->assertMatchesRegularExpression(
			'#^Content-Type: multipart/alternative; boundary="[^"]+"$#',
			$content_type_headers[0],
			'Content-Type header should declare multipart/alternative with a boundary parameter.'
		);

		// The boundary in the Content-Type header should match the boundary used in the body.
		preg_match( '/boundary="([^"]+)"/', $content_type_headers[0], $header_boundary );
		$this->assertNotEmpty( $header_boundary[1] ?? null, 'Boundary should be parseable from the Content-Type header.' );
		$this->assertStringContainsString(
			'--' . $header_boundary[1],
			$captured_atts['message'],
			'The boundary in the Content-Type header should be used as a delimiter in the body.'
		);
	}

	public function test_send_adds_text_html_content_type_when_text_content_empty() {
		if ( version_compare( $GLOBALS['wp_version'], '5.7', '<' ) ) {
			$this->markTestSkipped( 'This test requires WordPress 5.7 or higher for the pre_wp_mail filter.' );
		}

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

		$content = '<html><body>HTML only</body></html>';

		$this->email->send( 'test@example.com', 'Test Subject', $content );

		$this->assertNotNull( $captured_atts, 'Attributes should be captured.' );
		$this->assertEquals(
			$content,
			$captured_atts['message'],
			'Without text_content, the message passed to wp_mail() should equal the HTML content unchanged.'
		);
		$this->assertContains(
			'Content-Type: text/html; charset=UTF-8',
			$captured_atts['headers'],
			'Without text_content, a single-part text/html Content-Type header should be present.'
		);
	}

	public function test_send_respects_caller_supplied_content_type() {
		if ( version_compare( $GLOBALS['wp_version'], '5.7', '<' ) ) {
			$this->markTestSkipped( 'This test requires WordPress 5.7 or higher for the pre_wp_mail filter.' );
		}

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

		$content        = 'Plain body';
		$caller_headers = array( 'Content-Type: text/plain; charset=UTF-8' );

		$this->email->send( 'test@example.com', 'Test Subject', $content, $caller_headers, 'Plain text alternative' );

		$this->assertNotNull( $captured_atts, 'Attributes should be captured.' );
		$this->assertEquals(
			$content,
			$captured_atts['message'],
			'When the caller supplies a Content-Type, the message should be passed through unchanged (no multipart composition).'
		);

		$content_type_headers = array_values(
			array_filter(
				$captured_atts['headers'],
				function ( $header ) {
					return is_string( $header ) && 0 === stripos( ltrim( $header ), 'content-type:' );
				}
			)
		);

		$this->assertCount( 1, $content_type_headers, 'Caller-supplied Content-Type should not be duplicated.' );
		$this->assertEquals(
			'Content-Type: text/plain; charset=UTF-8',
			$content_type_headers[0],
			'Caller-supplied Content-Type should be preserved verbatim.'
		);
	}
}
