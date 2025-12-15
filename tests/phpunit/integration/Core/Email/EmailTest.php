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
}
