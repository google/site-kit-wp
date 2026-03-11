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
	private $email;
	private $user;

	public function set_up() {
		parent::set_up();

		$this->user                            = self::factory()->user->create_and_get();
		$this->email_template_renderer_factory = $this->createMock( Email_Template_Renderer_Factory::class );
		$this->email                           = $this->createMock( Email::class );
		$this->email_report_sender             = new Email_Report_Sender( $this->email_template_renderer_factory, $this->email );
	}

	public function test_send__success() {
		$renderer = $this->createMock( Email_Template_Renderer::class );
		$renderer->method( 'render' )->willReturn( '<html>Report Content</html>' );
		$renderer->method( 'render_text' )->willReturn( 'Report Content' );

		$this->email_template_renderer_factory->method( 'create' )->willReturn( $renderer );
		$this->email->method( 'send' )->willReturn( true );

		$result = $this->email_report_sender->send(
			$this->user,
			array(),
			array( 'subject' => 'Test Report' )
		);

		$this->assertTrue( $result, 'Email report should be sent successfully.' );
	}

	public function test_send__failed() {
		$renderer = $this->createMock( Email_Template_Renderer::class );
		$renderer->method( 'render' )->willReturn( '<html>Report</html>' );
		$renderer->method( 'render_text' )->willReturn( 'Report' );

		$this->email_template_renderer_factory->method( 'create' )->willReturn( $renderer );
		$this->email->method( 'send' )->willReturn(
			new WP_Error( 'wp_mail_failed', __( 'Failed to send email.', 'google-site-kit' ) )
		);

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
	}
}
