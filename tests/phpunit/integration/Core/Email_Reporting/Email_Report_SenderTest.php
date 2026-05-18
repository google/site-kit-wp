<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Report_SenderTest
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Core\Email\Email;
use Google\Site_Kit\Core\Email_Reporting\Email_Report_Sender;
use Google\Site_Kit\Core\Email_Reporting\Email_Template_Renderer;
use Google\Site_Kit\Core\Email_Reporting\Email_Template_Renderer_Factory;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

/**
 * @group Email_Reporting
 */
class Email_Report_SenderTest extends TestCase {

	private $email_report_sender;
	private $email_template_renderer_factory;
	private $user;

	public function set_up() {
		parent::set_up();

		reset_phpmailer_instance();

		$this->user                            = self::factory()->user->create_and_get();
		$this->email_template_renderer_factory = $this->createMock( Email_Template_Renderer_Factory::class );
		$this->email_report_sender             = new Email_Report_Sender(
			$this->email_template_renderer_factory,
			new Email()
		);
	}

	public function test_send__success() {
		$renderer = $this->createMock( Email_Template_Renderer::class );
		$renderer->method( 'render' )->willReturn( '<html>Report Content</html>' );
		$renderer->method( 'render_text' )->willReturn( 'Report Content' );

		$this->email_template_renderer_factory->method( 'create' )->willReturn( $renderer );

		$result = $this->email_report_sender->send(
			$this->user,
			array(),
			array( 'subject' => 'Test Report' )
		);

		$this->assertTrue( $result, 'Email report should be sent successfully.' );

		$mailer = tests_retrieve_phpmailer_instance();
		$this->assertCount( 1, $mailer->mock_sent, 'Exactly one email should have been queued by wp_mail.' );

		$sent = $mailer->get_sent();
		$this->assertSame( $this->user->user_email, $sent->to[0][0], 'Email should be addressed to the report recipient.' );
		$this->assertSame( 'Test Report', $sent->subject, 'Email subject should match the template subject.' );
	}

	public function test_send__failed() {
		$this->skip_if_pre_wp_mail_unsupported();

		$renderer = $this->createMock( Email_Template_Renderer::class );
		$renderer->method( 'render' )->willReturn( '<html>Report</html>' );
		$renderer->method( 'render_text' )->willReturn( 'Report' );

		$this->email_template_renderer_factory->method( 'create' )->willReturn( $renderer );

		$short_circuit_callback = function () {
			do_action(
				'wp_mail_failed',
				new WP_Error( 'wp_mail_failed', __( 'Failed to send email.', 'google-site-kit' ) )
			);
			return false;
		};
		add_filter( 'pre_wp_mail', $short_circuit_callback );

		try {
			$result = $this->email_report_sender->send(
				$this->user,
				array(),
				array( 'subject' => 'Test Report' )
			);

			$this->assertWPError( $result, 'Email report sending should fail with a WP_Error.' );
			$this->assertSame( 'wp_mail_failed', $result->get_error_code(), 'Error code should match.' );
			$error_data = $result->get_error_data();
			$this->assertArrayHasKey( 'category_id', $error_data, 'Error data should contain category_id.' );
			$this->assertSame( 'sending_error', $error_data['category_id'], 'category_id should be sending_error.' );
			$this->assertCount( 0, tests_retrieve_phpmailer_instance()->mock_sent, 'No email should have been delivered on the failure path.' );
		} finally {
			remove_filter( 'pre_wp_mail', $short_circuit_callback );
		}
	}

	/**
	 * Skips the test if the pre_wp_mail filter (WordPress 5.7+) isn't available.
	 */
	private function skip_if_pre_wp_mail_unsupported() {
		if ( version_compare( $GLOBALS['wp_version'], '5.7', '<' ) ) {
			$this->markTestSkipped( 'This test requires WordPress 5.7 or higher for the pre_wp_mail filter.' );
		}
	}
}
