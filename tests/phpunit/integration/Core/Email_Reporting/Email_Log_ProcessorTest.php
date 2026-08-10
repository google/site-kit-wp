<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Email_Log_ProcessorTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Email_Log;
use Google\Site_Kit\Core\Email_Reporting\Email_Log_Batch_Query;
use Google\Site_Kit\Core\Email_Reporting\Email_Log_Processor;
use Google\Site_Kit\Core\Email_Reporting\Email_Report_Data_Section_Part;
use Google\Site_Kit\Core\Email_Reporting\Email_Report_Sender;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Data_Requests;
use Google\Site_Kit\Core\Email_Reporting\Email_Template_Formatter;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;
use WP_User;

class Email_Log_ProcessorTest extends TestCase {

	/**
	 * @var Context
	 */
	private $context;

	/**
	 * @var Email_Log_Batch_Query
	 */
	private $batch_query;

	/**
	 * @var Email_Reporting_Data_Requests|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $data_requests;

	/**
	 * @var Email_Template_Formatter|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $template_formatter;

	/**
	 * @var Email_Report_Sender|\PHPUnit_Framework_MockObject_MockObject
	 */
	private $report_sender;

	/**
	 * @var Email_Log_Processor
	 */
	private $processor;

	/**
	 * @var array
	 */
	private $created_post_ids = array();

	public function set_up() {
		parent::set_up();

		$this->context            = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->batch_query        = new Email_Log_Batch_Query();
		$this->data_requests      = $this->createMock( Email_Reporting_Data_Requests::class );
		$this->template_formatter = $this->createMock( Email_Template_Formatter::class );
		$this->report_sender      = $this->createMock( Email_Report_Sender::class );

		$this->processor = new Email_Log_Processor(
			$this->batch_query,
			$this->data_requests,
			$this->template_formatter,
			$this->report_sender
		);

		$this->register_email_log_dependencies();
	}

	public function tear_down() {
		foreach ( $this->created_post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}

		$this->created_post_ids = array();

		if ( post_type_exists( Email_Log::POST_TYPE ) && function_exists( 'unregister_post_type' ) ) {
			unregister_post_type( Email_Log::POST_TYPE );
		}

		foreach ( array( Email_Log::STATUS_SENT, Email_Log::STATUS_FAILED, Email_Log::STATUS_SCHEDULED ) as $status ) {
			if ( isset( $GLOBALS['wp_post_statuses'][ $status ] ) ) {
				unset( $GLOBALS['wp_post_statuses'][ $status ] );
			}
		}

		foreach (
			array(
				Email_Log::META_REPORT_FREQUENCY,
				Email_Log::META_BATCH_ID,
				Email_Log::META_SEND_ATTEMPTS,
				Email_Log::META_ERROR_DETAILS,
				Email_Log::META_REPORT_REFERENCE_DATES,
				Email_Log::META_SITE_ID,
				Email_Log::META_TEMPLATE_TYPE,
			) as $meta_key
		) {
			if ( function_exists( 'unregister_meta_key' ) ) {
				unregister_meta_key( 'post', Email_Log::POST_TYPE, $meta_key );
			}
		}

		parent::tear_down();
	}

	public function test_process__marks_failed_for_invalid_user() {
		$post_id = $this->create_log_post( 12345 );

		$this->processor->process( $post_id, Email_Reporting_Settings::FREQUENCY_WEEKLY );

		$this->assertEquals( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Log with an invalid user should be marked failed.' );
		$this->assertStringContainsString( 'invalid_email_reporting_user', get_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, true ), 'Failure reason should be recorded.' );
	}

	public function test_process__marks_failed_for_invalid_date_range() {
		$user_id = self::factory()->user->create();
		$post_id = $this->create_log_post( $user_id, array() );

		$this->processor->process( $post_id, Email_Reporting_Settings::FREQUENCY_WEEKLY );

		$this->assertEquals( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Log with an invalid date range should be marked failed.' );
		$this->assertStringContainsString( 'email_report_invalid_date_range', get_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, true ), 'Failure reason should be recorded.' );
	}

	public function test_process__marks_failed_when_data_request_fails() {
		$user_id = self::factory()->user->create();
		$post_id = $this->create_log_post( $user_id );

		$this->data_requests->method( 'get_user_payload' )
			->willReturn( new WP_Error( 'data_failure', 'Data failure' ) );

		$this->processor->process( $post_id, Email_Reporting_Settings::FREQUENCY_WEEKLY );

		$this->assertEquals( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Log should be marked failed when the data request fails.' );
		$this->assertStringContainsString( 'data_failure', get_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, true ), 'Failure reason should be recorded.' );
	}

	public function test_process__marks_failed_when_section_build_fails() {
		$user_id = self::factory()->user->create();
		$post_id = $this->create_log_post( $user_id );

		$this->data_requests->method( 'get_user_payload' )->willReturn( array( 'total_visitors' => array() ) );
		$this->template_formatter->method( 'build_sections' )
			->willReturn( new WP_Error( 'email_report_section_build_failed', 'Section build failed' ) );

		$this->processor->process( $post_id, Email_Reporting_Settings::FREQUENCY_WEEKLY );

		$this->assertEquals( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Log should be marked failed when section building fails.' );
		$this->assertStringContainsString( 'email_report_section_build_failed', get_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, true ), 'Failure reason should be recorded.' );
	}

	public function test_process__marks_failed_when_no_sections_returned() {
		$user_id = self::factory()->user->create();
		$post_id = $this->create_log_post( $user_id );

		$this->data_requests->method( 'get_user_payload' )->willReturn( array( 'total_visitors' => array() ) );
		$this->template_formatter->method( 'build_sections' )->willReturn( array() );
		$this->template_formatter->expects( $this->never() )->method( 'build_template_payload' );

		$this->processor->process( $post_id, Email_Reporting_Settings::FREQUENCY_WEEKLY );

		$this->assertEquals( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Log should be marked failed when no sections are produced.' );
		$this->assertStringContainsString( 'email_report_no_data', get_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, true ), 'Failure reason should be recorded.' );
	}

	public function test_process__marks_failed_when_template_payload_fails() {
		$user_id = self::factory()->user->create();
		$post_id = $this->create_log_post( $user_id );
		$section = $this->create_section();

		$this->data_requests->method( 'get_user_payload' )->willReturn( array( 'total_visitors' => array() ) );
		$this->template_formatter->method( 'build_sections' )->willReturn( array( $section ) );
		$this->template_formatter->method( 'build_template_payload' )
			->willReturn( new WP_Error( 'email_report_template_payload_failed', 'Template payload building failed' ) );

		$this->processor->process( $post_id, Email_Reporting_Settings::FREQUENCY_WEEKLY );

		$this->assertEquals( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Log should be marked failed when template payload building fails.' );
		$this->assertStringContainsString( 'email_report_template_payload_failed', get_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, true ), 'Failure reason should be recorded.' );
	}

	public function test_process__marks_failed_when_send_fails() {
		$user_id = self::factory()->user->create();
		$post_id = $this->create_log_post( $user_id );
		$section = $this->create_section();

		$this->data_requests->method( 'get_user_payload' )->willReturn( array( 'total_visitors' => array() ) );
		$this->template_formatter->method( 'build_sections' )->willReturn( array( $section ) );
		$this->template_formatter->method( 'build_template_payload' )->willReturn(
			array(
				'sections_payload' => array( 'total_visitors' => array( 'value' => '10' ) ),
				'template_data'    => array( 'subject' => 'Subject' ),
			)
		);
		$this->report_sender->method( 'send' )->willReturn( new WP_Error( 'send_failure', 'Send failed' ) );

		$this->processor->process( $post_id, Email_Reporting_Settings::FREQUENCY_WEEKLY );

		$this->assertEquals( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Log should be marked failed when sending fails.' );
		$this->assertStringContainsString( 'send_failure', get_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, true ), 'Failure reason should be recorded.' );
	}

	public function test_process__marks_sent_on_success() {
		$user_id = self::factory()->user->create();
		$post_id = $this->create_log_post( $user_id );
		$section = $this->create_section();

		update_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, 'old-error' );

		$this->data_requests->method( 'get_user_payload' )->willReturn( array( 'total_visitors' => array() ) );
		$this->template_formatter->method( 'build_sections' )->willReturn( array( $section ) );
		$this->template_formatter->method( 'build_template_payload' )->willReturn(
			array(
				'sections_payload' => array( 'total_visitors' => array( 'value' => '10' ) ),
				'template_data'    => array( 'subject' => 'Subject' ),
			)
		);
		$this->report_sender->method( 'send' )->willReturn( true );

		$this->processor->process( $post_id, Email_Reporting_Settings::FREQUENCY_WEEKLY );

		$this->assertEquals( Email_Log::STATUS_SENT, get_post_status( $post_id ), 'Log should be marked sent on success.' );
		$this->assertEquals( '', get_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, true ), 'Error meta should be cleared on success.' );
	}

	public function test_process__handles_subscription_confirmation_log() {
		$user_id = self::factory()->user->create();
		$post_id = $this->create_log_post( $user_id, null, Email_Log::TEMPLATE_TYPE_SUBSCRIBE_SUCCESS );

		$this->data_requests->expects( $this->never() )->method( 'get_user_payload' );
		$this->template_formatter->method( 'prepare_subscription_confirmation_template_data' )
			->willReturn( array( 'subject' => 'Subscription Confirmation' ) );
		$this->report_sender->expects( $this->once() )
			->method( 'send' )
			->with(
				$this->isInstanceOf( WP_User::class ),
				array(),
				array( 'subject' => 'Subscription Confirmation' ),
				'simple-email'
			)
			->willReturn( true );

		$this->processor->process( $post_id, Email_Reporting_Settings::FREQUENCY_WEEKLY );

		$this->assertEquals( Email_Log::STATUS_SENT, get_post_status( $post_id ), 'Subscription confirmation log should be marked sent.' );
	}

	public function test_process__switches_to_recipient_locale_while_building_and_sending_the_report() {
		$original_locale     = get_locale();
		$recipient_locale    = $this->get_other_locale( $original_locale );
		$user_id             = self::factory()->user->create( array( 'locale' => $recipient_locale ) );
		$post_id             = $this->create_log_post( $user_id );
		$section             = $this->create_section();
		$locale_during_build = null;
		$locale_during_send  = null;

		$this->data_requests->method( 'get_user_payload' )->willReturn( array( 'total_visitors' => array() ) );
		$this->template_formatter->method( 'build_sections' )
			->willReturnCallback(
				function () use ( &$locale_during_build, $section ) {
					$locale_during_build = get_locale();
					return array( $section );
				}
			);
		$this->template_formatter->method( 'build_template_payload' )->willReturn(
			array(
				'sections_payload' => array( 'total_visitors' => array( 'value' => '10' ) ),
				'template_data'    => array( 'subject' => 'Subject' ),
			)
		);
		$this->report_sender->method( 'send' )
			->willReturnCallback(
				function () use ( &$locale_during_send ) {
					$locale_during_send = get_locale();
					return true;
				}
			);

		$this->processor->process( $post_id, Email_Reporting_Settings::FREQUENCY_WEEKLY );

		$this->assertEquals( $recipient_locale, $locale_during_build, 'Sections should be built using the recipient locale.' );
		$this->assertEquals( $recipient_locale, $locale_during_send, 'The report should be sent using the recipient locale.' );
		$this->assertEquals( $original_locale, get_locale(), 'The site locale should be restored after processing.' );
	}

	public function test_process__restores_site_locale_when_building_fails() {
		$original_locale     = get_locale();
		$recipient_locale    = $this->get_other_locale( $original_locale );
		$user_id             = self::factory()->user->create( array( 'locale' => $recipient_locale ) );
		$post_id             = $this->create_log_post( $user_id );
		$locale_during_build = null;

		$this->data_requests->method( 'get_user_payload' )->willReturn( array( 'total_visitors' => array() ) );
		$this->template_formatter->method( 'build_sections' )
			->willReturnCallback(
				function () use ( &$locale_during_build ) {
					$locale_during_build = get_locale();
					return new WP_Error( 'email_report_section_build_failed', 'Section build failed' );
				}
			);

		$this->processor->process( $post_id, Email_Reporting_Settings::FREQUENCY_WEEKLY );

		$this->assertEquals( $recipient_locale, $locale_during_build, 'Sections should be attempted using the recipient locale even when building fails.' );
		$this->assertEquals( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Log should be marked failed.' );
		$this->assertEquals( $original_locale, get_locale(), 'The site locale should be restored after a failed build.' );
	}

	public function test_process__marks_failed_when_build_and_send_throws_exception() {
		$user_id = self::factory()->user->create();
		$post_id = $this->create_log_post( $user_id );

		$this->data_requests->method( 'get_user_payload' )->willReturn( array( 'total_visitors' => array() ) );
		$this->template_formatter->method( 'build_sections' )
			->willReturnCallback(
				function () {
					throw new \Exception( 'Unexpected build failure' );
				}
			);
		$this->report_sender->expects( $this->never() )->method( 'send' );

		$this->processor->process( $post_id, Email_Reporting_Settings::FREQUENCY_WEEKLY );

		$this->assertEquals( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Log should be marked failed when building and sending throws.' );
		$this->assertStringContainsString( 'Unexpected build failure', get_post_meta( $post_id, Email_Log::META_ERROR_DETAILS, true ), 'Exception message should be recorded.' );
	}

	public function test_process__restores_site_locale_when_build_and_send_throws_exception() {
		$original_locale     = get_locale();
		$recipient_locale    = $this->get_other_locale( $original_locale );
		$user_id             = self::factory()->user->create( array( 'locale' => $recipient_locale ) );
		$post_id             = $this->create_log_post( $user_id );
		$locale_during_build = null;

		$this->data_requests->method( 'get_user_payload' )->willReturn( array( 'total_visitors' => array() ) );
		$this->template_formatter->method( 'build_sections' )
			->willReturnCallback(
				function () use ( &$locale_during_build ) {
					$locale_during_build = get_locale();
					throw new \Exception( 'Unexpected build failure' );
				}
			);

		$this->processor->process( $post_id, Email_Reporting_Settings::FREQUENCY_WEEKLY );

		$this->assertEquals( $recipient_locale, $locale_during_build, 'Sections should be attempted using the recipient locale before the exception is thrown.' );
		$this->assertEquals( Email_Log::STATUS_FAILED, get_post_status( $post_id ), 'Log should be marked failed.' );
		$this->assertEquals( $original_locale, get_locale(), 'The site locale should be restored after an exception during build and send.' );
	}

	public function test_process__restores_site_locale_across_sequential_logs_with_different_recipient_locales() {
		$original_locale  = get_locale();
		$locale_one       = $this->get_other_locale( $original_locale );
		$locale_two       = $this->get_other_locale( $original_locale, array( $locale_one ) );
		$user_one         = self::factory()->user->create( array( 'locale' => $locale_one ) );
		$user_two         = self::factory()->user->create( array( 'locale' => $locale_two ) );
		$post_one         = $this->create_log_post( $user_one );
		$post_two         = $this->create_log_post( $user_two );
		$section          = $this->create_section();
		$captured_locales = array();

		$this->data_requests->method( 'get_user_payload' )->willReturn( array( 'total_visitors' => array() ) );
		$this->template_formatter->method( 'build_sections' )
			->willReturnCallback(
				function () use ( &$captured_locales, $section ) {
					$captured_locales[] = get_locale();
					return array( $section );
				}
			);
		$this->template_formatter->method( 'build_template_payload' )->willReturn(
			array(
				'sections_payload' => array( 'total_visitors' => array( 'value' => '10' ) ),
				'template_data'    => array( 'subject' => 'Subject' ),
			)
		);
		$this->report_sender->method( 'send' )->willReturn( true );

		$this->processor->process( $post_one, Email_Reporting_Settings::FREQUENCY_WEEKLY );
		$this->processor->process( $post_two, Email_Reporting_Settings::FREQUENCY_WEEKLY );

		$this->assertEquals( array( $locale_one, $locale_two ), $captured_locales, 'Each log should be built using its own recipient locale, not one leaked from a previous log.' );
		$this->assertEquals( Email_Log::STATUS_SENT, get_post_status( $post_one ), 'First log should be marked sent.' );
		$this->assertEquals( Email_Log::STATUS_SENT, get_post_status( $post_two ), 'Second log should be marked sent.' );
		$this->assertEquals( $original_locale, get_locale(), 'The site locale should be restored after processing multiple logs in sequence.' );
	}

	/**
	 * Returns a locale different from the one given (and any excluded), for exercising the recipient-locale switch.
	 *
	 * @param string   $locale   Locale to differ from.
	 * @param string[] $excluded Optional. Additional locales to exclude. Default empty.
	 * @return string A different locale.
	 */
	private function get_other_locale( $locale, array $excluded = array() ) {
		foreach ( array( 'es_ES', 'de_DE', 'fr_FR' ) as $candidate ) {
			if ( $candidate !== $locale && ! in_array( $candidate, $excluded, true ) ) {
				return $candidate;
			}
		}

		return 'es_ES' === $locale ? 'de_DE' : 'es_ES';
	}

	/**
	 * Creates a minimal section part for use across success-path tests.
	 *
	 * @return Email_Report_Data_Section_Part Section part instance.
	 */
	private function create_section() {
		return new Email_Report_Data_Section_Part(
			'total_visitors',
			array(
				'title'  => 'Visitors',
				'labels' => array( 'Total visitors' ),
				'values' => array( '10' ),
				'trends' => array( '5.5' ),
			)
		);
	}

	/**
	 * Creates a real email log post for testing.
	 *
	 * @param int        $user_id         Post author / report recipient.
	 * @param array|null $date_range_meta Optional. Reference dates meta. Pass an empty array to omit valid dates. Default a valid range.
	 * @param string     $template_type   Optional. Template type. Default Email_Log::TEMPLATE_TYPE_EMAIL_REPORT.
	 * @return int Created post ID.
	 */
	private function create_log_post( $user_id, $date_range_meta = null, $template_type = null ) {
		$template_type = $template_type ?: Email_Log::TEMPLATE_TYPE_EMAIL_REPORT;

		$post_id = self::factory()->post->create(
			array(
				'post_type'   => Email_Log::POST_TYPE,
				'post_status' => Email_Log::STATUS_SCHEDULED,
				'post_author' => $user_id,
			)
		);

		$date_range_meta = null !== $date_range_meta ? $date_range_meta : $this->get_reference_dates_meta();

		if ( ! empty( $date_range_meta ) ) {
			update_post_meta( $post_id, Email_Log::META_REPORT_REFERENCE_DATES, $date_range_meta );
		}

		update_post_meta( $post_id, Email_Log::META_TEMPLATE_TYPE, $template_type );
		update_post_meta( $post_id, Email_Log::META_SEND_ATTEMPTS, 0 );

		$this->created_post_ids[] = $post_id;

		return $post_id;
	}

	/**
	 * Returns a valid reference dates meta payload.
	 *
	 * @return array Reference dates meta.
	 */
	private function get_reference_dates_meta() {
		return array(
			'startDate'        => strtotime( '2024-01-01' ),
			'endDate'          => strtotime( '2024-01-07' ),
			'compareStartDate' => strtotime( '2023-12-25' ),
			'compareEndDate'   => strtotime( '2023-12-31' ),
		);
	}

	/**
	 * Registers the email log post type/meta dependencies.
	 */
	private function register_email_log_dependencies() {
		if ( post_type_exists( Email_Log::POST_TYPE ) ) {
			return;
		}

		$email_log = new Email_Log( $this->context );
		$email_log->register();
		do_action( 'init' );
	}
}
