<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Batch_Error_NotifierTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email\Email;
use Google\Site_Kit\Core\Email_Reporting\Batch_Error_Notifier;
use Google\Site_Kit\Core\Email_Reporting\Content_Map;
use Google\Site_Kit\Core\Email_Reporting\Email_Log_Batch_Query;
use Google\Site_Kit\Core\Golinks\Golinks;
use Google\Site_Kit\Core\Golinks\Dashboard_Golink_Handler;
use Google\Site_Kit\Core\Golinks\Settings_Golink_Handler;
use Google\Site_Kit\Tests\TestCase;

class Batch_Error_NotifierTest extends TestCase {

	/**
	 * @var Email_Log_Batch_Query|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $batch_query;

	/**
	 * @var Email|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $email_sender;

	/**
	 * @var Context
	 */
	private $context;

	/**
	 * @var Golinks
	 */
	private $golinks;

	public function set_up() {
		parent::set_up();

		$this->batch_query  = $this->createMock( Email_Log_Batch_Query::class );
		$this->email_sender = $this->createMock( Email::class );
		$this->context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->golinks      = new Golinks( $this->context );
		$this->golinks->register_handler( 'dashboard', new Dashboard_Golink_Handler() );
		$this->golinks->register_handler( 'settings', new Settings_Golink_Handler() );
	}

	public function test_does_not_notify_when_batch_not_all_failed() {
		$this->batch_query->expects( $this->once() )
			->method( 'is_batch_all_failed' )
			->with( 'batch-1' )
			->willReturn( false );

		$this->batch_query->expects( $this->never() )
			->method( 'is_batch_admin_notified' );

		$this->email_sender->expects( $this->never() )
			->method( 'send' );

		$this->create_notifier()->maybe_notify( 'batch-1' );
	}

	public function test_does_not_notify_when_already_notified() {
		$this->batch_query->method( 'is_batch_all_failed' )->willReturn( true );

		$this->batch_query->expects( $this->once() )
			->method( 'is_batch_admin_notified' )
			->with( 'batch-1' )
			->willReturn( true );

		$this->email_sender->expects( $this->never() )
			->method( 'send' );

		$this->create_notifier()->maybe_notify( 'batch-1' );
	}

	/**
	 * @dataProvider data_non_sendable_categories
	 */
	public function test_does_not_notify_for_non_sendable_categories( $category_id ) {
		$this->set_up_batch_with_category( $category_id );

		$this->batch_query->expects( $this->never() )
			->method( 'mark_batch_admin_notified' );

		$this->email_sender->expects( $this->never() )
			->method( 'send' );

		$this->create_notifier()->maybe_notify( 'batch-1' );
	}

	public function data_non_sendable_categories() {
		return array(
			'sending_error'        => array( 'sending_error' ),
			'cron_scheduler_error' => array( 'cron_scheduler_error' ),
		);
	}

	/**
	 * @dataProvider data_sendable_categories
	 */
	public function test_sends_notification_for_sendable_categories( $category_id, $content_key ) {
		self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_up_batch_with_category( $category_id );

		$expected_subject = Content_Map::get_title( $content_key );

		$this->batch_query->expects( $this->once() )
			->method( 'mark_batch_admin_notified' )
			->with( 'batch-1' );

		$this->email_sender->method( 'build_headers' )->willReturn( array() );
		$this->email_sender->expects( $this->atLeastOnce() )
			->method( 'send' )
			->with(
				$this->isType( 'string' ),
				$this->equalTo( $expected_subject ),
				$this->isType( 'string' ),
				$this->isType( 'array' ),
				$this->isType( 'string' )
			);

		$this->create_notifier()->maybe_notify( 'batch-1' );
	}

	public function data_sendable_categories() {
		return array(
			'permissions_error' => array( 'permissions_error', 'error-email' ),
			'report_error'      => array( 'report_error', 'error-email' ),
			'server_error'      => array( 'server_error', 'error-email' ),
		);
	}

	public function test_sends_generic_error_when_no_error_details() {
		self::factory()->user->create( array( 'role' => 'administrator' ) );

		$this->batch_query->method( 'is_batch_all_failed' )->willReturn( true );
		$this->batch_query->method( 'is_batch_admin_notified' )->willReturn( false );
		$this->batch_query->method( 'get_batch_error_details' )->willReturn( null );

		$expected_subject = Content_Map::get_title( 'error-email' );

		$this->email_sender->method( 'build_headers' )->willReturn( array() );
		$this->email_sender->expects( $this->atLeastOnce() )
			->method( 'send' )
			->with(
				$this->isType( 'string' ),
				$this->equalTo( $expected_subject ),
				$this->isType( 'string' ),
				$this->isType( 'array' ),
				$this->isType( 'string' )
			);

		$this->create_notifier()->maybe_notify( 'batch-1' );
	}

	public function test_sends_generic_error_for_unknown_category() {
		self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_up_batch_with_category( 'some_unknown_category' );

		$expected_subject = Content_Map::get_title( 'error-email' );

		$this->email_sender->method( 'build_headers' )->willReturn( array() );
		$this->email_sender->expects( $this->atLeastOnce() )
			->method( 'send' )
			->with(
				$this->isType( 'string' ),
				$this->equalTo( $expected_subject ),
				$this->isType( 'string' ),
				$this->isType( 'array' ),
				$this->isType( 'string' )
			);

		$this->create_notifier()->maybe_notify( 'batch-1' );
	}

	public function test_sends_generic_error_for_malformed_json() {
		self::factory()->user->create( array( 'role' => 'administrator' ) );

		$this->batch_query->method( 'is_batch_all_failed' )->willReturn( true );
		$this->batch_query->method( 'is_batch_admin_notified' )->willReturn( false );
		$this->batch_query->method( 'get_batch_error_details' )->willReturn( 'not-valid-json' );

		$expected_subject = Content_Map::get_title( 'error-email' );

		$this->email_sender->method( 'build_headers' )->willReturn( array() );
		$this->email_sender->expects( $this->atLeastOnce() )
			->method( 'send' )
			->with(
				$this->isType( 'string' ),
				$this->equalTo( $expected_subject ),
				$this->isType( 'string' ),
				$this->isType( 'array' ),
				$this->isType( 'string' )
			);

		$this->create_notifier()->maybe_notify( 'batch-1' );
	}

	public function test_marks_notified_before_sending() {
		self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_up_batch_with_category( 'permissions_error' );

		$call_order = array();

		$this->batch_query->expects( $this->once() )
			->method( 'mark_batch_admin_notified' )
			->with( 'batch-1' )
			->willReturnCallback(
				function () use ( &$call_order ) {
					$call_order[] = 'mark_notified';
				}
			);

		$this->email_sender->method( 'build_headers' )->willReturn( array() );
		$this->email_sender->expects( $this->atLeastOnce() )
			->method( 'send' )
			->willReturnCallback(
				function () use ( &$call_order ) {
					$call_order[] = 'send';
					return true;
				}
			);

		$this->create_notifier()->maybe_notify( 'batch-1' );

		$this->assertSame( 'mark_notified', $call_order[0], 'Batch should be marked notified before any email is sent.' );
	}

	public function test_sends_to_all_admin_users() {
		self::factory()->user->create(
			array(
				'role'       => 'administrator',
				'user_email' => 'admin1-test@example.com',
			)
		);
		self::factory()->user->create(
			array(
				'role'       => 'administrator',
				'user_email' => 'admin2-test@example.com',
			)
		);
		$this->set_up_batch_with_category( 'permissions_error' );

		$sent_to = array();

		$this->email_sender->method( 'build_headers' )->willReturn( array() );
		$this->email_sender->method( 'send' )
			->willReturnCallback(
				function ( $email ) use ( &$sent_to ) {
					$sent_to[] = $email;
					return true;
				}
			);

		$this->create_notifier()->maybe_notify( 'batch-1' );

		$this->assertContains( 'admin1-test@example.com', $sent_to, 'First admin should receive the notification.' );
		$this->assertContains( 'admin2-test@example.com', $sent_to, 'Second admin should receive the notification.' );
	}

	public function test_does_not_send_duplicate_to_same_email() {
		self::factory()->user->create(
			array(
				'role'       => 'administrator',
				'user_email' => 'shared@example.com',
			)
		);
		self::factory()->user->create(
			array(
				'role'       => 'administrator',
				'user_email' => 'shared@example.com',
			)
		);
		$this->set_up_batch_with_category( 'permissions_error' );

		$sent_to = array();

		$this->email_sender->method( 'build_headers' )->willReturn( array() );
		$this->email_sender->method( 'send' )
			->willReturnCallback(
				function ( $email ) use ( &$sent_to ) {
					$sent_to[] = $email;
					return true;
				}
			);

		$this->create_notifier()->maybe_notify( 'batch-1' );

		$shared_count = count( array_filter( $sent_to, fn( $e ) => 'shared@example.com' === $e ) );
		$this->assertSame( 1, $shared_count, 'Duplicate admin emails should be deduplicated.' );
	}

	/**
	 * @dataProvider data_module_specific_categories
	 */
	public function test_uses_module_specific_content_when_available( $category_id, $module_slug, $expected_content_key ) {
		self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_up_batch_with_category_and_module( $category_id, $module_slug );

		$expected_subject = Content_Map::get_title( $expected_content_key );

		$this->batch_query->expects( $this->once() )
			->method( 'mark_batch_admin_notified' )
			->with( 'batch-1' );

		$this->email_sender->method( 'build_headers' )->willReturn( array() );
		$this->email_sender->expects( $this->atLeastOnce() )
			->method( 'send' )
			->with(
				$this->isType( 'string' ),
				$this->equalTo( $expected_subject ),
				$this->isType( 'string' ),
				$this->isType( 'array' ),
				$this->isType( 'string' )
			);

		$this->create_notifier()->maybe_notify( 'batch-1' );
	}

	public function data_module_specific_categories() {
		return array(
			'permissions_error with search-console' => array( 'permissions_error', 'search-console', 'error-email-permissions-search-console' ),
			'permissions_error with analytics-4'    => array( 'permissions_error', 'analytics-4', 'error-email-permissions-analytics-4' ),
			'report_error with search-console'      => array( 'report_error', 'search-console', 'error-email-report-search-console' ),
			'report_error with analytics-4'         => array( 'report_error', 'analytics-4', 'error-email-report-analytics-4' ),
		);
	}

	public function test_falls_back_to_generic_error_when_no_module_match() {
		self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_up_batch_with_category_and_module( 'permissions_error', 'unknown-module' );

		// No module-specific body for permissions + unknown-module, so falls back to generic error-email.
		$expected_subject = Content_Map::get_title( 'error-email' );

		$this->email_sender->method( 'build_headers' )->willReturn( array() );
		$this->email_sender->expects( $this->atLeastOnce() )
			->method( 'send' )
			->with(
				$this->isType( 'string' ),
				$this->equalTo( $expected_subject ),
				$this->isType( 'string' ),
				$this->isType( 'array' ),
				$this->isType( 'string' )
			);

		$this->create_notifier()->maybe_notify( 'batch-1' );
	}

	public function test_falls_back_to_generic_error_for_unknown_module() {
		self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_up_batch_with_category_and_module( 'server_error', 'some-unknown-module' );

		// No module-specific body for server_error + some-unknown-module, falls back to generic error-email.
		$expected_subject = Content_Map::get_title( 'error-email' );

		$this->email_sender->method( 'build_headers' )->willReturn( array() );
		$this->email_sender->expects( $this->atLeastOnce() )
			->method( 'send' )
			->with(
				$this->isType( 'string' ),
				$this->equalTo( $expected_subject ),
				$this->isType( 'string' ),
				$this->isType( 'array' ),
				$this->isType( 'string' )
			);

		$this->create_notifier()->maybe_notify( 'batch-1' );
	}

	public function test_cta_uses_dashboard_golink() {
		self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_up_batch_with_category( 'permissions_error' );

		// HTML output encodes & as &#038; or &amp;, so check for the unique go-link path.
		$this->email_sender->method( 'build_headers' )->willReturn( array() );
		$this->email_sender->expects( $this->atLeastOnce() )
			->method( 'send' )
			->with(
				$this->isType( 'string' ),
				$this->isType( 'string' ),
				$this->logicalAnd(
					$this->stringContains( 'googlesitekit_go' ),
					$this->stringContains( 'to=dashboard' )
				),
				$this->isType( 'array' ),
				$this->isType( 'string' )
			);

		$this->create_notifier()->maybe_notify( 'batch-1' );
	}

	public function test_footer_contains_help_center_privacy_and_unsubscribe_links() {
		self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_up_batch_with_category( 'permissions_error' );

		$this->email_sender->method( 'build_headers' )->willReturn( array() );
		$this->email_sender->expects( $this->atLeastOnce() )
			->method( 'send' )
			->with(
				$this->isType( 'string' ),
				$this->isType( 'string' ),
				$this->logicalAnd(
					$this->stringContains( 'https://sitekit.withgoogle.com/support/' ),
					$this->stringContains( 'https://policies.google.com/privacy' ),
					$this->stringContains( 'manage-subscription-email-reporting' ),
					$this->stringContains( 'you signed up to receive email reports' )
				),
				$this->isType( 'array' ),
				$this->isType( 'string' )
			);

		$this->create_notifier()->maybe_notify( 'batch-1' );
	}

	/**
	 * @dataProvider data_report_error_body_contains_settings_golink
	 */
	public function test_report_error_body_contains_settings_golink( $module_slug, $content_key ) {
		self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_up_batch_with_category_and_module( 'report_error', $module_slug );

		// HTML output encodes & in URLs, so check for the unique identifying parts.
		$this->email_sender->method( 'build_headers' )->willReturn( array() );
		$this->email_sender->expects( $this->atLeastOnce() )
			->method( 'send' )
			->with(
				$this->isType( 'string' ),
				$this->isType( 'string' ),
				$this->logicalAnd(
					$this->stringContains( 'module=' . $module_slug ),
					$this->stringContains( 'doc=email-reporting' )
				),
				$this->isType( 'array' ),
				$this->isType( 'string' )
			);

		$this->create_notifier()->maybe_notify( 'batch-1' );
	}

	public function data_report_error_body_contains_settings_golink() {
		return array(
			'search-console' => array( 'search-console', 'error-email-report-search-console' ),
			'analytics-4'    => array( 'analytics-4', 'error-email-report-analytics-4' ),
		);
	}

	/**
	 * @dataProvider data_permissions_error_body_contains_help_link
	 */
	public function test_permissions_error_body_contains_help_link( $module_slug ) {
		self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_up_batch_with_category_and_module( 'permissions_error', $module_slug );

		$expected_help_url = 'https://sitekit.withgoogle.com/support/?doc=email-reporting';

		$this->email_sender->method( 'build_headers' )->willReturn( array() );
		$this->email_sender->expects( $this->atLeastOnce() )
			->method( 'send' )
			->with(
				$this->isType( 'string' ),
				$this->isType( 'string' ),
				$this->stringContains( $expected_help_url ),
				$this->isType( 'array' ),
				$this->isType( 'string' )
			);

		$this->create_notifier()->maybe_notify( 'batch-1' );
	}

	public function data_permissions_error_body_contains_help_link() {
		return array(
			'search-console' => array( 'search-console' ),
			'analytics-4'    => array( 'analytics-4' ),
		);
	}

	public function test_generic_error_body_has_no_unresolved_placeholders() {
		self::factory()->user->create( array( 'role' => 'administrator' ) );

		$this->batch_query->method( 'is_batch_all_failed' )->willReturn( true );
		$this->batch_query->method( 'is_batch_admin_notified' )->willReturn( false );
		$this->batch_query->method( 'get_batch_error_details' )->willReturn( null );

		$this->email_sender->method( 'build_headers' )->willReturn( array() );
		$this->email_sender->expects( $this->atLeastOnce() )
			->method( 'send' )
			->with(
				$this->isType( 'string' ),
				$this->isType( 'string' ),
				$this->logicalNot( $this->matchesRegularExpression( '/%[0-9]*\$?s/' ) ),
				$this->isType( 'array' ),
				$this->isType( 'string' )
			);

		$this->create_notifier()->maybe_notify( 'batch-1' );
	}

	public function test_plain_text_contains_link_urls() {
		self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_up_batch_with_category_and_module( 'report_error', 'search-console' );

		$expected_settings_url = add_query_arg( 'module', 'search-console', $this->golinks->get_url( 'settings' ) );

		$this->email_sender->method( 'build_headers' )->willReturn( array() );
		$this->email_sender->expects( $this->atLeastOnce() )
			->method( 'send' )
			->with(
				$this->isType( 'string' ),
				$this->isType( 'string' ),
				$this->isType( 'string' ),
				$this->isType( 'array' ),
				// Plain text (5th arg) should contain the settings URL.
				$this->stringContains( $expected_settings_url )
			);

		$this->create_notifier()->maybe_notify( 'batch-1' );
	}

	private function create_notifier() {
		return new Batch_Error_Notifier( $this->batch_query, $this->email_sender, $this->context, $this->golinks );
	}

	private function set_up_batch_with_category( $category_id ) {
		$this->batch_query->method( 'is_batch_all_failed' )->willReturn( true );
		$this->batch_query->method( 'is_batch_admin_notified' )->willReturn( false );
		$this->batch_query->method( 'get_batch_error_details' )
			->willReturn( $this->build_error_json( $category_id ) );
	}

	private function set_up_batch_with_category_and_module( $category_id, $module_slug ) {
		$this->batch_query->method( 'is_batch_all_failed' )->willReturn( true );
		$this->batch_query->method( 'is_batch_admin_notified' )->willReturn( false );
		$this->batch_query->method( 'get_batch_error_details' )
			->willReturn( $this->build_error_json( $category_id, $module_slug ) );
	}

	private function build_error_json( $category_id, $module_slug = null ) {
		$error_data = array(
			'category_id' => $category_id,
		);

		if ( null !== $module_slug ) {
			$error_data['module_slug'] = $module_slug;
		}

		return wp_json_encode(
			array(
				'errors'     => array(
					'test_error' => array( 'Test error message' ),
				),
				'error_data' => array(
					'test_error' => $error_data,
				),
			)
		);
	}
}
